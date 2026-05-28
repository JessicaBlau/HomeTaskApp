# Product Roadmap — Home Team

> Last updated: 2026-05-28

---

## Phase 1 — Foundation ✅ (Shipped)

Everything below is live at **https://hometask-two.vercel.app**.

### Multi-Household Architecture
- Any couple or family can sign up independently
- Each household is a fully isolated data silo enforced at the database layer via Postgres RLS
- No household can read or write another household's data

### Onboarding
- New user flow: create household name → enter your name → pick a color → land in the app
- Runs at `/onboarding/create`; middleware redirects all new sessions here automatically

### Invite System
- Adults generate one-time invite links from Settings → Invite
- Links resolve to `/join/[code]` — publicly accessible (no login required to land there)
- Supports both unauthenticated flow (email + magic link) and already-logged-in flow
- Role is baked into the invite: new member joins as `adult` or `child`

### Task Columns
- Each household member gets their own task column, routed at `/{member-name}`
- Shared "Together" column at `/together` for tasks that belong to the whole household
- Tasks have: icon (emoji), name, meta note, frequency tag
- Subtasks can be added, edited, checked off, and deleted

### Subtask Check-off with Attribution
- Any household member can check a subtask
- Checked subtasks display "Name ✓" so everyone knows who did what
- Children can only check subtasks on tasks assigned to them; adults can check anything

### Dynamic Bottom Navigation
- Nav tabs are built at runtime from the household's profile list — no hard-coded names
- Sliding pill animates to the active tab
- Tab color matches the member's chosen profile color
- Includes the Together and Schedule tabs

### Role System
- Two roles: `adult` and `child`
- Adults can: add/delete tasks, add/delete subtasks, manage invites, rename the household, check any subtask
- Children can: check their own subtasks only

### Settings
- Household name (editable by adults)
- Member list with role and color
- Invite link generation and revocation
- Sign out

### Realtime Sync
- Task and subtask changes propagate to all open sessions via Supabase Realtime within ~200ms
- Subtask updates are patched in-place (no full refetch); task-level changes trigger a column refetch

### Deployment
- Deployed to Vercel with continuous deployment from `main`
- PWA manifest configured (`public/manifest.json`) — installable via Safari "Add to Home Screen" on iOS

---

## Phase 2 — Next Up

### Avatar Emoji Picker
- The `avatar_emoji` column already exists on profiles; the picker UI needs to be built
- Shown in the member list, task column headers, and bottom nav

### Edit and Delete Tasks
- Currently tasks are add-only from the UI
- Need inline edit (name, icon, freq, meta) and delete with confirmation

### Reorder Tasks
- Drag-to-reorder within a column using the `position` field (already in the DB)
- Should update positions optimistically with a debounced write to Supabase

### Cross-Assignment (Suggest a Task)
- Adults can suggest a task to another household member
- Suggested task enters a pending state; recipient can accept or decline
- Requires a `suggested_by` / `status` field on tasks or a separate `task_suggestions` table

### Notification Inbox
- Replace the `NotifPanel` stub with a real notification feed
- Notifications triggered by: task suggestions, subtask completions on shared tasks, approaching deadlines
- Requires a `notifications` table and a backend trigger or edge function

### Schedule Page
- Replace the placeholder at `/schedule` with a real recurring-task schedule
- Tasks have a `freq` field (`Daily`, `Weekly`, `Monthly`, `As needed`) — wire this to a weekly/monthly calendar view
- Auto-uncheck subtasks on the cadence boundary (e.g. every Monday for weekly tasks)

---

## Phase 3 — Future

### Stripe Billing / Pro Plan
- The `plan` column (`free` / `pro`) already exists on `households`
- Free tier: 2 adults, unlimited tasks
- Pro tier: unlimited members, additional features TBD
- Requires Stripe Checkout integration and a webhook to update `households.plan`

### Web Push Notifications
- Browser push API for reminders when the app is closed
- Requires storing push subscriptions and a server-side scheduler (Supabase Edge Functions or a cron job)
- `ReminderToasts` in `Toast.tsx` is the intended hook — currently returns `null`

### Mobile PWA Polish
- Safe area insets for notched iPhones and Android home-indicator bar
- Touch target sizing audit (WCAG 2.5.5 — 44×44px minimum)
- Haptic feedback on subtask check via the Vibration API

### Public Marketing Page
- Landing page at the root domain explaining Home Team
- Currently the root (`/`) just redirects to `/together`

---

## Phase 4 — Mobile App Store Distribution

The app is already a PWA (see `public/manifest.json` and `next-pwa` in
`package.json`). PWAs can be installed from the browser on Android and
technically on iOS Safari — but **Apple does not allow PWA-only apps in the
App Store**. Listing on both stores requires a native wrapper.

### Recommended Approach: Capacitor

[Capacitor](https://capacitorjs.com/) (by Ionic) wraps the existing Next.js
web app as a native iOS/Android app with minimal code changes. It renders
the app in a WKWebView (iOS) or WebView (Android) and bridges to native APIs.

**Why Capacitor over React Native or a full rewrite?**
- The codebase is already web-first (Next.js + CSS); no component rewrite needed
- Capacitor is a thin native shell — the web code runs as-is
- Deep link handling, push notifications, and camera access are available via Capacitor plugins

---

### What Needs to Change Before Mobile

#### 1. Static Export Compatibility

Capacitor needs a static HTML/JS/CSS bundle. Next.js App Router with server
components and Route Handlers is **not statically exportable by default**.

Options:
- **Recommended:** Move all data fetching to client components (already largely done)
  and configure `next.config.js` with `output: 'export'` for the mobile build.
  Keep the Vercel deployment separate (server-rendered) — use a build flag.
- **Alternative:** Use Capacitor's live-reload mode pointing at the Vercel URL
  during development, and static export only for production native builds.

#### 2. Deep Link Handling for Magic-Link Auth

Supabase magic links redirect to a URL. On mobile, that URL must open the
**app** rather than Safari/Chrome.

Steps:
- Register a custom URL scheme (e.g. `hometask://`) in the Capacitor config
- Add the scheme to Supabase → Authentication → URL Configuration as an
  allowed redirect URL: `hometask://auth/callback`
- In `app/auth/callback/route.ts`, handle the scheme when running inside
  Capacitor (detect via `Capacitor.isNativePlatform()`)
- On iOS, also configure an Associated Domain for universal links
  (requires an Apple Developer account and a `.well-known/apple-app-site-association`
  file on your domain)

#### 3. Safe Area Insets

Add CSS to respect the notch and home indicator bar:

```css
padding-top: env(safe-area-inset-top);
padding-bottom: env(safe-area-inset-bottom);
```

The `--topbar-height` and `--bottomnav-height` tokens in `globals.css` need
to account for these insets on devices that have them.

#### 4. Touch Target Sizing

Audit all interactive elements (subtask checkboxes, nav buttons, task card
headers) to meet 44×44px minimum touch targets.

---

### Capacitor Setup Steps

#### Prerequisites
- Xcode (macOS) for iOS builds
- Android Studio for Android builds
- Apple Developer Program ($99/year)
- Google Play Console account ($25 one-time)

#### Step-by-Step

```bash
# 1. Install Capacitor
npm install @capacitor/core @capacitor/cli
npm install @capacitor/ios @capacitor/android

# 2. Initialize Capacitor (run once)
npx cap init "Home Team" "com.hometeam.app" --web-dir=out

# 3. Add platforms
npx cap add ios
npx cap add android

# 4. Build the static export
# Add to next.config.js: output: 'export'
npm run build          # generates /out directory

# 5. Sync web assets into native projects
npx cap sync

# 6. Open in Xcode / Android Studio
npx cap open ios
npx cap open android
```

#### iOS App Store Submission
1. In Xcode: set Bundle Identifier, Version, and Build number
2. Create an App record in [App Store Connect](https://appstoreconnect.apple.com)
3. Archive and upload via Xcode Organizer (Product → Archive)
4. Submit for review with screenshots, description, and privacy policy URL

#### Google Play Submission
1. In Android Studio: set applicationId, versionName, versionCode in `build.gradle`
2. Generate a signed APK / AAB (Build → Generate Signed Bundle)
3. Create an app in [Google Play Console](https://play.google.com/console)
4. Upload the AAB and complete the store listing

---

### PWA vs Capacitor Tradeoffs

| | PWA | Capacitor |
|---|---|---|
| iOS App Store listing | ❌ Not allowed | ✅ Yes |
| Google Play listing | ✅ TWA possible | ✅ Yes |
| Install friction | Browser → Add to Home Screen | One tap from store |
| Push notifications on iOS | ❌ Limited (iOS 16.4+ only) | ✅ Full APNs support |
| Access to native APIs | Limited | Full via plugins |
| Code changes required | None | Moderate (static export + deep links) |
| Maintenance overhead | Low | Medium (native project files to maintain) |

**Recommendation:** Ship the PWA to Google Play now using a Trusted Web
Activity (TWA) — zero code changes. For iOS, build the Capacitor wrapper
as the path to the App Store.
