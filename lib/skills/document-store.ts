/**
 * Minimal document store for generated artifacts.
 *
 * Generates a stable random id, persists the buffer on disk (under a directory
 * that must be git-ignored) and serves it back by id. This is intentionally
 * simple — the app is single-user / anonymous by default — and gives the chatbot
 * a real, downloadable file URL for the documents it produces.
 */

import { promises as fs } from 'fs'
import path from 'path'

const STORE_DIR =
  process.env.DOCUMENT_STORE_DIR?.trim() ||
  path.join(process.cwd(), '.document-store')

async function ensureDir(): Promise<void> {
  await fs.mkdir(STORE_DIR, { recursive: true })
}

function randomId(): string {
  return (
    Date.now().toString(36) + Math.random().toString(36).slice(2, 10)
  ).replace(/[^a-z0-9]/gi, '')
}

export interface StoredDocument {
  id: string
  fileName: string
  mimeType: string
  size: number
}

export async function storeDocument(
  buffer: Buffer,
  fileName: string,
  mimeType: string
): Promise<StoredDocument> {
  await ensureDir()
  const id = randomId()
  const safeName = fileName.replace(/[^a-z0-9._-]/gi, '_')
  const filePath = path.join(STORE_DIR, `${id}__${safeName}`)
  await fs.writeFile(filePath, buffer)
  return { id, fileName: safeName, mimeType, size: buffer.length }
}

export async function resolveStoredDocument(
  id: string
): Promise<{ buffer: Buffer; meta: StoredDocument } | null> {
  if (!/^[a-z0-9]+$/i.test(id)) return null
  await ensureDir()
  const entries = await fs.readdir(STORE_DIR)
  const match = entries.find(e => e.startsWith(`${id}__`))
  if (!match) return null
  const buffer = await fs.readFile(path.join(STORE_DIR, match))
  const meta = match.split('__') as [string, string]
  const mimeType = mimeByExtension(meta[1])
  return { buffer, meta: { id, fileName: meta[1], mimeType, size: buffer.length } }
}

function mimeByExtension(fileName: string): string {
  const lower = fileName.toLowerCase()
  if (lower.endsWith('.pdf')) return 'application/pdf'
  if (lower.endsWith('.docx')) return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  if (lower.endsWith('.xlsx')) return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  if (lower.endsWith('.pptx')) return 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
  return 'application/octet-stream'
}
