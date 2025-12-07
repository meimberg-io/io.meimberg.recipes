import { Client } from '@notionhq/client'

let notionClient: Client | null = null

function getNotionClient(): Client {
  if (!notionClient) {
    const token = process.env.NOTION_TOKEN
    if (!token) {
      throw new Error('NOTION_TOKEN is not set')
    }
    notionClient = new Client({
      auth: token,
    })
  }
  return notionClient
}

// Lazy initialization - only creates client when actually used (at runtime, not build time)
// This prevents build-time errors when NOTION_TOKEN is not available during Docker build
export const notion = {
  get databases() {
    return getNotionClient().databases
  },
  get pages() {
    return getNotionClient().pages
  },
  get blocks() {
    return getNotionClient().blocks
  },
  get users() {
    return getNotionClient().users
  },
} as Client

