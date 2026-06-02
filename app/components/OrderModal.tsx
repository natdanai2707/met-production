'use client'
import { useState, useEffect } from 'react'
import { Order, Material, Equipment, STAGES, CHANNELS, MAT_OPTIONS, UNIT_OPTIONS } from '@/lib/supabase'

type Props = {
  open: boolean
  order: Order | null
  onClose: () => void
  onSave: (data: Partial<Order>, imageFile: File | null) => Promise<void>
  saving: boolean
}

const empty = (): Partial<Order> => ({
  customer: '', account: '', channel: 'Facebook', product: '',
  size: '', qty: 1, start_date: new Date().toISOString().split('T')[0],
  due_date: '', delivery: '', image_url: null, stage: 0,
  materials: [], equipment: [], total_price: 0, deposit: 0, notes: '',
})

export default function OrderModal({ open, order, onClose, onSave, saving }: Props) {
  const [form, setForm] = useState<Partial<Order>>(empty())
  const [materials, setMaterials] = useState<Material[]>([])
  const [equipment, setEquipment] = useState<Equipment[]>([])
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      if (order) {
        setForm({ ...order })
        setMaterials(order.materials || [])
        setEquipment(order.equipment || [])
        setImagePreview(order.image_url)
      } else {
        setForm(empty())
        setMaterials([])
        setEquipment([])
        setImagePreview(null)
      }
      setImageFile(null)
    }
  }, [open, order])

  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }))

  const paid = (form.total_price || 0) > 0
    ? Math.round(((form.deposit || 0) / (form.total_price || 1)) * 100)
    : 0
  const remaining = Math.max(0, (form.total_price || 0) - (form.deposit || 0))

  const handleImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImageFile(file)
    const reader = new FileReader()
    reader.onload = ev => setImagePreview(ev.target?.result as string)
    reader.readAsDataURL(file)
  }

  const addMat = () => setMaterials(m => [...m, { material: '5052 Aluminum', thickness: '', qty: 1 }])
  const removeMat = (i: number) => setMaterials(m => m.filter((_,idx) => idx !== i))
  const updateMat = (i: number, k: keyof Material, v: any) =>
    setMaterials(m => m.map((item, idx) => idx === i ? { ...item, [k]: v } : item))

  const addEq = () => setEquipment(e => [...e, { name: '', unit: 'ตัว', qty: 1 }])
  const removeEq = (i: number) => setEquipment(e => e.filter((_,idx) => idx !== i))
  const updateEq = (i: number, k: keyof Equipment, v: any) =>
    setEquipment(e => e.map((item, idx) => idx === i ? { ...item, [k]: v } : item))

  const handleSave = async () => {
    if (!form.customer || !form.product) { alert('กรุณากรอกชื่อลูกค้าและชื่อสินค้า'); return }
    await onSave({ ...form, materials, equipment }, imageFile)
  }

  if (!open) return null

  const inputStyle = { background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 2, color: 'var(--text)', fontFamily: '"DM Mono", monospace', fontSize: 13, padding: '9px 12px', outline: 'none', width: '100%' }
  const labelStyle = { fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase' as const, color: 'var(--muted)', display: 'block', marginBottom: 6 }

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.75)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:4, width:720, maxWidth:'95vw', maxHeight:'90vh', overflow:'hidden', display:'flex', flexDirection:'column' }}>
        
        {/* Header */}
        <div style={{ padding:'20px 24px', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', justifyContent:'space-between', background:'var(--surface)' }}>
          <div style={{ fontFamily:'Fraunces,serif', fontSize:18, fontWeight:300 }}>{order ? 'Edit Order' : 'New Order'}</div>
          <button onClick={onClose} style={{ background:'none', border:'none', color:'var(--muted)', fontSize:20, cursor:'pointer' }}>×</button>
        </div>

        {/* Body */}
        <div style={{ overflowY:'auto', padding:24, flex:1 }}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>

            {/* Row 1 */}
            <div><label style={labelStyle}>ชื่อลูกค้า</label><input style={inputStyle} value={form.customer||''} onChange={e=>set('customer',e.target.value)} /></div>
            <div><label style={labelStyle}>Account / Handle</label><input style={inputStyle} value={form.account||''} onChange={e=>set('account',e.target.value)} placeholder="@name หรือ LINE ID" /></div>

            {/* Row 2 */}
            <div>
              <label style={labelStyle}>ช่องทางที่สั่ง</label>
              <select style={inputStyle} value={form.channel||'Facebook'} onChange={e=>set('channel',e.target.value)}>
                {CHANNELS.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div><label style={labelStyle}>ชื่อสินค้า</label><input style={inputStyle} value={form.product||''} onChange={e=>set('product',e.target.value)} placeholder="เช่น ZEN Stool, MET Table" /></div>

            {/* Row 3 */}
            <div><label style={labelStyle}>ขนาด (กว้าง × ลึก × สูง)</label><input style={inputStyle} value={form.size||''} onChange={e=>set('size',e.target.value)} placeholder="เช่น 40×40×75 cm" /></div>
            <div><label style={labelStyle}>จำนวน</label><input style={inputStyle} type="number" min={1} value={form.qty||1} onChange={e=>set('qty',parseInt(e.target.value)||1)} /></div>

            {/* Row 4 */}
            <div><label style={labelStyle}>วันเริ่มสั่ง</label><input style={inputStyle} type="date" value={form.start_date||''} onChange={e=>set('start_date',e.target.value)} /></div>
            <div><label style={labelStyle}>กำหนดส่ง</label><input style={inputStyle} type="date" value={form.due_date||''} onChange={e=>set('due_date',e.target.value)} /></div>

            {/* Delivery */}
            <div style={{ gridColumn:'1/-1' }}>
              <label style={labelStyle}>สถานที่จัดส่ง</label>
              <input style={inputStyle} value={form.delivery||''} onChange={e=>set('delivery',e.target.value)} />
            </div>

            {/* MATERIALS */}
            <div style={{ gridColumn:'1/-1' }}>
              <label style={labelStyle}>วัสดุแผ่น</label>
              <div style={{ border:'1px solid var(--border)', borderRadius:2, overflow:'hidden' }}>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 90px 90px 32px', gap:8, padding:'6px 12px', background:'var(--bg)', borderBottom:'1px solid var(--border)' }}>
                  {['วัสดุ','ความหนา (mm)','จำนวน',''].map((h,i) => (
                    <span key={i} style={{ fontSize:9, letterSpacing:'0.12em', textTransform:'uppercase', color:'var(--muted)' }}>{h}</span>
                  ))}
                </div>
                {materials.map((m, i) => (
                  <div key={i} style={{ display:'grid', gridTemplateColumns:'1fr 90px 90px 32px', gap:8, padding:'10px 12px', borderBottom:'1px solid var(--border)', background:'var(--surface2)' }}>
                    <select style={{ ...inputStyle, padding:'7px 10px' }} value={m.material} onChange={e=>updateMat(i,'material',e.target.value)}>
                      {MAT_OPTIONS.map(o => <option key={o}>{o}</option>)}
                    </select>
                    <input style={{ ...inputStyle, padding:'7px 10px' }} type="number" placeholder="mm" step={0.5} min={0} value={m.thickness} onChange={e=>updateMat(i,'thickness',e.target.value)} />
                    <input style={{ ...inputStyle, padding:'7px 10px' }} type="number" min={1} value={m.qty} onChange={e=>updateMat(i,'qty',parseInt(e.target.value)||1)} />
                    <button onClick={()=>removeMat(i)} style={{ background:'none', border:'none', color:'var(--muted)', cursor:'pointer', fontSize:15 }}>✕</button>
                  </div>
                ))}
                <div style={{ padding:'10px 12px' }}>
                  <button onClick={addMat} style={{ background:'none', border:'1px dashed var(--border)', borderRadius:2, color:'var(--muted)', fontFamily:'"DM Mono",monospace', fontSize:11, letterSpacing:'0.08em', padding:'7px 14px', cursor:'pointer', width:'100%' }}>
                    + เพิ่มวัสดุแผ่น
                  </button>
                </div>
              </div>
            </div>

            {/* EQUIPMENT */}
            <div style={{ gridColumn:'1/-1' }}>
              <label style={labelStyle}>อุปกรณ์ / Hardware</label>
              <div style={{ border:'1px solid var(--border)', borderRadius:2, overflow:'hidden' }}>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 100px 90px 32px', gap:8, padding:'6px 12px', background:'var(--bg)', borderBottom:'1px solid var(--border)' }}>
                  {['รายการ (ระบุสเปค เช่น สกรูหัวแบน M5×20)','หน่วย','จำนวน',''].map((h,i) => (
                    <span key={i} style={{ fontSize:9, letterSpacing:'0.12em', textTransform:'uppercase', color:'var(--muted)' }}>{h}</span>
                  ))}
                </div>
                {equipment.map((e, i) => (
                  <div key={i} style={{ display:'grid', gridTemplateColumns:'1fr 100px 90px 32px', gap:8, padding:'10px 12px', borderBottom:'1px solid var(--border)', background:'var(--surface2)' }}>
                    <input style={{ ...inputStyle, padding:'7px 10px' }} type="text" placeholder="เช่น สกรูหัวแบน M5×20, น็อตตัวเมีย M5 ล็อค" value={e.name} onChange={ev=>updateEq(i,'name',ev.target.value)} />
                    <select style={{ ...inputStyle, padding:'7px 10px' }} value={e.unit} onChange={ev=>updateEq(i,'unit',ev.target.value)}>
                      {UNIT_OPTIONS.map(u => <option key={u}>{u}</option>)}
                    </select>
                    <input style={{ ...inputStyle, padding:'7px 10px' }} type="number" min={1} value={e.qty} onChange={ev=>updateEq(i,'qty',parseInt(ev.target.value)||1)} />
                    <button onClick={()=>removeEq(i)} style={{ background:'none', border:'none', color:'var(--muted)', cursor:'pointer', fontSize:15 }}>✕</button>
                  </div>
                ))}
                <div style={{ padding:'10px 12px' }}>
                  <button onClick={addEq} style={{ background:'none', border:'1px dashed var(--border)', borderRadius:2, color:'var(--muted)', fontFamily:'"DM Mono",monospace', fontSize:11, letterSpacing:'0.08em', padding:'7px 14px', cursor:'pointer', width:'100%' }}>
                    + เพิ่มอุปกรณ์
                  </button>
                </div>
              </div>
            </div>

            {/* IMAGE */}
            <div style={{ gridColumn:'1/-1' }}>
              <label style={labelStyle}>รูปสินค้า</label>
              <div style={{ border:'1px dashed var(--border)', borderRadius:2, padding:20, textAlign:'center', cursor:'pointer', position:'relative' }}>
                <input type="file" accept="image/*" onChange={handleImage} style={{ position:'absolute', inset:0, opacity:0, cursor:'pointer' }} />
                {imagePreview
                  ? <img src={imagePreview} style={{ maxHeight:80, maxWidth:'100%', borderRadius:2 }} />
                  : <div style={{ color:'var(--muted)', fontSize:11, letterSpacing:'0.08em' }}>คลิกหรือลากไฟล์ภาพมาวางที่นี่</div>
                }
              </div>
            </div>

            {/* STAGE */}
            <div style={{ gridColumn:'1/-1' }}>
              <label style={labelStyle}>Stage การผลิต</label>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:6 }}>
                {STAGES.map((s, i) => (
                  <button key={i} onClick={()=>set('stage',i)} style={{
                    padding:'7px 6px', borderRadius:2, fontSize:10, letterSpacing:'0.04em', cursor:'pointer',
                    fontFamily:'"DM Mono",monospace', textAlign:'center',
                    border: form.stage === i ? '1px solid var(--accent)' : '1px solid var(--border)',
                    color: form.stage === i ? 'var(--accent)' : 'var(--muted)',
                    background: form.stage === i ? 'rgba(200,169,110,0.08)' : 'transparent',
                  }}>{s}</button>
                ))}
              </div>
            </div>

            {/* PAYMENT */}
            <div style={{ gridColumn:'1/-1' }}>
              <label style={labelStyle}>การโอนเงิน</label>
              <div style={{ border:'1px solid var(--border)', borderRadius:2, padding:14 }}>
                {[
                  { label:'ราคารวม', key:'total_price', readonly:false },
                  { label:'โอนแล้ว', key:'deposit', readonly:false },
                  { label:'ค้างชำระ', key:'_remaining', readonly:true },
                ].map(row => (
                  <div key={row.key} style={{ display:'flex', gap:12, alignItems:'center', marginBottom:8 }}>
                    <label style={{ ...labelStyle, minWidth:90, marginBottom:0 }}>{row.label}</label>
                    <input
                      style={{ ...inputStyle, flex:1, opacity: row.readonly ? 0.6 : 1 }}
                      type="number"
                      readOnly={row.readonly}
                      value={row.key === '_remaining' ? remaining : (form as any)[row.key] || ''}
                      onChange={e => !row.readonly && set(row.key, parseFloat(e.target.value) || 0)}
                    />
                  </div>
                ))}
                <div style={{ marginTop:10, paddingTop:10, borderTop:'1px solid var(--border)', display:'flex', justifyContent:'space-between' }}>
                  <span style={{ color:'var(--muted)', fontSize:11 }}>โอนแล้ว</span>
                  <strong style={{ color:'var(--accent2)' }}>{paid}%</strong>
                </div>
              </div>
            </div>

            {/* NOTES */}
            <div style={{ gridColumn:'1/-1' }}>
              <label style={labelStyle}>หมายเหตุ</label>
              <textarea style={inputStyle} value={form.notes||''} onChange={e=>set('notes',e.target.value)} placeholder="ข้อมูลเพิ่มเติม..." />
            </div>

          </div>
        </div>

        {/* Footer */}
        <div style={{ padding:'16px 24px', borderTop:'1px solid var(--border)', display:'flex', gap:8, justifyContent:'flex-end', background:'var(--surface)' }}>
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save Order'}
          </button>
        </div>
      </div>
    </div>
  )
}
