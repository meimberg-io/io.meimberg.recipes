import { notion } from './notion'
import type { Recipe, Category } from '@/types/recipe'
import { getFrontendCategory } from '@/config/categories'

// Throttle utility to prevent rate limiting DURING BUILD ONLY
// At runtime, requests are infrequent and don't need throttling
// Delay between API calls (in milliseconds)
function getApiDelay(): number {
  const delay = process.env.NOTION_API_DELAY_MS
  return delay ? parseInt(delay, 10) : 200
}

// Check if we're in build phase (static generation)
// NEXT_PHASE is set by Next.js during build
function isBuildPhase(): boolean {
  return process.env.NEXT_PHASE === 'phase-production-build'
}

// Global throttle queue - only active during build
let lastApiCallTime = 0
const apiDelay = getApiDelay()

async function throttleApiCall<T>(apiCall: () => Promise<T>): Promise<T> {
  // Only throttle during build to prevent Notion rate limiting
  // At runtime, execute immediately
  if (!isBuildPhase()) {
    return apiCall()
  }
  
  const now = Date.now()
  const timeSinceLastCall = now - lastApiCallTime
  
  if (timeSinceLastCall < apiDelay) {
    await new Promise(resolve => setTimeout(resolve, apiDelay - timeSinceLastCall))
  }
  
  lastApiCallTime = Date.now()
  return apiCall()
}

// Lazy initialization - only check when actually used (at runtime, not build time)
function getDatabaseId(): string {
  const databaseId = process.env.NOTION_DATABASE_ID
  if (!databaseId) {
    throw new Error('NOTION_DATABASE_ID is not set')
  }
  return databaseId
}

// Category mapping is now handled by getFrontendCategory from config/categories.ts


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
    // Throttle: serialize API call to prevent rate limiting
    const response = await throttleApiCall(() =>
      notion.databases.query({
        database_id: getDatabaseId(),
        filter: {
          property: 'Speisekarte',
          checkbox: {
            equals: true,
          },
        },
      })
    )

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
        const vegetarian = getSelectValue(props['Vegetarisch'])
        const url = getUrl(props['URL'])
        const tags = getMultiSelect(props['Tags'])
        const speisekarte = getCheckbox(props['Speisekarte'])

        if (!speisekarte || !title) continue

        const cover = 'cover' in page ? page.cover : null
        const { url: coverImage, focalPoint: coverImageFocalPoint } = getCoverImage(cover)
        const pageIcon = getPageIcon(page)
        const slug = getSlug(title, page.id)
        const categoryColor = getSelectColor(props['Kategorie'])

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
    // Throttle: serialize API call to prevent rate limiting
    const page = await throttleApiCall(() =>
      notion.pages.retrieve({ page_id: id })
    )
    
    if (!('properties' in page)) {
      return null
    }

    const props = page.properties
    const title = getTitle(props['Name'])
    const description = getRichText(props['Kurzbeschreibung'])
    const notionCategory = getSelectValue(props['Kategorie']) || ''
    const { category, subCategory } = getFrontendCategory(notionCategory)
    const vegetarian = getSelectValue(props['Vegetarisch'])
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
      // Throttle: serialize each API call to prevent rate limiting
      const response = await throttleApiCall(() =>
        notion.blocks.children.list({ 
          block_id: id,
          start_cursor: cursor,
          page_size: 100
        })
      )
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
  const recipe = recipes.find(r => r.slug === slug)
  
  if (!recipe) {
    return null
  }

  // Fetch full recipe with content using getRecipeById
  return await getRecipeById(recipe.id)
}

