import Image from 'next/image'

export default function Header() {
  // Static header image from public directory
  const headerImageUrl = '/header_01.jpg'

  return (
    <header className="relative w-full h-64 overflow-hidden">
      {/* Blurred background image */}
      <div className="absolute inset-0">
        <Image
          src={headerImageUrl}
          alt="Kitchen"
          fill
          className="object-cover"
          priority
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-black/20 " />
      </div>
      
    
    </header>
  )
}
