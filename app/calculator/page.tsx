'use client'
import Link from 'next/link'

export default function CalculatorPage() {
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
        <Link
          href="/"
          style={{
            background:'none', border:'1px solid var(--border)', borderRadius:2,
            color:'var(--muted)', fontFamily:'"DM Mono",monospace', fontSize:10,
            letterSpacing:'0.1em', textTransform:'uppercase', padding:'5px 12px',
            cursor:'pointer', textDecoration:'none',
          }}
        >
          ← Orders
        </Link>
        <div style={{
          background:'rgba(200,169,110,0.1)', border:'1px solid var(--accent)', borderRadius:2,
          color:'var(--accent)', fontFamily:'"DM Mono",monospace', fontSize:10,
          letterSpacing:'0.1em', textTransform:'uppercase', padding:'5px 12px',
        }}>
          Calculator
        </div>
      </div>

      {/* Full-height iframe */}
      <iframe
        src="/calculator-legacy.html"
        style={{ flex:1, border:'none', width:'100%' }}
        title="MET Furniture Calculator"
      />
    </div>
  )
}
