'use client'
import { ReactNode } from 'react'
import ErrorBoundary from './ErrorBoundary'
import { ToastProvider } from './Toast'
import { ConfirmProvider } from './ConfirmDialog'

// Single client-side wrapper for the app-wide providers so the root layout
// can stay a server component.
export default function Providers({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <ConfirmProvider>
          {children}
        </ConfirmProvider>
      </ToastProvider>
    </ErrorBoundary>
  )
}
