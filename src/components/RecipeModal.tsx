'use client'

import { useEffect, useState, useRef } from 'react'
import Image from 'next/image'
import type { Recipe } from '@/types/recipe'
import ReactCountryFlag from 'react-country-flag'
import NotionContent from './NotionContent'

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
  '🇷🇴': 'RO',
}

// Reverse mapping: country codes to flag emojis
const countryCodeToFlag: Record<string, string> = Object.fromEntries(
  Object.entries(flagToCountryCode).map(([emoji, code]) => [code, emoji])
)

interface RecipeModalProps {
  recipe: Recipe | null
  onClose: () => void
}

export default function RecipeModal({ recipe, onClose }: RecipeModalProps) {
  const [fullRecipe, setFullRecipe] = useState<Recipe | null>(recipe)
  const [loading, setLoading] = useState(false)

  // Handle overflow when recipe changes
  useEffect(() => {
    if (recipe) {
      document.body.style.overflow = 'hidden'
      // Fetch full recipe details with content
      setLoading(true)
      fetch(`/api/recipes/${recipe.id}`)
        .then((res) => res.json())
        .then((data) => {
          setFullRecipe(data)
          setLoading(false)
        })
        .catch((err) => {
          console.error('Error fetching full recipe:', err)
          setFullRecipe(recipe) // Fallback to basic recipe
          setLoading(false)
        })
    } else {
      document.body.style.overflow = 'unset'
      setFullRecipe(null)
    }
  }, [recipe])

  // Handle overflow cleanup on unmount
  useEffect(() => {
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [])

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && recipe) {
        onClose()
      }
    }
    if (recipe) {
      window.addEventListener('keydown', handleEscape)
      return () => window.removeEventListener('keydown', handleEscape)
    }
  }, [recipe, onClose])

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && recipe) {
      onClose()
    }
  }

  if (!recipe) return null

  const displayRecipe = fullRecipe || recipe
  const content = displayRecipe.content

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 overflow-y-auto"
      onClick={handleBackdropClick}
    >
      <div className="bg-gray-900 rounded-lg max-w-6xl w-full max-h-[90vh] overflow-y-auto my-8 relative">
        {/* Close button */}
        <div className="absolute top-4 right-4 z-10">
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors bg-gray-800 rounded-full w-8 h-8 flex items-center justify-center"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Main Content */}
        <div className="overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12 px-8">
              <p className="text-gray-400">Lade Rezept...</p>
            </div>
          ) : (
            <>
              {/* Recipe Image - Full Width */}
              {displayRecipe.coverImage && (
                <div className="relative w-full aspect-[21/9] overflow-hidden">
                  <Image
                    src={displayRecipe.coverImage}
                    alt={displayRecipe.title}
                    fill
                    className="object-cover"
                    style={{
                      objectPosition: displayRecipe.coverImageFocalPoint
                        ? `${displayRecipe.coverImageFocalPoint.x * 100}% ${displayRecipe.coverImageFocalPoint.y * 100}%`
                        : 'center',
                    }}
                    sizes="(max-width: 768px) 100vw, 100vw"
                  />

                </div>
              )}

              <div className="max-w-4xl mx-auto px-8 py-8 relative">


                  {/* Flag overlapping the image - left aligned, above title position */}
                  {displayRecipe.pageIcon && (
                    <div className="absolute top-[-1.5em] left-0 px-8 pb-4 z-10">
                     
                        {(() => {
                          const icon = displayRecipe.pageIcon.trim()
                          
                          // Get country code from flag emoji or use icon directly if it's already a code
                          const countryCode = flagToCountryCode[icon] || (/^[A-Z]{2,3}$/i.test(icon) ? icon.toUpperCase() : null)
                          
                          if (countryCode) {
                            return (
                              <div className="rounded-md overflow-hidden border border-white/10" style={{ display: 'inline-block', width: '4em', height: '3em', lineHeight: 0 }}>
                                <ReactCountryFlag 
                                  countryCode={countryCode} 
                                  svg={true}
                                  style={{ width: '100%', height: '100%', display: 'block' }}
                                />
                              </div>
                            )
                          }
                          
                          // Fallback: display as emoji/icon
                          return icon
                        })()}
           
                    </div>
                  )}

                {/* Title */}
                <h1 className="text-4xl font-bold mb-6 mt-8"> 
                  {displayRecipe.title}
                </h1>

                {/* Metadata */}
                <div className="space-y-3 mb-8">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400 text-sm">Kategorie:</span>
                    <span className="px-3 py-1 bg-green-600/20 text-green-400 rounded-full text-sm">
                      {displayRecipe.category}
                    </span>
                  </div>
                  
                  {displayRecipe.description && (
                    <div className="flex items-start gap-2">
                      <span className="text-gray-400 text-sm">Kurzbeschreibung:</span>
                      <span className="text-gray-300 text-sm">{displayRecipe.description}</span>
                    </div>
                  )}

                  {displayRecipe.vegetarian && (
                    <div className="flex items-center gap-2">
                      <span className="text-gray-400 text-sm">Vegetarisch:</span>
                      <span className="px-3 py-1 bg-green-600/20 text-green-400 rounded-full text-sm">
                        {displayRecipe.vegetarian}
                      </span>
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    <span className="text-gray-400 text-sm">Speisekarte:</span>
                    <span className="text-gray-300 text-sm">✔</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-gray-400 text-sm">Status:</span>
                    <span className="text-gray-300 text-sm">Final</span>
                  </div>

                  {displayRecipe.url && (
                    <div className="flex items-start gap-2">
                      <span className="text-gray-400 text-sm">URL:</span>
                      <a
                        href={displayRecipe.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:underline text-sm break-all"
                      >
                        {displayRecipe.url}
                      </a>
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    <span className="text-gray-400 text-sm">Tags:</span>
                    <span className="text-gray-300 text-sm">
                      {displayRecipe.tags && displayRecipe.tags.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {displayRecipe.tags.map((tag) => (
                            <span
                              key={tag}
                              className="px-2 py-1 bg-gray-700 text-gray-300 rounded text-xs"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      ) : (
                        'Leer'
                      )}
                    </span>
                  </div>
                </div>

                {/* Content */}
                {content && Array.isArray(content) && (
                  <div className="mb-8">
                    <NotionContent blocks={content} />
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
