'use client'

import { useEffect, useState } from 'react'

// A recipe counts as "new" for this many days after its Notion created_time.
const NEW_WINDOW_DAYS = 14

interface NewBadgeProps {
  createdTime?: string
}

// Renders a small "Neu" badge for recipes created within the last NEW_WINDOW_DAYS.
// The freshness check runs on the client (after mount) against the real current
// date — the pages are statically generated with a long ISR window, so a
// server-side date check would be frozen at build time and go stale.
export default function NewBadge({ createdTime }: NewBadgeProps) {
  const [isNew, setIsNew] = useState(false)

  useEffect(() => {
    if (!createdTime) return
    const created = new Date(createdTime).getTime()
    if (Number.isNaN(created)) return
    const ageMs = Date.now() - created
    setIsNew(ageMs >= 0 && ageMs <= NEW_WINDOW_DAYS * 24 * 60 * 60 * 1000)
  }, [createdTime])

  if (!isNew) return null

  return (
    <span className="absolute top-2 left-2 z-10 rounded-full bg-black/55 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-yellow-200 ring-[1.5px] ring-white/75 shadow-md backdrop-blur-sm">
      Neu
    </span>
  )
}
