/**
 * URL slug generation for recipe pages.
 *
 * German umlauts and the sharp s are transliterated the way German URLs
 * conventionally do it (ä→ae, ß→ss) rather than being stripped, which used to
 * turn "Hähnchen süß-sauer" into "h-hnchen-s-sauer".
 */

// Applied before accent stripping, so these win over the generic NFD fallback
// (which would collapse "ä" to "a" instead of "ae").
const transliteration: Record<string, string> = {
  'ä': 'ae', 'ö': 'oe', 'ü': 'ue', 'ß': 'ss',
  'æ': 'ae', 'œ': 'oe', 'ø': 'oe', 'å': 'aa',
  'þ': 'th', 'ð': 'd', 'đ': 'd', 'ł': 'l',
}

export function slugify(title: string, fallback: string): string {
  const transliterated = Array.from(title.toLowerCase())
    .map((char) => transliteration[char] ?? char)
    .join('')

  return (
    transliterated
      // Strip remaining diacritics (é→e, ñ→n, …)
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '') || fallback
  )
}
