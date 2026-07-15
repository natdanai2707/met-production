import type { Metadata } from 'next'
import './globals.css'
import Providers from './components/Providers'

export const metadata: Metadata = {
  title: 'MET Production Tracker',
  description: 'MET Furniture order and production management',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
