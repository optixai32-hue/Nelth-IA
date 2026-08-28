import { NextRequest, NextResponse } from 'next/server'

import { readLocalFile } from '@/lib/storage/local-file-store'

/**
 * Serves files stored by the local filesystem fallback (used when object
 * storage is not configured). Key is validated inside `readLocalFile` so it
 * can never escape the local upload directory.
 */
export async function GET(req: NextRequest) {
  const key = req.nextUrl.searchParams.get('key')
  if (!key) {
    return new NextResponse('Missing key', { status: 400 })
  }

  const file = readLocalFile(key)
  if (!file) {
    return new NextResponse('Not found', { status: 404 })
  }

  return new NextResponse(new Uint8Array(file.buffer), {
    status: 200,
    headers: {
      'Content-Type': file.contentType,
      'Cache-Control': 'max-age=3600'
    }
  })
}
