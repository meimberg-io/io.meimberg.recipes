'use client'

import { useRouter } from 'next/navigation'
import RecipeGrid from './RecipeGrid'
import type { Recipe, Category } from '@/types/recipe'

interface RecipeGridClientProps {
  recipes: Recipe[]
  category: Category
  showSubCategories?: boolean
}

export default function RecipeGridClient({
  recipes,
  category,
  showSubCategories = false,
}: RecipeGridClientProps) {
  const router = useRouter()

  // Navigate to the static detail page instead of opening a modal
  const handleRecipeClick = (recipe: Recipe) => {
    router.push(`/recipes/${recipe.slug}`)
  }

  return (
    <RecipeGrid
      recipes={recipes}
      category={category}
      showSubCategories={showSubCategories}
      onRecipeClick={handleRecipeClick}
    />
  )
}
