'use client'
import { Order, STAGES } from '@/lib/supabase'

type Props = {
  order: Order | null
  onClose: () => void
  onEdit: (o: Order) => void
  onStageChange: (id: string, stage: number) => Promise<void>
}

function formatDate(d: string | null) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit' })
}
function getDueColor(d: string | null) {
  if (!d) return 'var(--text)'
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const diff = Math.ceil((new Date(d).getTime() - today.getTime()) / 86400000)
  return diff < 0 ? 'var(--danger)' : diff <= 7 ? 'var(--accent)' : 'var(--accent2)'
}

export default function DetailModal({ order, onClose, onEdit, onStageChange }: Props) {
  if (!order) return null

  const paid = order.total_price > 0 ? Math.round((order.deposit / order.total_price) * 100) : 0
  const payColor = paid >= 100 ? '#8fba9f' : paid >= 50 ? '#c8a96e' : '#c46060'
  const remaining = order.total_price - order.deposit

  const fieldStyle = { marginBottom: 16 }
  const labelStyle = { fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase' as const, color: 'var(--muted)', display: 'block', marginBottom: 3 }

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.75)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center' }}
      onClick={e => { if(e.target === e.currentTarget) onClose() }}>
      <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:4, width:680, maxWidth:'95vw', maxHeight:'90vh', overflow:'hidden', display:'flex', flexDirection:'column' }}>

        <div style={{ padding:'20px 24px', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', justifyContent:'space-between', background:'var(--surface)' }}>
          <div style={{ fontFamily:'Fraunces,serif', fontSize:18, fontWeight:300 }}>{order.customer} — {order.product}</div>
          <button onClick={onClose} style={{ background:'none', border:'none', color:'var(--muted)', fontSize:20, cursor:'pointer' }}>×</button>
        </div>

        <div style={{ overflowY:'auto', padding:24, flex:1 }}>

          {/* Pipeline */}
          <div style={{ display:'flex', border:'1px solid var(--border)', borderRadius:2, overflow:'hidden', marginBottom:20 }}>
            {STAGES.map((s, i) => {
              const isDone = i < order.stage
              const isCurrent = i === order.stage
              return (
                <div key={i} onClick={() => onStageChange(order.id, i)}
                  style={{
                    flex:1, padding:'8px 4px', textAlign:'center', fontSize:9,
                    letterSpacing:'0.06em', textTransform:'uppercase', cursor:'pointer',
                    borderRight: i < 6 ? '1px solid var(--border)' : 'none',
                    background: isDone ? 'rgba(143,186,159,0.1)' : isCurrent ? 'rgba(200,169,110,0.12)' : 'transparent',
                    color: isDone ? 'var(--accent2)' : isCurrent ? 'var(--accent)' : 'var(--muted)',
                    fontWeight: isCurrent ? 500 : 400,
                  }}>{s}</div>
              )
            })}
          </div>

          {/* Image */}
          {order.image_url && (
            <img src={order.image_url} style={{ width:'100%', maxHeight:180, objectFit:'cover', borderRadius:2, border:'1px solid var(--border)', marginBottom:20 }} />
          )}

          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 }}>
            <div style={fieldStyle}><label style={labelStyle}>ลูกค้า</label><p>{order.customer}</p></div>
            <div style={fieldStyle}><label style={labelStyle}>Account</label><p>{order.account || '—'}</p></div>
            <div style={fieldStyle}><label style={labelStyle}>ช่องทาง</label><p>{order.channel}</p></div>
            <div style={fieldStyle}><label style={labelStyle}>สินค้า</label><p>{order.product}</p></div>
            <div style={fieldStyle}><label style={labelStyle}>ขนาด</label><p>{order.size || '—'}</p></div>
            <div style={fieldStyle}><label style={labelStyle}>จำนวน</label><p>{order.qty}</p></div>
            <div style={fieldStyle}><label style={labelStyle}>วันเริ่มสั่ง</label><p>{formatDate(order.start_date)}</p></div>
            <div style={fieldStyle}><label style={labelStyle}>กำหนดส่ง</label><p style={{ color: getDueColor(order.due_date) }}>{formatDate(order.due_date)}</p></div>

            <div style={{ gridColumn:'1/-1', ...fieldStyle }}>
              <label style={labelStyle}>สถานที่จัดส่ง</label>
              <p>{order.delivery || '—'}</p>
            </div>

            {/* Materials table */}
            <div style={{ gridColumn:'1/-1', ...fieldStyle }}>
              <label style={labelStyle}>วัสดุแผ่น</label>
              {(order.materials||[]).length > 0 ? (
                <table style={{ width:'100%', borderCollapse:'collapse', marginTop:6 }}>
                  <thead>
                    <tr>{['วัสดุ','ความหนา','จำนวน'].map(h => (
                      <th key={h} style={{ fontSize:9, letterSpacing:'0.1em', textTransform:'uppercase', color:'var(--muted)', padding:'5px 8px', borderBottom:'1px solid var(--border)', textAlign:'left', fontWeight:400 }}>{h}</th>
                    ))}</tr>
                  </thead>
                  <tbody>
                    {order.materials.map((m, i) => (
                      <tr key={i} style={{ borderBottom:'1px solid var(--border)' }}>
                        <td style={{ padding:'7px 8px', fontSize:12 }}>{m.material}</td>
                        <td style={{ padding:'7px 8px', fontSize:12 }}>{m.thickness || '—'} mm</td>
                        <td style={{ padding:'7px 8px', fontSize:12 }}>{m.qty}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : <p style={{ color:'var(--muted)' }}>—</p>}
            </div>

            {/* Equipment table */}
            <div style={{ gridColumn:'1/-1', ...fieldStyle }}>
              <label style={labelStyle}>อุปกรณ์ / Hardware</label>
              {(order.equipment||[]).length > 0 ? (
                <table style={{ width:'100%', borderCollapse:'collapse', marginTop:6 }}>
                  <thead>
                    <tr>{['รายการ','หน่วย','จำนวน'].map(h => (
                      <th key={h} style={{ fontSize:9, letterSpacing:'0.1em', textTransform:'uppercase', color:'var(--muted)', padding:'5px 8px', borderBottom:'1px solid var(--border)', textAlign:'left', fontWeight:400 }}>{h}</th>
                    ))}</tr>
                  </thead>
                  <tbody>
                    {order.equipment.map((e, i) => (
                      <tr key={i} style={{ borderBottom:'1px solid var(--border)' }}>
                        <td style={{ padding:'7px 8px', fontSize:12 }}>{e.name}</td>
                        <td style={{ padding:'7px 8px', fontSize:12 }}>{e.unit}</td>
                        <td style={{ padding:'7px 8px', fontSize:12 }}>{e.qty}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : <p style={{ color:'var(--muted)' }}>—</p>}
            </div>

            {/* Payment */}
            <div style={{ gridColumn:'1/-1', ...fieldStyle }}>
              <label style={labelStyle}>การโอนเงิน</label>
              <div style={{ marginTop:6 }}>
                {[
                  { label:'ราคารวม', value: order.total_price ? order.total_price.toLocaleString()+' ฿' : '—', color:'var(--text)' },
                  { label:'โอนแล้ว', value: order.deposit ? `${order.deposit.toLocaleString()} ฿ (${paid}%)` : '—', color: payColor },
                  { label:'ค้างชำระ', value: order.total_price ? remaining.toLocaleString()+' ฿' : '—', color:'var(--danger)' },
                ].map(row => (
                  <div key={row.label} style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
                    <span style={{ color:'var(--muted)' }}>{row.label}</span>
                    <span style={{ color: row.color }}>{row.value}</span>
                  </div>
                ))}
                <div style={{ background:'var(--surface2)', borderRadius:2, height:4, marginTop:4 }}>
                  <div style={{ height:4, borderRadius:2, width:`${Math.min(paid,100)}%`, background:payColor }} />
                </div>
              </div>
            </div>

            {order.notes && (
              <div style={{ gridColumn:'1/-1' }}>
                <label style={labelStyle}>หมายเหตุ</label>
                <p style={{ color:'var(--muted)' }}>{order.notes}</p>
              </div>
            )}
          </div>
        </div>

        <div style={{ padding:'16px 24px', borderTop:'1px solid var(--border)', display:'flex', gap:8, justifyContent:'flex-end', background:'var(--surface)' }}>
          <button className="btn btn-ghost" onClick={onClose}>Close</button>
          <button className="btn btn-primary" onClick={() => { onClose(); onEdit(order) }}>Edit</button>
        </div>
      </div>
    </div>
  )
}
