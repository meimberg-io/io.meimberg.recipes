import Image from 'next/image'

// Switch between 'image' and 'video' header
const HEADER_TYPE: 'image' | 'video' = 'image'

export default function Header() {
  return (
    <header className="relative w-full h-96 overflow-hidden">
      <div className="absolute inset-0">
        {HEADER_TYPE === 'video' ? (
          // Looping video background
          <video
            src="/header/header_01.mp4"
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-full object-cover"
          />
        ) : (
          // Static image background
          <Image
            src="/header/header_02.jpg"
            alt="Header"
            fill
            className="object-cover"
            priority
            sizes="100vw"
          />
        )}
        <div className="absolute inset-0 bg-black/20" />
      </div>
    </header>
  )
}
