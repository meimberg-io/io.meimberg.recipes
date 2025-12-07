import { notion } from './notion'
import type { Recipe, Category, VegetarianOption } from '@/types/recipe'
import { getFrontendCategory } from '@/config/categories'

const DATABASE_ID = process.env.NOTION_DATABASE_ID

if (!DATABASE_ID) {
  throw new Error('NOTION_DATABASE_ID is not set')
}

// Category mapping is now handled by getFrontendCategory from config/categories.ts

function getVegetarianOption(value: string): VegetarianOption | undefined {
  const options: VegetarianOption[] = [
    'vegetarisch',
    'teilweise vegetarisch',
    'Vegetarische Option Verfügbar',
  ]
  return options.find(o => o === value) as VegetarianOption | undefined
}

function getSlug(title: string, id: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '') || id
}

function getCoverImage(cover: any): { url?: string; focalPoint?: { x: number; y: number } } {
  if (!cover) return {}
  
  let url: string | undefined
  let focalPoint: { x: number; y: number } | undefined
  
  if (cover.type === 'external') {
    url = cover.external?.url
  } else if (cover.type === 'file') {
    url = cover.file?.url
  }
  
  // Check for focal point (if available in Notion API)
  // Notion may store this in different places depending on API version
  if (cover.file?.focal_point) {
    focalPoint = cover.file.focal_point
  } else if (cover.external?.focal_point) {
    focalPoint = cover.external.focal_point
  } else if (cover.focal_point) {
    focalPoint = cover.focal_point
  }
  
  return { url, focalPoint }
}

function getRichText(property: any): string {
  if (!property?.rich_text) return ''
  return property.rich_text
    .map((text: any) => text.plain_text)
    .join('')
}

function getTitle(property: any): string {
  // Notion title property
  if (property?.title) {
    return property.title
      .map((text: any) => text.plain_text)
      .join('')
  }
  // Fallback to rich_text
  if (property?.rich_text) {
    return getRichText(property)
  }
  return ''
}

function getSelectValue(property: any): string | undefined {
  return property?.select?.name
}

function getSelectColor(property: any): string | undefined {
  return property?.select?.color
}

function getMultiSelect(property: any): string[] {
  if (!property?.multi_select) return []
  return property.multi_select.map((item: any) => item.name)
}

function getUrl(property: any): string | undefined {
  return property?.url
}

function getCheckbox(property: any): boolean {
  return property?.checkbox || false
}

function getPageIcon(page: any): string | undefined {
  if (!page.icon) return undefined
  
  if (page.icon.type === 'emoji') {
    return page.icon.emoji
  }
  if (page.icon.type === 'external') {
    return page.icon.external?.url
  }
  if (page.icon.type === 'file') {
    return page.icon.file?.url
  }
  return undefined
}


export async function getRecipes(): Promise<Recipe[]> {
  try {
    const response = await notion.databases.query({
      database_id: DATABASE_ID,
      filter: {
        property: 'Speisekarte',
        checkbox: {
          equals: true,
        },
      },
    })

    const recipes: Recipe[] = []
    
    // Sort by Notion category first (for consistent grouping)
    const sortedResults = [...response.results].sort((a, b) => {
      if ('properties' in a && 'properties' in b) {
        const aCat = getSelectValue(a.properties['Kategorie']) || ''
        const bCat = getSelectValue(b.properties['Kategorie']) || ''
        return aCat.localeCompare(bCat)
      }
      return 0
    })

    for (const page of sortedResults) {
      if ('properties' in page) {
        const props = page.properties
        const title = getTitle(props['Name'])
        const description = getRichText(props['Kurzbeschreibung'])
        const notionCategory = getSelectValue(props['Kategorie']) || ''
        const { category, subCategory } = getFrontendCategory(notionCategory)
        const vegetarian = getVegetarianOption(
          getSelectValue(props['Vegetarisch']) || ''
        )
        const url = getUrl(props['URL'])
        const tags = getMultiSelect(props['Tags'])
        const speisekarte = getCheckbox(props['Speisekarte'])

        if (!speisekarte || !title) continue

        const { url: coverImage, focalPoint: coverImageFocalPoint } = getCoverImage(page.cover)
        const pageIcon = getPageIcon(page)
        const slug = getSlug(title, page.id)
        
        // Get category color from database property if available
        const categoryColor = getSelectColor(props['Kategorie'])
        
        // Debug logging - log all properties for first Hauptspeisen recipe
        if (category === 'Hauptspeisen' && recipes.length === 0) {
          console.log('First Hauptspeisen recipe properties:', {
            title,
            allProps: Object.keys(props),
            props: Object.entries(props).map(([key, val]) => ({
              key,
              type: val?.type,
              select: val?.select,
              multi_select: val?.multi_select,
            }))
          })
        }

        recipes.push({
          id: page.id,
          title,
          description,
          category,
          subCategory,
          notionCategory, // Store original Notion category
          vegetarian,
          coverImage,
          coverImageFocalPoint,
          pageIcon,
          categoryColor,
          url,
          tags,
          slug,
        })
      }
    }

    return recipes
  } catch (error) {
    console.error('Error fetching recipes:', error)
    throw error
  }
}

export async function getRecipeById(id: string): Promise<Recipe | null> {
  try {
    const page = await notion.pages.retrieve({ page_id: id })
    
    if (!('properties' in page)) {
      return null
    }

    const props = page.properties
    const title = getTitle(props['Name'])
    const description = getRichText(props['Kurzbeschreibung'])
    const notionCategory = getSelectValue(props['Kategorie']) || ''
    const { category, subCategory } = getFrontendCategory(notionCategory)
    const vegetarian = getVegetarianOption(
      getSelectValue(props['Vegetarisch']) || ''
    )
    const url = getUrl(props['URL'])
    const tags = getMultiSelect(props['Tags'])
    const speisekarte = getCheckbox(props['Speisekarte'])

    if (!speisekarte || !title) {
      return null
    }

    const { url: coverImage, focalPoint: coverImageFocalPoint } = getCoverImage(page.cover)
    const pageIcon = getPageIcon(page)
    const slug = getSlug(title, page.id)
    const categoryColor = getSelectColor(props['Kategorie'])

    // Fetch all blocks and preserve richtext structure
    let allBlocks: any[] = []
    let cursor: string | undefined = undefined
    
    do {
      const response = await notion.blocks.children.list({ 
        block_id: id,
        start_cursor: cursor,
        page_size: 100
      })
      allBlocks = [...allBlocks, ...response.results]
      cursor = response.next_cursor || undefined
    } while (cursor)
    
    // Return blocks as-is to preserve richtext formatting
    const content = allBlocks.length > 0 ? allBlocks : undefined

    return {
      id: page.id,
      title,
      description,
      category,
      subCategory: subCategory as 'Hauptgerichte' | 'Pasta' | 'Special' | undefined,
      notionCategory,
      vegetarian,
      coverImage,
      coverImageFocalPoint,
      url,
      tags,
      slug,
      pageIcon,
      categoryColor,
      content: content,
    }
  } catch (error) {
    console.error('Error fetching recipe:', error)
    return null
  }
}

export async function getRecipeBySlug(slug: string): Promise<Recipe | null> {
  const recipes = await getRecipes()
  return recipes.find(r => r.slug === slug) || null
}

