/**
 * TypeScript port of `slack-gif-creator/core/gif_builder.py`.
 *
 * Builds optimized GIFs from programmatically composed frames, reusing the
 * pure-TS Frame buffer, median-cut quantizer, and GIF89a codec. No Python.
 *
 * Run (module):  import { GIFBuilder } from './gif_builder'
 */
import { promises as fs } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

import { Frame } from './frame'
import { buildPalette, encodeGIF } from './gif_codec'
import { validateFramesConsistent, validateGifSize, validateGifSpec } from './validators'

export class GIFBuilder {
  width: number
  height: number
  fps: number
  frames: Frame[] = []

  constructor(width = 480, height = 480, fps = 15) {
    this.width = width
    this.height = height
    this.fps = fps
  }

  addFrame(frame: Frame): void {
    let f = frame
    if (f.width !== this.width || f.height !== this.height) {
      f = f.resize(this.width, this.height)
    }
    this.frames.push(f)
  }

  addFrames(frames: Frame[]): void {
    for (const f of frames) this.addFrame(f)
  }

  /** Remove consecutive near-duplicate frames to shrink the file. */
  deduplicateFrames(threshold = 0.9995): number {
    if (this.frames.length < 2) return 0
    const kept: Frame[] = [this.frames[0]]
    let removed = 0
    for (let i = 1; i < this.frames.length; i++) {
      const prev = kept[kept.length - 1]
      const curr = this.frames[i]
      let diffSum = 0
      let count = 0
      const n = Math.min(prev.data.length, curr.data.length)
      for (let o = 0; o < n; o += 17) {
        diffSum += Math.abs(prev.data[o] - curr.data[o])
        count++
      }
      const similarity = 1 - diffSum / (count * 255) / 3
      if (similarity < threshold) kept.push(curr)
      else removed++
    }
    this.frames = kept
    return removed
  }

  private optimizeEmoji(): void {
    if (this.width > 128 || this.height > 128) {
      this.width = 128
      this.height = 128
      this.frames = this.frames.map(f => f.resize(128, 128))
      console.log('  Resizing to 128x128 for emoji')
    }
    if (this.frames.length > 12) {
      const keep = Math.max(1, Math.floor(this.frames.length / 12))
      this.frames = this.frames.filter((_, i) => i % keep === 0).slice(0, 12)
      console.log(`  Reducing frames to ~12 for emoji size`)
    }
  }

  async save(
    outputPath: string,
    opts: { numColors?: number; optimizeForEmoji?: boolean; removeDuplicates?: boolean } = {}
  ): Promise<{ path: string; sizeKb: number; dimensions: string; frameCount: number; fps: number; colors: number }> {
    if (this.frames.length === 0) throw new Error('No frames to save. Add frames with addFrame() first.')

    let numColors = Math.max(2, Math.min(256, opts.numColors ?? 128))

    if (opts.removeDuplicates) {
      const removed = this.deduplicateFrames(0.9995)
      if (removed > 0) console.log(`  Removed ${removed} near-duplicate frames`)
    }
    if (opts.optimizeForEmoji) {
      this.optimizeEmoji()
      numColors = Math.min(numColors, 48)
    }

    for (const issue of validateGifSpec({
      width: this.width,
      height: this.height,
      frameCount: this.frames.length,
      fps: this.fps,
      colors: numColors
    })) {
      if (issue.level === 'error') throw new Error(issue.message)
    }
    for (const issue of validateFramesConsistent(this.frames)) {
      if (issue.level === 'error') throw new Error(issue.message)
    }
    for (const issue of validateGifSize(this.width, this.height, this.frames.length, numColors)) {
      if (issue.level === 'warning') console.log(`  Note: ${issue.message}`)
    }

    const { palette, indices } = buildPalette(this.frames, numColors)
    const delays = this.frames.map(() => 1000 / this.fps)
    const buf = encodeGIF(this.width, this.height, indices, palette, delays)

    const out = path.resolve(outputPath)
    await fs.writeFile(out, buf)

    const sizeKb = buf.length / 1024
    const sizeMb = sizeKb / 1024
    console.log('\nGIF created successfully!')
    console.log(`  Path: ${out}`)
    console.log(`  Size: ${sizeKb.toFixed(1)} KB (${sizeMb.toFixed(2)} MB)`)
    console.log(`  Dimensions: ${this.width}x${this.height}`)
    console.log(`  Frames: ${this.frames.length} @ ${this.fps} fps`)
    console.log(`  Colors: ${numColors}`)

    return {
      path: out,
      sizeKb,
      dimensions: `${this.width}x${this.height}`,
      frameCount: this.frames.length,
      fps: this.fps,
      colors: numColors
    }
  }

  clear(): void {
    this.frames = []
  }
}

async function main(): Promise<void> {
  const out = process.argv[2] || 'out.gif'
  const b = new GIFBuilder(200, 200, 15)
  for (let i = 0; i < 20; i++) {
    const f = Frame.blank(200, 200, [240, 240, 245])
    const t = i / 19
    const cx = Math.round(100 + 70 * Math.sin(t * Math.PI * 2))
    f.drawCircle(cx, 100, 40, [220, 60, 90], [40, 20, 60], 2)
    b.addFrame(f)
  }
  await b.save(out, { numColors: 64 })
}

const thisFile = fileURLToPath(import.meta.url)
if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(thisFile)) {
  void main().catch(err => {
    console.error(String(err))
    process.exit(1)
  })
}
