import type { Category } from '@/types/recipe'
import { navigationTabs } from '@/config/navigation'

interface CategoryTabsProps {
  categories: Category[]
  activeCategory: Category | null
  onCategoryChange: (category: Category) => void
}

export default function CategoryTabs({
  categories,
  activeCategory,
  onCategoryChange,
}: CategoryTabsProps) {
  // Get tabs for available categories, in the order defined in navigation config
  const availableTabs = navigationTabs.filter(tab => 
    categories.includes(tab.id)
  )

  return (
    <nav className="sticky top-0 z-10 flex items-center justify-between px-8 py-4 bg-gray-800 border-b border-gray-800 border-t-2 border-t-gray-900">
      <div className="flex gap-2 overflow-x-auto">
        {availableTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onCategoryChange(tab.id)}
            className={`
              flex items-center gap-2 px-4 py-2 rounded-lg transition-colors whitespace-nowrap
              ${
                activeCategory === tab.id
                  ? 'bg-gray-700 text-white'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }
            `}
          >
            <span className="text-lg">{tab.icon || '☰'}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>
      <span className="text-gray-400 italic text-2xl font-medium whitespace-nowrap ml-4 hidden sm:block">
        Meimberg&apos;s Menu
      </span>
    </nav>
  )
}

