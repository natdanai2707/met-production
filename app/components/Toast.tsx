'use client'
import { createContext, useContext, useState, useCallback, useMemo, ReactNode } from 'react'

type ToastKind = 'success' | 'error' | 'info'
type ToastItem = { id: number; kind: ToastKind; message: string }

export type ToastApi = {
  success: (msg: string) => void
  error: (msg: string) => void
  info: (msg: string) => void
}

const ToastContext = createContext<ToastApi | null>(null)

export function useToast(): ToastApi {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within <ToastProvider>')
  return ctx
}

const KIND_STYLE: Record<ToastKind, { color: string; icon: string }> = {
  success: { color: 'var(--accent2)', icon: '✓' },
  error:   { color: 'var(--danger)',  icon: '✕' },
  info:    { color: 'var(--accent)',  icon: 'ℹ' },
}

let counter = 0

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const remove = useCallback((id: number) => {
    setToasts(t => t.filter(x => x.id !== id))
  }, [])

  const push = useCallback((kind: ToastKind, message: string) => {
    const id = ++counter
    setToasts(t => [...t, { id, kind, message }])
    setTimeout(() => remove(id), 3200)
  }, [remove])

  const api = useMemo<ToastApi>(() => ({
    success: m => push('success', m),
    error: m => push('error', m),
    info: m => push('info', m),
  }), [push])

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div style={{ position: 'fixed', bottom: 20, right: 20, zIndex: 5000, display: 'flex', flexDirection: 'column', gap: 8, maxWidth: 'calc(100vw - 40px)' }}>
        {toasts.map(t => {
          const ks = KIND_STYLE[t.kind]
          return (
            <div key={t.id} className="toast-in" onClick={() => remove(t.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                background: 'var(--surface)', border: '1px solid var(--border)',
                borderLeft: `3px solid ${ks.color}`, borderRadius: 3,
                padding: '11px 16px', minWidth: 220, cursor: 'pointer',
                boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
              }}>
              <span style={{ color: ks.color, fontSize: 13, flexShrink: 0 }}>{ks.icon}</span>
              <span style={{ fontSize: 12, color: 'var(--text)', lineHeight: 1.4 }}>{t.message}</span>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}
