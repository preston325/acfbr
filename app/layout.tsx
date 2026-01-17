import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'America\'s College Football Rankings',
  description: 'Independent college football rankings voted on by Americas football pundits',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
