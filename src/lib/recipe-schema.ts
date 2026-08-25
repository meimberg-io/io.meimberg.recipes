import type { Recipe } from '@/types/recipe'

/**
 * Builds schema.org/Recipe JSON-LD from a recipe's Notion blocks.
 *
 * Google only shows recipe rich results when recipeIngredient and
 * recipeInstructions are present, so the ingredient and step lists are read
 * back out of the page content. The content follows the convention documented
 * in CLAUDE.md: an "# Zutaten" heading, then an "# Zubereitung" heading, each
 * optionally split into "### Untergruppe" blocks.
 */

type Section = 'ingredients' | 'instructions' | 'other'

interface InstructionStep {
  '@type': 'HowToStep'
  text: string
}

interface InstructionSection {
  '@type': 'HowToSection'
  name: string
  itemListElement: InstructionStep[]
}

const ingredientHeading = /^zutaten\b/i
const instructionHeading = /^(zubereitung|anleitung|schritte|so\s+geht|vorbereitung)\b/i

// e.g. "16 Portionen · Springform Ø 26 cm", "Für 4 Personen"
const yieldPattern = /(\d+)\s*(portionen|portion|personen|person|stück|stücke|gläser|scheiben)/i

function plainText(richText: unknown): string {
  if (!Array.isArray(richText)) return ''
  return richText
    .map((fragment: { plain_text?: string }) => fragment?.plain_text ?? '')
    .join('')
    .trim()
}

function headingText(block: { type: string; [key: string]: unknown }): string | null {
  if (block.type !== 'heading_1' && block.type !== 'heading_2' && block.type !== 'heading_3') {
    return null
  }
  const heading = block[block.type] as { rich_text?: unknown } | undefined
  return plainText(heading?.rich_text)
}

function isTopLevelHeading(type: string): boolean {
  return type === 'heading_1' || type === 'heading_2'
}

interface ParsedContent {
  ingredients: string[]
  instructions: (InstructionStep | InstructionSection)[]
  recipeYield?: string
}

export function parseRecipeContent(blocks: unknown[] | undefined): ParsedContent {
  const ingredients: string[] = []
  const instructions: (InstructionStep | InstructionSection)[] = []
  let recipeYield: string | undefined

  if (!Array.isArray(blocks)) {
    return { ingredients, instructions }
  }

  let section: Section = 'other'
  // Set while inside an "### Untergruppe" of the instructions block
  let openSection: InstructionSection | null = null

  const pushStep = (text: string) => {
    const step: InstructionStep = { '@type': 'HowToStep', text }
    if (openSection) {
      openSection.itemListElement.push(step)
    } else {
      instructions.push(step)
    }
  }

  for (const raw of blocks) {
    const block = raw as { type?: string; [key: string]: unknown }
    if (!block?.type) continue

    const heading = headingText(block as { type: string })
    if (heading !== null) {
      // A "Zutaten"/"Zubereitung" heading switches the section at any level —
      // some pages use "# Zutaten", others "### Zutaten".
      if (ingredientHeading.test(heading)) {
        section = 'ingredients'
        openSection = null
      } else if (instructionHeading.test(heading)) {
        section = 'instructions'
        openSection = null
      } else if (isTopLevelHeading(block.type)) {
        section = 'other'
        openSection = null
      } else if (section === 'instructions' && heading) {
        // Subheading inside the steps — start a named HowToSection
        openSection = { '@type': 'HowToSection', name: heading, itemListElement: [] }
        instructions.push(openSection)
      }

      if (!recipeYield) {
        const match = heading.match(yieldPattern)
        if (match) recipeYield = `${match[1]} ${match[2]}`
      }
      continue
    }

    const body = block[block.type] as { rich_text?: unknown } | undefined
    const text = plainText(body?.rich_text)
    if (!text) continue

    if (section === 'ingredients') {
      if (block.type === 'bulleted_list_item' || block.type === 'numbered_list_item') {
        ingredients.push(text)
      } else if (block.type === 'paragraph' && !recipeYield) {
        const match = text.match(yieldPattern)
        if (match) recipeYield = `${match[1]} ${match[2]}`
      }
      continue
    }

    if (section === 'instructions') {
      if (
        block.type === 'numbered_list_item' ||
        block.type === 'bulleted_list_item' ||
        block.type === 'paragraph'
      ) {
        pushStep(text)
      }
    }
  }

  // A HowToSection that never received a step would be invalid markup
  const cleanedInstructions = instructions.filter(
    (entry) => entry['@type'] !== 'HowToSection' || entry.itemListElement.length > 0
  )

  return { ingredients, instructions: cleanedInstructions, recipeYield }
}

/**
 * Returns the Recipe JSON-LD object, or null when the page has neither an
 * ingredient list nor steps — emitting a Recipe without them would just be
 * invalid structured data.
 */
export function buildRecipeSchema(
  recipe: Recipe,
  baseUrl: string
): Record<string, unknown> | null {
  const { ingredients, instructions, recipeYield } = parseRecipeContent(recipe.content)

  if (ingredients.length === 0 && instructions.length === 0) {
    return null
  }

  const pageUrl = `${baseUrl}/recipes/${recipe.slug}`

  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Recipe',
    '@id': pageUrl,
    url: pageUrl,
    name: recipe.title,
    description: recipe.description || recipe.title,
    recipeCategory: recipe.category,
    inLanguage: 'de-DE',
    author: { '@type': 'Person', name: 'Meimberg' },
  }

  if (recipe.coverImage) {
    schema.image = recipe.coverImage.startsWith('http')
      ? recipe.coverImage
      : `${baseUrl}${recipe.coverImage}`
  }

  if (recipe.createdTime) {
    schema.datePublished = recipe.createdTime
  }

  if (recipe.lastEditedTime) {
    schema.dateModified = recipe.lastEditedTime
  }

  if (ingredients.length > 0) {
    schema.recipeIngredient = ingredients
  }

  if (instructions.length > 0) {
    schema.recipeInstructions = instructions
  }

  if (recipeYield) {
    schema.recipeYield = recipeYield
  }

  if (recipe.tags && recipe.tags.length > 0) {
    schema.keywords = recipe.tags.join(', ')
  }

  // Only the unqualified value means the dish itself is vegetarian — the Notion
  // options "Teilvegetarisch" and "Vegatarische Variante" (sic) do not.
  if (recipe.vegetarian === 'Vegetarisch') {
    schema.suitableForDiet = 'https://schema.org/VegetarianDiet'
  }

  const cuisineTags = recipe.tags?.filter((tag) =>
    ['Deutsch', 'Italienisch', 'Französisch', 'Asiatisch', 'Mexikanisch', 'Indisch', 'Griechisch', 'Spanisch', 'Thailändisch'].includes(tag)
  )
  if (cuisineTags && cuisineTags.length > 0) {
    schema.recipeCuisine = cuisineTags[0]
  }

  return schema
}
