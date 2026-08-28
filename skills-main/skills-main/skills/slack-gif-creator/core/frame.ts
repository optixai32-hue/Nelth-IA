/**
 * TypeScript port of `slack-gif-creator/core/frame_composer.py`.
 *
 * A tiny RGB frame buffer (no PIL/canvas dependency) with the drawing
 * primitives used to compose Slack GIF frames: blank frame, gradient, circle,
 * star, rectangle, and text (via a built-in 5x7 bitmap font).
 */

export type RGB = [number, number, number]

const FONT: Record<string, string[]> = {
  'A': ['01110','10001','10011','10101','11001','10001','10001'],
  'B': ['11110','10001','11110','10001','10001','10001','11110'],
  'C': ['01110','10001','10000','10000','10000','10001','01110'],
  'D': ['11110','10001','10001','10001','10001','10001','11110'],
  'E': ['11111','10000','11110','10000','10000','10000','11111'],
  'F': ['11111','10000','11110','10000','10000','10000','10000'],
  'G': ['01110','10001','10000','10111','10001','10001','01111'],
  'H': ['10001','10001','11111','10001','10001','10001','10001'],
  'I': ['11111','00100','00100','00100','00100','00100','11111'],
  'J': ['00111','00010','00010','00010','00010','10010','01100'],
  'K': ['10001','10010','10100','11000','10100','10010','10001'],
  'L': ['10000','10000','10000','10000','10000','10000','11111'],
  'M': ['10001','11011','10101','10101','10001','10001','10001'],
  'N': ['10001','10001','11001','10101','10011','10001','10001'],
  'O': ['01110','10001','10001','10001','10001','10001','01110'],
  'P': ['11110','10001','10001','11110','10000','10000','10000'],
  'Q': ['01110','10001','10001','10001','10101','10010','01101'],
  'R': ['11110','10001','10001','11110','10100','10010','10001'],
  'S': ['01111','10000','10000','01110','00001','00001','11110'],
  'T': ['11111','00100','00100','00100','00100','00100','00100'],
  'U': ['10001','10001','10001','10001','10001','10001','01110'],
  'V': ['10001','10001','10001','10001','10001','01010','00100'],
  'W': ['10001','10001','10001','10101','10101','11011','10001'],
  'X': ['10001','10001','01010','00100','01010','10001','10001'],
  'Y': ['10001','10001','01010','00100','00100','00100','00100'],
  'Z': ['11111','00001','00010','00100','01000','10000','11111'],
  '0': ['01110','10011','10101','10101','11001','11001','01110'],
  '1': ['00100','01100','00100','00100','00100','00100','01110'],
  '2': ['01110','10001','00001','00110','01000','10000','11111'],
  '3': ['11110','00001','00001','01110','00001','00001','11110'],
  '4': ['00010','00110','01010','10010','11111','00010','00010'],
  '5': ['11111','10000','11110','00001','00001','10001','01110'],
  '6': ['01110','10000','10000','11110','10001','10001','01110'],
  '7': ['11111','00001','00010','00100','01000','01000','01000'],
  '8': ['01110','10001','10001','01110','10001','10001','01110'],
  '9': ['01110','10001','10001','01111','00001','00001','01110'],
  ' ': ['00000','00000','00000','00000','00000','00000','00000'],
  '!': ['00100','00100','00100','00100','00100','00000','00100'],
  '?': ['01110','10001','00001','00110','00100','00000','00100'],
  '.': ['00000','00000','00000','00000','00000','01100','01100'],
  ',': ['00000','00000','00000','00000','00100','01000','10000'],
  ':': ['00000','00100','00100','00000','00100','00100','00000'],
  '-': ['00000','00000','00000','11111','00000','00000','00000'],
  "'": ['00100','00100','01000','00000','00000','00000','00000']
}

export class Frame {
  readonly width: number
  readonly height: number
  readonly data: Uint8Array

  constructor(width: number, height: number, data?: Uint8Array) {
    this.width = width
    this.height = height
    this.data = data ?? new Uint8Array(width * height * 3).fill(255)
  }

  static blank(width: number, height: number, color: RGB = [255, 255, 255]): Frame {
    const f = new Frame(width, height)
    for (let i = 0; i < width * height; i++) {
      f.data[i * 3] = color[0]
      f.data[i * 3 + 1] = color[1]
      f.data[i * 3 + 2] = color[2]
    }
    return f
  }

  private idx(x: number, y: number): number {
    return (y * this.width + x) * 3
  }

  getPixel(x: number, y: number): RGB {
    const i = this.idx(x, y)
    return [this.data[i], this.data[i + 1], this.data[i + 2]]
  }

  setPixel(x: number, y: number, c: RGB): void {
    if (x < 0 || y < 0 || x >= this.width || y >= this.height) return
    const i = this.idx(x, y)
    this.data[i] = c[0]
    this.data[i + 1] = c[1]
    this.data[i + 2] = c[2]
  }

  drawCircle(
    cx: number,
    cy: number,
    radius: number,
    fill?: RGB,
    outline?: RGB,
    outlineWidth = 1
  ): void {
    const r2 = radius * radius
    for (let y = -radius; y <= radius; y++) {
      for (let x = -radius; x <= radius; x++) {
        const d = x * x + y * y
        if (fill && d <= r2) this.setPixel(cx + x, cy + y, fill)
        if (outline) {
          const inner = (radius - outlineWidth) * (radius - outlineWidth)
          if (d > inner && d <= r2) this.setPixel(cx + x, cy + y, outline)
        }
      }
    }
  }

  drawStar(cx: number, cy: number, size: number, fill: RGB, outline?: RGB, outlineWidth = 1): void {
    const points: Array<[number, number]> = []
    for (let i = 0; i < 10; i++) {
      const angle = ((i * 36 - 90) * Math.PI) / 180
      const r = i % 2 === 0 ? size : size * 0.4
      points.push([cx + r * Math.cos(angle), cy + r * Math.sin(angle)])
    }
    this.drawPolygon(points, fill, outline, outlineWidth)
  }

  drawPolygon(points: Array<[number, number]>, fill: RGB, outline?: RGB, outlineWidth = 1): void {
    // Bounding box scanline fill.
    let minX = Infinity
    let maxX = -Infinity
    let minY = Infinity
    let maxY = -Infinity
    for (const [px, py] of points) {
      minX = Math.min(minX, px)
      maxX = Math.max(maxX, px)
      minY = Math.min(minY, py)
      maxY = Math.max(maxY, py)
    }
    const inPoly = (x: number, y: number): boolean => {
      let inside = false
      for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
        const [xi, yi] = points[i]
        const [xj, yj] = points[j]
        if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside
      }
      return inside
    }
    for (let y = Math.floor(minY); y <= Math.ceil(maxY); y++) {
      for (let x = Math.floor(minX); x <= Math.ceil(maxX); x++) {
        if (inPoly(x + 0.5, y + 0.5)) this.setPixel(x, y, fill)
      }
    }
    if (outline) {
      for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
        this.drawLine(points[j], points[i], outline, outlineWidth)
      }
    }
  }

  private drawLine(a: [number, number], b: [number, number], color: RGB, width = 1): void {
    const steps = Math.max(Math.abs(b[0] - a[0]), Math.abs(b[1] - a[1])) * 2
    for (let s = 0; s <= steps; s++) {
      const t = s / steps
      const x = Math.round(a[0] + (b[0] - a[0]) * t)
      const y = Math.round(a[1] + (b[1] - a[1]) * t)
      this.setPixel(x, y, color)
      if (width > 1) this.setPixel(x + 1, y, color)
    }
  }

  drawRect(x: number, y: number, w: number, h: number, color: RGB): void {
    for (let yy = y; yy < y + h; yy++) {
      for (let xx = x; xx < x + w; xx++) {
        this.setPixel(xx, yy, color)
      }
    }
  }

  static gradient(width: number, height: number, top: RGB, bottom: RGB): Frame {
    const f = new Frame(width, height)
    for (let y = 0; y < height; y++) {
      const ratio = height <= 1 ? 0 : y / (height - 1)
      const r = Math.round(top[0] * (1 - ratio) + bottom[0] * ratio)
      const g = Math.round(top[1] * (1 - ratio) + bottom[1] * ratio)
      const b = Math.round(top[2] * (1 - ratio) + bottom[2] * ratio)
      for (let x = 0; x < width; x++) f.setPixel(x, y, [r, g, b])
    }
    return f
  }

  drawText(text: string, x: number, y: number, color: RGB, centered = false): void {
    const scale = 1
    const glyphW = 5 * scale + 1
    let cursorX = x
    if (centered) {
      const totalW = text.length * glyphW
      cursorX = x - totalW / 2
    }
    for (const ch of text.toUpperCase()) {
      const glyph = FONT[ch] ?? FONT['?']
      for (let row = 0; row < 7; row++) {
        for (let col = 0; col < 5; col++) {
          if (glyph[row][col] === '#') {
            this.setPixel(cursorX + col, y + row, color)
          }
        }
      }
      cursorX += glyphW
    }
  }

  /** Nearest-neighbor resize to a new size. */
  resize(width: number, height: number): Frame {
    const out = new Frame(width, height)
    for (let y = 0; y < height; y++) {
      const sy = Math.floor((y * this.height) / height)
      for (let x = 0; x < width; x++) {
        const sx = Math.floor((x * this.width) / width)
        const c = this.getPixel(sx, sy)
        out.setPixel(x, y, c)
      }
    }
    return out
  }
}
