'use client'
// components/ArcProgress.tsx
// SVG arc progress ring — used on column headers

interface ArcProgressProps {
  pct:   number   // 0–100
  size:  number   // px, applied to width + height
  color: string   // stroke color (e.g. "white" or "#C4714A")
}

export function ArcProgress({ pct, size, color }: ArcProgressProps) {
  const strokeWidth = 2.5
  const r           = (size - strokeWidth * 2) / 2
  const cx          = size / 2
  const cy          = size / 2
  const circumference = 2 * Math.PI * r
  const offset        = circumference - (Math.min(pct, 100) / 100) * circumference

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      aria-label={`${pct}% complete`}
    >
      {/* Track */}
      <circle
        cx={cx} cy={cy} r={r}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        opacity={0.2}
      />
      {/* Progress */}
      <circle
        cx={cx} cy={cy} r={r}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        transform={`rotate(-90 ${cx} ${cy})`}
        style={{ transition: 'stroke-dashoffset 0.5s cubic-bezier(0.16,1,0.3,1)' }}
      />
    </svg>
  )
}
