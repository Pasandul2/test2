import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Smart Student Pathway Decider',
  description: 'AI-powered platform for personalized career pathways and student-employer matching',
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
