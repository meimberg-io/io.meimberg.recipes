'use client'

import RichText from './RichText'

interface NotionContentProps {
  blocks: any[]
}

export default function NotionContent({ blocks }: NotionContentProps) {
  if (!blocks || blocks.length === 0) return null

  const elements: JSX.Element[] = []
  let currentList: { type: 'bulleted' | 'numbered', items: JSX.Element[] } | null = null

  blocks.forEach((block, index) => {
    if (!('type' in block)) return

    const blockType = block.type

    // Skip database-related blocks (child_database, synced_block with databases, etc.)
    if (
      blockType === 'child_database' ||
      blockType === 'synced_block' ||
      blockType === 'link_to_page' ||
      blockType === 'bookmark' ||
      blockType === 'link_preview' ||
      blockType === 'embed' ||
      blockType === 'video' ||
      blockType === 'file' ||
      blockType === 'pdf' ||
      blockType === 'audio' ||
      blockType === 'image' // We handle images separately if needed
    ) {
      return // Skip these block types
    }

    // Helper to close current list
    const closeList = () => {
      if (currentList) {
        const ListTag = currentList.type === 'bulleted' ? 'ul' : 'ol'
        const listClass = currentList.type === 'bulleted'
          ? 'list-disc list-inside ml-4 space-y-1 text-gray-300'
          : 'list-decimal list-inside ml-4 space-y-1 text-gray-300'
        elements.push(
          <ListTag key={`list-${index}`} className={listClass}>
            {currentList.items}
          </ListTag>
        )
        currentList = null
      }
    }

    // Paragraph
    if (blockType === 'paragraph') {
      closeList()
      const richText = block.paragraph?.rich_text || []
      if (richText.length === 0) return
      elements.push(
        <p key={index} className="text-gray-300">
          <RichText richText={richText} />
        </p>
      )
      return
    }

    // Headings
    if (blockType === 'heading_1') {
      closeList()
      const richText = block.heading_1?.rich_text || []
      elements.push(
        <h2 key={index} className="text-2xl font-bold text-white mb-2">
          <RichText richText={richText} />
        </h2>
      )
      return
    }
    if (blockType === 'heading_2') {
      closeList()
      const richText = block.heading_2?.rich_text || []
      elements.push(
        <h3 key={index} className="text-xl font-bold text-white mb-2">
          <RichText richText={richText} />
        </h3>
      )
      return
    }
    if (blockType === 'heading_3') {
      closeList()
      const richText = block.heading_3?.rich_text || []
      elements.push(
        <h4 key={index} className="text-lg font-bold text-white mb-2">
          <RichText richText={richText} />
        </h4>
      )
      return
    }

    // Bulleted list
    if (blockType === 'bulleted_list_item') {
      if (currentList && currentList.type !== 'bulleted') {
        const ListTag = currentList.type === 'numbered' ? 'ol' : 'ul'
        const listClass = currentList.type === 'numbered'
          ? 'list-decimal list-inside ml-4 space-y-1 text-gray-300'
          : 'list-disc list-inside ml-4 space-y-1 text-gray-300'
        elements.push(
          <ListTag key={`list-${index}`} className={listClass}>
            {currentList.items}
          </ListTag>
        )
        currentList = null
      }
      if (!currentList) {
        currentList = { type: 'bulleted', items: [] }
      }
      const richText = block.bulleted_list_item?.rich_text || []
      currentList.items.push(
        <li key={index} className="text-gray-300">
          <RichText richText={richText} />
        </li>
      )
      return
    }

    // Numbered list
    if (blockType === 'numbered_list_item') {
      if (currentList && currentList.type !== 'numbered') {
        const ListTag = currentList.type === 'bulleted' ? 'ul' : 'ol'
        const listClass = currentList.type === 'bulleted'
          ? 'list-disc list-inside ml-4 space-y-1 text-gray-300'
          : 'list-decimal list-inside ml-4 space-y-1 text-gray-300'
        elements.push(
          <ListTag key={`list-${index}`} className={listClass}>
            {currentList.items}
          </ListTag>
        )
        currentList = null
      }
      if (!currentList) {
        currentList = { type: 'numbered', items: [] }
      }
      const richText = block.numbered_list_item?.rich_text || []
      currentList.items.push(
        <li key={index} className="text-gray-300">
          <RichText richText={richText} />
        </li>
      )
      return
    }

    // To-do
    if (blockType === 'to_do') {
      closeList()
      const richText = block.to_do?.rich_text || []
      const checked = block.to_do?.checked || false
      elements.push(
        <div key={index} className="flex items-start gap-2 text-gray-300">
          <input
            type="checkbox"
            checked={checked}
            readOnly
            className="mt-1"
          />
          <span className={checked ? 'line-through opacity-60' : ''}>
            <RichText richText={richText} />
          </span>
        </div>
      )
      return
    }
  })

  // Close any remaining list
  if (currentList) {
    const ListTag = currentList.type === 'bulleted' ? 'ul' : 'ol'
    const listClass = currentList.type === 'bulleted'
      ? 'list-disc list-inside ml-4 space-y-1 text-gray-300'
      : 'list-decimal list-inside ml-4 space-y-1 text-gray-300'
    elements.push(
      <ListTag key="list-final" className={listClass}>
        {currentList.items}
      </ListTag>
    )
  }

  return <div className="space-y-4">{elements}</div>
}

