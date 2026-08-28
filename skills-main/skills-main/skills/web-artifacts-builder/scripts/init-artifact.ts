/**
 * TypeScript port of `web-artifacts-builder/scripts/init-artifact.sh`.
 *
 * Scaffolds a React + Vite + Tailwind + shadcn/ui project (the artifact
 * builder workflow) using Node/pnpm — no bash, no Python. The optional
 * component tarball from the original script is skipped gracefully if absent.
 *
 * Run:  bun run skills-main/skills-main/skills/web-artifacts-builder/scripts/init-artifact.ts <project-name>
 */
import { execFileSync } from 'child_process'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

function run(cmd: string, args: string[], cwd?: string): void {
  execFileSync(cmd, args, { stdio: 'inherit', cwd, shell: false })
}

function nodeMajor(): number {
  return Number(process.versions.node.split('.')[0])
}

export function initArtifact(projectName: string): void {
  const nodeVersion = nodeMajor()
  console.log(`Detected Node.js version: ${nodeVersion}`)
  if (nodeVersion < 18) {
    throw new Error('Node.js 18 or higher is required')
  }
  const viteVersion = nodeVersion >= 20 ? 'latest' : '5.4.11'

  console.log(`Creating new React + Vite project: ${projectName}`)
  run('pnpm', ['create', 'vite', projectName, '--template', 'react-ts'])
  const projectDir = path.resolve(projectName)

  const indexHtml = path.join(projectDir, 'index.html')
  let html = readFileSync(indexHtml, 'utf8')
  html = html.replace(/<link rel="icon"[^>]*vite\.svg[^>]*>/g, '')
  html = html.replace(/<title>.*<\/title>/, `<title>${projectName}</title>`)
  writeFileSync(indexHtml, html)

  console.log('Installing base dependencies...')
  run('pnpm', ['install'], projectDir)
  if (nodeVersion < 20) {
    run('pnpm', ['add', '-D', `vite@${viteVersion}`], projectDir)
  }

  console.log('Installing Tailwind CSS and dependencies...')
  run(
    'pnpm',
    ['install', '-D', 'tailwindcss@3.4.1', 'postcss', 'autoprefixer', '@types/node', 'tailwindcss-animate'],
    projectDir
  )
  run(
    'pnpm',
    ['install', 'class-variance-authority', 'clsx', 'tailwind-merge', 'lucide-react', 'next-themes'],
    projectDir
  )

  writeFileSync(
    path.join(projectDir, 'postcss.config.js'),
    `export default {\n  plugins: {\n    tailwindcss: {},\n    autoprefixer: {},\n  },\n}\n`
  )

  writeFileSync(
    path.join(projectDir, 'tailwind.config.js'),
    `/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: { DEFAULT: "hsl(var(--primary))", foreground: "hsl(var(--primary-foreground))" },
        secondary: { DEFAULT: "hsl(var(--secondary))", foreground: "hsl(var(--secondary-foreground))" },
        destructive: { DEFAULT: "hsl(var(--destructive))", foreground: "hsl(var(--destructive-foreground))" },
        muted: { DEFAULT: "hsl(var(--muted))", foreground: "hsl(var(--muted-foreground))" },
        accent: { DEFAULT: "hsl(var(--accent))", foreground: "hsl(var(--accent-foreground))" },
        popover: { DEFAULT: "hsl(var(--popover))", foreground: "hsl(var(--popover-foreground))" },
        card: { DEFAULT: "hsl(var(--card))", foreground: "hsl(var(--card-foreground))" },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": { from: { height: "0" }, to: { height: "var(--radix-accordion-content-height)" } },
        "accordion-up": { from: { height: "0" }, to: { height: "0" } },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
`
  )

  writeFileSync(
    path.join(projectDir, 'src', 'index.css'),
    `@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 100%; --foreground: 0 0% 3.9%;
    --card: 0 0% 100%; --card-foreground: 0 0% 3.9%;
    --popover: 0 0% 100%; --popover-foreground: 0 0% 3.9%;
    --primary: 0 0% 9%; --primary-foreground: 0 0% 98%;
    --secondary: 0 0% 96.1%; --secondary-foreground: 0 0% 9%;
    --muted: 0 0% 96.1%; --muted-foreground: 0 0% 45.1%;
    --accent: 0 0% 96.1%; --accent-foreground: 0 0% 9%;
    --destructive: 0 84.2% 60.2%; --destructive-foreground: 0 0% 98%;
    --border: 0 0% 89.8%; --input: 0 0% 89.8%; --ring: 0 0% 3.9%;
    --radius: 0.5rem;
  }
  .dark {
    --background: 0 0% 3.9%; --foreground: 0 0% 98%;
    --card: 0 0% 3.9%; --card-foreground: 0 0% 98%;
    --popover: 0 0% 3.9%; --popover-foreground: 0 0% 98%;
    --primary: 0 0% 98%; --primary-foreground: 0 0% 9%;
    --secondary: 0 0% 14.9%; --secondary-foreground: 0 0% 98%;
    --muted: 0 0% 14.9%; --muted-foreground: 0 0% 63.9%;
    --accent: 0 0% 14.9%; --accent-foreground: 0 0% 98%;
    --destructive: 0 62.8% 30.6%; --destructive-foreground: 0 0% 98%;
    --border: 0 0% 14.9%; --input: 0 0% 14.9%; --ring: 0 0% 83.1%;
  }
}

@layer base {
  * { @apply border-border; }
  body { @apply bg-background text-foreground; }
}
`
  )

  const setAlias = (file: string) => {
    const cfg = JSON.parse(readFileSync(file, 'utf8'))
    cfg.compilerOptions = cfg.compilerOptions || {}
    cfg.compilerOptions.baseUrl = '.'
    cfg.compilerOptions.paths = { '@/*': ['./src/*'] }
    writeFileSync(file, JSON.stringify(cfg, null, 2))
  }
  setAlias(path.join(projectDir, 'tsconfig.json'))
  if (existsSync(path.join(projectDir, 'tsconfig.app.json'))) {
    setAlias(path.join(projectDir, 'tsconfig.app.json'))
  }

  writeFileSync(
    path.join(projectDir, 'vite.config.ts'),
    `import path from "path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  resolve: { alias: { "@": path.resolve(__dirname, "./src") } },
});
`
  )

  run(
    'pnpm',
    [
      'install',
      '@radix-ui/react-accordion', '@radix-ui/react-aspect-ratio', '@radix-ui/react-avatar',
      '@radix-ui/react-checkbox', '@radix-ui/react-collapsible', '@radix-ui/react-context-menu',
      '@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu', '@radix-ui/react-hover-card',
      '@radix-ui/react-label', '@radix-ui/react-menubar', '@radix-ui/react-navigation-menu',
      '@radix-ui/react-popover', '@radix-ui/react-progress', '@radix-ui/react-radio-group',
      '@radix-ui/react-scroll-area', '@radix-ui/react-select', '@radix-ui/react-separator',
      '@radix-ui/react-slider', '@radix-ui/react-slot', '@radix-ui/react-switch',
      '@radix-ui/react-tabs', '@radix-ui/react-toast', '@radix-ui/react-toggle',
      '@radix-ui/react-toggle-group', '@radix-ui/react-tooltip',
      'sonner', 'cmdk', 'vaul', 'embla-carousel-react', 'react-day-picker',
      'react-resizable-panels', 'date-fns', 'react-hook-form', '@hookform/resolvers', 'zod'
    ],
    projectDir
  )

  const tarball = path.join(path.dirname(fileURLToPath(import.meta.url)), 'shadcn-components.tar.gz')
  if (existsSync(tarball)) {
    mkdirSync(path.join(projectDir, 'src'), { recursive: true })
    run('tar', ['-xzf', tarball, '-C', path.join(projectDir, 'src')], projectDir)
  } else {
    console.log('  (skipped component tarball — shadcn-components.tar.gz not present)')
  }

  writeFileSync(
    path.join(projectDir, 'components.json'),
    `{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "default",
  "rsc": false,
  "tsx": true,
  "tailwind": { "config": "tailwind.config.js", "css": "src/index.css", "baseColor": "slate", "cssVariables": true, "prefix": "" },
  "aliases": { "components": "@/components", "utils": "@/lib/utils", "ui": "@/components/ui", "lib": "@/lib", "hooks": "@/hooks" }
}
`
  )

  console.log('Setup complete! Run: cd ' + projectName + ' && pnpm dev')
}

async function main(): Promise<void> {
  const name = process.argv[2]
  if (!name) {
    console.error('Usage: bun init-artifact.ts <project-name>')
    process.exit(1)
  }
  initArtifact(name)
}

const thisFile = fileURLToPath(import.meta.url)
if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(thisFile)) {
  void main().catch(err => {
    console.error(String(err))
    process.exit(1)
  })
}
