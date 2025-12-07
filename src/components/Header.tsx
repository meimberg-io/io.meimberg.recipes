import Image from 'next/image'

export default function Header() {
  // You can replace this with your actual kitchen image URL
  const headerImageUrl = process.env.NEXT_PUBLIC_HEADER_IMAGE || 
    'https://images.unsplash.com/photo-1556910096-6f5e72db6803?w=1920&q=80'

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
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      </div>
      
      {/* Content */}
      <div className="relative z-10 h-full flex items-center justify-center px-8">
        <div className="flex items-center gap-4">
          {/* Red book icon */}
          <div className="w-12 h-12 bg-red-600 rounded flex items-center justify-center flex-shrink-0">
            <span className="text-white text-2xl font-bold">M</span>
          </div>
          
          {/* Title */}
          <h1 className="text-5xl font-bold text-white">Bei Meimbergs</h1>
        </div>
      </div>
    </header>
  )
}
