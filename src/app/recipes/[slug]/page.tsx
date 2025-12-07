'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import Header from '@/components/Header'
import CategoryTabs from '@/components/CategoryTabs'
import NotionContent from '@/components/NotionContent'
import type { Category, Recipe } from '@/types/recipe'
import { getSlugFromCategory } from '@/config/navigation'

export default function RecipePage() {
  const params = useParams()
  const slug = params.slug as string
  
  const [recipe, setRecipe] = useState<Recipe | null>(null)
  const [allRecipes, setAllRecipes] = useState<Recipe[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch('/api/recipes').then((res) => res.json()),
    ]).then(([recipes]) => {
      setAllRecipes(recipes)
      const found = recipes.find((r: Recipe) => r.slug === slug)
      setRecipe(found || null)
      setLoading(false)
    })
  }, [slug])

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <p className="text-gray-400">Lade Rezept...</p>
      </main>
    )
  }

  if (!recipe) {
    return (
      <main className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-400 mb-4">Rezept nicht gefunden</p>
          <Link href="/" className="text-blue-400 hover:underline">
            Zurück zur Übersicht
          </Link>
        </div>
      </main>
    )
  }

  const categories: Category[] = [
    'Frühstück',
    'Vorspeisen',
    'Hauptspeisen',
    'Suppen',
    'Nachspeisen',
  ].filter((cat) => allRecipes.some((r) => r.category === cat)) as Category[]

  return (
    <main className="min-h-screen bg-gray-900 text-white">
      <div className="flex">
        {/* Left Sidebar */}
        <aside className="w-80 flex-shrink-0 border-r border-gray-800 h-screen overflow-y-auto">
          <div className="sticky top-0">
            <Header />
            <CategoryTabs
              categories={categories}
              activeCategory={recipe.category}
              onCategoryChange={(cat) => {
                const slug = getSlugFromCategory(cat)
                if (slug) {
                  window.location.href = `/${slug}`
                }
              }}
            />
            
            {/* Recipe List */}
            <div className="px-4 py-4 space-y-2">
              {allRecipes
                .filter((r) => r.category === recipe.category)
                .map((r) => (
                  <Link
                    key={r.id}
                    href={`/recipes/${r.slug}`}
                    className={`
                      block p-3 rounded-lg transition-colors
                      ${
                        r.id === recipe.id
                          ? 'bg-gray-700'
                          : 'bg-gray-800 hover:bg-gray-700'
                      }
                    `}
                  >
                    {r.coverImage && (
                      <div className="relative w-full aspect-[5/4] mb-2 rounded overflow-hidden">
                        <Image
                          src={r.coverImage}
                          alt={r.title}
                          fill
                          className="object-cover"
                          style={{
                            objectPosition: r.coverImageFocalPoint
                              ? `${r.coverImageFocalPoint.x * 100}% ${r.coverImageFocalPoint.y * 100}%`
                              : 'center',
                          }}
                          sizes="300px"
                        />
                      </div>
                    )}
                    <h4 className="font-medium text-sm mb-1">{r.title}</h4>
                    <p className="text-xs text-gray-400 line-clamp-2">
                      {r.description}
                    </p>
                    {r.vegetarian && (
                      <span className="inline-block mt-2 px-2 py-0.5 bg-green-600/20 text-green-400 text-xs rounded-full">
                        {r.vegetarian}
                      </span>
                    )}
                  </Link>
                ))}
            </div>
            
            <footer className="px-4 py-4 text-xs text-gray-500 border-t border-gray-800">
              Erstellt von meimberg.io
            </footer>
          </div>
        </aside>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-4xl mx-auto px-8 py-8">
            {/* Recipe Image */}
            {recipe.coverImage && (
              <div className="relative w-full aspect-video mb-8 rounded-lg overflow-hidden">
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

            {/* Title */}
            <h1 className="text-4xl font-bold mb-6">{recipe.title}</h1>

            {/* Metadata */}
            <div className="space-y-3 mb-8">
              <div className="flex items-center gap-2">
                <span className="text-gray-400 text-sm">Kategorie:</span>
                <span className="px-3 py-1 bg-green-600/20 text-green-400 rounded-full text-sm">
                  {recipe.category}
                </span>
              </div>
              
              {recipe.description && (
                <div className="flex items-start gap-2">
                  <span className="text-gray-400 text-sm">Kurzbeschreibung:</span>
                  <span className="text-gray-300 text-sm">{recipe.description}</span>
                </div>
              )}

              {recipe.vegetarian && (
                <div className="flex items-center gap-2">
                  <span className="text-gray-400 text-sm">Vegetarisch:</span>
                  <span className="px-3 py-1 bg-green-600/20 text-green-400 rounded-full text-sm">
                    {recipe.vegetarian}
                  </span>
                </div>
              )}

              <div className="flex items-center gap-2">
                <span className="text-gray-400 text-sm">Speisekarte:</span>
                <span className="text-gray-300 text-sm">✔</span>
              </div>

              {recipe.url && (
                <div className="flex items-start gap-2">
                  <span className="text-gray-400 text-sm">URL:</span>
                  <a
                    href={recipe.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:underline text-sm break-all"
                  >
                    {recipe.url}
                  </a>
                </div>
              )}

              <div className="flex items-center gap-2">
                <span className="text-gray-400 text-sm">Tags:</span>
                <span className="text-gray-300 text-sm">
                  {recipe.tags && recipe.tags.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {recipe.tags.map((tag) => (
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
            {recipe.content && Array.isArray(recipe.content) && recipe.content.length > 0 && (
              <div className="mb-8">
                <NotionContent blocks={recipe.content} />
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}
