'use client'
import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react'
import { modalOverlay, modalCard } from '@/lib/styles'

type ConfirmOptions = {
  title?: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  danger?: boolean
}

type ConfirmApi = (opts: ConfirmOptions) => Promise<boolean>

const ConfirmContext = createContext<ConfirmApi | null>(null)

export function useConfirm(): ConfirmApi {
  const ctx = useContext(ConfirmContext)
  if (!ctx) throw new Error('useConfirm must be used within <ConfirmProvider>')
  return ctx
}

type Pending = ConfirmOptions & { resolve: (v: boolean) => void }

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [pending, setPending] = useState<Pending | null>(null)

  const confirm = useCallback<ConfirmApi>((opts) => {
    return new Promise<boolean>(resolve => setPending({ ...opts, resolve }))
  }, [])

  const settle = useCallback((value: boolean) => {
    setPending(prev => { prev?.resolve(value); return null })
  }, [])

  useEffect(() => {
    if (!pending) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') settle(false)
      if (e.key === 'Enter') settle(true)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [pending, settle])

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {pending && (
        <div style={{ ...modalOverlay, zIndex: 4000 }} className="overlay-in"
          onClick={e => { if (e.target === e.currentTarget) settle(false) }}>
          <div style={{ ...modalCard, width: 380 }} className="dialog-in">
            <div style={{ padding: '22px 24px 8px' }}>
              {pending.title && (
                <div style={{ fontFamily: 'Fraunces, serif', fontSize: 17, fontWeight: 300, marginBottom: 8 }}>
                  {pending.title}
                </div>
              )}
              <div style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.6 }}>{pending.message}</div>
            </div>
            <div style={{ padding: '16px 24px', display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button className="btn btn-ghost" onClick={() => settle(false)}>
                {pending.cancelLabel || 'ยกเลิก'}
              </button>
              <button className={pending.danger ? 'btn btn-danger' : 'btn btn-primary'} onClick={() => settle(true)}>
                {pending.confirmLabel || 'ยืนยัน'}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  )
}
