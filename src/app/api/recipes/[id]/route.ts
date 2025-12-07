import { NextResponse } from 'next/server'
import { getRecipeById } from '@/lib/notion-recipe'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const recipe = await getRecipeById(params.id)
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

