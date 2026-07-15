'use client'
import { Order, STAGES, CHANNELS } from '@/lib/supabase'

type Props = {
  open: boolean
  onClose: () => void
  orders: Order[]
}

function fmt(n: number) { return n.toLocaleString('th-TH') }

export default function ReportModal({ open, onClose, orders }: Props) {
  if (!open) return null

  // ── group by month ────────────────────────────────────────────────────────
  const byMonth: Record<string, Order[]> = {}
  orders.forEach(o => {
    const key = o.created_at ? o.created_at.slice(0, 7) : 'unknown'
    if (!byMonth[key]) byMonth[key] = []
    byMonth[key].push(o)
  })
  const months = Object.keys(byMonth).sort().reverse()

  // ── overall stats ─────────────────────────────────────────────────────────
  const totalRevenue = orders.reduce((s, o) => s + (o.total_price || 0), 0)
  const totalCollected = orders.reduce((s, o) => s + (o.deposit || 0), 0)
  const totalOutstanding = totalRevenue - totalCollected
  const uniqueCustomers = new Set(orders.map(o => o.customer)).size
  const avgOrderValue = orders.length > 0 ? totalRevenue / orders.length : 0

  // ── by channel ────────────────────────────────────────────────────────────
  const byChan: Record<string, number> = {}
  orders.forEach(o => { byChan[o.channel] = (byChan[o.channel] || 0) + 1 })

  // ── by stage ─────────────────────────────────────────────────────────────
  const byStage = STAGES.map((s, i) => ({
    label: s,
    count: orders.filter(o => o.stage === i).length,
  }))

  // ── top materials ─────────────────────────────────────────────────────────
  const matCount: Record<string, number> = {}
  orders.forEach(o => (o.materials || []).forEach(m => {
    matCount[m.material] = (matCount[m.material] || 0) + 1
  }))
  const topMats = Object.entries(matCount).sort((a, b) => b[1] - a[1])

  const lbl: React.CSSProperties = { fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--muted)', display: 'block', marginBottom: 4 }
  const card: React.CSSProperties = { background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 2, padding: '14px 16px' }
  const sectionTitle: React.CSSProperties = { fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 12, marginTop: 24 }

  const formatMonth = (key: string) => {
    if (key === 'unknown') return 'Unknown'
    const [y, m] = key.split('-')
    const date = new Date(parseInt(y), parseInt(m) - 1)
    return date.toLocaleDateString('th-TH', { month: 'long', year: 'numeric' })
  }

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.8)', zIndex:2000, display:'flex', alignItems:'center', justifyContent:'center' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:4, width:760, maxWidth:'95vw', maxHeight:'90vh', overflow:'hidden', display:'flex', flexDirection:'column' }}>

        {/* Header */}
        <div style={{ padding:'20px 24px', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', justifyContent:'space-between', background:'var(--surface)' }}>
          <div style={{ fontFamily:'Fraunces,serif', fontSize:18, fontWeight:300 }}>
            Report <span style={{ fontStyle:'italic', color:'var(--muted)', fontSize:14 }}>· ภาพรวม</span>
          </div>
          <button onClick={onClose} style={{ background:'none', border:'none', color:'var(--muted)', fontSize:20, cursor:'pointer' }}>×</button>
        </div>

        <div style={{ overflowY:'auto', padding:24, flex:1 }}>

          {/* KPI cards */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10, marginBottom:4 }}>
            {[
              { label:'คำสั่งซื้อทั้งหมด', value: orders.length + ' รายการ', color:'var(--accent)' },
              { label:'มูลค่ารวม', value: fmt(totalRevenue) + ' ฿', color:'var(--text)' },
              { label:'เก็บเงินแล้ว', value: fmt(totalCollected) + ' ฿', color:'var(--accent2)' },
              { label:'ค้างรับ', value: fmt(totalOutstanding) + ' ฿', color: totalOutstanding > 0 ? 'var(--danger)' : 'var(--muted)' },
              { label:'ลูกค้า (unique)', value: uniqueCustomers + ' คน', color:'var(--text)' },
              { label:'มูลค่าเฉลี่ย/ออร์เดอร์', value: fmt(Math.round(avgOrderValue)) + ' ฿', color:'var(--text)' },
              { label:'กำลังผลิต', value: orders.filter(o=>o.stage>0&&o.stage<6).length + ' รายการ', color:'var(--accent)' },
              { label:'ส่งแล้ว', value: orders.filter(o=>o.stage===6).length + ' รายการ', color:'var(--accent2)' },
            ].map((k, i) => (
              <div key={i} style={card}>
                <label style={lbl}>{k.label}</label>
                <div style={{ fontFamily:'Fraunces,serif', fontSize:20, fontWeight:300, color:k.color }}>{k.value}</div>
              </div>
            ))}
          </div>

          {/* Monthly breakdown */}
          <div style={sectionTitle}>รายเดือน</div>
          <div style={{ border:'1px solid var(--border)', borderRadius:2, overflow:'hidden' }}>
            <div style={{ display:'grid', gridTemplateColumns:'1.4fr 70px 110px 110px 110px 80px', gap:0, background:'var(--bg)', borderBottom:'1px solid var(--border)' }}>
              {['เดือน','ออร์เดอร์','มูลค่ารวม','เก็บแล้ว','ค้างรับ','ลูกค้า'].map((h,i) => (
                <div key={i} style={{ padding:'8px 12px', fontSize:9, letterSpacing:'0.12em', textTransform:'uppercase', color:'var(--muted)', borderRight: i<5 ? '1px solid var(--border)' : 'none' }}>{h}</div>
              ))}
            </div>
            {months.length === 0 && (
              <div style={{ padding:'20px 12px', color:'var(--muted)', fontSize:12 }}>ยังไม่มีข้อมูล</div>
            )}
            {months.map((key, ri) => {
              const mos = byMonth[key]
              const rev = mos.reduce((s,o)=>s+(o.total_price||0),0)
              const col = mos.reduce((s,o)=>s+(o.deposit||0),0)
              const out = rev - col
              const cust = new Set(mos.map(o=>o.customer)).size
              return (
                <div key={key} style={{ display:'grid', gridTemplateColumns:'1.4fr 70px 110px 110px 110px 80px', borderBottom: ri < months.length-1 ? '1px solid var(--border)' : 'none', background: ri%2===0 ? 'transparent' : 'rgba(255,255,255,0.01)' }}>
                  <div style={{ padding:'10px 12px', fontFamily:'Fraunces,serif', fontSize:14, fontWeight:300, borderRight:'1px solid var(--border)' }}>{formatMonth(key)}</div>
                  <div style={{ padding:'10px 12px', color:'var(--accent)', borderRight:'1px solid var(--border)' }}>{mos.length}</div>
                  <div style={{ padding:'10px 12px', borderRight:'1px solid var(--border)' }}>{fmt(rev)} ฿</div>
                  <div style={{ padding:'10px 12px', color:'var(--accent2)', borderRight:'1px solid var(--border)' }}>{fmt(col)} ฿</div>
                  <div style={{ padding:'10px 12px', color: out>0?'var(--danger)':'var(--muted)', borderRight:'1px solid var(--border)' }}>{fmt(out)} ฿</div>
                  <div style={{ padding:'10px 12px', color:'var(--muted)' }}>{cust} คน</div>
                </div>
              )
            })}
          </div>

          {/* 2-col section: channel + stage */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginTop:0 }}>

            <div>
              <div style={sectionTitle}>ช่องทางที่สั่ง</div>
              <div style={{ border:'1px solid var(--border)', borderRadius:2, overflow:'hidden' }}>
                {CHANNELS.map((ch, i) => {
                  const count = byChan[ch] || 0
                  const pct = orders.length > 0 ? Math.round((count / orders.length) * 100) : 0
                  return (
                    <div key={ch} style={{ display:'flex', alignItems:'center', gap:12, padding:'9px 12px', borderBottom: i < CHANNELS.length-1 ? '1px solid var(--border)' : 'none' }}>
                      <div style={{ minWidth:80, fontSize:11 }}>{ch}</div>
                      <div style={{ flex:1, background:'var(--bg)', borderRadius:2, height:4 }}>
                        <div style={{ height:4, borderRadius:2, width:`${pct}%`, background:'var(--accent)', transition:'width 0.3s' }} />
                      </div>
                      <div style={{ minWidth:30, textAlign:'right', color:'var(--muted)', fontSize:11 }}>{count}</div>
                    </div>
                  )
                })}
              </div>
            </div>

            <div>
              <div style={sectionTitle}>Stage ปัจจุบัน</div>
              <div style={{ border:'1px solid var(--border)', borderRadius:2, overflow:'hidden' }}>
                {byStage.map((s, i) => {
                  const pct = orders.length > 0 ? Math.round((s.count / orders.length) * 100) : 0
                  return (
                    <div key={i} style={{ display:'flex', alignItems:'center', gap:12, padding:'9px 12px', borderBottom: i < byStage.length-1 ? '1px solid var(--border)' : 'none' }}>
                      <div style={{ minWidth:100, fontSize:11 }}>{s.label}</div>
                      <div style={{ flex:1, background:'var(--bg)', borderRadius:2, height:4 }}>
                        <div style={{ height:4, borderRadius:2, width:`${pct}%`, background:'var(--accent2)', transition:'width 0.3s' }} />
                      </div>
                      <div style={{ minWidth:30, textAlign:'right', color:'var(--muted)', fontSize:11 }}>{s.count}</div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Top materials */}
          {topMats.length > 0 && (
            <>
              <div style={sectionTitle}>วัสดุที่ใช้บ่อย</div>
              <div style={{ border:'1px solid var(--border)', borderRadius:2, overflow:'hidden' }}>
                {topMats.map(([mat, cnt], i) => {
                  const pct = Math.round((cnt / orders.length) * 100)
                  return (
                    <div key={mat} style={{ display:'flex', alignItems:'center', gap:12, padding:'9px 12px', borderBottom: i < topMats.length-1 ? '1px solid var(--border)' : 'none' }}>
                      <div style={{ minWidth:160, fontSize:11 }}>{mat}</div>
                      <div style={{ flex:1, background:'var(--bg)', borderRadius:2, height:4 }}>
                        <div style={{ height:4, borderRadius:2, width:`${pct}%`, background:'#8ab4e0' }} />
                      </div>
                      <div style={{ minWidth:60, textAlign:'right', color:'var(--muted)', fontSize:11 }}>{cnt} ออร์เดอร์</div>
                    </div>
                  )
                })}
              </div>
            </>
          )}

          {/* Overdue */}
          {(() => {
            const today = new Date(); today.setHours(0,0,0,0)
            const overdue = orders.filter(o => o.due_date && o.stage < 6 && new Date(o.due_date) < today)
            if (overdue.length === 0) return null
            return (
              <>
                <div style={{ ...sectionTitle, color:'var(--danger)' }}>เลยกำหนดส่ง ({overdue.length} รายการ)</div>
                <div style={{ border:'1px solid rgba(196,96,96,0.3)', borderRadius:2, overflow:'hidden' }}>
                  {overdue.map((o, i) => {
                    const days = Math.ceil((today.getTime() - new Date(o.due_date!).getTime()) / 86400000)
                    return (
                      <div key={o.id} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'9px 12px', borderBottom: i<overdue.length-1?'1px solid var(--border)':'none' }}>
                        <div>
                          <span style={{ fontFamily:'Fraunces,serif', fontSize:14 }}>{o.customer}</span>
                          <span style={{ color:'var(--muted)', marginLeft:10, fontSize:11 }}>{o.product}</span>
                        </div>
                        <span style={{ color:'var(--danger)', fontSize:11 }}>เลยมา {days} วัน</span>
                      </div>
                    )
                  })}
                </div>
              </>
            )
          })()}

        </div>

        <div style={{ padding:'14px 24px', borderTop:'1px solid var(--border)', display:'flex', justifyContent:'flex-end', background:'var(--surface)' }}>
          <button className="btn btn-ghost" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  )
}
