import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'MET Production Tracker',
  description: 'MET Furniture order and production management',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th">
      <body>{children}</body>
    </html>
  )
}
