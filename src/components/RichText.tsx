'use client'

import { Fragment } from 'react'

interface RichTextProps {
  richText: any[]
}

export default function RichText({ richText }: RichTextProps) {
  if (!richText || richText.length === 0) return null

  return (
    <>
      {richText.map((text, index) => {
        let content: React.ReactNode = text.plain_text || ''
        const annotations = text.annotations || {}
        
        // Apply formatting in order: inner to outer
        // Code should be innermost (applied first)
        if (annotations.code) {
          content = <code className="bg-gray-800 px-1 rounded text-sm font-mono">{content}</code>
        }
        // Then bold
        if (annotations.bold) {
          content = <strong>{content}</strong>
        }
        // Then italic
        if (annotations.italic) {
          content = <em>{content}</em>
        }
        // Then strikethrough
        if (annotations.strikethrough) {
          content = <del>{content}</del>
        }
        // Then underline
        if (annotations.underline) {
          content = <u>{content}</u>
        }
        
        // Links wrap everything (outermost)
        if (text.href) {
          content = (
            <a 
              href={text.href} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-400 hover:underline"
            >
              {content}
            </a>
          )
        }
        
        // Only the Fragment has a key
        return <Fragment key={index}>{content}</Fragment>
      })}
    </>
  )
}

