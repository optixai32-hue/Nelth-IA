/**
 * TypeScript port entry point for the `pdf` Anthropic skill.
 *
 * Original `scripts/fill_fillable_fields.py` used pypdf + a PDF lib to fill
 * AcroForm fields. This uses `pdf-lib` (TS-native) via dynamic import so the
 * project type-checks pre-install:
 *
 *   bun add pdf-lib
 *
 * Run:  bun run skills-main/skills-main/skills/pdf/scripts/fill_pdf.ts <in.pdf> <out.pdf>
 */
import { readFileSync, writeFileSync } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

/** Fill top-level text AcroForm fields by name (port of fill_fillable_fields.py). */
export async function fillPdf(
  inputPath: string,
  outputPath: string,
  values: Record<string, string>
): Promise<void> {
  const pkgName = 'pdf-lib'
  const mod = await import(pkgName)
  const { PDFDocument } = mod as Record<string, any>
  const bytes = readFileSync(path.resolve(inputPath))
  const pdf = await PDFDocument.load(bytes)
  const form = pdf.getForm()

  for (const [name, value] of Object.entries(values)) {
    try {
      const field = form.getTextField(name)
      field.setText(value)
    } catch {
      console.warn(`Skipping field '${name}' (not a text field or not found)`)
    }
  }
  const buf = await pdf.save()
  const out = path.resolve(outputPath)
  writeFileSync(out, buf)
  console.log(`Filled ${Object.keys(values).length} field(s) -> ${out}`)
}

async function main(): Promise<void> {
  const [input, output, ...rest] = process.argv.slice(2)
  if (!input || !output) {
    console.error('Usage: bun fill_pdf.ts <in.pdf> <out.pdf> key=value ...')
    process.exit(1)
  }
  const values: Record<string, string> = {}
  for (const pair of rest) {
    const i = pair.indexOf('=')
    if (i > 0) values[pair.slice(0, i)] = pair.slice(i + 1)
  }
  await fillPdf(input, output, values)
}

const thisFile = fileURLToPath(import.meta.url)
if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(thisFile)) {
  void main().catch(err => {
    console.error(String(err))
    process.exit(1)
  })
}
