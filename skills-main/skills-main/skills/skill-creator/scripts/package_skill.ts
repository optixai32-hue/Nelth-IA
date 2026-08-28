/**
 * TypeScript port of `skill-creator/scripts/package_skill.py`.
 *
 * Packages a skill folder into a `.skill` archive (ZIP format) without Python.
 * We implement a minimal STORED (no-compression) ZIP writer in pure Node so no
 * external dependency is required. Validation is delegated to `quick_validate`.
 *
 * Run:  bun run skills-main/skills-main/skills/skill-creator/scripts/package_skill.ts <skill-folder> [output-dir]
 */
import { promises as fs } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

import { validateSkill } from './quick_validate'

const EXCLUDE_DIRS = new Set(['__pycache__', 'node_modules'])
const EXCLUDE_GLOBS = ['*.pyc']
const EXCLUDE_FILES = new Set(['.DS_Store'])
const ROOT_EXCLUDE_DIRS = new Set(['evals'])

function shouldExclude(relParts: string[], name: string): boolean {
  if (relParts.some(p => EXCLUDE_DIRS.has(p))) return true
  if (relParts.length > 1 && ROOT_EXCLUDE_DIRS.has(relParts[1])) return true
  if (EXCLUDE_FILES.has(name)) return true
  return EXCLUDE_GLOBS.some(g => {
    const re = new RegExp('^' + g.replace(/[.]/g, '\\.').replace(/\*/g, '.*') + '$')
    return re.test(name)
  })
}

/** CRC32 (IEEE) — needed for the ZIP central directory. */
function crc32(buf: Buffer): number {
  let crc = ~0
  for (let i = 0; i < buf.length; i++) {
    crc ^= buf[i]
    for (let k = 0; k < 8; k++) {
      crc = crc & 1 ? (crc >>> 1) ^ 0xedb88320 : crc >>> 1
    }
  }
  return ~crc >>> 0
}

interface ZipEntry {
  name: string
  data: Buffer
  crc: number
  offset: number
}

/** Build a STORED (uncompressed) ZIP archive in memory and return its bytes. */
function buildZip(files: { name: string; data: Buffer }[]): Buffer {
  const entries: ZipEntry[] = []
  const chunks: Buffer[] = []
  let offset = 0

  for (const f of files) {
    const crc = crc32(f.data)
    const local = Buffer.alloc(30)
    local.writeUInt32LE(0x04034b50, 0)
    local.writeUInt16LE(20, 4)
    local.writeUInt16LE(0, 6)
    local.writeUInt16LE(0, 8)
    local.writeUInt16LE(0, 10)
    local.writeUInt16LE(0, 12)
    local.writeUInt32LE(crc, 14)
    local.writeUInt32LE(f.data.length, 18)
    local.writeUInt32LE(f.data.length, 22)
    local.writeUInt16LE(Buffer.byteLength(f.name), 26)
    local.writeUInt16LE(0, 28)
    chunks.push(local, Buffer.from(f.name, 'utf8'), f.data)
    entries.push({ name: f.name, data: f.data, crc, offset })
    offset += local.length + Buffer.byteLength(f.name) + f.data.length
  }

  const centralStart = offset
  for (const e of entries) {
    const cd = Buffer.alloc(46)
    cd.writeUInt32LE(0x02014b50, 0)
    cd.writeUInt16LE(20, 4)
    cd.writeUInt16LE(20, 6)
    cd.writeUInt16LE(0, 8)
    cd.writeUInt16LE(0, 10)
    cd.writeUInt16LE(0, 12)
    cd.writeUInt16LE(0, 14)
    cd.writeUInt32LE(e.crc, 16)
    cd.writeUInt32LE(e.data.length, 20)
    cd.writeUInt32LE(e.data.length, 24)
    cd.writeUInt16LE(Buffer.byteLength(e.name), 28)
    cd.writeUInt16LE(0, 30)
    cd.writeUInt16LE(0, 32)
    cd.writeUInt16LE(0, 34)
    cd.writeUInt16LE(0, 36)
    cd.writeUInt32LE(0, 38)
    cd.writeUInt32LE(e.offset, 42)
    chunks.push(cd, Buffer.from(e.name, 'utf8'))
    offset += cd.length + Buffer.byteLength(e.name)
  }

  const end = Buffer.alloc(22)
  end.writeUInt32LE(0x06054b50, 0)
  end.writeUInt16LE(0, 4)
  end.writeUInt16LE(0, 6)
  end.writeUInt16LE(entries.length, 8)
  end.writeUInt16LE(entries.length, 10)
  end.writeUInt32LE(offset - centralStart, 12)
  end.writeUInt32LE(centralStart, 16)
  end.writeUInt16LE(0, 20)
  chunks.push(end)

  return Buffer.concat(chunks)
}

export async function packageSkill(
  skillPath: string,
  outputDir?: string
): Promise<string | null> {
  const root = path.resolve(skillPath)
  let stat: import('fs').Stats
  try {
    stat = await fs.stat(root)
  } catch {
    console.error(`Error: Skill folder not found: ${root}`)
    return null
  }
  if (!stat.isDirectory()) {
    console.error(`Error: Path is not a directory: ${root}`)
    return null
  }
  try {
    await fs.access(path.join(root, 'SKILL.md'))
  } catch {
    console.error(`Error: SKILL.md not found in ${root}`)
    return null
  }

  console.log('Validating skill...')
  const { valid, message } = await validateSkill(root)
  if (!valid) {
    console.error(`Validation failed: ${message}`)
    console.error('Please fix the validation errors before packaging.')
    return null
  }
  console.log(`✅ ${message}\n`)

  const skillName = path.basename(root)
  const outBase = outputDir ? path.resolve(outputDir) : process.cwd()
  await fs.mkdir(outBase, { recursive: true })
  const skillFile = path.join(outBase, `${skillName}.skill`)

  const files: { name: string; data: Buffer }[] = []
  const walk = async (dir: string, rel: string[]) => {
    const entries = await fs.readdir(dir, { withFileTypes: true })
    for (const entry of entries) {
      const parts = [...rel, entry.name]
      if (entry.isDirectory()) {
        if (shouldExclude(parts, entry.name)) {
          console.log(`  Skipped: ${parts.join('/')}`)
          continue
        }
        await walk(path.join(dir, entry.name), parts)
      } else if (entry.isFile()) {
        if (shouldExclude(parts, entry.name)) {
          console.log(`  Skipped: ${parts.join('/')}`)
          continue
        }
        const data = await fs.readFile(path.join(dir, entry.name))
        files.push({ name: parts.join('/'), data })
        console.log(`  Added: ${parts.join('/')}`)
      }
    }
  }
  await walk(root, [skillName])

  const zip = buildZip(files)
  await fs.writeFile(skillFile, zip)
  console.log(`\n✅ Successfully packaged skill to: ${skillFile}`)
  return skillFile
}

async function main(): Promise<void> {
  const skillPath = process.argv[2]
  if (!skillPath) {
    console.error('Usage: bun package_skill.ts <path/to/skill-folder> [output-directory]')
    process.exit(1)
  }
  const outputDir = process.argv[3]
  const result = await packageSkill(skillPath, outputDir)
  process.exit(result ? 0 : 1)
}

const thisFile = fileURLToPath(import.meta.url)
if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(thisFile)) {
  void main()
}
