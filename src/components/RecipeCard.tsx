import Image from 'next/image'
import Link from 'next/link'
import type { Recipe } from '@/types/recipe'
import ReactCountryFlag from 'react-country-flag'

// Map flag emojis to country codes
const flagToCountryCode: Record<string, string> = {
  '🇷🇺': 'RU',
  '🇺🇸': 'US',
  '🇮🇳': 'IN',
  '🇫🇷': 'FR',
  '🇲🇽': 'MX',
  '🇩🇪': 'DE',
  '🇨🇳': 'CN',
  '🇬🇷': 'GR',
  '🇮🇹': 'IT',
  '🇹🇭': 'TH',
  '🇭🇺': 'HU',
  '🇬🇧': 'GB',
  '🇪🇸': 'ES',
  '🇵🇹': 'PT',
  '🇯🇵': 'JP',
  '🇰🇷': 'KR',
  '🇻🇳': 'VN',
  '🇹🇷': 'TR',
  '🇵🇱': 'PL',
  '🇨🇿': 'CZ',
  '🇦🇹': 'AT',
  '🇨🇭': 'CH',
  '🇧🇪': 'BE',
  '🇳🇱': 'NL',
  '🇩🇰': 'DK',
  '🇸🇪': 'SE',
  '🇳🇴': 'NO',
  '🇫🇮': 'FI',
}

function getCountryCode(icon: string): string {
  // If it's already a country code (2-3 letters), return it
  if (/^[A-Z]{2,3}$/.test(icon.trim())) {
    return icon.trim().toUpperCase()
  }
  // If it's a flag emoji, convert it
  if (flagToCountryCode[icon]) {
    return flagToCountryCode[icon]
  }
  // If it's a URL, try to extract from filename or return a default
  if (icon.startsWith('http')) {
    return 'XX'
  }
  // Return the icon as-is if we can't determine
  return icon
}

interface RecipeCardProps {
  recipe: Recipe
  onClick?: () => void
}

const categoryColors: Record<string, string> = {
  'Frühstück': 'bg-yellow-600/20 border-yellow-600/30',
  'Vorspeisen': 'bg-blue-600/20 border-blue-600/30',
  'Hauptspeisen': 'bg-red-600/20 border-red-600/30',
  'Suppen': 'bg-orange-600/20 border-orange-600/30',
  'Nachspeisen': 'bg-pink-600/20 border-pink-600/30',
}

// Map Notion color names to Tailwind classes
const notionColorMap: Record<string, string> = {
  'default': 'bg-gray-600/20 border-gray-600/30',
  'gray': 'bg-gray-600/20 border-gray-600/30',
  'brown': 'bg-amber-600/20 border-amber-600/30',
  'orange': 'bg-orange-600/20 border-orange-600/30',
  'yellow': 'bg-yellow-600/20 border-yellow-600/30',
  'green': 'bg-green-600/20 border-green-600/30',
  'blue': 'bg-blue-600/20 border-blue-600/30',
  'purple': 'bg-purple-600/20 border-purple-600/30',
  'pink': 'bg-pink-600/20 border-pink-600/30',
  'red': 'bg-red-600/20 border-red-600/30',
}

export default function RecipeCard({ recipe, onClick }: RecipeCardProps) {
  const cardColor = recipe.categoryColor 
    ? (notionColorMap[recipe.categoryColor] || categoryColors[recipe.category] || 'bg-gray-800 border-gray-700')
    : (categoryColors[recipe.category] || 'bg-gray-800 border-gray-700')

  const handleClick = (e: React.MouseEvent) => {
    if (onClick) {
      e.preventDefault()
      onClick()
    }
  }

  return (
    <Link
      href={`/recipes/${recipe.slug}`}
      onClick={handleClick}
      className={`group block rounded-lg overflow-hidden hover:opacity-90 transition-opacity border ${cardColor}`}
    >
      {/* Image with flag overlay */}
      {recipe.coverImage ? (
        <div className="relative w-full aspect-[16/9] overflow-hidden">
          <Image
            src={recipe.coverImage}
            alt={recipe.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            style={{
              objectPosition: recipe.coverImageFocalPoint
                ? `${recipe.coverImageFocalPoint.x * 100}% ${recipe.coverImageFocalPoint.y * 100}%`
                : 'center',
            }}
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        </div>
      ) : (
        <div className="w-full aspect-[16/9] bg-gray-700 relative">
        </div>
      )}

      {/* Content */}
      <div className="p-3">
        <h3 className="text-base font-bold text-white mb-1 line-clamp-2 flex items-start gap-2">
          <span className="flex-1">{recipe.title}</span>
          {recipe.pageIcon && (() => {
            // Check if it's a flag emoji (in our mapping)
            const countryCode = flagToCountryCode[recipe.pageIcon]
            
            // If it's a flag emoji, use the flag icon library
            if (countryCode && countryCode.length === 2) {
              return (
                <span className="flex-shrink-0" style={{ fontSize: '1.2em', lineHeight: 1 }}>
                  <ReactCountryFlag 
                    countryCode={countryCode} 
                    svg 
                    style={{ width: '1.2em', height: '1.2em' }}
                  />
                </span>
              )
            }
            // Otherwise, display the emoji/icon directly (for non-flag emojis like 🥩, 🍝, etc.)
            return (
              <span className="text-lg flex-shrink-0" role="img">
                {recipe.pageIcon}
              </span>
            )
          })()}
        </h3>
        <p className="text-gray-300 text-xs mb-2 line-clamp-2 leading-relaxed">
          {recipe.description}
        </p>

      </div>
    </Link>
  )
}