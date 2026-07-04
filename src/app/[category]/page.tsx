import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import Header from '@/components/Header'
import CategoryTabsClient from '@/components/CategoryTabsClient'
import RecipeGridClient from '@/components/RecipeGridClient'
import type { Recipe, Category } from '@/types/recipe'
import { hasSubCategories } from '@/config/categories'
import { getCategoryFromSlug, navigationTabs } from '@/config/navigation'
import { getRecipesByCategory, getPopulatedCategories } from '@/lib/notion-recipe'

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
// Allow dynamic params - pages can be generated on-demand if missing after revalidation

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const { category: categorySlug } = await params
  const category: Category | null = getCategoryFromSlug(categorySlug) ?? null
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://recipes.meimberg.io'
  
  if (!category) {
    return {
      title: 'Bei Meimbergs - Rezepte',
      description: 'Unsere Rezeptsammlung',
    }
  }

  // Get recipe count for better description (filtered at the Notion query)
  const recipeCount = (await getRecipesByCategory(category)).length
  const description = recipeCount > 0 
    ? `Entdecke ${recipeCount} ${recipeCount === 1 ? 'Rezept' : 'Rezepte'} in der Kategorie ${category}`
    : `Unsere ${category} Rezepte`

  return {
    title: `${category} - Bei Meimbergs`,
    description,
    alternates: {
      canonical: `${baseUrl}/${categorySlug}`,
    },
    openGraph: {
      type: 'website',
      title: `${category} - Bei Meimbergs`,
      description,
      url: `${baseUrl}/${categorySlug}`,
      siteName: 'Bei Meimbergs',
      locale: 'de_DE',
    },
    twitter: {
      card: 'summary',
      title: `${category} - Bei Meimbergs`,
      description,
    },
  }
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { category: categorySlug } = await params
  const category: Category | null = getCategoryFromSlug(categorySlug) ?? null
  
  if (!category) {
    notFound()
  }

  // Fetch only this category's recipes (filtered at the Notion query) plus the
  // set of populated categories for the tab bar — never the whole database.
  const [filteredRecipes, categories] = await Promise.all([
    getRecipesByCategory(category),
    getPopulatedCategories(),
  ])

  // Check if this category has subcategories configured
  const needsSubCategories = hasSubCategories(category) &&
    filteredRecipes.some((r: Recipe) => r.subCategory)

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://recipes.meimberg.io'

  // Breadcrumb schema
  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: baseUrl,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: category,
        item: `${baseUrl}/${categorySlug}`,
      },
    ],
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
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
    </>
  )
}
