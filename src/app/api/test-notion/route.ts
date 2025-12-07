import { NextResponse } from 'next/server'
import { notion } from '@/lib/notion'

export async function GET() {
  const results: {
    step: string
    status: 'success' | 'error' | 'warning'
    message: string
    data?: any
  }[] = []

  // Step 1: Check environment variables
  const token = process.env.NOTION_TOKEN
  const databaseId = process.env.NOTION_DATABASE_ID

  if (!token) {
    results.push({
      step: 'Environment Variables',
      status: 'error',
      message: 'NOTION_TOKEN is not set in .env.local',
    })
    return NextResponse.json({ results }, { status: 500 })
  }

  if (!token.startsWith('secret_') && !token.startsWith('ntn_')) {
    results.push({
      step: 'Token Format',
      status: 'warning',
      message: 'NOTION_TOKEN should start with "secret_" or "ntn_"',
      data: { tokenPrefix: token.substring(0, 10) + '...' },
    })
  } else {
    results.push({
      step: 'Environment Variables',
      status: 'success',
      message: 'NOTION_TOKEN is set',
      data: { tokenPrefix: token.substring(0, 15) + '...' },
    })
  }

  if (!databaseId) {
    results.push({
      step: 'Database ID',
      status: 'error',
      message: 'NOTION_DATABASE_ID is not set in .env.local',
    })
    return NextResponse.json({ results }, { status: 500 })
  }

  if (databaseId.length < 20) {
    results.push({
      step: 'Database ID Format',
      status: 'warning',
      message: 'Database ID seems too short. It should be a long string (32 characters)',
      data: { databaseIdLength: databaseId.length },
    })
  } else {
    results.push({
      step: 'Database ID',
      status: 'success',
      message: 'NOTION_DATABASE_ID is set',
      data: { databaseIdPrefix: databaseId.substring(0, 8) + '...' },
    })
  }

  // Step 2: Test API connection
  try {
    await notion.users.me()
    results.push({
      step: 'API Connection',
      status: 'success',
      message: 'Successfully connected to Notion API',
    })
  } catch (error: any) {
    results.push({
      step: 'API Connection',
      status: 'error',
      message: 'Failed to connect to Notion API',
      data: {
        error: error.message,
        hint: 'Check if your token is correct and the integration is active',
      },
    })
    return NextResponse.json({ results }, { status: 500 })
  }

  // Step 3: Test database access
  try {
    const database = await notion.databases.retrieve({
      database_id: databaseId,
    })

    results.push({
      step: 'Database Access',
      status: 'success',
      message: 'Successfully accessed the database',
      data: {
        title: database.title?.[0]?.plain_text || 'Untitled',
        properties: Object.keys(database.properties || {}),
      },
    })
  } catch (error: any) {
    if (error.code === 'object_not_found') {
      results.push({
        step: 'Database Access',
        status: 'error',
        message: 'Database not found',
        data: {
          error: error.message,
          hint: 'Check if the database ID is correct and the database is shared with your integration',
        },
      })
    } else if (error.code === 'unauthorized') {
      results.push({
        step: 'Database Access',
        status: 'error',
        message: 'Not authorized to access this database',
        data: {
          error: error.message,
          hint: 'Make sure you shared the database with your integration in Notion',
        },
      })
    } else {
      results.push({
        step: 'Database Access',
        status: 'error',
        message: 'Failed to access database',
        data: {
          error: error.message,
        },
      })
    }
    return NextResponse.json({ results }, { status: 500 })
  }

  // Step 4: Test query
  try {
    const response = await notion.databases.query({
      database_id: databaseId,
      page_size: 1,
    })

    results.push({
      step: 'Database Query',
      status: 'success',
      message: `Successfully queried database (found ${response.results.length} result(s))`,
      data: {
        totalResults: response.results.length,
      },
    })
  } catch (error: any) {
    results.push({
      step: 'Database Query',
      status: 'error',
      message: 'Failed to query database',
      data: {
        error: error.message,
      },
    })
    return NextResponse.json({ results }, { status: 500 })
  }

  // Step 5: Check for required properties
  try {
    const database = await notion.databases.retrieve({
      database_id: databaseId,
    })

    const properties = database.properties || {}
    const requiredProps = [
      'Name',
      'Kategorie',
      'Kurzbeschreibung',
      'Speisekarte',
      'Vegetarisch',
    ]

    const foundProps: string[] = []
    const missingProps: string[] = []

    for (const prop of requiredProps) {
      if (properties[prop]) {
        foundProps.push(prop)
      } else {
        missingProps.push(prop)
      }
    }

    if (missingProps.length > 0) {
      results.push({
        step: 'Required Properties',
        status: 'warning',
        message: `Some properties might be missing: ${missingProps.join(', ')}`,
        data: {
          found: foundProps,
          missing: missingProps,
          allProperties: Object.keys(properties),
        },
      })
    } else {
      results.push({
        step: 'Required Properties',
        status: 'success',
        message: 'All required properties found',
        data: {
          found: foundProps,
        },
      })
    }
  } catch (error: any) {
    results.push({
      step: 'Required Properties',
      status: 'error',
      message: 'Could not check properties',
      data: {
        error: error.message,
      },
    })
  }

  return NextResponse.json({
    results,
    summary: {
      allPassed: results.every(r => r.status === 'success'),
      hasErrors: results.some(r => r.status === 'error'),
      hasWarnings: results.some(r => r.status === 'warning'),
    },
  })
}

