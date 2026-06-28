#!/usr/bin/env node
/**
 * Lädt ein Bild herunter und hostet es DAUERHAFT in Notion (file upload),
 * dann setzt es als Cover der angegebenen Notion-Seite.
 *
 * Warum nicht einfach eine externe Cover-URL? Externe URLs (z.B. von Instagram)
 * laufen ab / werden bei jedem Aufruf live nachgeladen. Hochgeladene Notion-Files
 * werden von Notion gehostet; die App (image-proxy) refresht deren URLs dauerhaft.
 *
 * Nutzung (aus dem Repo-Root, damit node_modules + .env gefunden werden):
 *   node .claude/skills/add-recipe/set-notion-cover.mjs --page <pageId> --instagram <postUrl>
 *   node .claude/skills/add-recipe/set-notion-cover.mjs --page <pageId> --image-url <directUrl> [--filename name.jpg]
 *
 * Liest NOTION_TOKEN aus der .env im aktuellen Verzeichnis.
 */
import { readFileSync } from 'node:fs'
import { Client } from '@notionhq/client'

// --- args ---
const args = Object.fromEntries(
  process.argv.slice(2).reduce((acc, cur, i, arr) => {
    if (cur.startsWith('--')) acc.push([cur.slice(2), arr[i + 1]])
    return acc
  }, [])
)
const pageId = args.page
if (!pageId || (!args.instagram && !args['image-url'])) {
  console.error('Usage: --page <id> (--instagram <postUrl> | --image-url <url>) [--filename name.jpg]')
  process.exit(1)
}

// --- token from .env ---
function loadToken() {
  if (process.env.NOTION_TOKEN) return process.env.NOTION_TOKEN
  try {
    const env = readFileSync('.env', 'utf8')
    const m = env.match(/^NOTION_TOKEN=(.+)$/m)
    if (m) return m[1].trim()
  } catch {}
  throw new Error('NOTION_TOKEN not found (env or .env)')
}

const BROWSER_UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36'

// Instagram serves og:image meta tags to crawlers — grab the post thumbnail.
async function instagramOgImage(postUrl) {
  const res = await fetch(postUrl, { headers: { 'User-Agent': 'facebookexternalhit/1.1' } })
  const html = await res.text()
  const m = html.match(/<meta property="og:image" content="([^"]+)"/i)
  if (!m) throw new Error('og:image not found on Instagram post')
  return m[1].replace(/&amp;/g, '&')
}

async function main() {
  const notion = new Client({ auth: loadToken() })

  const imageUrl = args.instagram ? await instagramOgImage(args.instagram) : args['image-url']
  console.log('Image URL:', imageUrl.slice(0, 90), '…')

  // 1) Download the bytes ourselves (don't rely on Notion reaching the source host).
  const imgRes = await fetch(imageUrl, { headers: { 'User-Agent': BROWSER_UA } })
  if (!imgRes.ok) throw new Error(`Image download failed: ${imgRes.status}`)
  const contentType = imgRes.headers.get('content-type') || 'image/jpeg'
  const buf = Buffer.from(await imgRes.arrayBuffer())
  const filename = args.filename || (contentType.includes('png') ? 'cover.png' : 'cover.jpg')
  console.log(`Downloaded ${buf.length} bytes (${contentType})`)

  // 2) Upload into Notion (single_part → Notion hosts it permanently).
  const upload = await notion.fileUploads.create({
    mode: 'single_part',
    filename,
    content_type: contentType,
  })
  await notion.fileUploads.send({
    file_upload_id: upload.id,
    file: { filename, data: new Blob([buf], { type: contentType }) },
  })
  console.log('Uploaded to Notion, file_upload id:', upload.id)

  // 3) Set as page cover.
  await notion.pages.update({
    page_id: pageId,
    cover: { type: 'file_upload', file_upload: { id: upload.id } },
  })
  console.log('✅ Cover set on page', pageId)
}

main().catch((e) => {
  console.error('❌', e.message || e)
  process.exit(1)
})
