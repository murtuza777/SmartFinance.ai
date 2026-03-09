import { AuthProvider } from '@/contexts/AuthContext'
import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'BurryAI',
  description: 'AI-Powered Student Finance Management',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  )
} 
