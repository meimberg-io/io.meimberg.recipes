'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Header from '@/components/Header'
import CategoryTabs from '@/components/CategoryTabs'
import RecipeGrid from '@/components/RecipeGrid'
import type { Recipe, Category } from '@/types/recipe'
import { hasSubCategories, getFrontendCategories } from '@/config/categories'
import { getCategoryFromSlug, getSlugFromCategory } from '@/config/navigation'

export default function CategoryPage() {
  const params = useParams()
  const router = useRouter()
  const categorySlug = params.category as string
  const category: Category = getCategoryFromSlug(categorySlug) || 'Hauptspeisen'
  
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [filteredRecipes, setFilteredRecipes] = useState<Recipe[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/recipes')
      .then((res) => res.json())
      .then((data) => {
        setRecipes(data)
        setFilteredRecipes(data.filter((r: Recipe) => r.category === category))
        setLoading(false)
      })
      .catch((err) => {
        console.error('Error fetching recipes:', err)
        setLoading(false)
      })
  }, [])

  useEffect(() => {
    setFilteredRecipes(recipes.filter((r) => r.category === category))
  }, [category, recipes])

  const handleCategoryChange = (newCategory: Category) => {
    const slug = getSlugFromCategory(newCategory)
    if (slug) {
      router.push(`/${slug}`)
    }
  }

  // Get all categories that have recipes (from config)
  const allCategories = getFrontendCategories()
  const categories: Category[] = allCategories.filter((cat) => 
    recipes.some((r) => r.category === cat)
  ) as Category[]

  // Check if this category has subcategories configured
  const needsSubCategories = hasSubCategories(category) && 
    recipes.some((r) => r.category === category && r.subCategory)

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <p className="text-gray-400">Lade Rezepte...</p>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gray-900 text-white">
      <Header />
      <CategoryTabs
        categories={categories}
        activeCategory={category as Category}
        onCategoryChange={handleCategoryChange}
      />
      <RecipeGrid 
        recipes={filteredRecipes}
        category={category}
        showSubCategories={needsSubCategories}
      />
    </main>
  )
}

