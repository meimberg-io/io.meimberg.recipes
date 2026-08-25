import { permanentRedirect } from 'next/navigation'
import type { Metadata } from 'next'
import { getSlugFromCategory } from '@/config/navigation'

export const metadata: Metadata = {
  title: 'Rezepte',
  description: 'Unsere Rezeptsammlung - Entdecke unsere Lieblingsrezepte',
  alternates: {
    canonical: '/',
  },
}

export default function Home() {
  // 308 rather than a temporary 307, so Google consolidates "/" onto the
  // default category instead of keeping both as separate candidates.
  const slug = getSlugFromCategory('Hauptspeisen')
  if (slug) {
    permanentRedirect(`/${slug}`)
  }

  return null
}
