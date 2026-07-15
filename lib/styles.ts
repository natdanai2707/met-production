import type { CSSProperties } from 'react'

// Shared, reusable style objects so components stop repeating inline CSS.
// Everything here leans on the CSS variables defined in globals.css.

const MONO = '"DM Mono", monospace'

// ── Modal shell ──────────────────────────────────────────────────────────────

export const modalOverlay: CSSProperties = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(0,0,0,0.75)',
  zIndex: 1000,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 16,
}

export const modalCard: CSSProperties = {
  background: 'var(--surface)',
  border: '1px solid var(--border)',
  borderRadius: 4,
  width: 720,
  maxWidth: '100%',
  maxHeight: '90vh',
  overflow: 'hidden',
  display: 'flex',
  flexDirection: 'column',
}

export const modalHeader: CSSProperties = {
  padding: '20px 24px',
  borderBottom: '1px solid var(--border)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  background: 'var(--surface)',
  flexShrink: 0,
}

export const modalTitle: CSSProperties = {
  fontFamily: 'Fraunces, serif',
  fontSize: 18,
  fontWeight: 300,
}

export const modalBody: CSSProperties = {
  overflowY: 'auto',
  padding: 24,
  flex: 1,
}

export const modalFooter: CSSProperties = {
  padding: '16px 24px',
  borderTop: '1px solid var(--border)',
  display: 'flex',
  gap: 8,
  justifyContent: 'flex-end',
  background: 'var(--surface)',
  flexShrink: 0,
}

export const closeBtn: CSSProperties = {
  background: 'none',
  border: 'none',
  color: 'var(--muted)',
  fontSize: 20,
  cursor: 'pointer',
  lineHeight: 1,
}

// ── Form controls ────────────────────────────────────────────────────────────

export const input: CSSProperties = {
  background: 'var(--surface2)',
  border: '1px solid var(--border)',
  borderRadius: 2,
  color: 'var(--text)',
  fontFamily: MONO,
  fontSize: 13,
  padding: '9px 12px',
  outline: 'none',
  width: '100%',
}

export const inputSm: CSSProperties = { ...input, padding: '7px 10px' }

export const label: CSSProperties = {
  fontSize: 10,
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
  color: 'var(--muted)',
  display: 'block',
  marginBottom: 6,
}

// Compact select used in toolbars.
export const toolbarSelect: CSSProperties = {
  background: 'var(--surface2)',
  border: '1px solid var(--border)',
  borderRadius: 2,
  color: 'var(--text)',
  fontFamily: MONO,
  fontSize: 12,
  padding: '7px 12px',
  outline: 'none',
  cursor: 'pointer',
}

// ── Misc ─────────────────────────────────────────────────────────────────────

export const badge: CSSProperties = {
  display: 'inline-block',
  padding: '2px 8px',
  borderRadius: 2,
  fontSize: 10,
  letterSpacing: '0.05em',
  textTransform: 'uppercase',
}

export const iconBtn: CSSProperties = {
  background: 'none',
  border: '1px solid var(--border)',
  color: 'var(--muted)',
  borderRadius: 2,
  width: 26,
  height: 26,
  cursor: 'pointer',
  fontSize: 13,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
}

// Small pill link/button used in page headers.
export const navPill: CSSProperties = {
  background: 'none',
  border: '1px solid var(--border)',
  borderRadius: 2,
  color: 'var(--muted)',
  fontFamily: MONO,
  fontSize: 10,
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  padding: '5px 12px',
  cursor: 'pointer',
  textDecoration: 'none',
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
}
