import { NextResponse } from 'next/server'
import { unstable_cache } from 'next/cache'
import { getRecipeById } from '@/lib/notion-recipe'

// Cache API route responses - can be invalidated via revalidateTag('recipes')
// This prevents hitting Notion API on every modal open
export const revalidate = false

// Helper to get cached recipe by ID
async function getCachedRecipeById(id: string) {
  const cachedFn = unstable_cache(
    async () => getRecipeById(id),
    [`recipe-${id}`],
    {
      tags: ['recipes', `recipe-${id}`],
    }
  )
  return await cachedFn()
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const recipe = await getCachedRecipeById(id)
    if (!recipe) {
      return NextResponse.json({ error: 'Recipe not found' }, { status: 404 })
    }
    return NextResponse.json(recipe)
  } catch (error) {
    console.error('Error fetching recipe:', error)
    return NextResponse.json(
      { error: 'Failed to fetch recipe' },
      { status: 500 }
    )
  }
}

