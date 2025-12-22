import RichText from './RichText'

interface NotionContentProps {
  blocks: any[]
}

export default function NotionContent({ blocks }: NotionContentProps) {
  if (!blocks || blocks.length === 0) return null

  const elements: JSX.Element[] = []
  type ListState = { type: 'bulleted' | 'numbered', items: JSX.Element[], listId: string }
  let currentList: ListState | null = null
  let listCounter = 0
  let itemCounter = 0

  blocks.forEach((block, index) => {
    if (!('type' in block)) return

    const blockType = block.type
    const blockId = block.id || `block-${index}`

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
          ? 'list-disc list-outside ml-4 space-y-1 text-gray-300'
          : 'list-decimal list-outside ml-4 space-y-1 text-gray-300'
        elements.push(
          <ListTag key={currentList.listId} className={listClass}>
            {currentList.items}
          </ListTag>
        )
        currentList = null
        itemCounter = 0
      }
    }

    // Paragraph
    if (blockType === 'paragraph') {
      closeList()
      const richText = block.paragraph?.rich_text || []
      if (richText.length === 0) return
      elements.push(
        <p key={blockId} className="text-gray-300">
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
        <h2 key={blockId} className="text-2xl font-bold text-white mb-2 pt-6">
          <RichText richText={richText} />
        </h2>
      )
      return
    }
    if (blockType === 'heading_2') {
      closeList()
      const richText = block.heading_2?.rich_text || []
      elements.push(
        <h3 key={blockId} className="text-xl font-bold text-white mb-2 pt-6">
          <RichText richText={richText} />
        </h3>
      )
      return
    }
    if (blockType === 'heading_3') {
      closeList()
      const richText = block.heading_3?.rich_text || []
      elements.push(
        <h4 key={blockId} className="text-lg font-bold text-white mb-2">
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
          ? 'list-decimal list-outside ml-4 space-y-1 text-gray-300'
          : 'list-disc list-outside ml-4 space-y-1 text-gray-300'
        elements.push(
          <ListTag key={currentList.listId} className={listClass}>
            {currentList.items}
          </ListTag>
        )
        currentList = null
        itemCounter = 0
      }
      if (!currentList) {
        listCounter++
        currentList = { type: 'bulleted', items: [], listId: `list-bulleted-${listCounter}` }
      }
      const richText = block.bulleted_list_item?.rich_text || []
      itemCounter++
      currentList.items.push(
        <li key={`${currentList.listId}-item-${itemCounter}`} className="text-gray-300 marker:text-grey-400">
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
          ? 'list-disc list-outside ml-4 space-y-1 text-gray-300'
          : 'list-decimal list-outside ml-4 space-y-1 text-gray-300'
        elements.push(
          <ListTag key={currentList.listId} className={listClass}>
            {currentList.items}
          </ListTag>
        )
        currentList = null
        itemCounter = 0
      }
      if (!currentList) {
        listCounter++
        currentList = { type: 'numbered', items: [], listId: `list-numbered-${listCounter}` }
      }
      const richText = block.numbered_list_item?.rich_text || []
      itemCounter++
      currentList.items.push(
        <li key={`${currentList.listId}-item-${itemCounter}`} className="text-gray-300 ml-4 pl-2 marker:text-grey-400 marker:font-bold">
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
        <div key={blockId} className="flex items-start gap-2 text-gray-300">
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
    const list: ListState = currentList
    const ListTag = list.type === 'bulleted' ? 'ul' : 'ol'
    const listClass = list.type === 'bulleted'
      ? 'list-disc list-outside ml-4 space-y-1 text-gray-300'
      : 'list-decimal list-outside ml-4 space-y-1 text-gray-300'
    elements.push(
      <ListTag key={list.listId} className={listClass}>
        {list.items}
      </ListTag>
    )
  }

  return <div className="space-y-4">{elements}</div>
}

