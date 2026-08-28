/**
 * TypeScript port of `skill-creator/scripts/quick_validate.py`.
 *
 * Pure-Node validation of a skill's SKILL.md frontmatter against the Agent
 * Skills spec. No Python, no third-party YAML dependency — a small frontmatter
 * reader covers the scalar fields we need.
 *
 * Run:  bun run skills-main/skills-main/skills/skill-creator/scripts/quick_validate.ts <skill_directory>
 */
import { promises as fs } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const ALLOWED_PROPERTIES = new Set([
  'name',
  'description',
  'license',
  'allowed-tools',
  'metadata',
  'compatibility'
])

interface ValidationResult {
  valid: boolean
  message: string
}

/** Minimal frontmatter reader: top-level scalar keys + nested `metadata:` block. */
function parseFrontmatter(content: string): {
  ok: boolean
  top: Record<string, string>
  meta: Record<string, string>
  error?: string
} {
  if (!content.startsWith('---')) {
    return { ok: false, top: {}, meta: {}, error: 'No YAML frontmatter found' }
  }
  const match = content.match(/^---\n([\s\S]*?)\n---/)
  if (!match) {
    return { ok: false, top: {}, meta: {}, error: 'Invalid frontmatter format' }
  }
  const body = match[1]

  const top: Record<string, string> = {}
  const meta: Record<string, string> = {}
  let inMeta = false

  for (const rawLine of body.split('\n')) {
    const line = rawLine.replace(/\s+#.*$/, '')
    if (/^\s*$/.test(line)) continue
    if (/^metadata:\s*$/.test(line)) {
      inMeta = true
      continue
    }
    if (inMeta) {
      const m = line.match(/^\s+([a-z0-9_-]+):\s*(.*)$/i)
      if (m) meta[m[1].toLowerCase()] = m[2].trim()
      continue
    }
    const m = line.match(/^([a-z0-9_-]+):\s*(.*)$/i)
    if (m) top[m[1].toLowerCase()] = m[2].trim()
  }

  return { ok: true, top, meta }
}

export async function validateSkill(skillPath: string): Promise<ValidationResult> {
  const skillMd = path.join(skillPath, 'SKILL.md')
  let content: string
  try {
    content = await fs.readFile(skillMd, 'utf8')
  } catch {
    return { valid: false, message: 'SKILL.md not found' }
  }

  const fm = parseFrontmatter(content)
  if (!fm.ok) {
    return { valid: false, message: fm.error ?? 'Invalid frontmatter' }
  }

  const unexpected = Object.keys(fm.top).filter(k => !ALLOWED_PROPERTIES.has(k))
  if (unexpected.length > 0) {
    return {
      valid: false,
      message: `Unexpected key(s) in SKILL.md frontmatter: ${unexpected.join(', ')}. Allowed properties are: ${[...ALLOWED_PROPERTIES].join(', ')}`
    }
  }

  if (!('name' in fm.top)) return { valid: false, message: "Missing 'name' in frontmatter" }
  if (!('description' in fm.top)) {
    return { valid: false, message: "Missing 'description' in frontmatter" }
  }

  const name = (fm.top['name'] ?? '').trim()
  if (name) {
    if (!/^[a-z0-9-]+$/.test(name)) {
      return {
        valid: false,
        message: `Name '${name}' should be kebab-case (lowercase letters, digits, and hyphens only)`
      }
    }
    if (name.startsWith('-') || name.endsWith('-') || name.includes('--')) {
      return {
        valid: false,
        message: `Name '${name}' cannot start/end with hyphen or contain consecutive hyphens`
      }
    }
    if (name.length > 64) {
      return {
        valid: false,
        message: `Name is too long (${name.length} characters). Maximum is 64 characters.`
      }
    }
  }

  const description = (fm.top['description'] ?? '').trim()
  if (description) {
    if (description.includes('<') || description.includes('>')) {
      return { valid: false, message: 'Description cannot contain angle brackets (< or >)' }
    }
    if (description.length > 1024) {
      return {
        valid: false,
        message: `Description is too long (${description.length} characters). Maximum is 1024 characters.`
      }
    }
  }

  const compatibility = (fm.top['compatibility'] ?? '').trim()
  if (compatibility && compatibility.length > 500) {
    return {
      valid: false,
      message: `Compatibility is too long (${compatibility.length} characters). Maximum is 500 characters.`
    }
  }

  return { valid: true, message: 'Skill is valid!' }
}

async function main(): Promise<void> {
  const target = process.argv[2]
  if (!target) {
    console.error('Usage: bun quick_validate.ts <skill_directory>')
    process.exit(1)
  }
  const { valid, message } = await validateSkill(target)
  console.log(message)
  process.exit(valid ? 0 : 1)
}

const thisFile = fileURLToPath(import.meta.url)
if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(thisFile)) {
  void main()
}
