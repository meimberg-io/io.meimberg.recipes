import type { Recipe } from '@/types/recipe'
import RecipeCard from './RecipeCard'
import type { Category } from '@/types/recipe'

interface RecipeGridProps {
  recipes: Recipe[]
  category: Category
  showSubCategories?: boolean
  onRecipeClick?: (recipe: Recipe) => void
}

export default function RecipeGrid({ recipes, category, showSubCategories = false, onRecipeClick }: RecipeGridProps) {
  if (recipes.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-400">Keine Rezepte gefunden</p>
      </div>
    )
  }

  // Group by subcategory if needed - dynamically based on actual recipes
  if (showSubCategories) {
    const grouped: Record<string, Recipe[]> = {}

    // Group by subCategory if available, otherwise use notionCategory
    recipes.forEach((recipe) => {
      const groupKey = recipe.subCategory || recipe.notionCategory || 'Other'
      if (!grouped[groupKey]) {
        grouped[groupKey] = []
      }
      grouped[groupKey].push(recipe)
    })

    // Get all group keys and sort them
    const groupKeys = Object.keys(grouped).sort()
    
    // Sort recipes within each group by title
    groupKeys.forEach((key) => {
      grouped[key].sort((a, b) => a.title.localeCompare(b.title))
    })

    return (
      <div className="px-8 py-6 space-y-8">
        {/* Render all groups dynamically with headers */}
        {groupKeys.map((groupKey) => {
          if (grouped[groupKey].length === 0) return null
          return (
            <div key={groupKey}>
              <h2 className="text-xl font-semibold text-gray-300 mb-4 flex items-center gap-2">

                {groupKey}
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
                {grouped[groupKey].map((recipe) => (
                  <RecipeCard 
                    key={recipe.id} 
                    recipe={recipe} 
                    onClick={() => onRecipeClick?.(recipe)}
                  />
                ))}
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  // Regular grid (7 columns like in screenshot) - sort by title
  const sortedRecipes = [...recipes].sort((a, b) => a.title.localeCompare(b.title))
  
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 px-8 py-6">
      {sortedRecipes.map((recipe) => (
        <RecipeCard 
          key={recipe.id} 
          recipe={recipe} 
          onClick={() => onRecipeClick?.(recipe)}
        />
      ))}
    </div>
  )
}
