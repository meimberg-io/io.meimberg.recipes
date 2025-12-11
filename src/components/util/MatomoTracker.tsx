'use client'

import { useEffect } from 'react'

/*
    Tracking deaktivieren und aktivieren:
    javascript:localStorage.setItem("matomo-disable","true");alert("Tracking deaktiviert!");
    javascript:localStorage.removeItem("matomo-disable");alert("Tracking wieder aktiv!");
*/

export function MatomoTracker() {
  const enabled = process.env.NEXT_PUBLIC_MATOMO_TRACKER === 'true'

  useEffect(() => {
    if (!enabled) return
    if (typeof window === 'undefined') return
    if (localStorage.getItem('matomo-disable') === 'true') return

    // @ts-ignore
    const _paq = (window._paq = window._paq || [])
    _paq.push(['trackPageView'])
    _paq.push(['disableCookies'])
    _paq.push(['enableLinkTracking'])
    _paq.push(['setTrackerUrl', 'https://matomo.meimberg.io/matomo.php'])
    _paq.push(['setSiteId', '5']) // Recipes site ID (different from awesomeapps which uses 4)

    const d = document, g = d.createElement('script'), s = d.getElementsByTagName('script')[0]
    g.async = true
    g.src = 'https://matomo.meimberg.io/matomo.js'
    s.parentNode?.insertBefore(g, s)
  }, [enabled])

  return null
}

