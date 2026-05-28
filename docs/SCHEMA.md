# Database Schema — Home Team

> Authoritative source: `schema/schema.sql`
> Run the full file in the Supabase SQL Editor to apply (safe on a fresh project — drops and recreates everything).

---

## Tables

### `households`

The top-level tenant. Every piece of data in the app is scoped to one household.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | `uuid` | PK, default `uuid_generate_v4()` | |
| `name` | `text` | NOT NULL | Display name, editable by adults |
| `invite_code` | `text` | NOT NULL, UNIQUE, default `generate_invite_code()` | Legacy field — active invites now use `household_invites.code` |
| `plan` | `text` | NOT NULL, default `'free'` | `'free'` or `'pro'` |
| `created_by` | `uuid` | FK → `auth.users(id)` ON DELETE SET NULL | The user who created the household; NULL if they deleted their account |
| `created_at` | `timestamptz` | NOT NULL, default `now()` | |

**RLS policies:**
- **INSERT**: Any authenticated user (`auth.uid() IS NOT NULL`). Required for onboarding — the user has no profile yet when they insert the first household row.
- **SELECT**: Members of the household (`id = my_household_id()`) OR the creator (`created_by = auth.uid()`). The `OR created_by` clause covers the onboarding window where `my_household_id()` still returns NULL.
- **UPDATE**: Adults only (`id = my_household_id() AND my_profile_role() = 'adult'`).
- **DELETE**: No policy defined (no delete path in the app).

---

### `profiles`

One row per authenticated user. Linked to exactly one household.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | `uuid` | PK, FK → `auth.users(id)` ON DELETE CASCADE | Same UUID as the Supabase auth user |
| `household_id` | `uuid` | NOT NULL, FK → `households(id)` ON DELETE CASCADE | |
| `name` | `text` | NOT NULL | Display name; must be unique within the household (case-insensitive) |
| `color` | `text` | NOT NULL, default `'#6A9060'` | Hex string; used for UI accents |
| `role` | `text` | NOT NULL, default `'adult'`, CHECK `IN ('adult', 'child')` | |
| `avatar_emoji` | `text` | NOT NULL, default `'🙂'` | Picker not yet built; column exists for Phase 2 |
| `created_at` | `timestamptz` | NOT NULL, default `now()` | |

**Unique constraints:**
- `(household_id, name)` — case-insensitive via index `profiles_household_lower_name ON (household_id, lower(name))`. Two members of the same household cannot have the same name regardless of case.
- `name` may not be one of the reserved route slugs: `together`, `schedule`, `settings`, `login`, `join`, `onboarding`, `auth`, `api`. This prevents a member named "settings" from shadowing the settings page.

**Indexes:**
- `profiles_household_lower_name` — used for URL slug resolution (`/jessica` → profile lookup by lowercase name).

**RLS policies:**
- **INSERT**: `id = auth.uid()` — you can only create your own profile.
- **SELECT**: `household_id = my_household_id()` — see all profiles in your household.
- **UPDATE (own)**: `id = auth.uid()` — update your own profile.
- **UPDATE (role management)**: `household_id = my_household_id() AND my_profile_role() = 'adult'` — adults can update other members' roles.

---

### `household_invites`

One row per generated invite link. Each invite has a unique code embedded in `/join/[code]`.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | `uuid` | PK, default `uuid_generate_v4()` | |
| `household_id` | `uuid` | NOT NULL, FK → `households(id)` ON DELETE CASCADE | |
| `code` | `text` | NOT NULL, UNIQUE, default `generate_invite_code()` | 8-char human-friendly string (no 0/O/1/I/L ambiguity) |
| `created_by` | `uuid` | NOT NULL, FK → `profiles(id)` ON DELETE CASCADE | The adult who generated the invite |
| `role` | `text` | NOT NULL, default `'adult'`, CHECK `IN ('adult', 'child')` | Role the new member will be assigned |
| `max_uses` | `int` | NOT NULL, default `1` | Currently always 1 (one-time links) |
| `use_count` | `int` | NOT NULL, default `0` | Incremented when someone joins; `get_household_for_invite` filters `use_count < max_uses` |
| `expires_at` | `timestamptz` | nullable | Optional expiry; NULL means never expires |
| `created_at` | `timestamptz` | NOT NULL, default `now()` | |

**Indexes:**
- `(household_id)` — list all invites for a household
- `(code)` — fast lookup in `get_household_for_invite`

**RLS policies:**
- **SELECT**: `household_id = my_household_id()` — members see their own household's invites.
- **INSERT**: `household_id = my_household_id() AND my_profile_role() = 'adult'` — adults only.
- **DELETE**: `household_id = my_household_id() AND my_profile_role() = 'adult'` — adults only (revoke).
- **UPDATE**: `using (true) with check (true)` — any authenticated user. This is intentionally permissive: it allows the join page to increment `use_count` after a new member creates their profile. The `get_household_for_invite` function is the security gate.

---

### `tasks`

A task belongs to either one member (personal) or the whole household (shared).

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | `uuid` | PK, default `uuid_generate_v4()` | |
| `household_id` | `uuid` | NOT NULL, FK → `households(id)` ON DELETE CASCADE | |
| `owner_id` | `uuid` | nullable, FK → `profiles(id)` ON DELETE CASCADE | NULL when `is_shared = true` |
| `is_shared` | `bool` | NOT NULL, default `false` | `true` = Together column; `false` = personal column |
| `icon` | `text` | NOT NULL, default `'📋'` | Emoji displayed on the card |
| `name` | `text` | NOT NULL | Task title |
| `meta` | `text` | NOT NULL, default `''` | Optional note shown below the name |
| `freq` | `text` | NOT NULL, default `'Weekly'` | `Daily` / `Weekly` / `Monthly` / `As needed` |
| `position` | `int` | NOT NULL, default `0` | Sort order within a column |
| `created_at` | `timestamptz` | NOT NULL, default `now()` | |

**Constraint:** `tasks_owner_check` — enforces the mutual exclusivity rule:
```sql
(is_shared = true AND owner_id IS NULL) OR (is_shared = false AND owner_id IS NOT NULL)
```

**Indexes:**
- `(household_id, owner_id, position)` — personal task column queries
- `(household_id, is_shared, position)` — shared task column queries

**RLS policies:**
- **SELECT**: `household_id = my_household_id()` — all household members see all tasks.
- **INSERT / UPDATE / DELETE**: `household_id = my_household_id() AND my_profile_role() = 'adult'` — adults only.

---

### `subtasks`

Individual checklist items within a task.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | `uuid` | PK, default `uuid_generate_v4()` | |
| `task_id` | `uuid` | NOT NULL, FK → `tasks(id)` ON DELETE CASCADE | |
| `household_id` | `uuid` | NOT NULL, FK → `households(id)` ON DELETE CASCADE | Denormalized for efficient RLS checks |
| `text` | `text` | NOT NULL | The subtask label |
| `checked` | `bool` | NOT NULL, default `false` | |
| `checked_by` | `uuid` | nullable, FK → `profiles(id)` ON DELETE SET NULL | Attribution — who checked it |
| `checked_at` | `timestamptz` | nullable | When it was checked |
| `position` | `int` | NOT NULL, default `0` | Sort order within the task |
| `created_at` | `timestamptz` | NOT NULL, default `now()` | |

**Note:** `household_id` is denormalized (it's derivable via `task → household_id`) to avoid a join in every RLS policy evaluation.

**Indexes:**
- `(task_id)` — fetch subtasks for a task
- `(household_id)` — RLS policy evaluation

**RLS policies:**
- **SELECT**: `household_id = my_household_id()`.
- **INSERT**: `household_id = my_household_id() AND my_profile_role() = 'adult'`.
- **DELETE**: `household_id = my_household_id() AND my_profile_role() = 'adult'`.
- **UPDATE**: Adults can update any subtask. Children can update only subtasks belonging to tasks they own:
  ```sql
  household_id = my_household_id()
  AND (
    my_profile_role() = 'adult'
    OR EXISTS (
      SELECT 1 FROM tasks
      WHERE tasks.id = subtasks.task_id
        AND tasks.owner_id = auth.uid()
    )
  )
  ```

---

## SECURITY DEFINER Helper Functions

These functions run with the **definer's privileges** (superuser), bypassing
RLS. They are called inside RLS policies to avoid infinite recursion.

### `my_household_id() → uuid`
Returns `profiles.household_id` for the currently authenticated user.
Used in almost every RLS policy to scope data to the user's household.

### `my_profile_id() → uuid`
Returns `profiles.id` for the currently authenticated user.
Convenience alias for `auth.uid()` via the profiles table.

### `my_profile_role() → text`
Returns `profiles.role` for the currently authenticated user (`'adult'` or `'child'`).
Used in write policies to restrict mutations to adults.

**Why SECURITY DEFINER?** Without it, the policy evaluation would try to
query `profiles`, which itself has an RLS policy, causing an infinite
recursion error. SECURITY DEFINER steps outside the RLS context entirely.

### `generate_invite_code() → text`
Generates a random 8-character code using a human-friendly alphabet
(no `0`/`O`/`1`/`I`/`L` to avoid visual ambiguity). Used as the default
value for `household_invites.code` and `households.invite_code`.

### `get_household_for_invite(p_code text) → table`
Returns household info for a valid, unused, unexpired invite code.
SECURITY DEFINER so it can be called from the `/join/[code]` page **without
the user being authenticated or having a profile**. The invite code itself
is the secret — possession of the code is the authorization.

Returns: `{ household_id, household_name, invite_role, invite_id }` or empty set.

---

## Invite Code Flow (End-to-End)

1. Adult navigates to Settings → Invite and selects a role (`adult` or `child`).
2. App calls `supabase.from('household_invites').insert(...)` — RLS checks `my_profile_role() = 'adult'`.
3. Supabase generates a unique `code` via `generate_invite_code()` default.
4. Adult copies the link: `https://hometask-two.vercel.app/join/{code}`.
5. Recipient opens the link — page calls `get_household_for_invite(code)` RPC (bypasses RLS).
6. If valid: invite info is displayed. If expired/used/not found: "Invalid link" screen.
7. Recipient completes the join form → profile is created → `use_count` is incremented.
8. Once `use_count >= max_uses`, the invite no longer appears in `get_household_for_invite` results.

---

## Onboarding RLS Edge Case

**Problem:** When a new user signs up, they must insert a `households` row
and a `profiles` row. But all RLS policies that scope data to "your household"
call `my_household_id()`, which reads `profiles`. Before the profile exists,
`my_household_id()` returns `NULL` — which would deny every write.

**Solution (three-part):**

1. **Households INSERT policy** uses only `auth.uid() IS NOT NULL` — no profile lookup required.

2. **Households SELECT policy** adds `OR created_by = auth.uid()` — the creator can read their
   own household even before their profile row exists.

3. **`crypto.randomUUID()` client-side** — the household UUID is generated in the browser
   before any database call. This lets the profile INSERT include `household_id` without
   needing a SELECT after the households INSERT (which would be denied by RLS at that moment).

---

## Realtime Configuration

The following tables are added to the `supabase_realtime` publication:
- `tasks` — triggers a full column refetch in `useTasks`
- `subtasks` — triggers incremental patch in `useTasks` (no refetch)
- `household_invites` — available for future real-time invite status updates

Enable in Supabase Dashboard → Database → Replication, or the schema.sql
already runs: `ALTER PUBLICATION supabase_realtime ADD TABLE tasks;`
