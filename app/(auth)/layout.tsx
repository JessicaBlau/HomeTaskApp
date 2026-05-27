// app/(auth)/layout.tsx
// Auth group layout — no chrome, just the page content

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
