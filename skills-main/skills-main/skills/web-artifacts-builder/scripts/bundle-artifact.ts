/**
 * TypeScript port of `web-artifacts-builder/scripts/bundle-artifact.sh`.
 *
 * Bundles a React/Vite artifact project into a single self-contained HTML file
 * using Parcel + html-inline. Pure Node orchestration — no bash, no Python.
 *
 * Run:  bun run skills-main/skills-main/skills/web-artifacts-builder/scripts/bundle-artifact.ts
 */
import { execFileSync } from 'child_process'
import { existsSync, writeFileSync } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

function run(cmd: string, args: string[], cwd?: string): void {
  execFileSync(cmd, args, { stdio: 'inherit', cwd, shell: false })
}

export function bundleArtifact(): void {
  if (!existsSync('package.json')) {
    throw new Error('No package.json found. Run this script from your project root.')
  }
  if (!existsSync('index.html')) {
    throw new Error('No index.html found in project root.')
  }

  console.log('Installing bundling dependencies...')
  run('pnpm', ['add', '-D', 'parcel', '@parcel/config-default', 'parcel-resolver-tspaths', 'html-inline'])

  if (!existsSync('.parcelrc')) {
    console.log('Creating Parcel configuration with path-alias support...')
    writeFileSync(
      '.parcelrc',
      `{\n  "extends": "@parcel/config-default",\n  "resolvers": ["parcel-resolver-tspaths", "..."]\n}\n`
    )
  }

  console.log('Cleaning previous build...')
  run('pnpm', ['exec', 'rm', '-rf', 'dist', 'bundle.html'])

  console.log('Building with Parcel...')
  run('pnpm', ['exec', 'parcel', 'build', 'index.html', '--dist-dir', 'dist', '--no-source-maps'])

  console.log('Inlining all assets into single HTML file...')
  const out = execFileSync('pnpm', ['exec', 'html-inline', 'dist/index.html'], {
    encoding: 'utf8'
  })
  writeFileSync('bundle.html', out)

  console.log('\nBundle complete! Output: bundle.html')
  console.log('You can now use this single HTML file as an artifact in conversations.')
}

async function main(): Promise<void> {
  try {
    bundleArtifact()
  } catch (e) {
    console.error(String(e))
    process.exit(1)
  }
}

const thisFile = fileURLToPath(import.meta.url)
if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(thisFile)) {
  void main()
}
