'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import CategoryTabs from './CategoryTabs'
import type { Category } from '@/types/recipe'
import { getSlugFromCategory, navigationTabs } from '@/config/navigation'

interface CategoryTabsClientProps {
  categories: Category[]
  activeCategory: Category
}

export default function CategoryTabsClient({
  categories,
  activeCategory,
}: CategoryTabsClientProps) {
  const router = useRouter()
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const handleCategoryChange = (newCategory: Category) => {
    const slug = getSlugFromCategory(newCategory)
    if (slug) {
      router.push(`/${slug}`)
      setIsMenuOpen(false) // Close menu after navigation
    }
  }

  // Close menu on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsMenuOpen(false)
      }
    }
    if (isMenuOpen) {
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
  }, [isMenuOpen])

  // Get available tabs
  const availableTabs = navigationTabs.filter(tab => 
    categories.includes(tab.id)
  )
  
  // Get current tab info
  const currentTab = navigationTabs.find(tab => tab.id === activeCategory)

  return (
    <>
      {/* Desktop navigation - visible on xl and above (1280px) */}
      <div className="hidden xl:block">
        <CategoryTabs
          categories={categories}
          activeCategory={activeCategory}
          onCategoryChange={handleCategoryChange}
        />
      </div>

      {/* Mobile/Tablet navigation - visible below xl (1280px) */}
      <nav className="sticky top-0 z-10 xl:hidden flex items-center justify-between px-4 py-4 bg-gray-800 border-b border-gray-800 border-t-2 border-t-gray-900">
        {/* Current category button */}
        <button
          onClick={() => setIsMenuOpen(true)}
          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-700 text-white flex-shrink-0"
          aria-label="Kategorien öffnen"
        >
          <span className="text-lg">{currentTab?.icon || '☰'}</span>
          <span>{currentTab?.label || activeCategory}</span>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-4 h-4"
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>

        <span className="text-gray-400 italic text-lg sm:text-xl font-medium whitespace-nowrap ml-2 truncate">
          Meimberg&apos;s Menu
        </span>
      </nav>

      {/* Off-canvas menu overlay */}
      {isMenuOpen && (
        <div
          className="fixed inset-0 z-50 xl:hidden"
          onClick={() => setIsMenuOpen(false)}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/50" />
          
          {/* Menu panel */}
          <div
            className="absolute left-0 top-0 h-full w-80 max-w-[85vw] bg-gray-900 border-r border-gray-800 shadow-xl overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-gray-800 flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">Kategorien</h2>
              <button
                onClick={() => setIsMenuOpen(false)}
                className="text-gray-400 hover:text-white transition-colors"
                aria-label="Menü schließen"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="w-6 h-6"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <div className="p-4 space-y-2">
              {availableTabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => handleCategoryChange(tab.id)}
                  className={`
                    w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-left
                    ${
                      activeCategory === tab.id
                        ? 'bg-gray-700 text-white'
                        : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                    }
                  `}
                >
                  <span className="text-2xl">{tab.icon || '☰'}</span>
                  <span className="font-medium">{tab.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
