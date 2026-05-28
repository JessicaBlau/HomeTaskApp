# CLAUDE.md — Home Team

> **Read this before touching any code.** It covers every architectural
> decision that isn't obvious from the file tree alone.

---

## Project Overview

**Home Team** is a multi-household SaaS app for couples and families to
manage shared tasks. Each household has members (adults + children), and
every member gets their own task column plus a shared "Together" column.
Tasks contain subtasks; members check off subtasks in real time.

- **Live URL:** https://hometask-two.vercel.app
- **Repo:** https://github.com/JessicaBlau/HomeTaskApp.git
- **Status:** Phase 1 complete and deployed. See `docs/ROADMAP.md`.

---

## Tech Stack

| Layer | Choice | Version |
|---|---|---|
| Framework | Next.js (App Router) | 14.2.29 |
| Language | TypeScript | ^5 |
| Auth + DB | Supabase (Postgres + RLS + Realtime) | @supabase/ssr ^0.5.2 |
| Styling | Custom CSS design system (`app/globals.css`) | — |
| PWA | next-pwa | ^5.6.0 |
| Deployment | Vercel | — |

Tailwind is installed but **not used for utility classes** — it only drives
the PostCSS pipeline. All styling is via CSS custom properties in
`app/globals.css`.

---

## Directory Structure

```
/
├── app/
│   ├── layout.tsx                   Root layout: fonts, PWA meta, viewport
│   ├── page.tsx                     Root redirect + auth-code forwarding
│   ├── globals.css                  Entire design system (tokens, components)
│   │
│   ├── (app)/                       Route group — authenticated shell
│   │   ├── layout.tsx               Topbar + BottomNav + NotifPanel + ToastProvider
│   │   ├── [owner]/page.tsx         Dynamic column page → ColPage component
│   │   ├── schedule/page.tsx        Placeholder (see "Not built yet")
│   │   └── settings/
│   │       ├── page.tsx             Household settings + member list + sign out
│   │       └── invite/page.tsx      Generate + revoke invite links
│   │
│   ├── (auth)/                      Route group — no chrome
│   │   ├── layout.tsx               Pass-through layout
│   │   └── login/page.tsx           Magic-link login form
│   │
│   ├── (onboarding)/                Route group — no chrome
│   │   ├── layout.tsx               Pass-through layout
│   │   └── onboarding/create/page.tsx   New household + profile setup
│   │
│   ├── auth/callback/route.ts       Supabase auth redirect handler (Route Handler)
│   └── join/[code]/page.tsx         Invite landing page (public)
│
├── components/
│   ├── ColPage.tsx                  Column view: resolves owner slug → tasks
│   ├── TaskCard.tsx                 Expandable task card + subtask panel
│   ├── SubtaskItem.tsx              Single subtask row (check/edit/delete)
│   ├── AddTaskRow.tsx               Collapsed "Add task" inline form
│   ├── AddRow.tsx                   Inline "Add subtask" inside a TaskCard
│   ├── BottomNav.tsx                Dynamic sliding-pill bottom nav
│   ├── NotifPanel.tsx               Slide-in notification drawer (stub)
│   ├── ArcProgress.tsx              SVG arc progress ring
│   └── Toast.tsx                    ToastProvider + SyncIndicator + OverviewStrip
│                                    + LoadingScreen + ReminderToasts (stub)
│
├── lib/
│   ├── supabase/
│   │   ├── client.ts                createBrowserClient (use in 'use client')
│   │   ├── server.ts                createServerClient (use in Server Components / Route Handlers)
│   │   └── types.ts                 Hand-maintained DB types + convenience aliases
│   └── hooks/
│       ├── useCurrentProfile.ts     Logged-in user's profile + household
│       ├── useProfiles.ts           All profiles in the current household
│       └── useTasks.ts              Tasks + subtasks + realtime + CRUD actions
│
├── middleware.ts                    Auth guard (runs on every non-static request)
├── schema/
│   ├── schema.sql                   Full DB schema + RLS policies (run in Supabase SQL Editor)
│   ├── SETUP.md                     Scaffold/setup guide
│   ├── seed_home_team.sql           Dev seed data
│   └── seed_users.sql               User seed helper
│
├── public/
│   └── manifest.json                PWA manifest
│
└── docs/
    ├── ROADMAP.md
    ├── SCHEMA.md
    └── AUTH_FLOW.md
```

---

## Critical Architectural Decisions

### 1. Route Groups and URL Resolution

Next.js route groups use parentheses — `(app)`, `(auth)`, `(onboarding)` —
which are **excluded from the URL**. This means:

| File path | Rendered URL |
|---|---|
| `app/(app)/[owner]/page.tsx` | `/{owner}` e.g. `/together`, `/jessica` |
| `app/(app)/settings/page.tsx` | `/settings` |
| `app/(auth)/login/page.tsx` | `/login` |
| `app/(onboarding)/onboarding/create/page.tsx` | `/onboarding/create` |
| `app/join/[code]/page.tsx` | `/join/{code}` (no group — intentionally public) |
| `app/auth/callback/route.ts` | `/auth/callback` (no group — must be reachable unauthenticated) |

The `(app)` group provides the shared `layout.tsx` (topbar + bottom nav)
for all authenticated pages without adding a URL segment.

### 2. Supabase RLS — Helper Functions

Direct table lookups inside RLS policies cause **infinite recursion** (e.g.,
a policy on `profiles` that queries `profiles`). The solution is three
`SECURITY DEFINER` helper functions that run with elevated privilege outside
the policy evaluation cycle:

```sql
my_household_id()  -- returns profiles.household_id for auth.uid()
my_profile_id()    -- returns profiles.id for auth.uid()
my_profile_role()  -- returns profiles.role for auth.uid()
```

Every multi-table RLS policy uses these instead of subselects. They are
defined in `schema/schema.sql` and must exist before any policies.

### 3. Onboarding RLS Edge Case

When a brand-new user completes onboarding (no profile exists yet):

- `my_household_id()` returns `NULL`
- Most RLS policies would therefore **deny** the insert

This is solved two ways:

**Households insert policy** allows any authenticated user:
```sql
with check (auth.uid() is not null)
```

**Households read policy** also allows the `created_by` user even without
a profile:
```sql
using (id = my_household_id() OR created_by = auth.uid())
```

**Profiles insert policy** only requires `id = auth.uid()` (you can always
create your own profile).

### 4. `crypto.randomUUID()` in Onboarding

In `app/(onboarding)/onboarding/create/page.tsx`, the household UUID is
pre-generated client-side:

```ts
const householdId = crypto.randomUUID()
await supabase.from('households').insert({ id: householdId, ... })
await supabase.from('profiles').insert({ household_id: householdId, ... })
```

**Why?** After inserting the household, we need its `id` to insert the
profile. A `SELECT` after `INSERT` would fail — there's no profile yet, so
`my_household_id()` returns `NULL`, and the read policy denies it. By
generating the UUID upfront, we skip the SELECT entirely.

### 5. `OwnerFilter` Type and Owner Routing

Defined in `lib/supabase/types.ts`:

```ts
export type OwnerFilter = string | 'together' | null
```

| Value | Meaning |
|---|---|
| `null` | Still loading / not yet resolved — `useTasks` skips the fetch |
| `'together'` | Query tasks where `is_shared = true` |
| `<uuid string>` | Query tasks where `owner_id = uuid` |

`ColPage` resolves the URL slug (e.g. `"jessica"`) to a profile UUID by
matching `profile.name.toLowerCase()` against `owner.toLowerCase()`. While
profiles are still loading, it passes `null` to `useTasks` to prevent a
premature empty-result flash.

### 6. Dynamic Colors via Hex Props

Components receive a `color` hex string prop rather than a CSS class name:

```tsx
<TaskCard color={ownerProfile?.color ?? '#6A9060'} ... />
```

**Why?** The design evolved from hard-coded `jessica`/`naor` classes to a
multi-household model where member names are unknown at build time. Passing
hex directly means any household can have any member name and the correct
accent color still applies. The `tint()` helper in both `TaskCard` and
`BottomNav` computes an rgba tint from the hex at runtime.

### 7. Middleware Routing Logic

`middleware.ts` runs on every non-static request and enforces three rules:

```
No session              → /login       (skip: /login, /auth/*, /join/*)
Session + no profile    → /onboarding/create  (skip: /onboarding/*, /join/*, /auth/*)
Session + profile       → pass through
Session + profile + /login → /together
```

`/join/[code]` is in **both** skip lists — it must be reachable with no
session (unauthenticated invite landing) and also with a session but no
profile yet (post-magic-link return during invite flow).

`/auth/callback` is always skipped — it's the redirect target after
magic-link click and must be reachable before any session exists.

---

## TypeScript Gotchas — The `as never` / `as any` Pattern

Supabase's generated types are strict about insert shapes. When inserting
objects that don't perfectly match the generated `Insert` type (e.g.,
providing `id` explicitly on a table where it has a default, or providing
`household_id` where the client derives it), TypeScript raises an error.

The workaround used throughout this codebase:

```ts
await supabase.from('households').insert({ id: householdId, name, ... } as never)
await supabase.from('tasks').update({ name: newName.trim() } as never)
```

Or with `as any` for query building:
```ts
let query = (supabase as any).from('tasks').select(...)
```

This is intentional, not a bug. The underlying Supabase queries are correct;
TypeScript's inference just can't handle partial/dynamic insert shapes.

**Do not "fix" these by changing the data model.** When Supabase types are
regenerated (see below), re-audit whether the casts are still needed.

---

## Running Locally

### Prerequisites
- Node.js 18+
- A Supabase project with `schema/schema.sql` already applied

### Environment Variables

Create `.env.local` at the project root:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

Get these from: Supabase Dashboard → Project Settings → API.

### Start Dev Server

```bash
npm install
npm run dev
# → http://localhost:3001
```

Note: dev server runs on port **3001** (set in `package.json`).

### Regenerate TypeScript Types

After changing `schema.sql`:

```bash
npx supabase login
npx supabase gen types typescript \
  --project-id YOUR_PROJECT_ID \
  > lib/supabase/types.ts
```

---

## Git Workflow

- **Always branch from `main`.** Never commit directly to `main`.
- Branch naming: `feat/description`, `fix/description`, `docs/description`
- Open a PR for review before merging.

```bash
git checkout main && git pull
git checkout -b feat/my-feature
# ... make changes ...
git push -u origin feat/my-feature
# open PR on GitHub
```

---

## Supabase Setup

See `schema/SETUP.md` for the full scaffold walkthrough.

The authoritative schema lives in `schema/schema.sql`. Run it in the
Supabase SQL Editor — it is **idempotent** (drops and recreates everything).

Key Supabase settings required:
- Authentication → Email → **Magic Link enabled**, "Confirm email" **disabled**
- Authentication → URL Configuration → add Vercel URL to Redirect URLs:
  `https://hometask-two.vercel.app/auth/callback`
- Realtime → enabled on `tasks`, `subtasks`, `household_invites`

---

## What Is Intentionally NOT Built Yet

| Feature | Location | Status |
|---|---|---|
| Schedule page | `app/(app)/schedule/page.tsx` | Placeholder only — renders a "coming soon" message |
| Notifications | `components/NotifPanel.tsx`, `components/Toast.tsx` → `ReminderToasts` | UI shell exists; no notification data model or triggers yet |
| Avatar emoji picker | `lib/supabase/types.ts` has `avatar_emoji` field | DB column exists; no picker UI |
| Task edit / reorder | — | Add-only for now; no edit or drag-to-reorder |
| Push notifications | — | Not wired; `ReminderToasts` returns `null` |
| Stripe billing | — | `plan` column exists on `households`; no payment flow |

Do not assume these are bugs. Check this list before filing issues.
