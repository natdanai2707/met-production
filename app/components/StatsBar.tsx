'use client'
import { Order, STAGES } from '@/lib/supabase'

type Props = { orders: Order[] }

export default function StatsBar({ orders }: Props) {
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const weekEnd = new Date(today); weekEnd.setDate(weekEnd.getDate() + 7)

  const inProd = orders.filter(o => o.stage > 0 && o.stage < 6).length
  const done = orders.filter(o => o.stage === 6).length
  const dueThisWeek = orders.filter(o => {
    if (!o.due_date || o.stage === 6) return false
    return new Date(o.due_date) <= weekEnd
  }).length
  const unpaid = orders.filter(o => o.total_price > 0 && o.deposit < o.total_price).length

  const stats = [
    { label: 'Total Orders', value: orders.length, color: 'var(--accent)' },
    { label: 'In Production', value: inProd, color: 'var(--text)' },
    { label: 'Due This Week', value: dueThisWeek, color: 'var(--danger)' },
    { label: 'Completed', value: done, color: 'var(--accent2)' },
    { label: 'Awaiting Payment', value: unpaid, color: 'var(--text)' },
  ]

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', borderBottom: '1px solid var(--border)' }}>
      {stats.map((s, i) => (
        <div key={i} style={{ padding: '16px 24px', borderRight: i < 4 ? '1px solid var(--border)' : 'none' }}>
          <div style={{ color: 'var(--muted)', fontSize: 10, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 4 }}>{s.label}</div>
          <div style={{ fontFamily: 'Fraunces, serif', fontSize: 26, fontWeight: 300, color: s.color }}>{s.value}</div>
        </div>
      ))}
    </div>
  )
}
