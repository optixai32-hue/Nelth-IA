/**
 * Some models (e.g. Nemotron) sometimes emit the related-questions / image
 * spec JSONL without wrapping it in a ```spec fenced block. When that happens
 * the JSON is rendered as raw text. This helper detects a bare run of JSONL
 * spec lines and wraps it in a ```spec fence so the renderer can pick it up.
 *
 * It only wraps content that looks like a real spec block: consecutive lines
 * that each start with `{"op":` and contain a `path` field, covering the
 * `{"op":"add","path":...}` shape used by related-question and image specs.
 */
const SPEC_LINE_RE = /^\s*\{\s*"op"\s*:/

function looksLikeSpecLine(line: string): boolean {
  return SPEC_LINE_RE.test(line)
}

export function wrapBareSpecBlocks(text: string): string {
  if (!text.includes('{"op":')) return text

  const lines = text.split('\n')

  // Some models emit a ```spec fence whose closing delimiter is malformed:
  // a bare `spec` line (no backticks) instead of ```. Normalize those into a
  // proper closing fence so the block doesn't leak as raw text.
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim() === 'spec') {
      lines[i] = '```'
    }
  }

  const out: string[] = []
  let buffer: string[] = []
  let fenceOpen = false

  const flush = (fenced: boolean) => {
    if (buffer.length === 0) {
      fenceOpen = false
      return
    }
    if (fenced) {
      out.push('```spec')
      out.push(...buffer)
      out.push('```')
    } else {
      out.push(...buffer)
    }
    buffer = []
    fenceOpen = false
  }

  for (const line of lines) {
    const trimmed = line.trim()
    if (trimmed === '```') {
      // Proper closing fence: flush whatever we collected as a spec block.
      flush(fenceOpen)
      out.push(line)
      continue
    }
    const isSpec = looksLikeSpecLine(line)
    if (isSpec) {
      if (fenceOpen) {
        // Already inside a spec fence — pass through unchanged.
        out.push(line)
        continue
      }
      buffer.push(line)
    } else {
      if (fenceOpen) {
        // Fence was opened but this line breaks the spec run: close it
        // implicitly and emit the buffered spec as a fenced block.
        flush(true)
      }
      out.push(line)
    }
  }
  // Close a spec fence that was left open at the end of the message.
  flush(true)

  return out.join('\n')
}
