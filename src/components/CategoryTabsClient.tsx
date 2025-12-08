'use client'

import { useRouter } from 'next/navigation'
import CategoryTabs from './CategoryTabs'
import type { Category } from '@/types/recipe'
import { getSlugFromCategory } from '@/config/navigation'

interface CategoryTabsClientProps {
  categories: Category[]
  activeCategory: Category
}

export default function CategoryTabsClient({
  categories,
  activeCategory,
}: CategoryTabsClientProps) {
  const router = useRouter()

  const handleCategoryChange = (newCategory: Category) => {
    const slug = getSlugFromCategory(newCategory)
    if (slug) {
      router.push(`/${slug}`)
    }
  }

  return (
    <CategoryTabs
      categories={categories}
      activeCategory={activeCategory}
      onCategoryChange={handleCategoryChange}
    />
  )
}
