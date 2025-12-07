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
        let content: any = text.plain_text || ''
        const annotations = text.annotations || {}
        
        // Apply formatting in order: code, bold, italic, strikethrough, underline
        if (annotations.code) {
          content = <code key={`code-${index}`} className="bg-gray-800 px-1 rounded text-sm font-mono">{content}</code>
        }
        if (annotations.bold) {
          content = <strong key={`bold-${index}`}>{content}</strong>
        }
        if (annotations.italic) {
          content = <em key={`italic-${index}`}>{content}</em>
        }
        if (annotations.strikethrough) {
          content = <del key={`del-${index}`}>{content}</del>
        }
        if (annotations.underline) {
          content = <u key={`u-${index}`}>{content}</u>
        }
        
        // Links wrap everything
        if (text.href) {
          content = (
            <a 
              key={`link-${index}`}
              href={text.href} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-400 hover:underline"
            >
              {content}
            </a>
          )
        }
        
        return <Fragment key={index}>{content}</Fragment>
      })}
    </>
  )
}

