/**
 * TypeScript port of `slack-gif-creator/core/validators.py`.
 * Lightweight structural validation + Slack sizing guidance (no PIL).
 */
import type { Frame } from './frame'

export interface ValidationIssue {
  level: 'error' | 'warning'
  message: string
}

export interface GifValidationInput {
  width: number
  height: number
  frameCount: number
  fps: number
  colors: number
}

const MAX_DIMENSION = 2000
const MAX_FRAMES = 300
const SLACK_EMOJI_MAX_KB = 256

export function validateGifSpec(input: GifValidationInput): ValidationIssue[] {
  const issues: ValidationIssue[] = []
  if (input.width <= 0 || input.height <= 0) {
    issues.push({ level: 'error', message: 'Width and height must be positive' })
  }
  if (input.width > MAX_DIMENSION || input.height > MAX_DIMENSION) {
    issues.push({
      level: 'warning',
      message: `Large dimension (${input.width}x${input.height}); Slack displays best under ${MAX_DIMENSION}px`
    })
  }
  if (input.frameCount < 1) {
    issues.push({ level: 'error', message: 'At least one frame is required' })
  }
  if (input.frameCount > MAX_FRAMES) {
    issues.push({ level: 'warning', message: `Very high frame count (${input.frameCount}); consider reducing` })
  }
  if (input.fps <= 0) {
    issues.push({ level: 'error', message: 'fps must be positive' })
  }
  if (input.colors < 2 || input.colors > 256) {
    issues.push({ level: 'error', message: 'colors must be between 2 and 256' })
  }
  return issues
}

/** Heuristic file-size estimate (uncompressed-ish) used to warn before writing. */
export function estimateGifKb(width: number, height: number, frameCount: number, colors: number): number {
  const bytesPerPixel = Math.max(1, Math.ceil(Math.log2(colors) / 8))
  const raw = width * height * frameCount * bytesPerPixel
  const withOverhead = raw * 0.6 + frameCount * 8 // LZW + structure discount
  return withOverhead / 1024
}

export function validateGifSize(
  width: number,
  height: number,
  frameCount: number,
  colors: number
): ValidationIssue[] {
  const issues: ValidationIssue[] = []
  const kb = estimateGifKb(width, height, frameCount, colors)
  if (kb > 1024) {
    issues.push({
      level: 'warning',
      message: `Estimated ~${kb.toFixed(0)} KB; Slack emoji limit is ~${SLACK_EMOJI_MAX_KB} KB — reduce frames/colors/size`
    })
  }
  return issues
}

export function validateFramesConsistent(frames: Frame[]): ValidationIssue[] {
  const issues: ValidationIssue[] = []
  if (frames.length === 0) return issues
  const { width, height } = frames[0]
  for (let i = 1; i < frames.length; i++) {
    if (frames[i].width !== width || frames[i].height !== height) {
      issues.push({
        level: 'error',
        message: `Frame ${i} size ${frames[i].width}x${frames[i].height} != ${width}x${height}`
      })
    }
  }
  return issues
}
