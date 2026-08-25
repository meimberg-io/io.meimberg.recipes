import type { MetadataRoute } from 'next'
import { getRecipes } from '@/lib/notion-recipe'
import { navigationTabs } from '@/config/navigation'
import { baseUrl, isIndexableCategory, isIndexableRecipe } from '@/lib/seo'

// Regenerated daily. The previous sitemap was rebuilt on every request with
// lastmod = now, which makes Google discount the lastmod signal entirely.
export const revalidate = 86400

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // "/" permanently redirects to the default category, so it does not belong
  // in the sitemap — only the redirect target does.
  const categoryEntries: MetadataRoute.Sitemap = navigationTabs
    .filter((tab) => isIndexableCategory(tab.id))
    .map((tab) => ({
      url: `${baseUrl}/${tab.slug}`,
      changeFrequency: 'weekly' as const,
      priority: 0.9,
    }))

  let recipeEntries: MetadataRoute.Sitemap = []
  try {
    const recipes = await getRecipes()
    recipeEntries = recipes.filter(isIndexableRecipe).map((recipe) => ({
      url: `${baseUrl}/recipes/${recipe.slug}`,
      lastModified: recipe.lastEditedTime ? new Date(recipe.lastEditedTime) : undefined,
      changeFrequency: 'monthly' as const,
      priority: 0.8,
    }))
  } catch (error) {
    // Serving the category entries alone beats serving a 500 that Google
    // remembers as a broken sitemap.
    console.error('Error building recipe sitemap entries:', error)
  }

  return [...categoryEntries, ...recipeEntries]
}
