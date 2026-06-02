'use client'
import { Order, STAGES } from '@/lib/supabase'

type Props = {
  orders: Order[]
  onEdit: (o: Order) => void
  onDelete: (id: string) => void
  onDetail: (o: Order) => void
}

const STAGE_STYLE = [
  { bg: 'rgba(107,103,98,0.2)', color: 'var(--muted)' },
  { bg: 'rgba(200,169,110,0.15)', color: 'var(--accent)' },
  { bg: 'rgba(90,140,200,0.15)', color: '#8ab4e0' },
  { bg: 'rgba(160,100,200,0.15)', color: '#c09ad8' },
  { bg: 'rgba(200,130,70,0.15)', color: '#d4946a' },
  { bg: 'rgba(143,186,159,0.15)', color: 'var(--accent2)' },
  { bg: 'rgba(107,103,98,0.15)', color: 'var(--muted)' },
]

const CH_STYLE: Record<string, { bg: string; color: string }> = {
  Facebook:   { bg: 'rgba(59,89,152,0.25)',   color: '#7b9fd4' },
  Instagram:  { bg: 'rgba(193,53,132,0.2)',   color: '#d4789a' },
  LINE:       { bg: 'rgba(0,185,0,0.15)',     color: '#6ecf7a' },
  Shopee:     { bg: 'rgba(238,78,0,0.2)',     color: '#e8946a' },
  'Walk-in':  { bg: 'rgba(200,169,110,0.15)', color: 'var(--accent)' },
  Referral:   { bg: 'rgba(143,186,159,0.15)', color: 'var(--accent2)' },
  Other:      { bg: 'rgba(100,100,100,0.2)',  color: 'var(--muted)' },
}

function getDueClass(d: string | null) {
  if (!d) return ''
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const diff = Math.ceil((new Date(d).getTime() - today.getTime()) / 86400000)
  return diff < 0 ? 'var(--danger)' : diff <= 7 ? 'var(--accent)' : 'var(--accent2)'
}

function formatDate(d: string | null) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit' })
}

export default function OrderTable({ orders, onEdit, onDelete, onDetail }: Props) {
  if (orders.length === 0) return (
    <div style={{ textAlign: 'center', padding: '80px 32px', color: 'var(--muted)' }}>
      <div style={{ fontSize: 40, marginBottom: 12, opacity: 0.4 }}>⬜</div>
      <p style={{ fontFamily: 'Fraunces, serif', fontStyle: 'italic', fontSize: 16 }}>No orders yet — add your first one</p>
    </div>
  )

  return (
    <div style={{ overflowX: 'auto', padding: '0 32px 32px' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid var(--border)' }}>
            {['#','สินค้า','ลูกค้า','Account','ช่องทาง','ขนาด','วัสดุ','จำนวน','Stage','กำหนดส่ง','การโอน','สถานที่ส่ง',''].map((h,i) => (
              <th key={i} style={{ textAlign:'left', padding:'12px 10px', fontSize:10, letterSpacing:'0.15em', textTransform:'uppercase', color:'var(--muted)', fontWeight:400, whiteSpace:'nowrap' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {orders.map((o, idx) => {
            const paid = o.total_price > 0 ? Math.round((o.deposit / o.total_price) * 100) : 0
            const payColor = paid >= 100 ? '#8fba9f' : paid >= 50 ? '#c8a96e' : '#c46060'
            const ss = STAGE_STYLE[o.stage] || STAGE_STYLE[0]
            const cs = CH_STYLE[o.channel] || CH_STYLE['Other']
            const matSummary = (o.materials || []).map(m => `${m.material} ${m.thickness}mm`).join(', ') || '—'

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
                      ? <img src={o.image_url} style={{ width:36, height:36, objectFit:'cover', borderRadius:2, border:'1px solid var(--border)' }} />
                      : <div style={{ width:36, height:36, background:'var(--surface2)', border:'1px dashed var(--border)', borderRadius:2, display:'flex', alignItems:'center', justifyContent:'center', color:'var(--muted)' }}>□</div>
                    }
                    <span>{o.product}</span>
                  </div>
                </td>
                <td style={{ padding:'14px 10px', fontFamily:'Fraunces,serif', fontSize:15, fontWeight:300 }}>{o.customer}</td>
                <td style={{ padding:'14px 10px', color:'var(--muted)' }}>{o.account || '—'}</td>
                <td style={{ padding:'14px 10px' }}>
                  <span style={{ display:'inline-block', padding:'2px 8px', borderRadius:2, fontSize:10, letterSpacing:'0.05em', textTransform:'uppercase', background:cs.bg, color:cs.color }}>
                    {o.channel}
                  </span>
                </td>
                <td style={{ padding:'14px 10px', color:'var(--muted)' }}>{o.size || '—'}</td>
                <td style={{ padding:'14px 10px', color:'var(--muted)', maxWidth:140, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{matSummary}</td>
                <td style={{ padding:'14px 10px', textAlign:'center' }}>{o.qty}</td>
                <td style={{ padding:'14px 10px' }}>
                  <span style={{ display:'inline-flex', alignItems:'center', gap:5, padding:'3px 10px', borderRadius:2, fontSize:10, background:ss.bg, color:ss.color }}>
                    <span style={{ width:5, height:5, borderRadius:'50%', background:ss.color, display:'inline-block' }}></span>
                    {STAGES[o.stage]}
                  </span>
                </td>
                <td style={{ padding:'14px 10px', color: getDueClass(o.due_date) }}>{formatDate(o.due_date)}</td>
                <td style={{ padding:'14px 10px', minWidth:100 }}>
                  <div style={{ fontSize:11, color:'var(--muted)' }}>
                    <span style={{ color:payColor, fontSize:12 }}>{paid}%</span> โอนแล้ว
                  </div>
                  <div style={{ background:'var(--surface2)', borderRadius:2, height:4, marginTop:4 }}>
                    <div style={{ height:4, borderRadius:2, width:`${Math.min(paid,100)}%`, background:payColor, transition:'width 0.3s' }} />
                  </div>
                </td>
                <td style={{ padding:'14px 10px', color:'var(--muted)', maxWidth:120, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{o.delivery || '—'}</td>
                <td style={{ padding:'14px 10px' }}>
                  <div style={{ display:'flex', gap:6 }} onClick={e => e.stopPropagation()}>
                    <button onClick={() => onEdit(o)} style={{ background:'none', border:'1px solid var(--border)', color:'var(--muted)', borderRadius:2, width:26, height:26, cursor:'pointer', fontSize:13 }}>✎</button>
                    <button onClick={() => onDelete(o.id)} style={{ background:'none', border:'1px solid var(--border)', color:'var(--danger)', borderRadius:2, width:26, height:26, cursor:'pointer', fontSize:13 }}>✕</button>
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
