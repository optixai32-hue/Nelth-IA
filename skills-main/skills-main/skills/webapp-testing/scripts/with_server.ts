/**
 * TypeScript port of `webapp-testing/scripts/with_server.py`.
 *
 * Starts one or more dev servers, waits until their ports accept connections,
 * runs a command, then terminates the servers. Pure Node (child_process + net),
 * no Python, no new dependencies.
 *
 * Run:  bun run skills-main/skills-main/skills/webapp-testing/scripts/with_server.ts \
 *         --server "npm run dev" --port 5173 -- npx tsx automation.ts
 */
import { spawn } from 'child_process'
import net from 'net'
import path from 'path'
import { fileURLToPath } from 'url'

interface ServerSpec {
  cmd: string
  port: number
}

function isServerReady(port: number, timeoutMs: number): Promise<boolean> {
  const start = Date.now()
  return new Promise(resolve => {
    const tryOnce = () => {
      const sock = net.connect(port, 'localhost')
      const done = (ok: boolean) => {
        sock.destroy()
        resolve(ok)
      }
      sock.setTimeout(1000)
      sock.once('connect', () => done(true))
      sock.once('error', () => {
        sock.destroy()
        if (Date.now() - start < timeoutMs) {
          setTimeout(tryOnce, 500)
        } else {
          resolve(false)
        }
      })
      sock.once('timeout', () => {
        sock.destroy()
        if (Date.now() - start < timeoutMs) {
          setTimeout(tryOnce, 500)
        } else {
          resolve(false)
        }
      })
    }
    tryOnce()
  })
}

interface ParsedArgs {
  servers: ServerSpec[]
  timeout: number
  command: string[]
}

function parseArgs(argv: string[]): ParsedArgs {
  const servers: ServerSpec[] = []
  let timeout = 30_000
  const command: string[] = []
  let i = 2
  while (i < argv.length) {
    const a = argv[i]
    if (a === '--server' || a === '-server') {
      servers.push({ cmd: argv[i + 1], port: 0 })
      i += 2
    } else if (a === '--port' || a === '-port') {
      if (servers.length === 0) throw new Error('--port must follow a --server')
      servers[servers.length - 1].port = Number(argv[i + 1])
      i += 2
    } else if (a === '--timeout' || a === '-timeout') {
      timeout = Number(argv[i + 1]) * 1000
      i += 2
    } else if (a === '--') {
      command.push(...argv.slice(i + 1))
      break
    } else {
      command.push(a)
      i += 1
    }
  }
  if (servers.length === 0) throw new Error('At least one --server is required')
  if (servers.some(s => !s.port)) throw new Error('Every --server needs a matching --port')
  if (command.length === 0) throw new Error('No command specified to run after the server(s)')
  return { servers, timeout, command }
}

export async function withServer(
  servers: ServerSpec[],
  timeout: number,
  command: string[]
): Promise<number> {
  const procs: ReturnType<typeof spawn>[] = []
  try {
    for (let idx = 0; idx < servers.length; idx++) {
      const s = servers[idx]
      console.log(`Starting server ${idx + 1}/${servers.length}: ${s.cmd}`)
      const proc = spawn(s.cmd, {
        shell: true,
        stdio: ['ignore', 'pipe', 'pipe']
      })
      proc.stdout?.on('data', d => process.stdout.write(d))
      proc.stderr?.on('data', d => process.stderr.write(d))
      procs.push(proc)

      console.log(`Waiting for server on port ${s.port}...`)
      const ready = await isServerReady(s.port, timeout)
      if (!ready) throw new Error(`Server failed to start on port ${s.port} within ${timeout / 1000}s`)
      console.log(`Server ready on port ${s.port}`)
    }

    console.log(`\nAll ${servers.length} server(s) ready`)
    console.log(`Running: ${command.join(' ')}\n`)
    const result = spawn(command[0], command.slice(1), { stdio: 'inherit', shell: true })
    const code = await new Promise<number>(res => result.on('exit', c => res(c ?? 1)))
    return code
  } finally {
    console.log(`\nStopping ${procs.length} server(s)...`)
    for (let idx = 0; idx < procs.length; idx++) {
      const p = procs[idx]
      try {
        p.kill('SIGTERM')
      } catch {
        /* ignore */
      }
      console.log(`Server ${idx + 1} stopped`)
    }
    console.log('All servers stopped')
  }
}

async function main(): Promise<void> {
  const { servers, timeout, command } = parseArgs(process.argv)
  const code = await withServer(servers, timeout, command)
  process.exit(code)
}

const thisFile = fileURLToPath(import.meta.url)
if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(thisFile)) {
  void main().catch(err => {
    console.error(String(err))
    process.exit(1)
  })
}
