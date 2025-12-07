'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import Header from '@/components/Header'
import CategoryTabs from '@/components/CategoryTabs'
import RecipeGrid from '@/components/RecipeGrid'
import RecipeModal from '@/components/RecipeModal'
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
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null)
  const searchParams = useSearchParams()

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

  // Handle recipe selection from URL or search params
  useEffect(() => {
    const recipeSlug = searchParams.get('recipe')
    if (recipeSlug && recipes.length > 0) {
      const recipe = recipes.find((r: Recipe) => r.slug === recipeSlug)
      setSelectedRecipe(recipe || null)
    } else {
      setSelectedRecipe(null)
    }
  }, [searchParams, recipes])

  // Handle browser back/forward
  useEffect(() => {
    const handlePopState = () => {
      const recipeSlug = new URLSearchParams(window.location.search).get('recipe')
      if (recipeSlug && recipes.length > 0) {
        const recipe = recipes.find((r: Recipe) => r.slug === recipeSlug)
        setSelectedRecipe(recipe || null)
      } else {
        setSelectedRecipe(null)
      }
    }
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [recipes])

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

  const handleCloseModal = () => {
    setSelectedRecipe(null)
    router.replace(`/${categorySlug}`, { scroll: false })
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
        onRecipeClick={(recipe) => {
          setSelectedRecipe(recipe)
          router.push(`/${categorySlug}?recipe=${recipe.slug}`, { scroll: false })
        }}
      />
      {selectedRecipe && (
        <RecipeModal
          recipe={selectedRecipe}
          onClose={handleCloseModal}
        />
      )}
    </main>
  )
}
