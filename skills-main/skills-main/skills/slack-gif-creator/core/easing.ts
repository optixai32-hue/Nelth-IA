/**
 * TypeScript port of `slack-gif-creator/core/easing.py`.
 * Pure timing/easing math — no dependencies.
 */
export type EasingName =
  | 'linear'
  | 'ease_in'
  | 'ease_out'
  | 'ease_in_out'
  | 'bounce_in'
  | 'bounce_out'
  | 'bounce'
  | 'elastic_in'
  | 'elastic_out'
  | 'elastic'
  | 'back_in'
  | 'back_out'
  | 'back_in_out'
  | 'anticipate'
  | 'overshoot'

const c1 = 1.70158
const c3 = c1 + 1

export function linear(t: number): number {
  return t
}
export function easeInQuad(t: number): number {
  return t * t
}
export function easeOutQuad(t: number): number {
  return t * (2 - t)
}
export function easeInOutQuad(t: number): number {
  return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t
}
export function easeInCubic(t: number): number {
  return t * t * t
}
export function easeOutCubic(t: number): number {
  return (t - 1) * (t - 1) * (t - 1) + 1
}
export function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1
}
export function easeOutBounce(t: number): number {
  if (t < 1 / 2.75) return 7.5625 * t * t
  if (t < 2 / 2.75) return 7.5625 * (t -= 1.5 / 2.75) * t + 0.75
  if (t < 2.5 / 2.75) return 7.5625 * (t -= 2.25 / 2.75) * t + 0.9375
  return 7.5625 * (t -= 2.625 / 2.75) * t + 0.984375
}
export function easeInBounce(t: number): number {
  return 1 - easeOutBounce(1 - t)
}
export function easeInOutBounce(t: number): number {
  return t < 0.5 ? easeInBounce(t * 2) * 0.5 : easeOutBounce(t * 2 - 1) * 0.5 + 0.5
}
export function easeInElastic(t: number): number {
  if (t === 0 || t === 1) return t
  return -Math.pow(2, 10 * (t - 1)) * Math.sin((t - 1.1) * 5 * Math.PI)
}
export function easeOutElastic(t: number): number {
  if (t === 0 || t === 1) return t
  return Math.pow(2, -10 * t) * Math.sin((t - 0.1) * 5 * Math.PI) + 1
}
export function easeInOutElastic(t: number): number {
  if (t === 0 || t === 1) return t
  t = t * 2 - 1
  if (t < 0) return -0.5 * Math.pow(2, 10 * t) * Math.sin((t - 0.1) * 5 * Math.PI)
  return Math.pow(2, -10 * t) * Math.sin((t - 0.1) * 5 * Math.PI) * 0.5 + 1
}
export function easeBackIn(t: number): number {
  return c3 * t * t * t - c1 * t * t
}
export function easeBackOut(t: number): number {
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}
export function easeBackInOut(t: number): number {
  const c2 = c1 * 1.525
  if (t < 0.5) return (Math.pow(2 * t, 2) * ((c2 + 1) * 2 * t - c2)) / 2
  return (Math.pow(2 * t - 2, 2) * ((c2 + 1) * (t * 2 - 2) + c2) + 2) / 2
}

const EASING_FUNCTIONS: Record<EasingName, (t: number) => number> = {
  linear,
  ease_in: easeInQuad,
  ease_out: easeOutQuad,
  ease_in_out: easeInOutQuad,
  bounce_in: easeInBounce,
  bounce_out: easeOutBounce,
  bounce: easeInOutBounce,
  elastic_in: easeInElastic,
  elastic_out: easeOutElastic,
  elastic: easeInOutElastic,
  back_in: easeBackIn,
  back_out: easeBackOut,
  back_in_out: easeBackInOut,
  anticipate: easeBackIn,
  overshoot: easeBackOut
}

export function getEasing(name: EasingName | string = 'linear'): (t: number) => number {
  return (EASING_FUNCTIONS as Record<string, (t: number) => number>)[name] ?? linear
}

export function interpolate(start: number, end: number, t: number, easing: string = 'linear'): number {
  return start + (end - start) * getEasing(easing)(t)
}

export function applySquashStretch(
  baseScale: [number, number],
  intensity: number,
  direction: 'vertical' | 'horizontal' | 'both' = 'vertical'
): [number, number] {
  let [w, h] = baseScale
  if (direction === 'vertical') {
    h *= 1 - intensity * 0.5
    w *= 1 + intensity * 0.5
  } else if (direction === 'horizontal') {
    w *= 1 - intensity * 0.5
    h *= 1 + intensity * 0.5
  } else {
    w *= 1 - intensity * 0.3
    h *= 1 - intensity * 0.3
  }
  return [w, h]
}

export function calculateArcMotion(
  start: [number, number],
  end: [number, number],
  height: number,
  t: number
): [number, number] {
  const [x1, y1] = start
  const [x2, y2] = end
  const x = x1 + (x2 - x1) * t
  const arcOffset = 4 * height * t * (1 - t)
  const y = y1 + (y2 - y1) * t - arcOffset
  return [x, y]
}
