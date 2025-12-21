import type { Metadata } from 'next'
import Footer from '@/components/Footer'
import { MatomoTracker } from '@/components/util/MatomoTracker'
import SnowfallClient from '@/components/SnowfallClient'
import './globals.css'

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://recipes.meimberg.io'

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: 'Bei Meimbergs - Rezepte',
    template: '%s - Bei Meimbergs',
  },
  description: 'Unsere Rezeptsammlung',
  keywords: ['Rezepte', 'Kochen', 'Küche', 'Kochrezepte', 'Rezeptsammlung'],
  authors: [{ name: 'Meimberg' }],
  creator: 'Meimberg',
  publisher: 'Meimberg',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'de_DE',
    url: baseUrl,
    siteName: 'Bei Meimbergs',
    title: 'Bei Meimbergs - Rezepte',
    description: 'Unsere Rezeptsammlung',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Bei Meimbergs - Rezepte',
    description: 'Unsere Rezeptsammlung',
  },
}

const organizationSchema = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Bei Meimbergs',
  url: baseUrl,
  description: 'Rezeptsammlung - Unsere Lieblingsrezepte',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="de">
      <body className="flex flex-col min-h-screen">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />
        <main className="flex-1">{children}</main>
        <Footer />
        <MatomoTracker />
        <SnowfallClient />
      </body>
    </html>
  )
}

