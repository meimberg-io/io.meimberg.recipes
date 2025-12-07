'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getSlugFromCategory } from '@/config/navigation'

export default function Home() {
  const router = useRouter()
  
  // Redirect to Hauptspeisen by default
  useEffect(() => {
    const slug = getSlugFromCategory('Hauptspeisen')
    if (slug) {
      router.replace(`/${slug}`)
    }
  }, [router])

  return null
}
