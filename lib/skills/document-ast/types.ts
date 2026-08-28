/**
 * Document AST — the common, format-agnostic representation the AI produces.
 * No renderer depends on Markdown; everything flows through this AST.
 *
 * ── AST v1 (FROZEN CONTRACT) ──────────────────────────────────────────────
 * This is the stable v1 shape. Do NOT add new block types or change existing
 * ones without a versioned migration: every renderer (pdf, markdown, html,
 * and future docx/xlsx/pptx/svg) must honor exactly this contract. The core
 * stays fixed so new formats can be added without touching the AST.
 */

export type DocumentAST = {
  type: 'document'
  metadata?: {
    title?: string
    author?: string
    language?: string
  }
  blocks: DocumentBlock[]
}

export type DocumentBlock =
  | HeadingBlock
  | ParagraphBlock
  | ListBlock
  | TableBlock
  | QuoteBlock
  | CodeBlock
  | ImageBlock
  | PageBreakBlock

export interface HeadingBlock {
  type: 'heading'
  level: number
  text: string
}

export interface ParagraphBlock {
  type: 'paragraph'
  text: string
}

export interface ListBlock {
  type: 'list'
  ordered?: boolean
  items: string[]
}

export interface TableBlock {
  type: 'table'
  headers: string[]
  rows: string[][]
}

export interface QuoteBlock {
  type: 'quote'
  text: string
}

export interface CodeBlock {
  type: 'code'
  language?: string
  code: string
}

export interface ImageBlock {
  type: 'image'
  url: string
  alt?: string
}

export interface PageBreakBlock {
  type: 'pageBreak'
}
