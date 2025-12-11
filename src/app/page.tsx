import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { getSlugFromCategory } from '@/config/navigation'

export const metadata: Metadata = {
  title: 'Bei Meimbergs - Rezepte',
  description: 'Unsere Rezeptsammlung - Entdecke unsere Lieblingsrezepte',
  alternates: {
    canonical: '/',
  },
}

export default function Home() {
  // Redirect to Hauptspeisen by default
  const slug = getSlugFromCategory('Hauptspeisen')
  if (slug) {
    redirect(`/${slug}`)
  }
  
  return null
}
