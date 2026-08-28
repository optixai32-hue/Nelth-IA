/**
 * TypeScript port entry point for the `docx` Anthropic skill.
 *
 * The original `scripts/*.py` used python-docx + LibreOffice (soffice) to
 * manipulate .docx files. This TS port uses the `docx` npm library (the
 * TS-native equivalent) and is dynamically imported so the project type-checks
 * before the dependency is installed:
 *
 *   bun add docx
 *
 * LibreOffice/soffice-based validation & thumbnail steps are external binaries
 * (not Python) and are intentionally NOT reimplemented here — run soffice
 * separately if you need them.
 *
 * Run (after `bun add docx`):
 *   bun run skills-main/skills-main/skills/docx/scripts/docx.ts <output.docx>
 */
import { writeFileSync } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

export interface DocxBuildOptions {
  title?: string
  paragraphs?: string[]
}

/** Build a simple .docx from scratch (port of the docx skill's authoring path). */
export async function buildDocx(outputPath: string, opts: DocxBuildOptions = {}): Promise<void> {
  const pkgName = 'docx'
  const mod = await import(pkgName)
  const { Document, Packer, Paragraph, HeadingLevel, TextRun } = mod as Record<string, any>

  const children = [
    new Paragraph({ text: opts.title ?? 'Document', heading: HeadingLevel.HEADING_1 }),
    ...(opts.paragraphs ?? ['Generated with the docx Anthropic skill (TypeScript port).']).map(
      (p: string) => new Paragraph({ children: [new TextRun(p)] })
    )
  ]

  const doc = new Document({ sections: [{ children }] })
  const buf = await Packer.toBuffer(doc)
  const out = path.resolve(outputPath)
  writeFileSync(out, buf)
  console.log(`Wrote ${out}`)
}

async function main(): Promise<void> {
  const out = process.argv[2] || 'output.docx'
  await buildDocx(out)
}

const thisFile = fileURLToPath(import.meta.url)
if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(thisFile)) {
  void main().catch(err => {
    console.error(String(err))
    process.exit(1)
  })
}
