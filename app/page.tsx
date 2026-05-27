// app/page.tsx
// Root redirect — 'together' is always a safe landing for any household

import { redirect } from 'next/navigation'

export default function RootPage() {
  redirect('/together')
}
