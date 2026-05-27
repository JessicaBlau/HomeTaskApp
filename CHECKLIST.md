# HOME TEAM — Complete Project Checklist
## Jessica & Naor · Next.js 14 + Supabase + PWA

---

## PHASE 1 — Supabase Setup

- [ ] Create project at supabase.com → name it `home-team`
- [ ] Go to SQL Editor → paste and run `schema.sql` (creates all tables + RLS + seed data)
- [ ] Go to Authentication → Email → enable "Magic Link" (disable "Confirm email")
- [ ] Go to Project Settings → API → copy:
      - Project URL  → `NEXT_PUBLIC_SUPABASE_URL`
      - Anon key     → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] Go to Realtime → enable on `tasks` and `subtasks` tables

---

## PHASE 2 — Scaffold Next.js

```bash
npx create-next-app@latest home-team \
  --typescript --tailwind --app --no-src-dir \
  --import-alias "@/*"

cd home-team

npm install @supabase/supabase-js @supabase/ssr next-pwa
npm install -D supabase
```

---

## PHASE 3 — Drop In Files

Place each file from this session exactly where shown:

```
home-team/
│
├── app/
│   ├── globals.css                       ← globals.css
│   ├── layout.tsx                        ← root-layout.tsx
│   ├── page.tsx                          ← add: redirect('/jessica')
│   │
│   ├── (auth)/
│   │   ├── layout.tsx                    ← create: just return {children}
│   │   └── login/
│   │       └── page.tsx                  ← LoginPage.tsx
│   │
│   ├── (app)/
│   │   ├── layout.tsx                    ← app-layout.tsx
│   │   ├── jessica/
│   │   │   └── page.tsx                  ← ColPage.tsx (owner="jessica")
│   │   ├── naor/
│   │   │   └── page.tsx                  ← ColPage.tsx (owner="naor")
│   │   ├── together/
│   │   │   └── page.tsx                  ← ColPage.tsx (owner="together")
│   │   └── schedule/
│   │       └── page.tsx                  ← SchedulePage.tsx
│   │
│   └── auth/
│       └── callback/
│           └── route.ts                  ← auth-callback-route.ts
│
├── components/
│   ├── ArcProgress.tsx                   ← ArcProgress.tsx
│   ├── SubtaskItem.tsx                   ← SubtaskItem.tsx
│   ├── AddRow.tsx                        ← AddRow.tsx
│   ├── TaskCard.tsx                      ← TaskCard.tsx
│   ├── ColPage.tsx                       ← ColPage.tsx
│   ├── BottomNav.tsx                     ← BottomNav.tsx
│   ├── NotifPanel.tsx                    ← NotifPanel.tsx
│   └── Toast.tsx                         ← Toast.tsx (also has SyncIndicator,
│                                            OverviewStrip, LoadingScreen,
│                                            ReminderToasts)
│
├── lib/
│   ├── supabase/
│   │   ├── client.ts                     ← supabase-client.ts (browser part)
│   │   ├── server.ts                     ← supabase-client.ts (server part)
│   │   └── types.ts                      ← types.ts
│   └── hooks/
│       └── useTasks.ts                   ← useTasks.ts
│
├── public/
│   ├── manifest.json                     ← config-files.ts (manifest block)
│   └── icons/
│       ├── icon-192.png                  ← create or use any 192×192 png
│       └── icon-512.png                  ← create or use any 512×512 png
│
├── middleware.ts                         ← middleware-and-auth.ts (top block)
├── next.config.js                        ← config-files.ts (next.config block)
└── .env.local                            ← config-files.ts (env block)
```

---

## PHASE 4 — First Run

```bash
npm run dev
# → open http://localhost:3000
# → should redirect to /login
```

- [ ] Login page loads with DM Serif font
- [ ] Send magic link to jessica@youremail.com
- [ ] Click link in email → lands on /jessica
- [ ] Tasks load from Supabase
- [ ] Check a subtask → appears in DB instantly

---

## PHASE 5 — Link Both Users

- [ ] Sign up with Jessica's email via the app
- [ ] Sign up with Naor's email via the app
- [ ] Go to Supabase → Authentication → Users
- [ ] Copy Jessica's UUID → paste into `seed_users.sql`
- [ ] Copy Naor's UUID → paste into `seed_users.sql`
- [ ] Run `seed_users.sql` in SQL Editor
- [ ] Both users now share the same household

---

## PHASE 6 — Test Realtime Sync

- [ ] Open app in two browser tabs (or two phones)
- [ ] Log in as Jessica on one, Naor on the other
- [ ] Jessica checks a subtask
- [ ] Naor sees it update within ~200ms ✅
- [ ] "Jessica ✓" attribution shows on Naor's screen

---

## PHASE 7 — PWA Icons

Create two icons (any tool — Figma, Canva, even emoji screenshot):
- `/public/icons/icon-192.png` — 192×192px
- `/public/icons/icon-512.png` — 512×512px

Suggested design: warm `#F7F3EE` background, "HT" in DM Serif, terracotta `#C4714A` color.

- [ ] Icons created and placed in `/public/icons/`
- [ ] manifest.json in place
- [ ] next.config.js with next-pwa in place

---

## PHASE 8 — Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Follow prompts:
# → Link to your Vercel account
# → Add environment variables when asked:
#     NEXT_PUBLIC_SUPABASE_URL
#     NEXT_PUBLIC_SUPABASE_ANON_KEY
```

- [ ] Deployed — you get a URL like `https://home-team-abc.vercel.app`
- [ ] Go to Supabase → Authentication → URL Configuration
      → Add your Vercel URL to "Redirect URLs":
        `https://home-team-abc.vercel.app/auth/callback`
- [ ] Test magic link login on the live URL

---

## PHASE 9 — Install on Phones

### iPhone (Jessica & Naor)
1. Open the Vercel URL in Safari
2. Tap the **Share** button (box with arrow)
3. Tap **Add to Home Screen**
4. Name it "Home Team" → tap Add
5. App icon appears on home screen — opens fullscreen, no browser UI ✅

### Android (if needed)
1. Open in Chrome
2. Tap the three dots menu
3. Tap **Add to Home Screen** or **Install App**

---

## PHASE 10 — Supabase Auth Email Template (optional but nice)

Go to Supabase → Authentication → Email Templates → Magic Link

Replace subject + body with something warm:

**Subject:** Your Home Team magic link 🏡

**Body:**
```
Hi there,

Tap the link below to sign in to Home Team.

{{ .ConfirmationURL }}

This link expires in 1 hour.

— Home Team
```

---

## FILES GENERATED IN THIS SESSION

| File | Destination |
|------|-------------|
| `schema.sql` | Supabase SQL Editor |
| `seed_users.sql` | Supabase SQL Editor (after signup) |
| `globals.css` | `app/globals.css` |
| `root-layout.tsx` | `app/layout.tsx` |
| `app-layout.tsx` | `app/(app)/layout.tsx` |
| `LoginPage.tsx` | `app/(auth)/login/page.tsx` |
| `auth-callback-route.ts` | `app/auth/callback/route.ts` |
| `ColPage.tsx` | `components/ColPage.tsx` + 3 page files |
| `SchedulePage.tsx` | `app/(app)/schedule/page.tsx` |
| `ArcProgress.tsx` | `components/ArcProgress.tsx` |
| `SubtaskItem.tsx` | `components/SubtaskItem.tsx` |
| `AddRow.tsx` | `components/AddRow.tsx` |
| `TaskCard.tsx` | `components/TaskCard.tsx` |
| `BottomNav.tsx` | `components/BottomNav.tsx` |
| `NotifPanel.tsx` | `components/NotifPanel.tsx` |
| `Toast.tsx` | `components/Toast.tsx` |
| `supabase-client.ts` | `lib/supabase/client.ts` + `server.ts` |
| `types.ts` | `lib/supabase/types.ts` |
| `useTasks.ts` | `lib/hooks/useTasks.ts` |
| `middleware-and-auth.ts` | `middleware.ts` |
| `config-files.ts` | `manifest.json` + `next.config.js` + `.env.local` |
| `SETUP.md` | Reference only |

---

## WHAT TO BUILD NEXT (future sessions)

- [ ] Push notifications (Web Push API) for real reminders
- [ ] Weekly reset — subtasks auto-uncheck on Monday morning
- [ ] Drag to reorder tasks and subtasks
- [ ] App Store submission (React Native wrapper via Capacitor)
- [ ] Confetti animation when a full task is completed 🎉
