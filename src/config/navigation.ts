import type { Category } from '@/types/recipe'

/**
 * Central configuration for navigation tabs
 * Defines the order and display names for navigation tabs
 */
export interface NavigationTab {
  id: Category
  label: string
  slug: string
  icon?: string
}

export const navigationTabs: NavigationTab[] = [
  {
    id: 'Frühstück',
    label: 'Frühstück',
    slug: 'fruehstueck',
    icon: '☰',
  },
  {
    id: 'Vorspeisen',
    label: 'Vorspeisen',
    slug: 'vorspeisen',
    icon: '☰',
  },
  {
    id: 'Hauptspeisen',
    label: 'Hauptspeisen',
    slug: 'hauptspeisen',
    icon: '☰',
  },
  {
    id: 'Suppen',
    label: 'Suppen',
    slug: 'suppen',
    icon: '☰',
  },
  {
    id: 'Nachspeisen',
    label: 'Nachspeisen',
    slug: 'nachspeisen',
    icon: '☰',
  },
  {
    id: 'Dessert',
    label: 'Dessert',
    slug: 'dessert',
    icon: '☰',
  },
]

/**
 * Get navigation tab by category
 */
export function getTabByCategory(category: Category): NavigationTab | undefined {
  return navigationTabs.find(tab => tab.id === category)
}

/**
 * Get navigation tab by slug
 */
export function getTabBySlug(slug: string): NavigationTab | undefined {
  return navigationTabs.find(tab => tab.slug === slug)
}

/**
 * Get category from slug
 */
export function getCategoryFromSlug(slug: string): Category | undefined {
  return getTabBySlug(slug)?.id
}

/**
 * Get slug from category
 */
export function getSlugFromCategory(category: Category): string | undefined {
  return getTabByCategory(category)?.slug
}

