'use client'
import { Component, ReactNode } from 'react'

type Props = { children: ReactNode }
type State = { error: Error | null }

// Catches render errors anywhere below so one broken component does not take
// down the whole app. Shows a recoverable fallback with a reload action.
export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error) {
    // Keep a console trail for debugging in production logs.
    console.error('App error caught by ErrorBoundary:', error)
  }

  handleReset = () => this.setState({ error: null })

  render() {
    if (this.state.error) {
      return (
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, padding: 32, textAlign: 'center' }}>
          <div style={{ fontSize: 40, opacity: 0.4 }}>⚠</div>
          <div style={{ fontFamily: 'Fraunces, serif', fontSize: 20, fontWeight: 300 }}>เกิดข้อผิดพลาด</div>
          <div style={{ color: 'var(--muted)', fontSize: 12, maxWidth: 420, lineHeight: 1.7 }}>
            มีบางอย่างผิดพลาดในการแสดงผล ลองโหลดหน้าใหม่อีกครั้ง หากยังเป็นอยู่ให้แจ้งผู้ดูแลระบบ
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-ghost" onClick={this.handleReset}>ลองอีกครั้ง</button>
            <button className="btn btn-primary" onClick={() => location.reload()}>โหลดหน้าใหม่</button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
