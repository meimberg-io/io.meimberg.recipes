import { NextResponse } from 'next/server'
import { getRecipes } from '@/lib/notion-recipe'

export const revalidate = 3600000

export async function GET() {
  try {
    const recipes = await getRecipes()
    return NextResponse.json(recipes)
  } catch (error) {
    console.error('Error in recipes API:', error)
    return NextResponse.json(
      { error: 'Failed to fetch recipes' },
      { status: 500 }
    )
  }
}

