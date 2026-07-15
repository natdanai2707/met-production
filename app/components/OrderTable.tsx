'use client'
import { Order, STAGES } from '@/lib/supabase'
import {
  EMPTY, formatDate, getDueColor, paidPercent, payColor,
  stageStyle, channelStyle, SortKey, SortState,
} from '@/lib/utils'
import { badge, iconBtn } from '@/lib/styles'

type Props = {
  orders: Order[]
  onEdit: (o: Order) => void
  onDelete: (id: string) => void
  onDetail: (o: Order) => void
  onDuplicate: (o: Order) => void
  sort?: SortState
  onSort?: (key: SortKey) => void
}

const HEADERS: { label: string; sortKey?: SortKey }[] = [
  { label: '#', sortKey: 'created' },
  { label: 'สินค้า' }, { label: 'ลูกค้า' }, { label: 'Account' }, { label: 'ช่องทาง' },
  { label: 'ขนาด' }, { label: 'วัสดุ' }, { label: 'จำนวน' }, { label: 'Stage' },
  { label: 'กำหนดส่ง', sortKey: 'due' },
  { label: 'การโอน', sortKey: 'payment' },
  { label: 'สถานที่ส่ง' }, { label: '' },
]

export default function OrderTable({ orders, onEdit, onDelete, onDetail, onDuplicate, sort, onSort }: Props) {
  if (orders.length === 0) return (
    <div style={{ textAlign: 'center', padding: '80px 32px', color: 'var(--muted)' }}>
      <div style={{ fontSize: 40, marginBottom: 12, opacity: 0.4 }}>⬜</div>
      <p style={{ fontFamily: 'Fraunces, serif', fontStyle: 'italic', fontSize: 16 }}>No orders yet, add your first one</p>
    </div>
  )

  return (
    <div style={{ overflowX: 'auto', padding: '0 32px 32px' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid var(--border)' }}>
            {HEADERS.map((h, i) => {
              const sortable = !!(h.sortKey && onSort)
              const active = sortable && sort?.key === h.sortKey
              const arrow = active ? (sort!.dir === 'asc' ? ' ↑' : ' ↓') : ''
              return (
                <th key={i}
                  onClick={sortable ? () => onSort!(h.sortKey!) : undefined}
                  style={{
                    textAlign: 'left', padding: '12px 10px', fontSize: 10, letterSpacing: '0.15em',
                    textTransform: 'uppercase', fontWeight: 400, whiteSpace: 'nowrap',
                    color: active ? 'var(--accent)' : 'var(--muted)',
                    cursor: sortable ? 'pointer' : 'default',
                    userSelect: 'none',
                  }}>
                  {h.label}{arrow}
                </th>
              )
            })}
          </tr>
        </thead>
        <tbody>
          {orders.map((o, idx) => {
            const paid = paidPercent(o)
            const pc = payColor(paid)
            const ss = stageStyle(o.stage)
            const cs = channelStyle(o.channel)
            const matSummary = (o.materials || []).map(m => `${m.material} ${m.thickness}mm`).join(', ') || EMPTY

            return (
              <tr
                key={o.id}
                onClick={() => onDetail(o)}
                style={{ borderBottom: '1px solid var(--border)', cursor: 'pointer' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface2)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                <td style={{ padding:'14px 10px', color:'var(--muted)', fontSize:11 }}>#{String(idx+1).padStart(3,'0')}</td>
                <td style={{ padding:'14px 10px' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                    {o.image_url
                      // eslint-disable-next-line @next/next/no-img-element
                      ? <img alt={o.product} src={o.image_url} style={{ width:36, height:36, objectFit:'cover', borderRadius:2, border:'1px solid var(--border)' }} />
                      : <div style={{ width:36, height:36, background:'var(--surface2)', border:'1px dashed var(--border)', borderRadius:2, display:'flex', alignItems:'center', justifyContent:'center', color:'var(--muted)' }}>□</div>
                    }
                    <span>{o.product}</span>
                  </div>
                </td>
                <td style={{ padding:'14px 10px', fontFamily:'Fraunces,serif', fontSize:15, fontWeight:300 }}>{o.customer}</td>
                <td style={{ padding:'14px 10px', color:'var(--muted)' }}>{o.account || EMPTY}</td>
                <td style={{ padding:'14px 10px' }}>
                  <span style={{ ...badge, background:cs.bg, color:cs.color }}>
                    {o.channel}
                  </span>
                </td>
                <td style={{ padding:'14px 10px', color:'var(--muted)' }}>{o.size || EMPTY}</td>
                <td style={{ padding:'14px 10px', color:'var(--muted)', maxWidth:140, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{matSummary}</td>
                <td style={{ padding:'14px 10px', textAlign:'center' }}>{o.qty}</td>
                <td style={{ padding:'14px 10px' }}>
                  <span style={{ display:'inline-flex', alignItems:'center', gap:5, padding:'3px 10px', borderRadius:2, fontSize:10, background:ss.bg, color:ss.color }}>
                    <span style={{ width:5, height:5, borderRadius:'50%', background:ss.color, display:'inline-block' }}></span>
                    {STAGES[o.stage]}
                  </span>
                </td>
                <td style={{ padding:'14px 10px', color: getDueColor(o.due_date) }}>{formatDate(o.due_date)}</td>
                <td style={{ padding:'14px 10px', minWidth:100 }}>
                  <div style={{ fontSize:11, color:'var(--muted)' }}>
                    <span style={{ color:pc, fontSize:12 }}>{paid}%</span> โอนแล้ว
                  </div>
                  <div style={{ background:'var(--surface2)', borderRadius:2, height:4, marginTop:4 }}>
                    <div style={{ height:4, borderRadius:2, width:`${Math.min(paid,100)}%`, background:pc, transition:'width 0.3s' }} />
                  </div>
                </td>
                <td style={{ padding:'14px 10px', color:'var(--muted)', maxWidth:120, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{o.delivery || EMPTY}</td>
                <td style={{ padding:'14px 10px' }}>
                  <div style={{ display:'flex', gap:6 }} onClick={e => e.stopPropagation()}>
                    <button onClick={() => onDuplicate(o)} title="Duplicate" style={{ ...iconBtn, fontSize:12 }}>⎘</button>
                    <button onClick={() => onEdit(o)} title="Edit" style={iconBtn}>✎</button>
                    <button onClick={() => onDelete(o.id)} title="Delete" style={{ ...iconBtn, color:'var(--danger)' }}>✕</button>
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
