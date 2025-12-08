export type Category = 
  | 'Frühstück'
  | 'Vorspeisen'
  | 'Hauptspeisen'
  | 'Suppen'
  | 'Nachspeisen'
  | 'Dessert'

export type SubCategory = 
  | 'Hauptgerichte'
  | 'Pasta'
  | 'Special'

export interface Recipe {
  id: string
  title: string
  description: string
  category: Category
  subCategory?: SubCategory
  notionCategory?: string // Original category name from Notion
  vegetarian?: string // Dynamic value from Notion
  coverImage?: string
  coverImageFocalPoint?: { x: number; y: number } // Focal point from Notion (0-1 range)
  pageIcon?: string // Emoji or icon URL
  categoryColor?: string
  url?: string
  tags?: string[]
  content?: any[] // All richtext blocks from Notion page (preserves formatting)
  slug: string
}

