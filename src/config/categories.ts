import type { Category, SubCategory } from '@/types/recipe'

/**
 * Central configuration for category mappings
 * Maps frontend navigation tabs to Notion database categories
 */
export const categoryConfig = {
  'Frühstück': {
    notionCategories: ['Frühstück'],
    subCategories: undefined,
  },
  'Vorspeisen': {
    notionCategories: ['Vorspeisen'],
    subCategories: undefined,
  },
  'Hauptspeisen': {
    notionCategories: ['Hauptspeisen', 'Hauptgerichte', 'Pasta', 'Special'],
    subCategories: ['Hauptgerichte', 'Pasta', 'Special'] as SubCategory[],
    // Recipes without a subcategory but in Hauptspeisen go to "Special" group
  },
  'Suppen': {
    notionCategories: ['Suppen'],
    subCategories: undefined,
  },
  'Nachspeisen': {
    notionCategories: ['Nachspeisen'],
    subCategories: undefined,
  },
  'Dessert': {
    notionCategories: ['Dessert', 'Desserts'],
    subCategories: undefined,
  },
} as const

/**
 * Get frontend category for a Notion category
 */
export function getFrontendCategory(notionCategory: string): {
  category: Category
  subCategory?: SubCategory
} {
  for (const [frontendCat, config] of Object.entries(categoryConfig)) {
    if ((config.notionCategories as readonly string[]).includes(notionCategory)) {
      // Check if this Notion category is a subcategory
      if (config.subCategories?.includes(notionCategory as SubCategory)) {
        return {
          category: frontendCat as Category,
          subCategory: notionCategory as SubCategory,
        }
      }
      return {
        category: frontendCat as Category,
      }
    }
  }
  
  // Default to Hauptspeisen if not found
  return { category: 'Hauptspeisen' }
}

/**
 * Get all frontend categories
 */
export function getFrontendCategories(): Category[] {
  return Object.keys(categoryConfig) as Category[]
}

/**
 * Check if a category has subcategories
 */
export function hasSubCategories(category: Category): boolean {
  return categoryConfig[category]?.subCategories !== undefined
}

/**
 * Get subcategories for a category
 */
export function getSubCategories(category: Category): SubCategory[] | undefined {
  return categoryConfig[category]?.subCategories
}

