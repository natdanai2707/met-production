'use client'
import type { CSSProperties } from 'react'

// แสดงเวลาที่ระบบถูก build/deploy ล่าสุด เพื่อให้ผู้ใช้เช็คได้ว่าเห็นเวอร์ชันใหม่แล้วหรือยัง
// ค่า NEXT_PUBLIC_BUILD_TIME ถูก inline ตอน build (ตั้งใน next.config.mjs)
export default function BuildStamp({ style }: { style?: CSSProperties }) {
  const iso = process.env.NEXT_PUBLIC_BUILD_TIME
  if (!iso) return null

  let label = iso
  try {
    label = new Date(iso).toLocaleString('th-TH', {
      timeZone: 'Asia/Bangkok',
      day: 'numeric', month: 'short', year: '2-digit',
      hour: '2-digit', minute: '2-digit',
    })
  } catch { /* ใช้ค่า iso ดิบถ้า format ไม่ได้ */ }

  return (
    <span
      title={`Build time (UTC): ${iso}`}
      style={{
        fontSize: 10, color: 'var(--muted)', fontFamily: '"DM Mono", monospace',
        letterSpacing: '0.04em', whiteSpace: 'nowrap', ...style,
      }}
    >
      อัพเดตระบบ: {label} น.
    </span>
  )
}
