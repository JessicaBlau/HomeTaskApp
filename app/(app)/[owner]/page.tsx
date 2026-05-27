// app/(app)/[owner]/page.tsx
// Dynamic column page — works for any member name or 'together'

import { ColPage } from '@/components/ColPage'

interface Props {
  params: { owner: string }
}

export default function OwnerPage({ params }: Props) {
  return <ColPage owner={params.owner} />
}
