import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import Header from '@/components/Header'
import CategoryTabsClient from '@/components/CategoryTabsClient'
import RecipeGridClient from '@/components/RecipeGridClient'
import type { Recipe, Category } from '@/types/recipe'
import { hasSubCategories, getFrontendCategories } from '@/config/categories'
import { getCategoryFromSlug, navigationTabs } from '@/config/navigation'
import { getRecipes } from '@/lib/notion-recipe'

interface CategoryPageProps {
  params: Promise<{ category: string }>
}

// Generate static params for all categories at build time
export async function generateStaticParams() {
  return navigationTabs.map((tab) => ({
    category: tab.slug,
  }))
}

// ISR: Pages are pre-rendered at build time, but can be regenerated on-demand via revalidatePath
// Revalidate every 1 year (31536000 seconds) - pages stay static unless explicitly revalidated
export const revalidate = 31536000
export const dynamicParams = false

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const { category: categorySlug } = await params
  const category: Category | null = getCategoryFromSlug(categorySlug) ?? null
  
  return {
    title: category ? `${category} - Bei Meimbergs` : 'Bei Meimbergs - Rezepte',
    description: category ? `Unsere ${category} Rezepte` : 'Unsere Rezeptsammlung',
  }
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { category: categorySlug } = await params
  const category: Category | null = getCategoryFromSlug(categorySlug) ?? null
  
  if (!category) {
    notFound()
  }

  // Fetch recipes server-side on each request
  const allRecipes = await getRecipes()
  
  // Filter recipes for this category
  const filteredRecipes = allRecipes.filter((r: Recipe) => r.category === category)

  // Get all categories that have recipes (from config)
  const allCategories = getFrontendCategories()
  const categories: Category[] = allCategories.filter((cat) => 
    allRecipes.some((r: Recipe) => r.category === cat)
  ) as Category[]

  // Check if this category has subcategories configured
  const needsSubCategories = hasSubCategories(category) && 
    allRecipes.some((r: Recipe) => r.category === category && r.subCategory)

  return (
    <main className="min-h-screen bg-gray-900 text-white">
      <Header />
      <CategoryTabsClient
        categories={categories}
        activeCategory={category}
      />
      <RecipeGridClient
        recipes={filteredRecipes}
        category={category}
        showSubCategories={needsSubCategories}
      />
    </main>
  )
}
