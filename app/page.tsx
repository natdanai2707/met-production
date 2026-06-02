'use client'
import { useState, useEffect, useCallback } from 'react'
import { supabase, Order, CHANNELS, STAGES } from '@/lib/supabase'
import StatsBar from './components/StatsBar'
import OrderTable from './components/OrderTable'
import OrderModal from './components/OrderModal'
import DetailModal from './components/DetailModal'

export default function Home() {
  const [orders, setOrders] = useState<Order[]>([])
  const [filtered, setFiltered] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')
  const [filterStage, setFilterStage] = useState('')
  const [filterChannel, setFilterChannel] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editOrder, setEditOrder] = useState<Order | null>(null)
  const [detailOrder, setDetailOrder] = useState<Order | null>(null)

  const fetchOrders = useCallback(async () => {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false })
    if (!error && data) setOrders(data as Order[])
    setLoading(false)
  }, [])

  useEffect(() => { fetchOrders() }, [fetchOrders])

  useEffect(() => {
    let f = orders
    if (search) f = f.filter(o =>
      o.customer.toLowerCase().includes(search.toLowerCase()) ||
      o.product.toLowerCase().includes(search.toLowerCase()) ||
      (o.account||'').toLowerCase().includes(search.toLowerCase())
    )
    if (filterStage !== '') f = f.filter(o => String(o.stage) === filterStage)
    if (filterChannel) f = f.filter(o => o.channel === filterChannel)
    setFiltered(f)
  }, [orders, search, filterStage, filterChannel])

  const handleSave = async (data: Partial<Order>, imageFile: File | null) => {
    setSaving(true)
    try {
      let image_url = data.image_url || null

      if (imageFile) {
        const ext = imageFile.name.split('.').pop()
        const path = `orders/${Date.now()}.${ext}`
        const { error: upErr } = await supabase.storage.from('met-images').upload(path, imageFile)
        if (!upErr) {
          const { data: urlData } = supabase.storage.from('met-images').getPublicUrl(path)
          image_url = urlData.publicUrl
        }
      }

      const payload = { ...data, image_url }

      if (editOrder) {
        await supabase.from('orders').update({ ...payload, updated_at: new Date().toISOString() }).eq('id', editOrder.id)
      } else {
        await supabase.from('orders').insert({ ...payload, created_at: new Date().toISOString(), updated_at: new Date().toISOString() })
      }

      await fetchOrders()
      setModalOpen(false)
      setEditOrder(null)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('ลบออร์เดอร์นี้?')) return
    await supabase.from('orders').delete().eq('id', id)
    await fetchOrders()
  }

  const handleStageChange = async (id: string, stage: number) => {
    await supabase.from('orders').update({ stage, updated_at: new Date().toISOString() }).eq('id', id)
    await fetchOrders()
    setDetailOrder(prev => prev?.id === id ? { ...prev, stage } : prev)
  }

  const openNew = () => { setEditOrder(null); setModalOpen(true) }
  const openEdit = (o: Order) => { setEditOrder(o); setModalOpen(true) }

  const selectStyle = { background:'var(--surface2)', border:'1px solid var(--border)', borderRadius:2, color:'var(--text)', fontFamily:'"DM Mono",monospace', fontSize:12, padding:'7px 12px', outline:'none', cursor:'pointer' }

  return (
    <div>
      {/* Header */}
      <div style={{ borderBottom:'1px solid var(--border)', padding:'20px 32px', display:'flex', alignItems:'center', justifyContent:'space-between', position:'sticky', top:0, background:'var(--bg)', zIndex:100 }}>
        <div style={{ fontFamily:'Fraunces,serif', fontSize:22, fontWeight:300, letterSpacing:'0.08em', color:'var(--accent)' }}>
          MET <span style={{ fontStyle:'italic' }}>Production</span>
        </div>
        <button className="btn btn-primary" onClick={openNew}>+ New Order</button>
      </div>

      {/* Stats */}
      <StatsBar orders={orders} />

      {/* Toolbar */}
      <div style={{ padding:'16px 32px', display:'flex', gap:12, alignItems:'center', borderBottom:'1px solid var(--border)' }}>
        <input
          style={{ background:'var(--surface2)', border:'1px solid var(--border)', borderRadius:2, color:'var(--text)', fontFamily:'"DM Mono",monospace', fontSize:12, padding:'7px 14px', outline:'none', width:240 }}
          placeholder="ค้นหาลูกค้า / สินค้า..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <select style={selectStyle} value={filterStage} onChange={e => setFilterStage(e.target.value)}>
          <option value="">All Stages</option>
          {STAGES.map((s,i) => <option key={i} value={i}>{s}</option>)}
        </select>
        <select style={selectStyle} value={filterChannel} onChange={e => setFilterChannel(e.target.value)}>
          <option value="">All Channels</option>
          {CHANNELS.map(c => <option key={c}>{c}</option>)}
        </select>
        {loading && <span style={{ color:'var(--muted)', fontSize:11 }}>Loading...</span>}
      </div>

      {/* Table */}
      <OrderTable
        orders={filtered}
        onEdit={openEdit}
        onDelete={handleDelete}
        onDetail={setDetailOrder}
      />

      {/* Modals */}
      <OrderModal
        open={modalOpen}
        order={editOrder}
        onClose={() => { setModalOpen(false); setEditOrder(null) }}
        onSave={handleSave}
        saving={saving}
      />
      <DetailModal
        order={detailOrder}
        onClose={() => setDetailOrder(null)}
        onEdit={openEdit}
        onStageChange={handleStageChange}
      />
    </div>
  )
}
