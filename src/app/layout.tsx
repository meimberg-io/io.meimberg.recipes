import type { Metadata } from 'next'
import Footer from '@/components/Footer'
import './globals.css'

export const metadata: Metadata = {
  title: 'Bei Meimbergs - Rezepte',
  description: 'Unsere Rezeptsammlung',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="de">
      <body className="flex flex-col min-h-screen">
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  )
}

