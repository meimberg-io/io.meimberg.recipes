import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import ReactCountryFlag from 'react-country-flag'
import NotionContent from '@/components/NotionContent'
import Header from '@/components/Header'
import CategoryTabsClient from '@/components/CategoryTabsClient'
import ExternalLinkIcon from '@/components/ExternalLinkIcon'
import type { Recipe, Category } from '@/types/recipe'
import { getRecipes, getRecipeBySlug } from '@/lib/notion-recipe'
import { getSlugFromCategory } from '@/config/navigation'
import { getFrontendCategories } from '@/config/categories'

// Map flag emojis to country codes
const flagToCountryCode: Record<string, string> = {
  '🇷🇺': 'RU', '🇺🇸': 'US', '🇮🇳': 'IN', '🇫🇷': 'FR', '🇲🇽': 'MX',
  '🇩🇪': 'DE', '🇨🇳': 'CN', '🇬🇷': 'GR', '🇮🇹': 'IT', '🇹🇭': 'TH',
  '🇭🇺': 'HU', '🇬🇧': 'GB', '🇪🇸': 'ES', '🇵🇹': 'PT', '🇯🇵': 'JP',
  '🇰🇷': 'KR', '🇻🇳': 'VN', '🇹🇷': 'TR', '🇵🇱': 'PL', '🇨🇿': 'CZ',
  '🇦🇹': 'AT', '🇨🇭': 'CH', '🇧🇪': 'BE', '🇳🇱': 'NL', '🇩🇰': 'DK',
  '🇸🇪': 'SE', '🇳🇴': 'NO', '🇫🇮': 'FI', '🇷🇴': 'RO',
}

interface RecipePageProps {
  params: Promise<{ slug: string }>
}

// Generate static params for all recipes at build time
export async function generateStaticParams() {
  const recipes = await getRecipes()
  return recipes.map((recipe: Recipe) => ({
    slug: recipe.slug,
  }))
}

// ISR: Pages are pre-rendered at build time, but can be regenerated on-demand via revalidatePath
// Revalidate every 1 year (31536000 seconds) - pages stay static unless explicitly revalidated
export const revalidate = 31536000
// Allow dynamic params - pages can be generated on-demand if missing after revalidation

export async function generateMetadata({ params }: RecipePageProps): Promise<Metadata> {
  const { slug } = await params
  const recipe = await getRecipeBySlug(slug)
  
  if (!recipe) {
    return {
      title: 'Rezept nicht gefunden - Bei Meimbergs',
    }
  }

  return {
    title: `${recipe.title} - Bei Meimbergs`,
    description: recipe.description || `Rezept: ${recipe.title}`,
    openGraph: {
      title: recipe.title,
      description: recipe.description || `Rezept: ${recipe.title}`,
      images: recipe.coverImage ? [recipe.coverImage] : [],
    },
  }
}

export default async function RecipePage({ params }: RecipePageProps) {
  const { slug } = await params
  const recipe = await getRecipeBySlug(slug)

  if (!recipe) {
    notFound()
  }

  // Get all recipes to determine which categories have content
  const allRecipes = await getRecipes()
  const allCategories = getFrontendCategories()
  const categories: Category[] = allCategories.filter((cat) => 
    allRecipes.some((r: Recipe) => r.category === cat)
  ) as Category[]

  // Get the category slug for the back link
  const categorySlug = getSlugFromCategory(recipe.category)

  return (
    <main className="min-h-screen bg-gray-900 text-white">
      <Header />
      <CategoryTabsClient
        categories={categories}
        activeCategory={recipe.category}
      />
      
      <div className="relative max-w-4xl mx-auto px-8 py-8">
        {/* Back icon - positioned outside content column on larger screens */}
        <Link 
          href={categorySlug ? `/${categorySlug}` : '/'}
          className="absolute left-0 top-8 -translate-x-full pr-4 hidden lg:flex items-center justify-center w-12 h-12 text-gray-400 hover:text-white transition-colors"
          title={`Zurück zu ${recipe.category}`}
        >
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
            className="w-8 h-8"
          >
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 8 8 12 12 16" />
            <line x1="16" y1="12" x2="8" y2="12" />
          </svg>
        </Link>

        {/* Back link - visible on smaller screens */}
        <Link 
          href={categorySlug ? `/${categorySlug}` : '/'}
          className="inline-flex lg:hidden items-center gap-2 text-gray-400 hover:text-white transition-colors mb-6"
        >
          <span>←</span>
          <span>Zurück zu {recipe.category}</span>
        </Link>

        {/* Recipe Image with Flag overlay */}
        <div className="relative mb-8">
          {recipe.coverImage && (
            <div className="relative w-full aspect-video rounded-lg overflow-hidden">
              <Image
                src={recipe.coverImage}
                alt={recipe.title}
                fill
                className="object-cover"
                style={{
                  objectPosition: recipe.coverImageFocalPoint
                    ? `${recipe.coverImageFocalPoint.x * 100}% ${recipe.coverImageFocalPoint.y * 100}%`
                    : 'center',
                }}
                sizes="(max-width: 768px) 100vw, 800px"
              />
            </div>
          )}

          {/* Flag icon overlapping the bottom of the cover image */}
          {recipe.pageIcon && (() => {
            const icon = recipe.pageIcon.trim()
            const countryCode = flagToCountryCode[icon] || (/^[A-Z]{2,3}$/i.test(icon) ? icon.toUpperCase() : null)
            
            if (countryCode) {
              return (
                <div className="absolute bottom-0 right-8 translate-y-1/2 z-10">
                  <div className="rounded-md overflow-hidden border border-white/10 shadow-lg" style={{ width: '4em', height: '3em', lineHeight: 0 }}>
                    <ReactCountryFlag 
                      countryCode={countryCode} 
                      svg={true}
                      style={{ width: '100%', height: '100%', display: 'block' }}
                    />
                  </div>
                </div>
              )
            }
            
            // Fallback: display as emoji/icon
            return (
              <div className="absolute bottom-0 left-0 translate-y-1/2 z-10">
                <span className="text-4xl">{icon}</span>
              </div>
            )
          })()}
        </div>

        {/* Title with URL icon */}
        <div className="flex items-start justify-between gap-4 mb-2 mt-16 ">
          <h1 className="text-4xl font-bold">{recipe.title}</h1>
          {recipe.url && (
            <ExternalLinkIcon url={recipe.url} className="mt-2" />
          )}
        </div>

        {/* Description - italic, no label */}
        {recipe.description && (
          <p className="text-lg text-gray-300 italic mb-6">{recipe.description}</p>
        )}

        {/* Tags (merged with vegetarian and status) */}
        {((recipe.tags && recipe.tags.length > 0) || recipe.vegetarian || recipe.status) && (
          <div className="flex flex-wrap gap-2 mb-4">
            {recipe.vegetarian && (
              <span className="px-3 py-1 bg-green-600/20 text-green-400 rounded-full text-sm">
                {recipe.vegetarian}
              </span>
            )}
            {recipe.status && (
              <span className="px-3 py-1 bg-blue-600/20 text-blue-400 rounded-full text-sm">
                {recipe.status}
              </span>
            )}
            {recipe.tags?.map((tag) => (
              <span
                key={tag}
                className="px-3 py-1 bg-gray-700 text-gray-300 rounded-full text-sm"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Delimiter */}
        <hr className="border-gray-800 border-b mb-8 mt-12" />

        {/* Content */}
        {recipe.content && Array.isArray(recipe.content) && recipe.content.length > 0 && (
          <div className="mb-8">
            <NotionContent blocks={recipe.content} />
          </div>
        )}
      </div>
    </main>
  )
}
