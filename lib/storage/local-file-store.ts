import fs from 'node:fs'
import path from 'node:path'

/**
 * Local filesystem fallback for uploaded files, used when object storage
 * (R2/S3) is not configured (e.g. local dev / anonymous mode). This lets file
 * uploads succeed out of the box instead of failing with
 * "File upload storage is not configured".
 *
 * Files are written under `.local-uploads/` (gitignored) keyed by the same
 * `${userId}/chats/${chatId}/${name}` path used for object storage, and served
 * back through `/api/local-file`.
 */

export const LOCAL_UPLOAD_DIR = path.join(process.cwd(), '.local-uploads')

const LOCAL_FILE_BASE_URL =
  process.env.NEXT_PUBLIC_BASE_URL?.replace(/\/+$/, '') ?? ''

export function getLocalFileUrl(key: string): string {
  const pathPart = `/api/local-file?key=${encodeURIComponent(key)}`
  return LOCAL_FILE_BASE_URL ? `${LOCAL_FILE_BASE_URL}${pathPart}` : pathPart
}

/**
 * Resolve a key to an absolute path strictly inside LOCAL_UPLOAD_DIR.
 * Returns null when the key is empty, contains a NUL byte, or escapes the base
 * directory (path traversal protection).
 */
function safeResolve(key: string): string | null {
  const normalized = key.replace(/^\/+/, '').trim()
  if (!normalized || normalized.includes('\0')) return null
  const resolved = path.resolve(LOCAL_UPLOAD_DIR, normalized)
  const base = path.resolve(LOCAL_UPLOAD_DIR)
  if (resolved !== base && !resolved.startsWith(base + path.sep)) return null
  return resolved
}

export function saveLocalFile(
  key: string,
  buffer: Buffer,
  contentType: string
): void {
  const resolved = safeResolve(key)
  if (!resolved) throw new Error('Invalid local file key')
  fs.mkdirSync(path.dirname(resolved), { recursive: true })
  fs.writeFileSync(resolved, buffer)
  // Persist the content type alongside the bytes so the GET route can serve it.
  fs.writeFileSync(`${resolved}.ct`, contentType)
}

export function readLocalFile(
  key: string
): { buffer: Buffer; contentType: string } | null {
  const resolved = safeResolve(key)
  if (!resolved) return null
  try {
    const buffer = fs.readFileSync(resolved)
    let contentType = 'application/octet-stream'
    try {
      contentType = fs.readFileSync(`${resolved}.ct`, 'utf8')
    } catch {
      // Fall back to octet-stream if the content-type sidecar is missing.
    }
    return { buffer, contentType }
  } catch {
    return null
  }
}
