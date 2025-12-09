import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { getRecipes } from '@/lib/notion-recipe'
import { navigationTabs } from '@/config/navigation'

export async function POST(request: NextRequest) {
  const secret = request.headers.get('x-revalidate-secret')
  const expectedSecret = process.env.REVALIDATE_SECRET

  if (!expectedSecret) {
    return NextResponse.json(
      { error: 'REVALIDATE_SECRET not configured' },
      { status: 500 }
    )
  }

  if (secret !== expectedSecret) {
    return NextResponse.json({ error: 'Invalid secret' }, { status: 401 })
  }

  try {
    // Revalidate root and layout
    revalidatePath('/', 'layout')
    
    // Revalidate all category pages
    for (const tab of navigationTabs) {
      revalidatePath(`/${tab.slug}`, 'page')
    }
    
    // Revalidate all recipe pages
    const recipes = await getRecipes()
    for (const recipe of recipes) {
      revalidatePath(`/recipes/${recipe.slug}`, 'page')
    }
    
    return NextResponse.json({ 
      revalidated: true, 
      now: Date.now(),
      categories: navigationTabs.length,
      recipes: recipes.length
    })
  } catch (error) {
    console.error('Revalidation error:', error)
    return NextResponse.json(
      { error: 'Error revalidating', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 } 
    )
  }
}

