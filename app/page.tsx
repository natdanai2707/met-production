'use client'
import { useState, useEffect, useCallback, useMemo } from 'react'
import { supabase, Order, CHANNELS, STAGES } from '@/lib/supabase'
import {
  compressImage, storageExt, withRetry, daysUntil,
  compareOrders, SortKey, SortState, ordersToCSV, downloadFile,
} from '@/lib/utils'
import { toolbarSelect, input as inputStyle, navPill } from '@/lib/styles'
import { useToast } from './components/Toast'
import { useConfirm } from './components/ConfirmDialog'
import { OrderTableSkeleton } from './components/Skeleton'
import BuildStamp from './components/BuildStamp'
import Link from 'next/link'
import StatsBar from './components/StatsBar'
import OrderTable from './components/OrderTable'
import OrderModal from './components/OrderModal'
import DetailModal from './components/DetailModal'
import ReportModal from './components/ReportModal'
import MaterialSummaryModal from './components/MaterialSummaryModal'

type QuickFilter = '' | 'unpaid' | 'overdue'

export default function Home() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')
  const [filterStage, setFilterStage] = useState('')
  const [filterChannel, setFilterChannel] = useState('')
  const [quickFilter, setQuickFilter] = useState<QuickFilter>('')
  const [sort, setSort] = useState<SortState>({ key: 'created', dir: 'desc' })
  const [modalOpen, setModalOpen] = useState(false)
  const [editOrder, setEditOrder] = useState<Order | null>(null)
  const [detailOrder, setDetailOrder] = useState<Order | null>(null)
  const [reportOpen, setReportOpen] = useState(false)
  const [materialOpen, setMaterialOpen] = useState(false)

  const toast = useToast()
  const confirm = useConfirm()

  const fetchOrders = useCallback(async () => {
    setLoadError(false)
    try {
      const { data } = await withRetry(async () => {
        const res = await supabase.from('orders').select('*').order('created_at', { ascending: false })
        if (res.error) throw res.error
        return res
      })
      setOrders((data || []) as Order[])
    } catch {
      setLoadError(true)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchOrders() }, [fetchOrders])

  // Realtime sync so the second device sees changes without a manual refresh.
  useEffect(() => {
    const channel = supabase
      .channel('orders-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, payload => {
        if (payload.eventType === 'DELETE') {
          const oldId = (payload.old as Partial<Order>).id
          if (oldId) setOrders(prev => prev.filter(o => o.id !== oldId))
          return
        }
        const row = payload.new as Order
        setOrders(prev => prev.some(o => o.id === row.id)
          ? prev.map(o => (o.id === row.id ? row : o))
          : [row, ...prev])
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [])

  // Derived list: filter + quick filter + sort. Memoized so typing in the
  // search box does not re-sort the whole table on unrelated re-renders.
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    let f = orders
    if (q) f = f.filter(o =>
      o.customer.toLowerCase().includes(q) ||
      o.product.toLowerCase().includes(q) ||
      (o.account || '').toLowerCase().includes(q)
    )
    if (filterStage !== '') f = f.filter(o => String(o.stage) === filterStage)
    if (filterChannel) f = f.filter(o => o.channel === filterChannel)
    if (quickFilter === 'unpaid') f = f.filter(o => o.total_price > 0 && o.deposit < o.total_price)
    if (quickFilter === 'overdue') f = f.filter(o => {
      const d = daysUntil(o.due_date)
      return d !== null && d < 0 && o.stage < 6
    })
    const dir = sort.dir === 'asc' ? 1 : -1
    return [...f].sort((a, b) => compareOrders(a, b, sort.key) * dir)
  }, [orders, search, filterStage, filterChannel, quickFilter, sort])

  const onSort = useCallback((key: SortKey) => {
    setSort(s => s.key === key
      ? { key, dir: s.dir === 'asc' ? 'desc' : 'asc' }
      : { key, dir: key === 'created' ? 'desc' : 'asc' })
  }, [])

  const handleSave = async (data: Partial<Order>, imageFile: File | null) => {
    setSaving(true)
    try {
      let image_url = data.image_url || null
      if (imageFile) {
        const file = await compressImage(imageFile)
        const path = `orders/${Date.now()}.${storageExt(file)}`
        await withRetry(async () => {
          const r = await supabase.storage.from('met-images').upload(path, file)
          if (r.error) throw r.error
          return r
        })
        const { data: urlData } = supabase.storage.from('met-images').getPublicUrl(path)
        image_url = urlData.publicUrl
      }

      const payload = { ...data, image_url }
      const isEdit = !!editOrder?.id

      if (isEdit) {
        const id = editOrder!.id
        const updated = { ...payload, updated_at: new Date().toISOString() }
        // Optimistic patch, no full refetch.
        setOrders(prev => prev.map(o => (o.id === id ? { ...o, ...updated } as Order : o)))
        await withRetry(async () => {
          const r = await supabase.from('orders').update(updated).eq('id', id)
          if (r.error) throw r.error
          return r
        })
        toast.success('บันทึกการแก้ไขแล้ว')
      } else {
        const insertPayload = Object.fromEntries(
          Object.entries(payload as Order).filter(([k]) => k !== 'id')
        )
        const now = new Date().toISOString()
        const { data: inserted } = await withRetry(async () => {
          const r = await supabase.from('orders')
            .insert({ ...insertPayload, created_at: now, updated_at: now })
            .select().single()
          if (r.error) throw r.error
          return r
        })
        if (inserted) {
          setOrders(prev => prev.some(o => o.id === (inserted as Order).id)
            ? prev
            : [inserted as Order, ...prev])
        }
        toast.success('เพิ่มออร์เดอร์แล้ว')
      }
      setModalOpen(false)
      setEditOrder(null)
    } catch {
      toast.error('บันทึกไม่สำเร็จ, ตรวจสอบการเชื่อมต่อแล้วลองใหม่')
      // Reconcile local state with the server after a failed write.
      fetchOrders()
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    const ok = await confirm({
      title: 'ลบออร์เดอร์',
      message: 'ต้องการลบออร์เดอร์นี้? การกระทำนี้ย้อนกลับไม่ได้',
      confirmLabel: 'ลบ', danger: true,
    })
    if (!ok) return
    const snapshot = orders
    setOrders(prev => prev.filter(o => o.id !== id))
    setDetailOrder(prev => (prev?.id === id ? null : prev))
    try {
      await withRetry(async () => {
        const r = await supabase.from('orders').delete().eq('id', id)
        if (r.error) throw r.error
        return r
      })
      toast.success('ลบออร์เดอร์แล้ว')
    } catch {
      setOrders(snapshot)
      toast.error('ลบไม่สำเร็จ, ลองใหม่อีกครั้ง')
    }
  }

  const handleDuplicate = (o: Order) => {
    const copy: Order = {
      ...o,
      id: '',
      product: o.product + ' (copy)',
      stage: 0,
      deposit: 0,
      start_date: new Date().toISOString().split('T')[0],
      due_date: null,
      image_url: null,
      created_at: '',
      updated_at: '',
    }
    setEditOrder(copy)
    setModalOpen(true)
  }

  const handleStageChange = async (id: string, stage: number) => {
    const snapshot = orders
    setOrders(prev => prev.map(o => (o.id === id ? { ...o, stage } : o)))
    setDetailOrder(prev => (prev?.id === id ? { ...prev, stage } : prev))
    try {
      await withRetry(async () => {
        const r = await supabase.from('orders').update({ stage, updated_at: new Date().toISOString() }).eq('id', id)
        if (r.error) throw r.error
        return r
      })
    } catch {
      setOrders(snapshot)
      toast.error('อัปเดตสถานะไม่สำเร็จ')
    }
  }

  const openNew = () => { setEditOrder(null); setModalOpen(true) }
  const openEdit = (o: Order) => { setEditOrder(o); setModalOpen(true) }

  const handleExport = () => {
    if (filtered.length === 0) { toast.info('ไม่มีข้อมูลให้ส่งออก'); return }
    const stamp = new Date().toISOString().slice(0, 10)
    downloadFile(`met-orders-${stamp}.csv`, ordersToCSV(filtered))
    toast.success(`ส่งออก ${filtered.length} รายการแล้ว`)
  }

  const quickBtn = (key: QuickFilter, label: string, activeColor: string) => (
    <button
      onClick={() => setQuickFilter(f => (f === key ? '' : key))}
      style={{
        ...toolbarSelect,
        borderColor: quickFilter === key ? activeColor : 'var(--border)',
        color: quickFilter === key ? activeColor : 'var(--muted)',
        background: quickFilter === key ? 'var(--surface2)' : 'transparent',
      }}
    >{label}</button>
  )

  return (
    <div>
      {/* Header */}
      <div className="app-header page-x" style={{ borderBottom:'1px solid var(--border)', padding:'16px 32px', display:'flex', alignItems:'center', justifyContent:'space-between', position:'sticky', top:0, background:'var(--bg)', zIndex:100, gap:12, flexWrap:'wrap' }}>
        <div style={{ display:'flex', alignItems:'center', gap:16, flexWrap:'wrap' }}>
          <div style={{ fontFamily:'Fraunces,serif', fontSize:22, fontWeight:300, letterSpacing:'0.08em', color:'var(--accent)' }}>
            MET <span style={{ fontStyle:'italic' }}>Production</span>
          </div>
          <button onClick={() => setReportOpen(true)} style={navPill}>↗ Report</button>
          <button onClick={() => setMaterialOpen(true)} style={navPill}>📦 วัสดุ</button>
          <button onClick={handleExport} style={navPill}>⬇ Export</button>
          <Link href="/calculator" style={navPill}>🧮 Calculator</Link>
          <Link href="/calendar" style={navPill}>📅 Calendar</Link>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:16 }}>
          <BuildStamp />
          <button className="btn btn-primary" onClick={openNew}>+ New Order</button>
        </div>
      </div>

      <StatsBar orders={orders} />

      {/* Toolbar */}
      <div className="page-x" style={{ padding:'16px 32px', display:'flex', gap:12, alignItems:'center', borderBottom:'1px solid var(--border)', flexWrap:'wrap' }}>
        <input
          style={{ ...inputStyle, width:240, fontSize:12, padding:'7px 14px' }}
          placeholder="ค้นหาลูกค้า / สินค้า..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <select style={toolbarSelect} value={filterStage} onChange={e => setFilterStage(e.target.value)}>
          <option value="">All Stages</option>
          {STAGES.map((s,i) => <option key={i} value={i}>{s}</option>)}
        </select>
        <select style={toolbarSelect} value={filterChannel} onChange={e => setFilterChannel(e.target.value)}>
          <option value="">All Channels</option>
          {CHANNELS.map(c => <option key={c}>{c}</option>)}
        </select>
        {quickBtn('unpaid', 'ค้างจ่าย', 'var(--accent)')}
        {quickBtn('overdue', 'เลยกำหนด', 'var(--danger)')}
        {!loading && <span style={{ color:'var(--muted)', fontSize:11, marginLeft:'auto' }}>{filtered.length} รายการ</span>}
      </div>

      {loading ? (
        <OrderTableSkeleton />
      ) : loadError ? (
        <div style={{ textAlign:'center', padding:'80px 32px', color:'var(--muted)' }}>
          <div style={{ fontSize:32, marginBottom:12, opacity:0.5 }}>⚠</div>
          <p style={{ marginBottom:16 }}>โหลดข้อมูลไม่สำเร็จ, ตรวจสอบการเชื่อมต่อ</p>
          <button className="btn btn-ghost" onClick={() => { setLoading(true); fetchOrders() }}>ลองใหม่</button>
        </div>
      ) : (
        <OrderTable
          orders={filtered}
          onEdit={openEdit}
          onDelete={handleDelete}
          onDetail={setDetailOrder}
          onDuplicate={handleDuplicate}
          sort={sort}
          onSort={onSort}
        />
      )}

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
      <ReportModal
        open={reportOpen}
        onClose={() => setReportOpen(false)}
        orders={orders}
      />
      <MaterialSummaryModal
        open={materialOpen}
        onClose={() => setMaterialOpen(false)}
        orders={orders}
      />
    </div>
  )
}
