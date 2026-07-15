'use client'
import Link from 'next/link'
import { useEffect, useRef, useCallback } from 'react'
import { navPill } from '@/lib/styles'
import BuildStamp from '../components/BuildStamp'

export default function CalculatorPage() {
  const iframeRef = useRef<HTMLIFrameElement>(null)

  // Hand the (public) Supabase config to the same-origin calculator iframe so
  // it can sync the price database across devices. The anon key is already
  // public in the app bundle; postMessage keeps it out of the URL.
  const sendConfig = useCallback(() => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!url || !key) return
    iframeRef.current?.contentWindow?.postMessage(
      { type: 'met-supabase-config', url, key },
      window.location.origin,
    )
  }, [])

  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      if (e.origin !== window.location.origin) return
      if (e.data?.type === 'met-calc-ready') sendConfig()
    }
    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [sendConfig])

  return (
    <div style={{ height:'100vh', display:'flex', flexDirection:'column', background:'var(--bg)' }}>
      {/* Thin top bar */}
      <div style={{
        borderBottom:'1px solid var(--border)',
        padding:'10px 24px',
        display:'flex',
        alignItems:'center',
        gap:16,
        background:'var(--bg)',
        zIndex:10,
        flexShrink:0,
      }}>
        <div style={{ fontFamily:'Fraunces,serif', fontSize:18, fontWeight:300, letterSpacing:'0.08em', color:'var(--accent)' }}>
          MET <span style={{ fontStyle:'italic' }}>Production</span>
        </div>
        <Link href="/" style={navPill}>← Orders</Link>
        <div style={{
          background:'rgba(200,169,110,0.1)', border:'1px solid var(--accent)', borderRadius:2,
          color:'var(--accent)', fontFamily:'"DM Mono",monospace', fontSize:10,
          letterSpacing:'0.1em', textTransform:'uppercase', padding:'5px 12px',
        }}>
          Calculator
        </div>
        <BuildStamp style={{ marginLeft:'auto' }} />
      </div>

      {/* Full-height iframe */}
      <iframe
        ref={iframeRef}
        src="/calculator-legacy.html"
        onLoad={sendConfig}
        style={{ flex:1, border:'none', width:'100%' }}
        title="MET Furniture Calculator"
      />
    </div>
  )
}
