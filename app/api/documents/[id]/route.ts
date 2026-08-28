import { NextRequest } from 'next/server'

import { resolveStoredDocument } from '@/lib/skills/document-store'

export const runtime = 'nodejs'

/**
 * Serve a generated document artifact by id. The id is the opaque key returned by
 * the `document` tool; the file is streamed with a Content-Disposition header so
 * the browser triggers a real download / preview.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<Response> {
  const { id } = await params
  const found = await resolveStoredDocument(id)
  if (!found) {
    return new Response('Document not found', { status: 404 })
  }

  const { buffer, meta } = found
  return new Response(new Uint8Array(buffer), {
    status: 200,
    headers: {
      'Content-Type': meta.mimeType,
      'Content-Disposition': `attachment; filename="${meta.fileName}"`,
      'Content-Length': String(meta.size),
      'Cache-Control': 'private, no-cache'
    }
  })
}
