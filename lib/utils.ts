import type { Order } from './supabase'

// Placeholder shown for empty values in tables and detail views.
// We deliberately avoid the em dash character here.
export const EMPTY = '-'

// ── Dates ────────────────────────────────────────────────────────────────────

// Format an ISO / YYYY-MM-DD date to Thai short form, e.g. "3 ก.ค. 68".
export function formatDate(d: string | null): string {
  if (!d) return EMPTY
  const dt = new Date(d)
  if (isNaN(dt.getTime())) return EMPTY
  return dt.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit' })
}

// Format to short day + month only, e.g. "3 ก.ค.".
export function formatDayMonth(d: string | null): string {
  if (!d) return EMPTY
  const dt = new Date(d)
  if (isNaN(dt.getTime())) return EMPTY
  return dt.toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })
}

// Whole days from today (midnight) to the given date. Negative means overdue.
export function daysUntil(d: string | null): number | null {
  if (!d) return null
  const target = new Date(d)
  if (isNaN(target.getTime())) return null
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  target.setHours(0, 0, 0, 0)
  return Math.ceil((target.getTime() - today.getTime()) / 86400000)
}

// Color for a due date: red overdue, gold within a week, green otherwise.
export function getDueColor(d: string | null): string {
  const diff = daysUntil(d)
  if (diff === null) return 'var(--text)'
  return diff < 0 ? 'var(--danger)' : diff <= 7 ? 'var(--accent)' : 'var(--accent2)'
}

// Add N business days (skip Sat/Sun) to a start date. Returns YYYY-MM-DD.
export function addBusinessDays(startStr: string, days: number): string {
  if (!startStr || !days || days < 1) return ''
  const d = new Date(startStr)
  if (isNaN(d.getTime())) return ''
  let added = 0
  while (added < days) {
    d.setDate(d.getDate() + 1)
    const dow = d.getDay()
    if (dow !== 0 && dow !== 6) added++
  }
  return d.toISOString().split('T')[0]
}

// ── Payments ─────────────────────────────────────────────────────────────────

// Percent of total that has been paid (0 when there is no price yet).
export function paidPercent(o: Pick<Order, 'total_price' | 'deposit'>): number {
  return o.total_price > 0 ? Math.round((o.deposit / o.total_price) * 100) : 0
}

// Color for a payment percent: green fully paid, gold partial, red low.
export function payColor(percent: number): string {
  return percent >= 100 ? 'var(--accent2)' : percent >= 50 ? 'var(--accent)' : 'var(--danger)'
}

// ── Stage + channel styling ──────────────────────────────────────────────────

// Badge styling (bg + text color) per production stage index.
export const STAGE_STYLE: { bg: string; color: string }[] = [
  { bg: 'rgba(107,103,98,0.2)',  color: 'var(--muted)' },
  { bg: 'rgba(200,169,110,0.15)', color: 'var(--accent)' },
  { bg: 'rgba(90,140,200,0.15)',  color: '#8ab4e0' },
  { bg: 'rgba(160,100,200,0.15)', color: '#c09ad8' },
  { bg: 'rgba(200,130,70,0.15)',  color: '#d4946a' },
  { bg: 'rgba(143,186,159,0.15)', color: 'var(--accent2)' },
  { bg: 'rgba(107,103,98,0.15)',  color: 'var(--muted)' },
]

// Solid stage colors used by the calendar dots and bars.
export const STAGE_COLORS: string[] = ['#6b6762', '#c8a96e', '#8ab4e0', '#c09ad8', '#d4946a', '#8fba9f', '#444']

export function stageColor(stage: number): string {
  return STAGE_COLORS[stage] ?? '#6b6762'
}

export function stageStyle(stage: number): { bg: string; color: string } {
  return STAGE_STYLE[stage] || STAGE_STYLE[0]
}

// Badge styling per sales channel.
export const CH_STYLE: Record<string, { bg: string; color: string }> = {
  Facebook:  { bg: 'rgba(59,89,152,0.25)',   color: '#7b9fd4' },
  Instagram: { bg: 'rgba(193,53,132,0.2)',   color: '#d4789a' },
  LINE:      { bg: 'rgba(0,185,0,0.15)',     color: '#6ecf7a' },
  Shopee:    { bg: 'rgba(238,78,0,0.2)',     color: '#e8946a' },
  'Walk-in': { bg: 'rgba(200,169,110,0.15)', color: 'var(--accent)' },
  Referral:  { bg: 'rgba(143,186,159,0.15)', color: 'var(--accent2)' },
  Other:     { bg: 'rgba(100,100,100,0.2)',  color: 'var(--muted)' },
}

export function channelStyle(channel: string): { bg: string; color: string } {
  return CH_STYLE[channel] || CH_STYLE.Other
}

// ── Images ───────────────────────────────────────────────────────────────────

// File extension for a storage path, defaulting to jpg.
export function storageExt(file: File): string {
  const m = /\.(\w+)$/.exec(file.name)
  return (m?.[1] || 'jpg').toLowerCase()
}

// Resize an image file client-side so its longest edge is <= maxEdge px and
// re-encode as JPEG to cut upload size. Returns the original file untouched
// when it is already small enough or if anything goes wrong.
export async function compressImage(file: File, maxEdge = 1200, quality = 0.82): Promise<File> {
  if (typeof window === 'undefined' || !file.type.startsWith('image/')) return file
  try {
    const bitmap = await createImageBitmap(file)
    const longest = Math.max(bitmap.width, bitmap.height)
    const scale = Math.min(1, maxEdge / longest)
    if (scale >= 1) { bitmap.close?.(); return file }

    const w = Math.round(bitmap.width * scale)
    const h = Math.round(bitmap.height * scale)
    const canvas = document.createElement('canvas')
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext('2d')
    if (!ctx) { bitmap.close?.(); return file }
    ctx.drawImage(bitmap, 0, 0, w, h)
    bitmap.close?.()

    const blob = await new Promise<Blob | null>(res => canvas.toBlob(res, 'image/jpeg', quality))
    if (!blob || blob.size >= file.size) return file
    const name = file.name.replace(/\.\w+$/, '') + '.jpg'
    return new File([blob], name, { type: 'image/jpeg' })
  } catch {
    return file
  }
}

// ── Sorting ──────────────────────────────────────────────────────────────────

export type SortKey = 'created' | 'due' | 'payment'
export type SortDir = 'asc' | 'desc'
export type SortState = { key: SortKey; dir: SortDir }

// Sentinel so rows without a due date sort to the far end.
const FAR_DATE = '9999-12-31'

// Base comparator (ascending) for the sortable order columns.
export function compareOrders(a: Order, b: Order, key: SortKey): number {
  switch (key) {
    case 'due':
      return (a.due_date || FAR_DATE).localeCompare(b.due_date || FAR_DATE)
    case 'payment':
      return paidPercent(a) - paidPercent(b)
    case 'created':
    default:
      return (a.created_at || '').localeCompare(b.created_at || '')
  }
}

// ── Async helpers ────────────────────────────────────────────────────────────

// Run an async operation with a few retries on transient failures.
export async function withRetry<T>(fn: () => Promise<T>, retries = 2, delayMs = 600): Promise<T> {
  let lastErr: unknown
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn()
    } catch (err) {
      lastErr = err
      if (attempt < retries) await new Promise(r => setTimeout(r, delayMs * (attempt + 1)))
    }
  }
  throw lastErr
}
