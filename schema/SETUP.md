# HOME TEAM — Project Scaffold

## 1. Create the project

```bash
npx create-next-app@latest home-team \
  --typescript \
  --tailwind \
  --app \
  --no-src-dir \
  --import-alias "@/*"

cd home-team
```

## 2. Install dependencies

```bash
npm install @supabase/supabase-js @supabase/ssr
npm install next-pwa
npm install -D supabase
```

## 3. Environment variables

Create `.env.local` in the project root:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

Get these from: Supabase Dashboard → Project Settings → API

## 4. Generate TypeScript types from your schema

```bash
npx supabase login
npx supabase gen types typescript \
  --project-id your-project-id \
  > lib/supabase/types.ts
```

## 5. File structure to create

```
home-team/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   │   └── page.tsx          ← magic link login
│   │   └── layout.tsx
│   ├── (app)/
│   │   ├── jessica/
│   │   │   └── page.tsx
│   │   ├── naor/
│   │   │   └── page.tsx
│   │   ├── together/
│   │   │   └── page.tsx
│   │   ├── schedule/
│   │   │   └── page.tsx
│   │   └── layout.tsx            ← bottom nav + auth guard
│   ├── layout.tsx                ← root layout
│   └── page.tsx                  ← redirect to /jessica
├── components/
│   ├── TaskCard.tsx
│   ├── SubtaskItem.tsx
│   ├── AddRow.tsx
│   ├── BottomNav.tsx
│   └── NotifPanel.tsx
├── lib/
│   ├── supabase/
│   │   ├── client.ts
│   │   ├── server.ts
│   │   └── types.ts              ← generated
│   └── hooks/
│       ├── useTasks.ts           ← realtime subscription
│       └── useProfile.ts
├── public/
│   ├── manifest.json
│   └── icons/
│       ├── icon-192.png
│       └── icon-512.png
├── middleware.ts
└── next.config.js
```

## 6. Run locally

```bash
npm run dev
# → http://localhost:3000
```

## 7. Deploy (one command)

```bash
npx vercel
# Add your env vars when prompted
# Done — live URL instantly
```

---

## Steps in order

1. ✅ Run schema.sql in Supabase SQL editor
2. ⬜ Scaffold Next.js project (commands above)
3. ⬜ Add .env.local with your Supabase keys
4. ⬜ We'll build: lib/supabase/client.ts
5. ⬜ We'll build: middleware.ts (auth guard)
6. ⬜ We'll build: app/(auth)/login/page.tsx
7. ⬜ We'll build: lib/hooks/useTasks.ts (realtime)
8. ⬜ We'll build: components/ (TaskCard etc.)
9. ⬜ We'll build: app/(app)/layout.tsx + pages
10. ⬜ Add PWA manifest + next-pwa config
11. ⬜ Sign up both users → run seed_users.sql
12. ⬜ Deploy to Vercel
