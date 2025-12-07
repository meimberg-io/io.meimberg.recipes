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

export const notion = new Proxy({} as Client, {
  get(_target, prop) {
    const client = getNotionClient()
    const value = (client as any)[prop]
    if (typeof value === 'function') {
      return value.bind(client)
    }
    return value
  },
})

