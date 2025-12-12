import { NextRequest, NextResponse } from 'next/server'
import { notion } from '@/lib/notion'
import { getRecipes } from '@/lib/notion-recipe'

/**
 * Image proxy API route that refreshes expired S3 pre-signed URLs
 * 
 * Usage: /api/image-proxy?slug=recipe-slug
 * 
 * This route:
 * 1. Finds the recipe by slug
 * 2. Fetches fresh page data directly from Notion to get a new S3 URL
 * 3. Proxies the image from S3 (fetches and streams it)
 * 
 * Next.js Image optimization will cache the optimized image.
 * This solves the problem where S3 pre-signed URLs expire after 1 hour.
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const slug = searchParams.get('slug')

  if (!slug) {
    return NextResponse.json({ error: 'Missing slug parameter' }, { status: 400 })
  }

  try {
    // First, find the recipe to get the Notion page ID
    const recipes = await getRecipes()
    const recipe = recipes.find(r => r.slug === slug)

    if (!recipe) {
      return NextResponse.json({ error: 'Recipe not found' }, { status: 404 })
    }

    // Fetch fresh page data directly from Notion to get a new S3 pre-signed URL
    const page = await notion.pages.retrieve({ page_id: recipe.id })
    
    if (!('cover' in page) || !page.cover) {
      return NextResponse.json({ error: 'Recipe has no cover image' }, { status: 404 })
    }

    // Extract the raw S3 URL from the cover
    let s3Url: string | undefined
    if (page.cover.type === 'external') {
      s3Url = page.cover.external?.url
    } else if (page.cover.type === 'file') {
      s3Url = page.cover.file?.url
    }

    if (!s3Url) {
      return NextResponse.json({ error: 'Could not extract image URL' }, { status: 404 })
    }

    // Fetch the image from S3 and proxy it
    // This ensures Next.js Image optimization gets a valid image response
    const imageResponse = await fetch(s3Url, {
      headers: {
        'User-Agent': 'Next.js-Image-Proxy/1.0',
      },
    })

    if (!imageResponse.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch image from S3' },
        { status: imageResponse.status }
      )
    }

    // Get the content type from the S3 response or default to image/jpeg
    const contentType = imageResponse.headers.get('content-type') || 'image/jpeg'
    
    // Stream the image data
    const imageData = await imageResponse.arrayBuffer()

    // Return the image with appropriate headers
    // Don't cache the proxy response - we want fresh URLs each time
    // But Next.js Image optimization will cache the optimized version
    return new NextResponse(imageData, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    })
  } catch (error) {
    console.error('Error fetching image URL from Notion:', error)
    return NextResponse.json(
      { error: 'Failed to fetch image URL' },
      { status: 500 }
    )
  }
}

