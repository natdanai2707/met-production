'use client'
import { useMemo } from 'react'
import { Order } from '@/lib/supabase'
import { summarizeMaterials, ordersToCSV, downloadFile, EMPTY } from '@/lib/utils'
import { modalOverlay, modalCard, modalHeader, modalTitle, modalBody, modalFooter, closeBtn } from '@/lib/styles'
import { useToast } from './Toast'

type Props = {
  open: boolean
  onClose: () => void
  orders: Order[]
}

// Orders below this stage still need their sheet material ordered.
const MAX_STAGE_EXCLUSIVE = 2

export default function MaterialSummaryModal({ open, onClose, orders }: Props) {
  const toast = useToast()

  const rows = useMemo(() => summarizeMaterials(orders, MAX_STAGE_EXCLUSIVE), [orders])
  const pending = useMemo(() => orders.filter(o => o.stage < MAX_STAGE_EXCLUSIVE), [orders])

  if (!open) return null

  const exportCSV = () => {
    if (pending.length === 0) { toast.info('ไม่มีออร์เดอร์ที่รอสั่งวัสดุ'); return }
    const stamp = new Date().toISOString().slice(0, 10)
    downloadFile(`met-material-orders-${stamp}.csv`, ordersToCSV(pending))
    toast.success('ส่งออกรายการวัสดุแล้ว')
  }

  const th: React.CSSProperties = { fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--muted)', padding: '8px 12px', borderBottom: '1px solid var(--border)', textAlign: 'left', fontWeight: 400 }
  const td: React.CSSProperties = { padding: '10px 12px', fontSize: 13, borderBottom: '1px solid var(--border)' }

  return (
    <div style={{ ...modalOverlay, zIndex: 2000 }} className="overlay-in"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div style={{ ...modalCard, width: 560 }} className="dialog-in">
        <div style={modalHeader}>
          <div style={modalTitle}>
            สรุปวัสดุที่ต้องสั่ง <span style={{ fontStyle: 'italic', color: 'var(--muted)', fontSize: 14 }}>· ยังไม่เข้าตัด</span>
          </div>
          <button onClick={onClose} style={closeBtn}>×</button>
        </div>

        <div style={modalBody}>
          <div style={{ color: 'var(--muted)', fontSize: 11, lineHeight: 1.7, marginBottom: 16 }}>
            รวมวัสดุแผ่นจากออร์เดอร์ที่ยังอยู่ในขั้น รับออร์เดอร์ / สั่งวัสดุ ({pending.length} ออร์เดอร์)
            จัดกลุ่มตามชนิดวัสดุและความหนา เพื่อสั่งซื้อทีเดียว
          </div>

          {rows.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 12px', color: 'var(--muted)' }}>
              <div style={{ fontSize: 32, marginBottom: 10, opacity: 0.4 }}>📦</div>
              <div style={{ fontFamily: 'Fraunces, serif', fontStyle: 'italic', fontSize: 15 }}>ไม่มีวัสดุที่ต้องสั่งตอนนี้</div>
            </div>
          ) : (
            <div style={{ border: '1px solid var(--border)', borderRadius: 2, overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={th}>วัสดุ</th>
                    <th style={{ ...th, textAlign: 'right' }}>ความหนา</th>
                    <th style={{ ...th, textAlign: 'right' }}>จำนวนรวม</th>
                    <th style={{ ...th, textAlign: 'right' }}>ออร์เดอร์</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r, i) => (
                    <tr key={i}>
                      <td style={td}>{r.material}</td>
                      <td style={{ ...td, textAlign: 'right', color: 'var(--muted)' }}>{r.thickness ? `${r.thickness} mm` : EMPTY}</td>
                      <td style={{ ...td, textAlign: 'right', color: 'var(--accent)' }}>{r.totalQty}</td>
                      <td style={{ ...td, textAlign: 'right', color: 'var(--muted)' }}>{r.orderCount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div style={modalFooter}>
          <button className="btn btn-ghost" onClick={onClose}>Close</button>
          <button className="btn btn-primary" onClick={exportCSV}>⬇ Export รายการ</button>
        </div>
      </div>
    </div>
  )
}
