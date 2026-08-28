/**
 * TypeScript port of `mcp-builder/scripts/connections.py`.
 *
 * MCP server connection helpers. The official Python `mcp` SDK maps to the
 * official `@modelcontextprotocol/sdk` npm package. We import it dynamically
 * (string specifier) so this file type-checks in a project that has not yet run
 * `bun add @modelcontextprotocol/sdk`. Install it to run:
 *
 *   bun add @modelcontextprotocol/sdk
 *
 * Run/import:  const { createConnection } = await import('./connections')
 */
import { type ChildProcessWithoutNullStreams, spawn } from 'child_process'

type AnyDict = Record<string, unknown>

/** Minimal shape of a connected MCP session (structural, SDK-agnostic). */
export interface McpSession {
  listTools(): Promise<{ tools: Array<{ name: string; description?: string; inputSchema?: unknown }> }>
  callTool(name: string, args: AnyDict): Promise<{ content: unknown }>
  close(): Promise<void>
}

export interface McpConnection {
  session: McpSession | null
  connect(): Promise<void>
  close(): Promise<void>
  listTools(): Promise<{ tools: Array<{ name: string; description?: string; inputSchema?: unknown }> }>
  callTool(name: string, args: AnyDict): Promise<unknown>
}

const SDK = '@modelcontextprotocol/sdk'

async function loadSdk() {
  const client = await import(`${SDK}/client/index.js`)
  const stdio = await import(`${SDK}/client/stdio.js`)
  const sse = await import(`${SDK}/client/sse.js`)
  const http = await import(`${SDK}/client/streamableHttp.js`)
  return { client, stdio, sse, http }
}

function makeConnection(
  sdk: Awaited<ReturnType<typeof loadSdk>>,
  transport: 'stdio' | 'sse' | 'http',
  opts: { command?: string; args?: string[]; env?: Record<string, string>; url?: string; headers?: Record<string, string> }
): McpConnection {
  let session: McpSession | null = null
  let transportObj: { close(): Promise<void> } | null = null

  return {
    get session() {
      return session
    },
    async connect() {
      let transportInstance: unknown
      if (transport === 'stdio') {
        if (!opts.command) throw new Error('Command is required for stdio transport')
        transportInstance = new sdk.stdio.StdioClientTransport({
          command: opts.command,
          args: opts.args ?? [],
          env: opts.env as Record<string, string> | undefined
        })
      } else if (transport === 'sse') {
        if (!opts.url) throw new Error('URL is required for sse transport')
        transportInstance = new sdk.sse.SSEClientTransport(new URL(opts.url), {
          requestInit: opts.headers ? { headers: opts.headers } : undefined
        })
      } else {
        if (!opts.url) throw new Error('URL is required for http transport')
        transportInstance = new sdk.http.StreamableHTTPClientTransport(new URL(opts.url), {
          requestInit: opts.headers ? { headers: opts.headers } : undefined
        })
      }
      const clientSession = new sdk.client.Client({ name: 'mcp-client', version: '1' })
      await clientSession.connect(transportInstance as object)
      // close the transport alongside the session
      transportObj = transportInstance as { close(): Promise<void> }
      session = clientSession as unknown as McpSession
    },
    async close() {
      await session?.close()
      await transportObj?.close().catch(() => {})
      session = null
      transportObj = null
    },
    async listTools() {
      if (!session) throw new Error('Not connected')
      return session.listTools()
    },
    async callTool(name: string, args: AnyDict) {
      if (!session) throw new Error('Not connected')
      // `session` is the real SDK client (cast to our McpSession interface), so
      // call its single-object form. Cast to avoid the interface mismatch.
      const res = await (session as any).callTool({ name, arguments: args })
      return res.content
    }
  }
}

export function createConnection(
  transport: string,
  options: {
    command?: string
    args?: string[]
    env?: Record<string, string>
    url?: string
    headers?: Record<string, string>
  } = {}
): McpConnection {
  const t = transport.toLowerCase()
  if (t === 'stdio') {
    if (!options.command) throw new Error('Command is required for stdio transport')
  } else if (t === 'sse' || t === 'http' || t === 'streamable_http' || t === 'streamable-http') {
    if (!options.url) throw new Error('URL is required for http/sse transport')
  } else {
    throw new Error(`Unsupported transport type: ${transport}. Use 'stdio', 'sse', or 'http'`)
  }

  const normalized: 'stdio' | 'sse' | 'http' = t === 'stdio' ? 'stdio' : t === 'sse' ? 'sse' : 'http'

  // Load the SDK lazily so this module is importable without the dependency present.
  let conn: McpConnection | null = null
  const lazy: McpConnection = {
    get session() {
      return conn?.session ?? null
    },
    async connect() {
      const sdk = await loadSdk()
      conn = makeConnection(sdk, normalized, options)
      await conn.connect()
    },
    async close() {
      await conn?.close()
      conn = null
    },
    async listTools() {
      if (!conn) throw new Error('Not connected')
      return conn.listTools()
    },
    async callTool(name: string, args: AnyDict) {
      if (!conn) throw new Error('Not connected')
      return conn.callTool(name, args)
    }
  }
  return lazy
}

// Re-export for convenience so callers can also inspect the process handle.
export type { ChildProcessWithoutNullStreams }
void spawn
