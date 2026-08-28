/**
 * TypeScript port entry point for the `pptx` Anthropic skill.
 *
 * Original `scripts/add_slide.py` used python-pptx. This uses `pptxgenjs`
 * (TS-native) via dynamic import so the project type-checks pre-install:
 *
 *   bun add pptxgenjs
 *
 * Run:  bun run skills-main/skills-main/skills/pptx/scripts/pptx.ts <output.pptx>
 */
import { writeFileSync } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

export interface SlideSpec {
  title: string
  bullets: string[]
}

/** Add a title + bullets slide to a new deck (port of add_slide.py behavior). */
export async function buildPptx(outputPath: string, slides: SlideSpec[] = []): Promise<void> {
  const pkgName = 'pptxgenjs'
  const mod = await import(pkgName)
  const PptxGenJS = (mod as Record<string, any>).default ?? mod
  const pptx = new PptxGenJS()

  const specs = slides.length
    ? slides
    : [{ title: 'Slide 1', bullets: ['Generated with the pptx Anthropic skill (TypeScript port).'] }]

  for (const s of specs) {
    const slide = pptx.addSlide()
    slide.addText(s.title, { x: 0.5, y: 0.5, fontSize: 28, bold: true })
    slide.addText(
      s.bullets.map(b => ({ text: b, options: { bullet: true } })),
      { x: 0.5, y: 1.5, fontSize: 18 }
    )
  }

  const buf = await pptx.write({ outputType: 'nodebuffer' })
  const out = path.resolve(outputPath)
  writeFileSync(out, buf)
  console.log(`Wrote ${out}`)
}

async function main(): Promise<void> {
  const out = process.argv[2] || 'output.pptx'
  await buildPptx(out)
}

const thisFile = fileURLToPath(import.meta.url)
if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(thisFile)) {
  void main().catch(err => {
    console.error(String(err))
    process.exit(1)
  })
}
