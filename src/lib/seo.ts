import type { Category, Recipe } from '@/types/recipe'

export const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://recipes.meimberg.io'

/**
 * "Ideen" is the intake tray for captured recipe ideas — unreviewed, often
 * taken over close to verbatim from the source. Those pages stay reachable and
 * keep passing link equity, but they are held out of the index so Google judges
 * the site on the curated recipes.
 */
export const noindexCategories: readonly Category[] = ['Ideen']
const noindexStatus = 'Idea'

export function isIndexableCategory(category: Category): boolean {
  return !noindexCategories.includes(category)
}

export function isIndexableRecipe(recipe: Pick<Recipe, 'category' | 'status'>): boolean {
  return isIndexableCategory(recipe.category) && recipe.status !== noindexStatus
}

/** Metadata `robots` value for a page that should stay out of the index. */
export const noindexRobots = {
  index: false,
  follow: true,
  googleBot: { index: false, follow: true },
} as const
