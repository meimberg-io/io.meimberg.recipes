import { NextResponse } from 'next/server'
import { getRecipes } from '@/lib/notion-recipe'
import { navigationTabs } from '@/config/navigation'

const generateSitemap = (recipes: Array<{ slug: string }>) => {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://recipes.meimberg.io'
  const currentDate = new Date().toISOString()

  const entry = (url: string, priority: string = '0.8', changefreq: string = 'weekly') => {
    return `<url>
      <loc>${baseUrl}${url}</loc>
      <lastmod>${currentDate}</lastmod>
      <changefreq>${changefreq}</changefreq>
      <priority>${priority}</priority>
    </url>`
  }

  // Generate category page URLs
  const categoryUrls = navigationTabs.map(tab => 
    entry(`/${tab.slug}`, '0.9', 'weekly')
  ).join('')

  // Generate recipe page URLs
  const recipeUrls = recipes.map(recipe => 
    entry(`/recipes/${recipe.slug}`, '0.8', 'monthly')
  ).join('')

  return `<?xml version="1.0" encoding="UTF-8"?>
    <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
      ${entry('/', '1.0', 'daily')}
      ${categoryUrls}
      ${recipeUrls}
    </urlset>`
}

export async function GET() {
  try {
    const recipes = await getRecipes()
    const recipeSlugs = recipes.map(recipe => ({ slug: recipe.slug }))

    return new NextResponse(
      generateSitemap(recipeSlugs),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/xml',
        },
      }
    )
  } catch (error) {
    console.error('Error generating sitemap:', error)
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://recipes.meimberg.io'
    const currentDate = new Date().toISOString()
    
    const minimalSitemap = `<?xml version="1.0" encoding="UTF-8"?>
      <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
        <url>
          <loc>${baseUrl}/</loc>
          <lastmod>${currentDate}</lastmod>
          <changefreq>daily</changefreq>
          <priority>1.0</priority>
        </url>
      </urlset>`
    
    return new NextResponse(minimalSitemap, {
      status: 200,
      headers: {
        'Content-Type': 'application/xml',
      },
    })
  }
}

