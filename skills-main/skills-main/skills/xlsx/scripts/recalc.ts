/**
 * TypeScript port entry point for the `xlsx` Anthropic skill.
 *
 * Original `scripts/recalc.py` recalculated formulas with openpyxl + LibreOffice.
 * This uses `exceljs` to read/write the workbook and `hot-formula-parser` to
 * actually evaluate every formula (ExcelJS itself does not compute results):
 *
 *   bun add exceljs hot-formula-parser
 *
 * Run:  bun run skills-main/skills-main/skills/xlsx/scripts/recalc.ts <file.xlsx>
 */
import { readFileSync, writeFileSync } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

/** True when an ExcelJS cell value is a formula descriptor. */
function isFormula(value: unknown): value is { formula?: string; sharedFormula?: string } {
  return (
    !!value &&
    typeof value === 'object' &&
    ('formula' in value || 'sharedFormula' in value)
  )
}

/** Recalculate every formula in a workbook and write the computed values back. */
export async function recalc(inputPath: string, outputPath?: string): Promise<void> {
  const excelMod = await import('exceljs')
  const ExcelJS = (excelMod as Record<string, any>).default ?? excelMod
  const hfp = await import('hot-formula-parser')
  const Parser = (hfp as Record<string, any>).Parser ?? (hfp as Record<string, any>).default?.Parser

  const wb = new ExcelJS.Workbook()
  await wb.xlsx.readFile(path.resolve(inputPath))

  const out = outputPath ? path.resolve(outputPath) : path.resolve(inputPath)

  for (const ws of wb.worksheets) {
    const parser = new Parser()
    const evaluating = new Set<string>()

    const getValue = (row: number, col: number): unknown => {
      const cell = ws.getCell(row, col)
      const v = cell.value
      if (isFormula(v)) {
        const key = `${row}:${col}`
        if (evaluating.has(key)) return 0
        evaluating.add(key)
        let result: unknown
        try {
          const parsed = parser.parse((v.formula ?? v.sharedFormula) as string)
          result = parsed.error ? 0 : parsed.result
        } finally {
          evaluating.delete(key)
        }
        return result
      }
      if (v && typeof v === 'object' && 'result' in v) return (v as any).result
      return v
    }

    parser.on('callCellValue', (coord: any, done: (v: unknown) => void) => {
      done(getValue(coord.row.index + 1, coord.column.index + 1))
    })
    parser.on('callRangeValue', (start: any, end: any, done: (v: unknown[][]) => void) => {
      const grid: unknown[][] = []
      for (let r = start.row.index; r <= end.row.index; r++) {
        const rowArr: unknown[] = []
        for (let c = start.column.index; c <= end.column.index; c++) {
          rowArr.push(getValue(r + 1, c + 1))
        }
        grid.push(rowArr)
      }
      done(grid)
    })

    ws.eachRow((row: any) => {
      row.eachCell((cell: any) => {
        if (isFormula(cell.value)) {
          const parsed = parser.parse(
            (cell.value.formula ?? cell.value.sharedFormula) as string
          )
          if (!parsed.error) cell.value = parsed.result
        }
      })
    })
  }

  await wb.xlsx.writeFile(out)
  console.log(`Recalculated and wrote ${out}`)
}

async function main(): Promise<void> {
  const inPath = process.argv[2]
  if (!inPath) {
    console.error('Usage: bun recalc.ts <file.xlsx> [output.xlsx]')
    process.exit(1)
  }
  await recalc(inPath, process.argv[3])
}

const thisFile = fileURLToPath(import.meta.url)
if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(thisFile)) {
  void main().catch(err => {
    console.error(String(err))
    process.exit(1)
  })
}
