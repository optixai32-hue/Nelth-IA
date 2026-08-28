/**
 * TypeScript port of the color-quantization + GIF89a writing done by
 * `slack-gif-creator/core/gif_builder.py` (which relied on PIL/numpy/imageio).
 *
 * Pure Node implementation:
 *  - `buildPalette` uses a median-cut quantizer (global palette across frames).
 *  - `encodeGIF` writes a GIF89a stream with an LZW compressor.
 *
 * No Python, no native modules.
 */
import type { Frame, RGB } from './frame'

type Pixel = [number, number, number]

function channelRange(box: Pixel[]): { min: number; max: number; ch: number } {
  let best = { min: 0, max: 0, ch: 0 }
  let bestSpan = -1
  for (let ch = 0; ch < 3; ch++) {
    let min = 255
    let max = 0
    for (const p of box) {
      if (p[ch] < min) min = p[ch]
      if (p[ch] > max) max = p[ch]
    }
    const span = max - min
    if (span > bestSpan) {
      bestSpan = span
      best = { min, max, ch }
    }
  }
  return best
}

function avgColor(box: Pixel[]): RGB {
  let r = 0
  let g = 0
  let b = 0
  for (const p of box) {
    r += p[0]
    g += p[1]
    b += p[2]
  }
  const n = box.length || 1
  return [Math.round(r / n), Math.round(g / n), Math.round(b / n)]
}

export function medianCut(pts: Pixel[], maxColors: number): RGB[] {
  if (pts.length === 0) return [[0, 0, 0]]
  let boxes: Pixel[][] = [pts]
  while (boxes.length < maxColors) {
    let bestIdx = -1
    let bestScore = -1
    for (let i = 0; i < boxes.length; i++) {
      const b = boxes[i]
      if (b.length < 2) continue
      const { min, max, ch } = channelRange(b)
      const score = b.length * (max - min)
      if (score > bestScore) {
        bestScore = score
        bestIdx = i
      }
    }
    if (bestIdx < 0) break
    const box = boxes[bestIdx]
    const { ch } = channelRange(box)
    box.sort((a, b) => a[ch] - b[ch])
    const mid = box.length >> 1
    const b1 = box.slice(0, mid)
    const b2 = box.slice(mid)
    boxes.splice(bestIdx, 1, b1, b2)
  }
  return boxes.map(avgColor)
}

function nearestPalette(p: Pixel, palette: RGB[]): number {
  let best = 0
  let bestDist = Infinity
  for (let i = 0; i < palette.length; i++) {
    const dr = p[0] - palette[i][0]
    const dg = p[1] - palette[i][1]
    const db = p[2] - palette[i][2]
    const d = dr * dr + dg * dg + db * db
    if (d < bestDist) {
      bestDist = d
      best = i
    }
  }
  return best
}

function nextPow2(n: number): number {
  let p = 2
  while (p < n) p <<= 1
  return Math.min(256, p)
}

export interface QuantizeResult {
  palette: RGB[]
  indices: Uint8Array[]
}

/** Build a global palette and return per-frame palette indices. */
export function buildPalette(frames: Frame[], numColors: number): QuantizeResult {
  const cap = 20000
  const sample: Pixel[] = []
  for (const f of frames) {
    const total = f.width * f.height
    const step = Math.max(1, Math.floor(total / cap))
    let taken = 0
    for (let i = 0; i < total && taken < cap; i += step) {
      const o = i * 3
      sample.push([f.data[o], f.data[o + 1], f.data[o + 2]])
      taken++
    }
  }
  const colors = Math.max(2, Math.min(256, numColors))
  const palette = medianCut(sample, colors)
  const padded = nextPow2(palette.length)
  while (palette.length < padded) palette.push([0, 0, 0])

  const indices = frames.map(f => {
    const idx = new Uint8Array(f.width * f.height)
    for (let i = 0; i < f.width * f.height; i++) {
      const o = i * 3
      idx[i] = nearestPalette([f.data[o], f.data[o + 1], f.data[o + 2]], palette)
    }
    return idx
  })
  return { palette, indices }
}

/** LZW-compress one frame's indices (omggif-style variable-width codes). */
function lzwEncode(indices: Uint8Array, minCodeSize: number): number[] {
  const clearCode = 1 << minCodeSize
  const eoiCode = clearCode + 1
  const out: number[] = []
  let cur = 0
  let curShift = 0
  let codeSize = minCodeSize + 1
  let nextCode = eoiCode + 1
  let table = new Map<number, number>()

  const emit = (c: number) => {
    cur |= c << curShift
    curShift += codeSize
    while (curShift >= 8) {
      out.push(cur & 0xff)
      cur >>= 8
      curShift -= 8
    }
  }

  emit(clearCode)
  if (indices.length === 0) {
    emit(eoiCode)
    if (curShift > 0) out.push(cur & 0xff)
    return out
  }

  let prefix = indices[0]
  for (let i = 1; i < indices.length; i++) {
    const k = indices[i]
    const key = (prefix << 8) | k
    const found = table.get(key)
    if (found !== undefined) {
      prefix = found
    } else {
      emit(prefix)
      if (nextCode === 4096) {
        emit(clearCode)
        nextCode = eoiCode + 1
        codeSize = minCodeSize + 1
        table = new Map()
      } else {
        if (nextCode >= 1 << codeSize && codeSize < 12) codeSize++
        table.set(key, nextCode++)
      }
      prefix = k
    }
  }
  emit(prefix)
  emit(eoiCode)
  if (curShift > 0) out.push(cur & 0xff)
  return out
}

function writeShort(buf: number[], v: number): void {
  buf.push(v & 0xff, (v >> 8) & 0xff)
}

/** Assemble a GIF89a Buffer from per-frame indices + a (power-of-two) palette. */
export function encodeGIF(
  width: number,
  height: number,
  indices: Uint8Array[],
  palette: RGB[],
  delaysMs: number[]
): Buffer {
  const padded = nextPow2(palette.length)
  const bits = Math.round(Math.log2(padded))
  const minCodeSize = Math.max(2, bits)

  const bytes: number[] = []
  // Header
  'GIF89a'.split('').forEach(c => bytes.push(c.charCodeAt(0)))
  // Logical Screen Descriptor
  writeShort(bytes, width)
  writeShort(bytes, height)
  bytes.push(0x80 | ((bits - 1) << 4) | (bits - 1)) // global table, color res, palette size
  bytes.push(0) // background color index
  bytes.push(0) // pixel aspect ratio
  // Global Color Table
  for (let i = 0; i < padded; i++) {
    const c = palette[i] ?? [0, 0, 0]
    bytes.push(c[0], c[1], c[2])
  }
  // NETSCAPE looping extension
  bytes.push(0x21, 0xff, 0x0b)
  'NETSCAPE2.0'.split('').forEach(c => bytes.push(c.charCodeAt(0)))
  bytes.push(0x03, 0x01)
  writeShort(bytes, 0) // loop forever
  bytes.push(0x00)

  for (let f = 0; f < indices.length; f++) {
    // Graphic Control Extension
    bytes.push(0x21, 0xf9, 0x04, 0x00)
    writeShort(bytes, Math.max(2, Math.round(delaysMs[f] / 10))) // delay in 1/100s
    bytes.push(0x00, 0x00)
    // Image Descriptor
    bytes.push(0x2c)
    writeShort(bytes, 0)
    writeShort(bytes, 0)
    writeShort(bytes, width)
    writeShort(bytes, height)
    bytes.push(0x00) // no local color table
    // LZW image data
    bytes.push(minCodeSize)
    const lzw = lzwEncode(indices[f], minCodeSize)
    // Sub-block the LZW stream
    let pos = 0
    while (pos < lzw.length) {
      const chunk = lzw.slice(pos, pos + 255)
      bytes.push(chunk.length)
      for (const b of chunk) bytes.push(b)
      pos += 255
    }
    bytes.push(0x00) // block terminator
  }
  bytes.push(0x3b) // trailer
  return Buffer.from(bytes)
}
