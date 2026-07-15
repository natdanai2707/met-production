'use client'
import type { CSSProperties } from 'react'

// A single shimmering placeholder block.
export function Skeleton({ width = '100%', height = 14, radius = 2, style }: {
  width?: number | string
  height?: number | string
  radius?: number
  style?: CSSProperties
}) {
  return (
    <div
      className="skeleton"
      style={{ width, height, borderRadius: radius, ...style }}
    />
  )
}

// Placeholder rows that mirror the orders table layout while data loads.
export function OrderTableSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div style={{ padding: '8px 32px 32px' }}>
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '14px 10px', borderBottom: '1px solid var(--border)' }}>
          <Skeleton width={36} height={36} />
          <Skeleton width="18%" height={12} />
          <Skeleton width="14%" height={12} />
          <Skeleton width="10%" height={20} radius={2} />
          <Skeleton width="16%" height={12} />
          <Skeleton width="10%" height={12} />
          <Skeleton width={80} height={12} style={{ marginLeft: 'auto' }} />
        </div>
      ))}
    </div>
  )
}

// Placeholder rows for the calendar gantt while data loads.
export function CalendarSkeleton({ rows = 8 }: { rows?: number }) {
  return (
    <div style={{ padding: '16px 24px' }}>
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 16, height: 44, borderBottom: '1px solid var(--border)' }}>
          <Skeleton width={200} height={14} />
          <Skeleton width={`${20 + (i % 4) * 15}%`} height={22} radius={2} style={{ marginLeft: 40 + (i % 3) * 60 }} />
        </div>
      ))}
    </div>
  )
}
