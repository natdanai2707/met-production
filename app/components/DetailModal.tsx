'use client'
import { Order, STAGES } from '@/lib/supabase'
import { EMPTY, formatDate, getDueColor, paidPercent, payColor } from '@/lib/utils'
import { modalOverlay, modalCard, modalHeader, modalTitle, modalBody, modalFooter, closeBtn } from '@/lib/styles'

type Props = {
  order: Order | null
  onClose: () => void
  onEdit: (o: Order) => void
  onStageChange: (id: string, stage: number) => Promise<void>
}

export default function DetailModal({ order, onClose, onEdit, onStageChange }: Props) {
  if (!order) return null

  const paid = paidPercent(order)
  const pc = payColor(paid)
  const remaining = order.total_price - order.deposit

  const lbl: React.CSSProperties = { fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--muted)', display: 'block', marginBottom: 3 }

  return (
    <div style={modalOverlay} className="overlay-in"
      onClick={e => { if(e.target === e.currentTarget) onClose() }}>
      <div style={{ ...modalCard, width:680 }} className="dialog-in">

        <div style={modalHeader}>
          <div style={modalTitle}>{order.customer} · {order.product}</div>
          <button onClick={onClose} style={closeBtn}>×</button>
        </div>

        <div style={modalBody}>

          {order.image_url && (
            <div style={{ marginBottom:20, borderRadius:2, overflow:'hidden', border:'1px solid var(--border)', cursor:'pointer', position:'relative' }}
              onClick={() => window.open(order.image_url!, '_blank')}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={order.image_url} alt={order.product}
                style={{ width:'100%', maxHeight:260, objectFit:'cover', display:'block' }} />
              <div style={{ position:'absolute', bottom:8, right:8, background:'rgba(0,0,0,0.5)', borderRadius:2, padding:'3px 8px', fontSize:10, color:'var(--text)', letterSpacing:'0.08em' }}>
                คลิกเพื่อดูเต็ม
              </div>
            </div>
          )}

          {/* Pipeline stepper */}
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

          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 }}>
            <div><label style={lbl}>ลูกค้า</label><p>{order.customer}</p></div>
            <div><label style={lbl}>Account</label><p>{order.account || EMPTY}</p></div>
            <div><label style={lbl}>ช่องทาง</label><p>{order.channel}</p></div>
            <div><label style={lbl}>สินค้า</label><p>{order.product}</p></div>
            <div><label style={lbl}>ขนาด</label><p>{order.size || EMPTY}</p></div>
            <div><label style={lbl}>จำนวน</label><p>{order.qty}</p></div>
            <div><label style={lbl}>วันเริ่มสั่ง</label><p>{formatDate(order.start_date)}</p></div>
            <div><label style={lbl}>กำหนดส่ง</label><p style={{ color: getDueColor(order.due_date) }}>{formatDate(order.due_date)}</p></div>

            <div style={{ gridColumn:'1/-1' }}>
              <label style={lbl}>สถานที่จัดส่ง</label>
              <p>{order.delivery || EMPTY}</p>
            </div>

            <div style={{ gridColumn:'1/-1' }}>
              <label style={lbl}>วัสดุแผ่น</label>
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
                        <td style={{ padding:'7px 8px', fontSize:12 }}>{m.thickness || EMPTY} mm</td>
                        <td style={{ padding:'7px 8px', fontSize:12 }}>{m.qty}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : <p style={{ color:'var(--muted)' }}>{EMPTY}</p>}
            </div>

            <div style={{ gridColumn:'1/-1' }}>
              <label style={lbl}>อุปกรณ์ / Hardware</label>
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
              ) : <p style={{ color:'var(--muted)' }}>{EMPTY}</p>}
            </div>

            <div style={{ gridColumn:'1/-1' }}>
              <label style={lbl}>การโอนเงิน</label>
              <div style={{ marginTop:6 }}>
                {[
                  { label:'ราคารวม', value: order.total_price ? order.total_price.toLocaleString()+' ฿' : EMPTY, color:'var(--text)' },
                  { label:'โอนแล้ว', value: order.deposit ? `${order.deposit.toLocaleString()} ฿ (${paid}%)` : EMPTY, color: pc },
                  { label:'ค้างชำระ', value: order.total_price ? remaining.toLocaleString()+' ฿' : EMPTY, color:'var(--danger)' },
                ].map(row => (
                  <div key={row.label} style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
                    <span style={{ color:'var(--muted)' }}>{row.label}</span>
                    <span style={{ color: row.color }}>{row.value}</span>
                  </div>
                ))}
                <div style={{ background:'var(--surface2)', borderRadius:2, height:4, marginTop:4 }}>
                  <div style={{ height:4, borderRadius:2, width:`${Math.min(paid,100)}%`, background:pc }} />
                </div>
              </div>
            </div>

            {order.notes && (
              <div style={{ gridColumn:'1/-1' }}>
                <label style={lbl}>หมายเหตุ</label>
                <p style={{ color:'var(--muted)' }}>{order.notes}</p>
              </div>
            )}
          </div>
        </div>

        <div style={modalFooter}>
          <button className="btn btn-ghost" onClick={onClose}>Close</button>
          <button className="btn btn-primary" onClick={() => { onClose(); onEdit(order) }}>Edit</button>
        </div>
      </div>
    </div>
  )
}
