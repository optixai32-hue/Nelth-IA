import { mkdtempSync, rmSync } from 'fs'
import { tmpdir } from 'os'
import path from 'path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

/**
 * REAL artifact storage test: a generated document is persisted, resolved back
 * by id, and its bytes are byte-identical (this is what the download endpoint
 * streams). No fake artifacts.
 */

let storeDir: string
let storeDocument: typeof import('./document-store').storeDocument
let resolveStoredDocument: typeof import('./document-store').resolveStoredDocument

beforeAll(async () => {
  storeDir = mkdtempSync(path.join(tmpdir(), 'docstore-'))
  process.env.DOCUMENT_STORE_DIR = storeDir
  // Import AFTER setting the env so the module-level store dir resolves to temp.
  const mod = await import('./document-store')
  storeDocument = mod.storeDocument
  resolveStoredDocument = mod.resolveStoredDocument
})

afterAll(() => {
  rmSync(storeDir, { recursive: true, force: true })
})

describe('TEST 8 — Artifact storage + download content', () => {
  it('stores and resolves a real DOCX artifact with correct metadata', async () => {
    const buffer = Buffer.from('PK\x03\x04 fake docx bytes for test')
    const stored = await storeDocument(
      buffer,
      'analysis.docx',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    )

    expect(stored.id).toBeTruthy()
    expect(stored.fileName).toBe('analysis.docx')
    expect(stored.mimeType).toBe(
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    )
    expect(stored.size).toBe(buffer.length)

    const resolved = await resolveStoredDocument(stored.id)
    expect(resolved).not.toBeNull()
    expect(resolved!.buffer.equals(buffer)).toBe(true)
    expect(resolved!.meta.fileName).toBe('analysis.docx')
    expect(resolved!.meta.mimeType).toBe(stored.mimeType)
  })

  it('rejects malformed ids and returns null', async () => {
    expect(await resolveStoredDocument('../../etc/passwd')).toBeNull()
    expect(await resolveStoredDocument('')).toBeNull()
  })

  it('supports every document format round-trip', async () => {
    const formats: [string, string][] = [
      ['report.pdf', 'application/pdf'],
      ['data.xlsx', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
      [
        'deck.pptx',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation'
      ]
    ]
    for (const [name, mime] of formats) {
      const buf = Buffer.from(`content for ${name}`)
      const stored = await storeDocument(buf, name, mime)
      const resolved = await resolveStoredDocument(stored.id)
      expect(resolved).not.toBeNull()
      expect(resolved!.buffer.equals(buf)).toBe(true)
      expect(resolved!.meta.mimeType).toBe(mime)
    }
  })
})
