-- ============================================================
-- HOME TEAM  •  Schema v2
-- Multi-household, invite-based, role-aware
--
-- Run the whole file in the Supabase SQL Editor.
-- It drops and recreates everything — safe on a fresh project.
-- ============================================================

-- ── Drop existing objects (clean slate) ──────────────────────
drop table if exists subtasks          cascade;
drop table if exists tasks             cascade;
drop table if exists household_invites cascade;
drop table if exists profiles          cascade;
drop table if exists households        cascade;

drop function if exists my_household_id()             cascade;
drop function if exists my_profile_id()               cascade;
drop function if exists my_profile_role()             cascade;
drop function if exists generate_invite_code()        cascade;
drop function if exists get_household_for_invite(text) cascade;

-- ── Extensions ───────────────────────────────────────────────
create extension if not exists "uuid-ossp";

-- ── Helper: random 8-char invite code ────────────────────────
-- Uses a human-friendly alphabet (no 0/O, 1/I/L ambiguity).
create or replace function generate_invite_code()
returns text language plpgsql as $$
declare
  chars  text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result text := '';
  i      int;
begin
  for i in 1..8 loop
    result := result || substr(chars, ceil(random() * length(chars))::int, 1);
  end loop;
  return result;
end;
$$;

-- ── HOUSEHOLDS ───────────────────────────────────────────────
create table households (
  id           uuid primary key default uuid_generate_v4(),
  name         text not null,
  invite_code  text not null unique default generate_invite_code(),
  plan         text not null default 'free',   -- 'free' | 'pro'
  created_by   uuid references auth.users(id) on delete set null,
  created_at   timestamptz not null default now()
);

-- ── PROFILES ─────────────────────────────────────────────────
-- One row per auth user, linked to exactly one household.
create table profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  household_id  uuid not null references households(id) on delete cascade,
  name          text not null,
  color         text not null default '#6A9060',
  role          text not null default 'adult'   -- 'adult' | 'child'
                check (role in ('adult', 'child')),
  avatar_emoji  text not null default '🙂',
  created_at    timestamptz not null default now(),

  -- Names must be unique within a household (case-insensitive)
  constraint profiles_name_unique_in_household
    unique (household_id, name),

  -- Reserved slugs — these are app routes, not people
  constraint profiles_name_not_reserved
    check (lower(name) not in (
      'together', 'schedule', 'settings', 'login',
      'join', 'onboarding', 'auth', 'api'
    ))
);

-- Fast lookup when resolving URL slug → profile
create unique index profiles_household_lower_name
  on profiles (household_id, lower(name));

-- ── HOUSEHOLD INVITES ─────────────────────────────────────────
create table household_invites (
  id            uuid primary key default uuid_generate_v4(),
  household_id  uuid not null references households(id) on delete cascade,
  code          text not null unique default generate_invite_code(),
  created_by    uuid not null references profiles(id) on delete cascade,
  role          text not null default 'adult'
                check (role in ('adult', 'child')),
  max_uses      int  not null default 1,
  use_count     int  not null default 0,
  expires_at    timestamptz,
  created_at    timestamptz not null default now()
);

create index on household_invites (household_id);
create index on household_invites (code);

-- ── TASKS ────────────────────────────────────────────────────
-- owner_id  = null  +  is_shared = true   →  "Together" task
-- owner_id  = uuid  +  is_shared = false  →  personal task
create table tasks (
  id            uuid primary key default uuid_generate_v4(),
  household_id  uuid not null references households(id) on delete cascade,
  owner_id      uuid references profiles(id) on delete cascade,
  is_shared     bool not null default false,
  icon          text not null default '📋',
  name          text not null,
  meta          text not null default '',
  freq          text not null default 'Weekly',
  position      int  not null default 0,
  created_at    timestamptz not null default now(),

  constraint tasks_owner_check
    check (
      (is_shared = true  and owner_id is null) or
      (is_shared = false and owner_id is not null)
    )
);

create index on tasks (household_id, owner_id, position);
create index on tasks (household_id, is_shared, position);

-- ── SUBTASKS ─────────────────────────────────────────────────
create table subtasks (
  id            uuid primary key default uuid_generate_v4(),
  task_id       uuid not null references tasks(id) on delete cascade,
  household_id  uuid not null references households(id) on delete cascade,
  text          text not null,
  checked       bool not null default false,
  checked_by    uuid references profiles(id) on delete set null,
  checked_at    timestamptz,
  position      int  not null default 0,
  created_at    timestamptz not null default now()
);

create index on subtasks (task_id);
create index on subtasks (household_id);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table households        enable row level security;
alter table profiles          enable row level security;
alter table household_invites enable row level security;
alter table tasks              enable row level security;
alter table subtasks           enable row level security;

-- ── Helper functions (SECURITY DEFINER so they work in policies) ──

create or replace function my_household_id()
returns uuid language sql stable security definer as $$
  select household_id from profiles where id = auth.uid()
$$;

create or replace function my_profile_id()
returns uuid language sql stable security definer as $$
  select id from profiles where id = auth.uid()
$$;

create or replace function my_profile_role()
returns text language sql stable security definer as $$
  select role from profiles where id = auth.uid()
$$;

-- ── Public helper used by the /join/[code] page ───────────────
-- SECURITY DEFINER so it bypasses RLS — the invite code itself is the secret.
create or replace function get_household_for_invite(p_code text)
returns table (
  household_id   uuid,
  household_name text,
  invite_role    text,
  invite_id      uuid
) language sql security definer as $$
  select
    h.id,
    h.name,
    hi.role,
    hi.id
  from household_invites hi
  join households h on h.id = hi.household_id
  where hi.code = p_code
    and hi.use_count < hi.max_uses
    and (hi.expires_at is null or hi.expires_at > now())
  limit 1;
$$;

-- ── HOUSEHOLDS policies ───────────────────────────────────────
-- Any authenticated user can create a household (first-time onboarding).
-- We only require the user to be authenticated — not that created_by matches,
-- because auth.uid() can be hard to validate server-side during first insert.
create policy "households: authenticated users can insert"
  on households for insert
  with check (auth.uid() is not null);

-- Members can read their own household.
-- Also allow the creator to read even before their profile exists (onboarding).
create policy "households: members can read"
  on households for select
  using (
    id = my_household_id()
    or created_by = auth.uid()
  );

-- Adults can update household name etc.
create policy "households: adults can update"
  on households for update
  using (id = my_household_id() and my_profile_role() = 'adult');

-- ── PROFILES policies ─────────────────────────────────────────
-- Any logged-in user can create their own profile (in any household).
-- Application code enforces invite-code validation before calling this.
create policy "profiles: user can insert own"
  on profiles for insert
  with check (id = auth.uid());

-- Household members can read all profiles in their household.
create policy "profiles: household members can read"
  on profiles for select
  using (household_id = my_household_id());

-- Each user can update their own profile.
create policy "profiles: user can update own"
  on profiles for update
  using (id = auth.uid());

-- Adults can update roles of other members (for child account management).
create policy "profiles: adults can update roles"
  on profiles for update
  using (household_id = my_household_id() and my_profile_role() = 'adult');

-- ── HOUSEHOLD_INVITES policies ────────────────────────────────
-- Household members can see their invites.
create policy "invites: household members can read"
  on household_invites for select
  using (household_id = my_household_id());

-- Adults can create invites.
create policy "invites: adults can insert"
  on household_invites for insert
  with check (
    household_id = my_household_id()
    and my_profile_role() = 'adult'
  );

-- Adults can revoke invites.
create policy "invites: adults can delete"
  on household_invites for delete
  using (
    household_id = my_household_id()
    and my_profile_role() = 'adult'
  );

-- Anyone authenticated can increment use_count when joining
-- (the page code does this after validating the invite).
create policy "invites: authenticated can increment use_count"
  on household_invites for update
  using (true)
  with check (true);

-- ── TASKS policies ────────────────────────────────────────────
create policy "tasks: household members can read"
  on tasks for select
  using (household_id = my_household_id());

create policy "tasks: adults can insert"
  on tasks for insert
  with check (
    household_id = my_household_id()
    and my_profile_role() = 'adult'
  );

create policy "tasks: adults can update"
  on tasks for update
  using (
    household_id = my_household_id()
    and my_profile_role() = 'adult'
  );

create policy "tasks: adults can delete"
  on tasks for delete
  using (
    household_id = my_household_id()
    and my_profile_role() = 'adult'
  );

-- ── SUBTASKS policies ─────────────────────────────────────────
create policy "subtasks: household members can read"
  on subtasks for select
  using (household_id = my_household_id());

-- Adults can insert/delete any subtask.
create policy "subtasks: adults can insert"
  on subtasks for insert
  with check (
    household_id = my_household_id()
    and my_profile_role() = 'adult'
  );

create policy "subtasks: adults can delete"
  on subtasks for delete
  using (
    household_id = my_household_id()
    and my_profile_role() = 'adult'
  );

-- Adults can update any subtask; children can only check subtasks on their own tasks.
create policy "subtasks: members can update"
  on subtasks for update
  using (
    household_id = my_household_id()
    and (
      my_profile_role() = 'adult'
      or exists (
        select 1 from tasks
        where tasks.id = subtasks.task_id
          and tasks.owner_id = auth.uid()
      )
    )
  );

-- ============================================================
-- REALTIME
-- ============================================================

alter publication supabase_realtime add table tasks;
alter publication supabase_realtime add table subtasks;
alter publication supabase_realtime add table household_invites;
