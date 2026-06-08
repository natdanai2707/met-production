'use client'
import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { supabase, Order, STAGES } from '@/lib/supabase'

// Stage colors for the bar
const STAGE_COLORS: Record<number, string> = {
  0: '#6b6762',
  1: '#c8a96e',
  2: '#8ab4e0',
  3: '#c09ad8',
  4: '#d4946a',
  5: '#8fba9f',
  6: '#444',
}

function parseDate(d: string | null): Date | null {
  if (!d) return null
  const dt = new Date(d)
  dt.setHours(0, 0, 0, 0)
  return isNaN(dt.getTime()) ? null : dt
}

function addDays(d: Date, n: number): Date {
  const r = new Date(d)
  r.setDate(r.getDate() + n)
  return r
}

function diffDays(a: Date, b: Date): number {
  return Math.round((b.getTime() - a.getTime()) / 86400000)
}

function fmtDay(d: Date) {
  return d.toLocaleDateString('th-TH', { day: 'numeric' })
}
function fmtMonth(d: Date) {
  return d.toLocaleDateString('th-TH', { month: 'short' })
}

const COL_W = 36   // px per day
const ROW_H = 44   // px per row
const LABEL_W = 220 // px for row label

export default function CalendarPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const todayRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    supabase.from('orders').select('*')
      .order('due_date', { ascending: true, nullsFirst: false })
      .then(({ data }) => {
        if (data) setOrders(data as Order[])
        setLoading(false)
      })
  }, [])

  useEffect(() => {
    todayRef.current?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' })
  }, [orders])

  // Orders that have at least a due_date, sorted by due_date asc
  const valid = orders
    .filter(o => o.due_date)
    .sort((a, b) => (a.due_date! > b.due_date! ? 1 : -1))

  // Also show orders without due_date at the bottom
  const noDue = orders.filter(o => !o.due_date)

  // Date range: today → last due_date + 3 days padding
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const lastDue = valid.length > 0 ? parseDate(valid[valid.length - 1].due_date)! : addDays(today, 30)
  const rangeStart = addDays(today, -7)  // show 7 days before today
  const rangeEnd = addDays(lastDue, 5)
  const totalDays = diffDays(rangeStart, rangeEnd) + 1

  // Group days by month for header
  type MonthGroup = { month: string; days: Date[] }
  const monthGroups: MonthGroup[] = []
  for (let i = 0; i < totalDays; i++) {
    const d = addDays(rangeStart, i)
    const mLabel = fmtMonth(d) + ' ' + d.getFullYear()
    if (!monthGroups.length || monthGroups[monthGroups.length - 1].month !== mLabel) {
      monthGroups.push({ month: mLabel, days: [] })
    }
    monthGroups[monthGroups.length - 1].days.push(d)
  }

  const dayCol = (d: Date) => diffDays(rangeStart, d)
  const todayCol = dayCol(today)

  // Row render helper
  const renderRow = (o: Order, idx: number) => {
    const startDate = parseDate(o.start_date) || parseDate(o.created_at)
    const dueDate = parseDate(o.due_date)
    const stageColor = STAGE_COLORS[o.stage] ?? '#6b6762'
    const paid = o.total_price > 0 ? Math.round((o.deposit / o.total_price) * 100) : 0
    const payColor = paid >= 100 ? '#8fba9f' : paid >= 50 ? '#c8a96e' : '#c46060'

    let barLeft = 0, barWidth = 0, hasDue = false
    if (startDate && dueDate) {
      barLeft = dayCol(startDate) * COL_W
      barWidth = Math.max((dayCol(dueDate) - dayCol(startDate) + 1) * COL_W, COL_W)
      hasDue = true
    } else if (dueDate) {
      barLeft = (dayCol(dueDate) - 1) * COL_W
      barWidth = COL_W * 2
      hasDue = true
    }

    // Is overdue?
    const isOverdue = dueDate && dueDate < today && o.stage < 6
    const rowBg = idx % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.015)'

    return (
      <div key={o.id} style={{ display: 'flex', height: ROW_H, borderBottom: '1px solid var(--border)', background: rowBg }}>
        {/* Label */}
        <div style={{
          width: LABEL_W, minWidth: LABEL_W,
          padding: '0 12px',
          display: 'flex', alignItems: 'center', gap: 8,
          borderRight: '1px solid var(--border)',
          position: 'sticky', left: 0, background: idx % 2 === 0 ? 'var(--bg)' : '#111',
          zIndex: 2,
        }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: stageColor, flexShrink: 0 }} />
          <div style={{ overflow: 'hidden' }}>
            <div style={{ fontSize: 12, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {o.customer}
            </div>
            <div style={{ fontSize: 10, color: 'var(--muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {o.product}
            </div>
          </div>
          {o.due_date && (
            <div style={{ marginLeft: 'auto', fontSize: 10, color: isOverdue ? 'var(--danger)' : 'var(--muted)', flexShrink: 0 }}>
              {new Date(o.due_date).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })}
            </div>
          )}
        </div>

        {/* Timeline */}
        <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
          {/* Today line */}
          <div style={{
            position: 'absolute', left: todayCol * COL_W + COL_W / 2,
            top: 0, bottom: 0, width: 1, background: 'rgba(200,169,110,0.4)', zIndex: 1,
          }} />

          {/* Bar */}
          {hasDue && (
            <div style={{
              position: 'absolute',
              left: barLeft,
              top: 10,
              width: barWidth,
              height: ROW_H - 20,
              borderRadius: 2,
              background: isOverdue
                ? 'rgba(196,96,96,0.25)'
                : `${stageColor}22`,
              border: `1px solid ${isOverdue ? '#c46060' : stageColor}`,
              display: 'flex', alignItems: 'center', paddingLeft: 8,
              overflow: 'hidden',
              zIndex: 2,
            }}>
              {/* Payment progress strip at bottom */}
              <div style={{
                position: 'absolute', bottom: 0, left: 0,
                height: 3, width: `${paid}%`, background: payColor,
                borderRadius: '0 0 0 2px',
              }} />
              <span style={{ fontSize: 10, color: isOverdue ? '#c46060' : stageColor, whiteSpace: 'nowrap', fontWeight: 500 }}>
                {STAGES[o.stage]} {o.qty > 1 ? `×${o.qty}` : ''}
              </span>
            </div>
          )}

          {/* Due date marker */}
          {dueDate && (
            <div style={{
              position: 'absolute',
              left: dayCol(dueDate) * COL_W + COL_W / 2 - 1,
              top: 6, bottom: 6, width: 2,
              background: isOverdue ? 'var(--danger)' : 'var(--accent2)',
              borderRadius: 1, zIndex: 3,
            }} />
          )}
        </div>
      </div>
    )
  }

  if (loading) return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)' }}>
      Loading...
    </div>
  )

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ borderBottom: '1px solid var(--border)', padding: '16px 24px', display: 'flex', alignItems: 'center', gap: 16, position: 'sticky', top: 0, background: 'var(--bg)', zIndex: 100, flexShrink: 0 }}>
        <div style={{ fontFamily: 'Fraunces,serif', fontSize: 20, fontWeight: 300, letterSpacing: '0.08em', color: 'var(--accent)' }}>
          MET <span style={{ fontStyle: 'italic' }}>Production</span>
        </div>
        <Link href="/" style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 2, color: 'var(--muted)', fontFamily: '"DM Mono",monospace', fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', padding: '5px 12px', cursor: 'pointer', textDecoration: 'none' }}>
          ← Orders
        </Link>
        <div style={{ background: 'rgba(200,169,110,0.1)', border: '1px solid var(--accent)', borderRadius: 2, color: 'var(--accent)', fontFamily: '"DM Mono",monospace', fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', padding: '5px 12px' }}>
          Calendar
        </div>
        {/* Legend */}
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 16, alignItems: 'center', fontSize: 10, color: 'var(--muted)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <div style={{ width: 20, height: 3, background: 'var(--accent2)' }} />
            กำหนดส่ง
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <div style={{ width: 20, height: 3, background: 'rgba(200,169,110,0.4)' }} />
            วันนี้
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <div style={{ width: 20, height: 3, background: 'var(--danger)' }} />
            เลยกำหนด
          </div>
        </div>
      </div>

      {/* Gantt */}
      <div style={{ flex: 1, overflow: 'auto' }}>
        <div style={{ display: 'flex', minWidth: LABEL_W + totalDays * COL_W }}>

          {/* STICKY LEFT HEADER CORNER */}
          <div style={{ width: LABEL_W, minWidth: LABEL_W, flexShrink: 0, position: 'sticky', left: 0, zIndex: 10, background: 'var(--bg)' }}>
            {/* Month row */}
            <div style={{ height: 28, borderBottom: '1px solid var(--border)', borderRight: '1px solid var(--border)', display: 'flex', alignItems: 'center', padding: '0 12px', fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--muted)' }}>
              ออร์เดอร์
            </div>
            {/* Day row */}
            <div style={{ height: 28, borderBottom: '2px solid var(--border)', borderRight: '1px solid var(--border)' }} />
          </div>

          {/* HEADER COLUMNS */}
          <div style={{ flex: 1, position: 'relative' }}>
            {/* Month row */}
            <div style={{ display: 'flex', height: 28, borderBottom: '1px solid var(--border)' }}>
              {monthGroups.map((mg, i) => (
                <div key={i} style={{
                  width: mg.days.length * COL_W,
                  minWidth: mg.days.length * COL_W,
                  borderRight: '1px solid var(--border)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--muted)',
                  fontWeight: 500,
                }}>
                  {mg.month}
                </div>
              ))}
            </div>
            {/* Day row */}
            <div style={{ display: 'flex', height: 28, borderBottom: '2px solid var(--border)', position: 'relative' }}>
              {Array.from({ length: totalDays }, (_, i) => {
                const d = addDays(rangeStart, i)
                const isToday = i === todayCol
                const isSun = d.getDay() === 0
                const isSat = d.getDay() === 6
                return (
                  <div key={i}
                    ref={isToday ? todayRef : undefined}
                    style={{
                      width: COL_W, minWidth: COL_W,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 10,
                      color: isToday ? 'var(--accent)' : isSun || isSat ? '#555' : 'var(--muted)',
                      fontWeight: isToday ? 600 : 400,
                      borderRight: '1px solid var(--border)',
                      background: isToday ? 'rgba(200,169,110,0.1)' : 'transparent',
                      position: 'relative',
                    }}>
                    {fmtDay(d)}
                    {isToday && (
                      <div style={{ position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: 4, height: 4, borderRadius: '50%', background: 'var(--accent)' }} />
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* ROW BODY */}
        <div style={{ position: 'relative' }}>
          {/* Weekend column shading */}
          {Array.from({ length: totalDays }, (_, i) => {
            const d = addDays(rangeStart, i)
            const isSun = d.getDay() === 0
            const isSat = d.getDay() === 6
            if (!isSun && !isSat) return null
            return (
              <div key={i} style={{
                position: 'absolute',
                left: LABEL_W + i * COL_W,
                top: 0, bottom: 0, width: COL_W,
                background: 'rgba(255,255,255,0.015)',
                pointerEvents: 'none', zIndex: 0,
              }} />
            )
          })}

          {valid.map((o, idx) => renderRow(o, idx))}

          {/* No-due orders */}
          {noDue.length > 0 && (
            <>
              <div style={{ padding: '8px 12px', fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--muted)', borderBottom: '1px solid var(--border)', marginTop: 4 }}>
                ไม่มีกำหนดส่ง
              </div>
              {noDue.map((o, idx) => renderRow(o, valid.length + idx))}
            </>
          )}

          {orders.length === 0 && (
            <div style={{ textAlign: 'center', padding: '80px 32px', color: 'var(--muted)' }}>
              <div style={{ fontFamily: 'Fraunces,serif', fontStyle: 'italic', fontSize: 16 }}>ยังไม่มีออร์เดอร์</div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
