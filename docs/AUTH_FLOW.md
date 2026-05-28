# Authentication Flows — Home Team

Supabase handles all authentication. The app uses **magic links** (passwordless
email OTP) exclusively — no passwords. All flows ultimately land at
`/auth/callback`, which exchanges the token for a session and redirects.

---

## Flow 1: Standard Magic Link Login

For existing household members who have already completed onboarding.

```
User visits /login
    │
    ├─ Middleware: no session → passes through (isPublic)
    │
    └─ Login form: user enters email → clicks "Send magic link"
           │
           └─ supabase.auth.signInWithOtp({
                email,
                emailRedirectTo: `${origin}/auth/callback`
              })
                   │
                   └─ Supabase sends email with link:
                      `https://hometask-two.vercel.app/auth/callback?token_hash=...&type=magiclink`
                           │
                           └─ User taps link in email
                                  │
                                  └─ GET /auth/callback
                                         │
                                         ├─ token_hash + type present?
                                         │   └─ supabase.auth.verifyOtp({ type, token_hash })
                                         │       ├─ success → redirect to `next` (default: /together)
                                         │       └─ error  → redirect to /login?error=auth_failed
                                         │
                                         └─ Session cookie set by Supabase SSR
                                                │
                                                └─ Middleware: session + profile → passes through
                                                       │
                                                       └─ User lands on /together
```

### Error States
| Scenario | What happens |
|---|---|
| Link expired (> 1 hour) | Supabase sends `?error=otp_expired` to the redirect URL, which forwarded by `app/page.tsx` to `/login?error=otp_expired`. Login page shows "That link has expired — request a new one below." |
| Already used link | Same `otp_expired` / `access_denied` path |
| Rate limited (too many attempts) | Login form catches the error and shows "Too many attempts — please wait a few minutes." |
| Auth code lands on root `/` instead of `/auth/callback` | `app/page.tsx` detects `?code=` param and forwards to `/auth/callback?code=...` |

---

## Flow 2: Onboarding (New Household Creation)

For first-time users who have not yet created a household.

```
User visits /login → clicks "Create a household" link
    │
    └─ Navigates to /onboarding/create
           │
           ├─ If no session: middleware would normally block,
           │   but /onboarding/* is in the isOnboarding skip list → passes through
           │
           └─ User fills form: household name, their name, color
                  │
                  └─ handleCreate():
                       │
                       ├─ supabase.auth.getUser() — must be logged in
                       │   (user was sent here from login, so they have a session)
                       │
                       ├─ householdId = crypto.randomUUID()   ← pre-generate, no SELECT needed
                       │
                       ├─ INSERT households { id: householdId, name, created_by: user.id }
                       │   RLS: auth.uid() IS NOT NULL → allowed
                       │
                       ├─ INSERT profiles { id: user.id, household_id: householdId, name, color, role: 'adult' }
                       │   RLS: id = auth.uid() → allowed
                       │
                       └─ router.push('/together')
                              │
                              └─ Middleware: session + profile → passes through
```

**Why `crypto.randomUUID()`?** After inserting the household, the code needs
the household ID to insert the profile. Fetching it via SELECT would fail
RLS — `my_household_id()` returns NULL until the profile exists. Pre-generating
the UUID client-side avoids the SELECT entirely.

**Reaching onboarding without a session:** A user can navigate directly to
`/onboarding/create` without being logged in. The form will fail at
`supabase.auth.getUser()` (returns no user) and show "Not signed in."
This is intentional — the normal path is login-first.

---

## Flow 3A: Invite Flow (Not Logged In)

For someone who receives an invite link and doesn't have an account yet.

```
Recipient opens /join/{code}  (no session)
    │
    ├─ Middleware: no session, but /join/* is in isPublic → passes through
    │
    └─ Page mounts → init():
           │
           ├─ RPC get_household_for_invite({ p_code: code })
           │   SECURITY DEFINER — bypasses RLS, no auth required
           │   ├─ Valid, unused, unexpired → sets invite state
           │   └─ Not found / expired / used → shows "This invite expired" screen
           │
           ├─ supabase.auth.getUser() → no user → authed = false
           │
           └─ Shows form: name + color + email (three-field form)
                  │
                  └─ handleSendLink():
                       │
                       ├─ localStorage.setItem('ht_pending_join',
                       │     JSON.stringify({ name, color, auto: true }))
                       │    ↑ Survives the redirect so we can auto-join after magic link
                       │
                       ├─ supabase.auth.signInWithOtp({
                       │     email,
                       │     emailRedirectTo: `${origin}/auth/callback?next=/join/${code}`
                       │   })
                       │
                       └─ Shows "Magic link sent!" screen
                              │
                              └─ User taps link in email
                                     │
                                     └─ GET /auth/callback?next=/join/{code}
                                            │
                                            └─ verifyOtp → session created
                                                   │
                                                   └─ redirect to /join/{code}  (with session now)
                                                          │
                                                          ├─ init() runs again: authed = true, hasProfile = false
                                                          ├─ Reads localStorage → { name, color, auto: true }
                                                          │
                                                          └─ Second useEffect auto-calls handleCreateProfile()
                                                                 │
                                                                 ├─ INSERT profiles { id, household_id, name, color, role }
                                                                 ├─ UPDATE household_invites SET use_count = 999
                                                                 ├─ localStorage.removeItem('ht_pending_join')
                                                                 └─ router.push('/together')
```

**localStorage key:** `ht_pending_join` stores `{ name, color, auto }`.
The `auto: true` flag triggers the auto-join effect when the page reloads
with a session. Without `auto`, the form is shown again (manual submit).

---

## Flow 3B: Invite Flow (Already Logged In, No Profile)

For someone who has a Supabase session (from a previous sign-in) but
hasn't joined any household yet.

```
Recipient opens /join/{code}  (has session, no profile)
    │
    ├─ Middleware: session + no profile, but /join/* is in isOnboarding → passes through
    │
    └─ Page mounts → init():
           │
           ├─ get_household_for_invite({ p_code: code }) → invite info
           ├─ supabase.auth.getUser() → user exists → authed = true
           ├─ profiles SELECT .eq('id', user.id) → null → hasProfile = false
           │
           └─ Checks localStorage for saved name/color from a prior attempt
                  │
                  └─ Shows "join" form: name + color only (no email — already logged in)
                         │
                         └─ handleJoinSubmit() → handleCreateProfile()
                                │
                                ├─ INSERT profiles { ... }
                                ├─ UPDATE household_invites SET use_count = 999
                                ├─ localStorage.removeItem('ht_pending_join')
                                └─ router.push('/together')
```

---

## Flow 3C: Invite Flow (Already Has a Profile)

```
Recipient opens /join/{code}  (has session AND profile)
    │
    └─ init(): hasProfile = true
           │
           └─ Shows "You're already in a household" screen with button to /together
```

---

## Middleware Routing Logic

`middleware.ts` intercepts every non-static request. Rules are evaluated
in order; the first match wins.

```
Request arrives
    │
    ├─ Is path static asset? (_next/static, _next/image, favicon, icons, manifest)
    │   └─ Skip middleware entirely (matcher config)
    │
    ├─ supabase.auth.getUser()
    │
    ├─ NO SESSION:
    │   ├─ isPublic? (/login, /auth/*, /join/*)  → pass through
    │   └─ else                                  → redirect /login
    │
    └─ HAS SESSION:
           │
           ├─ SELECT from profiles WHERE id = auth.uid()
           │
           ├─ NO PROFILE:
           │   ├─ isOnboarding? (/onboarding/*, /join/*, /auth/*) → pass through
           │   └─ else                                            → redirect /onboarding/create
           │
           └─ HAS PROFILE:
                  ├─ pathname === '/login'  → redirect /together
                  └─ else                  → pass through
```

### Skip Lists

**`isPublic`** (no session passes through):
- `/login` — the login page itself
- `/auth/*` — callback route handler
- `/join/*` — invite landing (must work unauthenticated)

**`isOnboarding`** (session + no profile passes through):
- `/onboarding/*` — the onboarding form
- `/join/*` — someone could open an invite link right after getting a magic link session, before creating a profile
- `/auth/*` — included defensively

### Why `/join/*` is in Both Skip Lists

The invite flow involves returning to `/join/[code]` after clicking a magic
link. At that exact moment the user has a session but no profile. If `/join`
were not in the `isOnboarding` skip list, middleware would redirect them to
`/onboarding/create` instead of back to the join page — breaking the flow.

---

## Auth Callback Route (`app/auth/callback/route.ts`)

Handles both Supabase auth flows:

| Flow | Query params | Handler |
|---|---|---|
| PKCE (OAuth / email with code exchange) | `?code=...` | `supabase.auth.exchangeCodeForSession(code)` |
| OTP / Magic link | `?token_hash=...&type=magiclink` | `supabase.auth.verifyOtp({ type, token_hash })` |

The `next` parameter controls the post-auth redirect destination (defaults to `/together`).
The invite flow passes `next=/join/{code}` so the user lands back on the join page with their
new session.

On any error, redirects to `/login?error=auth_failed`.

---

## Session Management

Sessions are managed via cookies by `@supabase/ssr`. The middleware client
reads cookies from the request and writes refreshed tokens back to the
response on every request. Server components use `lib/supabase/server.ts`;
client components use `lib/supabase/client.ts` (browser localStorage-based).

Sessions persist until:
- The user clicks "Sign out" (calls `supabase.auth.signOut()`)
- The Supabase refresh token expires (default: 1 week)
