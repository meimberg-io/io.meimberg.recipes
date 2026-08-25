import type { Metadata } from 'next'

// Internal diagnostics page — never in the index.
export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
    googleBot: { index: false, follow: false },
  },
}

export default function TestLayout({ children }: { children: React.ReactNode }) {
  return children
}
