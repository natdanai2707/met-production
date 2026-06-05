'use client'
import { useState, useCallback } from 'react'
import Link from 'next/link'

// ── Types ──────────────────────────────────────────────────────────────
type MatRow = { id: number; matId: string; customPrice: number; costOverride: string; yield: number; sheets: number; remark: string }
type SvcRow = { id: number; name: string; unitPrice: number; qty: number; unit: string; enabled: boolean }
type Quote = { matCost: number; svcCost: number; otherCost: number; totalCost: number; sellPerUnit: number; totalSell: number; profit: number; singlePrice: number }

// ── Data ───────────────────────────────────────────────────────────────
const MATERIALS = [
  { id:'ss_4x8_1.5', label:'Stainless 304 4×8\' 1.5mm (Hairline)', price:4700 },
  { id:'ss_4x8_2',   label:'Stainless 304 4×8\' 2mm (Hairline)',   price:5930 },
  { id:'ss_4x8_3',   label:'Stainless 304 4×8\' 3mm (No.1)',       price:5300 },
  { id:'ss_4x8_4',   label:'Stainless 304 4×8\' 4mm (No.1)',       price:6840 },
  { id:'ss_510_3',   label:'Stainless 304 5×10\' 3mm (No.1)',      price:8000 },
  { id:'ss_510_4',   label:'Stainless 304 5×10\' 4mm (No.1)',      price:10200 },
  { id:'al_4x8_2',   label:'Aluminum 5052 4×8\' 2mm',              price:2500 },
  { id:'al_4x8_3',   label:'Aluminum 5052 4×8\' 3mm',              price:4350 },
  { id:'al_4x8_4',   label:'Aluminum 5052 4×8\' 4mm',              price:6180 },
  { id:'al_4x8_5',   label:'Aluminum 5052 4×8\' 5mm',              price:7400 },
  { id:'st_4x8_3',   label:'Mild Steel 4×8\' 3mm',                 price:1530 },
  { id:'st_4x8_4',   label:'Mild Steel 4×8\' 4mm',                 price:2040 },
  { id:'__custom__', label:'กำหนดเองง',                             price:0 },
]

const DEF_SERVICES: Omit<SvcRow,'id'>[] = [
  { name:'ค่าตัดเลเซอร์',         unitPrice:300, qty:1, unit:'ครั้ง', enabled:false },
  { name:'ค่าพับ',                 unitPrice:80,  qty:1, unit:'ครั้ง', enabled:false },
  { name:'ค่าเชื่อม',              unitPrice:0,   qty:1, unit:'จุด',   enabled:false },
  { name:'ปาด เจีย ลบคม',          unitPrice:100, qty:1, unit:'ชิ้น',  enabled:false },
  { name:'ค่าขัดแฮร์ไลน์',        unitPrice:0,   qty:1, unit:'ชิ้น',  enabled:false },
  { name:'ค่าขัดสก็อตไบร์ท',      unitPrice:0,   qty:1, unit:'ชิ้น',  enabled:false },
  { name:'ค่าแรงประกอบ',           unitPrice:200, qty:1, unit:'ชิ้น',  enabled:true  },
  { name:'ค่าดีไซน์',             unitPrice:300, qty:1, unit:'งาน',   enabled:true  },
  { name:'ค่าทำแบบ',              unitPrice:300, qty:1, unit:'งาน',   enabled:true  },
  { name:'สกรู/อุปกรณ์ยึด',       unitPrice:10,  qty:4, unit:'ชุด',   enabled:false },
  { name:'อุปกรณ์จิปาถะ',         unitPrice:100, qty:1, unit:'รายการ',enabled:false },
]

let _mid = 0, _sid = 0
const newMat = (): MatRow => ({ id:++_mid, matId:'', customPrice:0, costOverride:'', yield:6, sheets:1, remark:'' })
const newSvc = (s: Omit<SvcRow,'id'>): SvcRow => ({ ...s, id:++_sid })

function fmt(n: number, d=0) {
  return n.toLocaleString('th-TH', { minimumFractionDigits:d, maximumFractionDigits:d })
}

// ── Styles ─────────────────────────────────────────────────────────────
const S = {
  page: { minHeight:'100vh', background:'var(--bg)', color:'var(--text)', fontFamily:'"DM Mono",monospace' } as React.CSSProperties,
  header: { borderBottom:'1px solid var(--border)', padding:'16px 32px', display:'flex', alignItems:'center', justifyContent:'space-between', position:'sticky' as const, top:0, background:'var(--bg)', zIndex:100 } ,
  logo: { fontFamily:'Fraunces,serif', fontSize:22, fontWeight:300, letterSpacing:'0.08em', color:'var(--accent)' } as React.CSSProperties,
  section: { margin:'0 32px 20px', border:'1px solid var(--border)', borderRadius:2 } as React.CSSProperties,
  sHead: { padding:'12px 16px', borderBottom:'1px solid var(--border)', fontSize:10, letterSpacing:'0.14em', textTransform:'uppercase' as const, color:'var(--muted)' },
  sBody: { padding:20 } as React.CSSProperties,
  lbl: { fontSize:10, letterSpacing:'0.1em', textTransform:'uppercase' as const, color:'var(--muted)', display:'block', marginBottom:5 },
  inp: { background:'var(--surface2)', border:'1px solid var(--border)', borderRadius:2, color:'var(--text)', fontFamily:'"DM Mono",monospace', fontSize:13, padding:'8px 10px', outline:'none', width:'100%', transition:'border-color .15s' } as React.CSSProperties,
  inpRo: { background:'var(--bg)', border:'1px solid var(--border)', borderRadius:2, color:'var(--accent2)', fontFamily:'"DM Mono",monospace', fontSize:13, padding:'8px 10px', width:'100%' } as React.CSSProperties,
  addBtn: { background:'none', border:'1px dashed var(--border)', borderRadius:2, color:'var(--muted)', fontFamily:'"DM Mono",monospace', fontSize:11, letterSpacing:'0.08em', padding:'7px 14px', cursor:'pointer', width:'100%', marginTop:10 } as React.CSSProperties,
  removeBtn: { background:'none', border:'none', color:'var(--danger)', cursor:'pointer', fontSize:16, lineHeight:1, padding:'0 4px' } as React.CSSProperties,
}

export default function CalculatorPage() {
  const [mats, setMats] = useState<MatRow[]>([newMat()])
  const [svcs, setSvcs] = useState<SvcRow[]>(DEF_SERVICES.map(newSvc))
  const [qty, setQty] = useState(1)
  const [markupPct, setMarkupPct] = useState(10)
  const [singleMarkupPct, setSingleMarkupPct] = useState(10)
  const [productName, setProductName] = useState('')
  const [customerName, setCustomerName] = useState('')
  const [showReport, setShowReport] = useState(false)

  // ── Compute ──────────────────────────────────────────────────────────
  const calc = useCallback((): Quote => {
    let matCost = 0
    mats.forEach(m => {
      if (m.costOverride !== '') {
        matCost += parseFloat(m.costOverride) || 0
      } else {
        const mat = MATERIALS.find(x => x.id === m.matId)
        const price = m.matId === '__custom__' ? m.customPrice : (mat?.price || 0)
        matCost += (price / Math.max(m.yield, 0.01)) * (m.sheets || 1)
      }
    })
    let svcCost = 0
    svcs.forEach(s => { if (s.enabled) svcCost += s.unitPrice * s.qty })
    const otherCost = 0
    const costPerUnit = matCost + svcCost + otherCost
    const totalCost = costPerUnit * qty
    const sellPerUnit = costPerUnit * (1 + markupPct / 100)
    const totalSell = sellPerUnit * qty
    const profit = totalSell - totalCost
    const singlePrice = costPerUnit * (1 + singleMarkupPct / 100)
    return { matCost, svcCost, otherCost, totalCost, sellPerUnit, totalSell, profit, singlePrice }
  }, [mats, svcs, qty, markupPct, singleMarkupPct])

  const q = calc()

  // ── Mat helpers ──────────────────────────────────────────────────────
  const updateMat = (id: number, k: keyof MatRow, v: MatRow[keyof MatRow]) =>
    setMats(ms => ms.map(m => m.id === id ? { ...m, [k]: v } : m))
  const removeMat = (id: number) => setMats(ms => ms.filter(m => m.id !== id))

  // ── Svc helpers ──────────────────────────────────────────────────────
  const updateSvc = (id: number, k: keyof SvcRow, v: SvcRow[keyof SvcRow]) =>
    setSvcs(ss => ss.map(s => s.id === id ? { ...s, [k]: v } : s))
  const removeSvc = (id: number) => setSvcs(ss => ss.filter(s => s.id !== id))

  // ── Mat cost display ─────────────────────────────────────────────────
  const matCostDisplay = (m: MatRow) => {
    if (m.costOverride !== '') return parseFloat(m.costOverride) || 0
    const mat = MATERIALS.find(x => x.id === m.matId)
    const price = m.matId === '__custom__' ? m.customPrice : (mat?.price || 0)
    return (price / Math.max(m.yield, 0.01)) * (m.sheets || 1)
  }
  const matPrice = (m: MatRow) => {
    const mat = MATERIALS.find(x => x.id === m.matId)
    return m.matId === '__custom__' ? m.customPrice : (mat?.price || 0)
  }

  const colHdr = (label: string) => (
    <div style={{ fontSize:9, letterSpacing:'0.12em', textTransform:'uppercase', color:'var(--muted)', paddingBottom:4 }}>{label}</div>
  )

  return (
    <div style={S.page}>
      {/* Header */}
      <div style={S.header}>
        <div style={{ display:'flex', alignItems:'center', gap:16 }}>
          <div style={S.logo}>MET <span style={{ fontStyle:'italic' }}>Production</span></div>
          <div style={{ display:'flex', gap:8 }}>
            <Link href="/" style={{ background:'none', border:'1px solid var(--border)', borderRadius:2, color:'var(--muted)', fontFamily:'"DM Mono",monospace', fontSize:10, letterSpacing:'0.1em', textTransform:'uppercase', padding:'5px 12px', cursor:'pointer', textDecoration:'none' }}>
              ← Orders
            </Link>
            <div style={{ background:'rgba(200,169,110,0.1)', border:'1px solid var(--accent)', borderRadius:2, color:'var(--accent)', fontFamily:'"DM Mono",monospace', fontSize:10, letterSpacing:'0.1em', textTransform:'uppercase', padding:'5px 12px' }}>
              Calculator
            </div>
          </div>
        </div>
      </div>

      <div style={{ padding:'24px 32px 8px' }}>
        {/* Product info row */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 80px 80px 80px', gap:12, marginBottom:20 }}>
          <div>
            <label style={S.lbl}>ชื่อสินค้า</label>
            <input style={S.inp} value={productName} onChange={e=>setProductName(e.target.value)} placeholder="เช่น ZEN Stool" />
          </div>
          <div>
            <label style={S.lbl}>ลูกค้า</label>
            <input style={S.inp} value={customerName} onChange={e=>setCustomerName(e.target.value)} />
          </div>
          <div>
            <label style={S.lbl}>จำนวน</label>
            <input style={S.inp} type="number" min={1} value={qty} onChange={e=>setQty(parseInt(e.target.value)||1)} />
          </div>
          <div>
            <label style={S.lbl}>Markup % (ล็อต)</label>
            <input style={S.inp} type="number" min={0} step={5} value={markupPct} onChange={e=>setMarkupPct(parseFloat(e.target.value)||0)} />
          </div>
          <div>
            <label style={S.lbl}>Markup % (เดี่ยว)</label>
            <input style={S.inp} type="number" min={0} step={5} value={singleMarkupPct} onChange={e=>setSingleMarkupPct(parseFloat(e.target.value)||0)} />
          </div>
        </div>
      </div>

      {/* MATERIALS */}
      <div style={S.section}>
        <div style={S.sHead}>วัสดุแผ่น</div>
        <div style={S.sBody}>
          {/* Column headers */}
          <div style={{ display:'grid', gridTemplateColumns:'2fr 90px 80px 80px 90px 90px 1fr 28px', gap:10, marginBottom:6 }}>
            {['ประเภทวัสดุ','ราคาแผ่น (฿)','ตัดได้/แผ่น','จำนวนแผ่น','ต้นทุน/ชิ้น (฿)','แก้ไขเอง (฿)','หมายเหตุ',''].map((h,i)=>
              <div key={i} style={{ fontSize:9, letterSpacing:'0.1em', textTransform:'uppercase', color:'var(--muted)' }}>{h}</div>
            )}
          </div>
          {mats.map(m => {
            const mat = MATERIALS.find(x => x.id === m.matId)
            const displayPrice = matPrice(m)
            const displayCost = matCostDisplay(m)
            return (
              <div key={m.id} style={{ display:'grid', gridTemplateColumns:'2fr 90px 80px 80px 90px 90px 1fr 28px', gap:10, marginBottom:10, alignItems:'center', padding:'10px 12px', background:'var(--surface2)', borderRadius:2 }}>
                <select style={S.inp} value={m.matId} onChange={e=>updateMat(m.id,'matId',e.target.value)}>
                  <option value="">-- เลือกวัสดุ --</option>
                  {MATERIALS.map(x=><option key={x.id} value={x.id}>{x.label}</option>)}
                </select>
                {/* sheet price — editable if custom, readonly otherwise */}
                {m.matId === '__custom__'
                  ? <input style={S.inp} type="number" value={m.customPrice} onChange={e=>updateMat(m.id,'customPrice',parseFloat(e.target.value)||0)} />
                  : <input style={S.inpRo} readOnly value={displayPrice > 0 ? fmt(displayPrice) : '—'} />
                }
                <input style={S.inp} type="number" min={0.1} step={0.1} value={m.yield} onChange={e=>updateMat(m.id,'yield',parseFloat(e.target.value)||1)} />
                <input style={S.inp} type="number" min={1} value={m.sheets} onChange={e=>updateMat(m.id,'sheets',parseInt(e.target.value)||1)} />
                {/* auto cost */}
                <input style={{ ...S.inpRo, color: m.costOverride !== '' ? 'var(--muted)' : 'var(--accent2)', textDecoration: m.costOverride !== '' ? 'line-through' : 'none' }}
                  readOnly value={fmt(mat || m.matId === '__custom__' ? (displayPrice / Math.max(m.yield,0.01)) * (m.sheets||1) : 0)} />
                {/* manual override */}
                <input style={{ ...S.inp, borderColor: m.costOverride !== '' ? 'var(--accent)' : 'var(--border)' }}
                  type="number" min={0} placeholder="override"
                  value={m.costOverride}
                  onChange={e=>updateMat(m.id,'costOverride',e.target.value)} />
                <input style={S.inp} type="text" placeholder="ฟังก์ชัน / ส่วน..." value={m.remark} onChange={e=>updateMat(m.id,'remark',e.target.value)} />
                <button style={S.removeBtn} onClick={()=>removeMat(m.id)}>✕</button>
              </div>
            )
          })}
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:4 }}>
            <button style={S.addBtn} onClick={()=>setMats(ms=>[...ms,newMat()])}>+ เพิ่มวัสดุ</button>
            <div style={{ marginLeft:12, fontSize:12, color:'var(--accent2)', whiteSpace:'nowrap' }}>
              รวมวัสดุ: <strong>฿{fmt(q.matCost)}</strong>
            </div>
          </div>
        </div>
      </div>

      {/* SERVICES */}
      <div style={S.section}>
        <div style={S.sHead}>ค่าบริการ / ค่าแรง</div>
        <div style={S.sBody}>
          <div style={{ display:'grid', gridTemplateColumns:'28px 1fr 110px 60px 70px 28px', gap:10, marginBottom:6 }}>
            {['','รายการ','ราคา/หน่วย (฿)','จำนวน','หน่วย',''].map((h,i)=>
              <div key={i} style={{ fontSize:9, letterSpacing:'0.1em', textTransform:'uppercase', color:'var(--muted)' }}>{h}</div>
            )}
          </div>
          {svcs.map(s => (
            <div key={s.id} style={{ display:'grid', gridTemplateColumns:'28px 1fr 110px 60px 70px 28px', gap:10, marginBottom:8, alignItems:'center', opacity: s.enabled ? 1 : 0.45 }}>
              <input type="checkbox" checked={s.enabled} onChange={e=>updateSvc(s.id,'enabled',e.target.checked)} style={{ width:15, height:15, accentColor:'var(--accent)', cursor:'pointer' }} />
              <input style={S.inp} type="text" value={s.name} onChange={e=>updateSvc(s.id,'name',e.target.value)} />
              <input style={S.inp} type="number" min={0} value={s.unitPrice} onChange={e=>updateSvc(s.id,'unitPrice',parseFloat(e.target.value)||0)} />
              <input style={S.inp} type="number" min={1} value={s.qty} onChange={e=>updateSvc(s.id,'qty',parseInt(e.target.value)||1)} />
              <input style={S.inp} type="text" value={s.unit} onChange={e=>updateSvc(s.id,'unit',e.target.value)} />
              <button style={S.removeBtn} onClick={()=>removeSvc(s.id)}>✕</button>
            </div>
          ))}
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <button style={S.addBtn} onClick={()=>setSvcs(ss=>[...ss,newSvc({name:'รายการใหม่',unitPrice:0,qty:1,unit:'ครั้ง',enabled:true})])}>+ เพิ่มรายการ</button>
            <div style={{ marginLeft:12, fontSize:12, color:'var(--accent2)', whiteSpace:'nowrap' }}>
              รวมค่าแรง: <strong>฿{fmt(q.svcCost)}</strong>
            </div>
          </div>
        </div>
      </div>

      {/* SUMMARY */}
      <div style={{ margin:'0 32px 32px', display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>

        {/* cost breakdown */}
        <div style={{ border:'1px solid var(--border)', borderRadius:2 }}>
          <div style={S.sHead}>ต้นทุน Breakdown</div>
          <div style={{ padding:16 }}>
            {[
              { label:'ค่าวัสดุ/ชิ้น', value: q.matCost, color:'var(--text)' },
              { label:'ค่าแรง/ชิ้น', value: q.svcCost, color:'var(--text)' },
              { label:'ต้นทุนรวม/ชิ้น', value: q.matCost+q.svcCost, color:'var(--text)', bold:true },
            ].map(r=>(
              <div key={r.label} style={{ display:'flex', justifyContent:'space-between', padding:'7px 0', borderBottom:'1px solid var(--border)', fontWeight: r.bold ? 600 : 400 }}>
                <span style={{ color:'var(--muted)', fontSize:12 }}>{r.label}</span>
                <span style={{ color: r.color }}>฿{fmt(r.value)}</span>
              </div>
            ))}
            <div style={{ marginTop:12, padding:'10px 12px', background:'rgba(200,169,110,0.08)', borderRadius:2, border:'1px solid rgba(200,169,110,0.3)' }}>
              <div style={{ fontSize:10, color:'var(--muted)', letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:4 }}>ราคาขาย (สั่ง {qty} ตัว, markup {markupPct}%)</div>
              <div style={{ fontFamily:'Fraunces,serif', fontSize:28, fontWeight:300, color:'var(--accent)' }}>฿{fmt(q.totalSell)}</div>
              <div style={{ fontSize:11, color:'var(--muted)', marginTop:2 }}>฿{fmt(q.sellPerUnit)}/ตัว · กำไร ฿{fmt(q.profit)}</div>
            </div>
            <div style={{ marginTop:10, padding:'10px 12px', background:'rgba(143,186,159,0.08)', borderRadius:2, border:'1px solid rgba(143,186,159,0.3)' }}>
              <div style={{ fontSize:10, color:'var(--muted)', letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:4 }}>ราคาสั่งเดี่ยว (1 ตัว, markup {singleMarkupPct}%)</div>
              <div style={{ fontFamily:'Fraunces,serif', fontSize:24, fontWeight:300, color:'var(--accent2)' }}>฿{fmt(q.singlePrice)}</div>
            </div>
          </div>
        </div>

        {/* customer report */}
        <div style={{ border:'1px solid var(--border)', borderRadius:2 }}>
          <div style={{ ...S.sHead, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <span>Report สำหรับลูกค้า</span>
            <button
              onClick={()=>setShowReport(r=>!r)}
              style={{ background:'none', border:'1px solid var(--border)', borderRadius:2, color:'var(--muted)', fontFamily:'"DM Mono",monospace', fontSize:9, letterSpacing:'0.1em', textTransform:'uppercase', padding:'3px 10px', cursor:'pointer' }}
            >{showReport ? 'ซ่อน' : 'แสดง'}</button>
          </div>
          {showReport && (
            <div style={{ padding:16 }}>
              {/* Printable card */}
              <div id="customer-report" style={{ background:'var(--surface2)', border:'1px solid var(--border)', borderRadius:2, padding:16 }}>
                <div style={{ fontFamily:'Fraunces,serif', fontSize:15, fontWeight:300, marginBottom:12, color:'var(--accent)', letterSpacing:'0.05em' }}>
                  MET Furniture {productName ? `— ${productName}` : ''}
                </div>
                {customerName && <div style={{ fontSize:11, color:'var(--muted)', marginBottom:12 }}>ลูกค้า: {customerName}</div>}
                <div style={{ display:'grid', gap:8 }}>
                  {[
                    { label:'ค่าวัสดุ', value:`฿${fmt(q.matCost)}` },
                    { label:'ค่าแรง / ค่าบริการ', value:`฿${fmt(q.svcCost)}` },
                    { label:'ค่าดำเนินการ / กำไร', value:`฿${fmt(q.profit)}` },
                  ].map(r=>(
                    <div key={r.label} style={{ display:'flex', justifyContent:'space-between', padding:'6px 0', borderBottom:'1px solid var(--border)' }}>
                      <span style={{ color:'var(--muted)', fontSize:12 }}>{r.label}</span>
                      <span style={{ fontWeight:600 }}>{r.value}</span>
                    </div>
                  ))}
                  <div style={{ display:'flex', justifyContent:'space-between', padding:'10px 0 0', borderTop:'2px solid var(--accent)', marginTop:4 }}>
                    <span style={{ fontWeight:600 }}>ราคารวม ({qty} ตัว)</span>
                    <span style={{ fontFamily:'Fraunces,serif', fontSize:20, fontWeight:300, color:'var(--accent)' }}>฿{fmt(q.totalSell)}</span>
                  </div>
                  {qty > 1 && (
                    <div style={{ display:'flex', justifyContent:'space-between', padding:'4px 0 0' }}>
                      <span style={{ fontSize:11, color:'var(--muted)' }}>ราคาสั่งเดี่ยว (1 ตัว)</span>
                      <span style={{ fontSize:13, color:'var(--accent2)' }}>฿{fmt(q.singlePrice)}</span>
                    </div>
                  )}
                </div>
                <div style={{ marginTop:12, fontSize:10, color:'var(--muted)', letterSpacing:'0.06em' }}>
                  {new Date().toLocaleDateString('th-TH',{year:'numeric',month:'long',day:'numeric'})}
                </div>
              </div>
              <div style={{ marginTop:8, fontSize:10, color:'var(--muted)' }}>Screenshot ส่วนนี้ส่งลูกค้าได้เลย</div>
            </div>
          )}
          {!showReport && (
            <div style={{ padding:'24px 16px', color:'var(--muted)', fontSize:12, textAlign:'center' }}>
              กดแสดงเพื่อดู report สำหรับลูกค้า
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
