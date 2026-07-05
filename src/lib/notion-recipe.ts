import { notion } from './notion'
import type { Recipe, Category } from '@/types/recipe'
import { getFrontendCategory, getFrontendCategories, categoryConfig } from '@/config/categories'

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

// Notion API 2025-09-03 (SDK v5) queries data sources, not databases directly.
// Resolve the database's (first) data source id once and cache it.
let cachedDataSourceId: string | null = null
async function getDataSourceId(): Promise<string> {
  if (cachedDataSourceId) {
    return cachedDataSourceId
  }
  const database = await throttleApiCall(() =>
    notion.databases.retrieve({ database_id: getDatabaseId() })
  )
  const dataSources = 'data_sources' in database ? database.data_sources : []
  const dataSourceId = dataSources[0]?.id
  if (!dataSourceId) {
    throw new Error('No data source found for the configured Notion database')
  }
  cachedDataSourceId = dataSourceId
  return dataSourceId
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


// Only recipes marked for the menu ("Speisekarte") are shown in the app.
const SPEISEKARTE_FILTER = {
  property: 'Speisekarte',
  checkbox: { equals: true },
} as const

// The Kategorie select options that actually exist in the data source. Notion
// rejects a select filter with an option name it doesn't know, so we must only
// filter on values that really exist. Cached after the first lookup.
let cachedKategorieOptions: string[] | null = null
async function getKategorieOptions(): Promise<string[]> {
  if (cachedKategorieOptions) return cachedKategorieOptions
  const dataSourceId = await getDataSourceId()
  const ds = await throttleApiCall(() =>
    notion.dataSources.retrieve({ data_source_id: dataSourceId })
  )
  const prop = 'properties' in ds ? (ds.properties as any)['Kategorie'] : undefined
  const opts: string[] = prop?.select?.options?.map((o: any) => o.name) ?? []
  cachedKategorieOptions = opts
  return opts
}

// Notion filter for one frontend category: Speisekarte AND (one of its Notion categories).
// A frontend category can map to several Notion "Kategorie" values (see categories.ts);
// only values that actually exist as options are used. Returns null if none apply.
async function categoryFilter(category: Category): Promise<unknown | null> {
  const cfg = categoryConfig[category as keyof typeof categoryConfig]
  const configured = (cfg ? cfg.notionCategories : [category]) as readonly string[]
  const options = await getKategorieOptions()
  const valid = configured.filter((c) => options.includes(c))
  if (valid.length === 0) return null
  return {
    and: [
      SPEISEKARTE_FILTER,
      { or: valid.map((c) => ({ property: 'Kategorie', select: { equals: c } })) },
    ],
  }
}

// Run a data-source query with the given filter, following pagination to the end
// (Notion returns max 100 results per page).
async function queryAllPages(filter: unknown): Promise<any[]> {
  const dataSourceId = await getDataSourceId()
  const results: any[] = []
  let cursor: string | undefined = undefined
  do {
    const response = await throttleApiCall(() =>
      notion.dataSources.query({
        data_source_id: dataSourceId,
        filter: filter as any,
        start_cursor: cursor,
        page_size: 100,
      })
    )
    results.push(...response.results)
    cursor = response.has_more ? (response.next_cursor ?? undefined) : undefined
  } while (cursor)
  return results
}

// Map a Notion page object to a Recipe (list view). Returns null if it's not a
// valid, menu-listed recipe.
function mapPageToRecipe(page: any): Recipe | null {
  if (!('properties' in page)) return null
  const props = page.properties
  const title = getTitle(props['Name'])
  const speisekarte = getCheckbox(props['Speisekarte'])
  if (!speisekarte || !title) return null

  const notionCategory = getSelectValue(props['Kategorie']) || ''
  const { category, subCategory } = getFrontendCategory(notionCategory)
  const cover = 'cover' in page ? page.cover : null
  const { url: coverImage, focalPoint: coverImageFocalPoint } = getCoverImage(cover)
  const slug = getSlug(title, page.id)
  // Use proxy URL for cover images to handle expired S3 pre-signed URLs.
  const coverImageUrl = coverImage ? `/api/image-proxy?slug=${encodeURIComponent(slug)}` : undefined

  return {
    id: page.id,
    title,
    description: getRichText(props['Kurzbeschreibung']),
    category,
    subCategory,
    notionCategory,
    vegetarian: getSelectValue(props['Vegetarisch']),
    status: getSelectValue(props['Status']),
    statusColor: getSelectColor(props['Status']),
    coverImage: coverImageUrl,
    coverImageFocalPoint,
    pageIcon: getPageIcon(page),
    categoryColor: getSelectColor(props['Kategorie']),
    url: getUrl(props['URL']),
    tags: getMultiSelect(props['Tags']),
    createdTime: page.created_time,
    slug,
  }
}

// All menu-listed recipes (across every category). Needed where a global view is
// required (e.g. resolving a recipe by slug).
export async function getRecipes(): Promise<Recipe[]> {
  try {
    const pages = await queryAllPages(SPEISEKARTE_FILTER)
    // Sort by Notion category first (for consistent grouping)
    pages.sort((a, b) => {
      const aCat = ('properties' in a && getSelectValue(a.properties['Kategorie'])) || ''
      const bCat = ('properties' in b && getSelectValue(b.properties['Kategorie'])) || ''
      return aCat.localeCompare(bCat)
    })
    return pages.map(mapPageToRecipe).filter((r): r is Recipe => r !== null)
  } catch (error) {
    console.error('Error fetching recipes:', error)
    throw error
  }
}

// Only the recipes belonging to one frontend category — filtered at the Notion
// query, so a category page never loads the whole database.
export async function getRecipesByCategory(category: Category): Promise<Recipe[]> {
  try {
    const filter = await categoryFilter(category)
    if (!filter) return []
    const pages = await queryAllPages(filter)
    return pages
      .map(mapPageToRecipe)
      .filter((r): r is Recipe => r !== null && r.category === category)
      .sort((a, b) => a.title.localeCompare(b.title))
  } catch (error) {
    console.error(`Error fetching recipes for category ${category}:`, error)
    throw error
  }
}

// Which frontend categories currently have at least one menu-listed recipe —
// used to render only the populated navigation tabs, without loading all recipes.
export async function getPopulatedCategories(): Promise<Category[]> {
  const dataSourceId = await getDataSourceId()
  const populated: Category[] = []
  for (const category of getFrontendCategories()) {
    const filter = await categoryFilter(category)
    if (!filter) continue
    const response = await throttleApiCall(() =>
      notion.dataSources.query({
        data_source_id: dataSourceId,
        filter: filter as any,
        page_size: 1,
      })
    )
    if (response.results.length > 0) populated.push(category)
  }
  return populated
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
    const status = getSelectValue(props['Status'])
    const statusColor = getSelectColor(props['Status'])
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

    // Use proxy URL for cover images to handle expired S3 pre-signed URLs
    const coverImageUrl = coverImage ? `/api/image-proxy?slug=${encodeURIComponent(slug)}` : undefined

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
      status,
      statusColor,
      coverImage: coverImageUrl,
      coverImageFocalPoint,
      url,
      tags,
      slug,
      pageIcon,
      categoryColor,
      createdTime: page.created_time,
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

