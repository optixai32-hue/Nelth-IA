/**
 * TypeScript port of `mcp-builder/scripts/evaluation.py`.
 *
 * Evaluates an MCP server by running XML-defined QA pairs against it using an
 * LLM agent loop. Depends on:
 *   - `@modelcontextprotocol/sdk` (connection) — see ./connections
 *   - `@anthropic-ai/sdk` (LLM) — install with `bun add @anthropic-ai/sdk`
 *
 * Both are imported dynamically (string specifiers) so this file type-checks
 * without the dependencies present.
 *
 * Run:  bun run skills-main/skills-main/skills/mcp-builder/scripts/evaluation.ts \
 *         eval.xml -t stdio -c "bun server.ts"
 */
import { readFileSync, writeFileSync } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

import { createConnection } from './connections'

type AnyDict = Record<string, unknown>

const EVALUATION_PROMPT = `You are an AI assistant with access to tools.

When given a task, you MUST:
1. Use the available tools to complete the task
2. Provide summary of each step in your approach, wrapped in <summary> tags
3. Provide feedback on the tools provided, wrapped in <feedback> tags
4. Provide your final response, wrapped in <response> tags

Summary Requirements:
- In your <summary> tags, explain the steps you took, which tools you used and why, the inputs and outputs.

Feedback Requirements:
- In your <feedback> tags, provide constructive feedback on tool names, parameters, descriptions, and errors.

Response Requirements:
- Wrap your final response in <response> tags
- If you cannot solve the task return <response>NOT_FOUND</response>
- Be concise and directly address what was asked`

interface QaPair {
  question: string
  answer: string
}

function parseEvaluationFile(file: string): QaPair[] {
  const xml = readFileSync(file, 'utf8')
  const pairs: QaPair[] = []
  const re = /<qa_pair>([\s\S]*?)<\/qa_pair>/g
  let m: RegExpExecArray | null
  while ((m = re.exec(xml))) {
    const block = m[1]
    const q = block.match(/<question>([\s\S]*?)<\/question>/)
    const a = block.match(/<answer>([\s\S]*?)<\/answer>/)
    if (q && a) {
      pairs.push({ question: q[1].trim(), answer: a[1].trim() })
    }
  }
  return pairs
}

function extractXml(text: string | null, tag: string): string | null {
  if (!text) return null
  const re = new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`)
  const mm = text.match(re)
  return mm ? mm[1].trim() : null
}

interface ToolSpec {
  name: string
  description?: string
  input_schema?: unknown
}

interface ToolMetric {
  count: number
  durations: number[]
}

async function agentLoop(
  client: { messages: { create(params: AnyDict): Promise<AnyDict> } },
  model: string,
  question: string,
  tools: ToolSpec[],
  conn: ReturnType<typeof createConnection>
): Promise<{ responseText: string | null; metrics: Record<string, ToolMetric> }> {
  const messages: AnyDict[] = [{ role: 'user', content: question }]
  const mcpTools = tools.map(t => ({
    name: t.name,
    description: t.description ?? '',
    input_schema: (t.input_schema as AnyDict) ?? { type: 'object', properties: {} }
  }))

  const metrics: Record<string, ToolMetric> = {}
  let response: AnyDict = await client.messages.create({
    model,
    max_tokens: 4096,
    system: EVALUATION_PROMPT,
    messages,
    tools: mcpTools
  })
  messages.push({ role: 'assistant', content: response.content })

  let guard = 0
  while (response.stop_reason === 'tool_use' && guard++ < 16) {
    const content = (response.content as AnyDict[]) || []
    const toolUse = content.find(c => c.type === 'tool_use') as AnyDict | undefined
    if (!toolUse) break
    const toolName: string = String(toolUse.name)
    const toolInput: AnyDict = (toolUse.input as AnyDict) || {}

    const start = Date.now()
    let toolResponse: string
    try {
      const result = await conn.callTool(toolName, toolInput)
      toolResponse =
        typeof result === 'object' ? JSON.stringify(result) : String(result)
    } catch (e) {
      toolResponse = `Error executing tool ${toolName}: ${String(e)}`
    }
    const dur = (Date.now() - start) / 1000

    if (!metrics[toolName]) metrics[toolName] = { count: 0, durations: [] }
    metrics[toolName].count += 1
    metrics[toolName].durations.push(dur)

    messages.push({
      role: 'user',
      content: [
        { type: 'tool_result', tool_use_id: toolUse.id, content: toolResponse }
      ]
    })

    response = await client.messages.create({
      model,
      max_tokens: 4096,
      system: EVALUATION_PROMPT,
      messages
    })
    messages.push({ role: 'assistant', content: response.content })
  }

  const content = (response.content as AnyDict[]) || []
  const textBlock = content.find(c => typeof c.text === 'string') as AnyDict | undefined
  return { responseText: textBlock ? String(textBlock.text) : null, metrics }
}

function parseHeaders(headerList?: string[]): Record<string, string> | undefined {
  if (!headerList) return undefined
  const headers: Record<string, string> = {}
  for (const h of headerList) {
    const idx = h.indexOf(':')
    if (idx > 0) headers[h.slice(0, idx).trim()] = h.slice(idx + 1).trim()
  }
  return headers
}

function parseEnv(envList?: string[]): Record<string, string> | undefined {
  if (!envList) return undefined
  const env: Record<string, string> = {}
  for (const e of envList) {
    const idx = e.indexOf('=')
    if (idx > 0) env[e.slice(0, idx).trim()] = e.slice(idx + 1).trim()
  }
  return env
}

async function runEvaluation(
  evalFile: string,
  conn: ReturnType<typeof createConnection>,
  model: string
): Promise<string> {
  console.log('Starting Evaluation')
  const sdkName = '@anthropic-ai/sdk'
  const sdk = await import(sdkName)
  const client = new (sdk as any).default({}) as {
    messages: { create(params: AnyDict): Promise<AnyDict> }
  }

  const { tools } = await conn.listTools()
  console.log(`Loaded ${tools.length} tools from MCP server`)

  const qaPairs = parseEvaluationFile(evalFile)
  console.log(`Loaded ${qaPairs.length} evaluation tasks`)

  const results: AnyDict[] = []
  for (let i = 0; i < qaPairs.length; i++) {
    console.log(`Task ${i + 1}: ${qaPairs[i].question}`)
    const { responseText, metrics } = await agentLoop(client, model, qaPairs[i].question, tools, conn)
    const actual = extractXml(responseText, 'response')
    const summary = extractXml(responseText, 'summary')
    const feedback = extractXml(responseText, 'feedback')
    results.push({
      question: qaPairs[i].question,
      expected: qaPairs[i].answer,
      actual: actual ?? null,
      score: actual && actual === qaPairs[i].answer ? 1 : 0,
      total_duration: 0,
      tool_calls: metrics,
      num_tool_calls: Object.values(metrics).reduce((s, m) => s + m.durations.length, 0),
      summary,
      feedback
    })
  }

  const total = results.length
  const correct = results.reduce((s, r) => s + (r.score as number), 0)
  const accuracy = total ? (correct / total) * 100 : 0
  const avgToolCalls = total
    ? results.reduce((s, r) => s + (r.num_tool_calls as number), 0) / total
    : 0

  let report = `# Evaluation Report\n\n## Summary\n\n- **Accuracy**: ${correct}/${total} (${accuracy.toFixed(1)}%)\n- **Average Tool Calls per Task**: ${avgToolCalls.toFixed(2)}\n- **Total Tool Calls**: ${results.reduce((s, r) => s + (r.num_tool_calls as number), 0)}\n\n---\n`
  results.forEach((r, i) => {
    report += `\n### Task ${i + 1}\n\n**Question**: ${r.question}\n**Ground Truth**: \`${r.expected}\`\n**Actual**: \`${r.actual ?? 'N/A'}\`\n**Correct**: ${r.score ? '✅' : '❌'}\n**Tool Calls**: ${JSON.stringify(r.tool_calls, null, 2)}\n\n**Summary**\n${r.summary ?? 'N/A'}\n\n**Feedback**\n${r.feedback ?? 'N/A'}\n\n---\n`
  })
  return report
}

async function main(): Promise<void> {
  const argv = process.argv.slice(2)
  let evalFile = ''
  let transport = 'stdio'
  let model = 'claude-3-7-sonnet-20250219'
  let command: string | undefined
  let args: string[] = []
  let url: string | undefined
  let headers: string[] | undefined
  let env: string[] | undefined
  let output: string | undefined

  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    if (a === '-t' || a === '--transport') transport = argv[++i]
    else if (a === '-m' || a === '--model') model = argv[++i]
    else if (a === '-c' || a === '--command') command = argv[++i]
    else if (a === '-a' || a === '--args') args = argv[++i].split(' ')
    else if (a === '-u' || a === '--url') url = argv[++i]
    else if (a === '-H' || a === '--header') headers = argv.slice(++i)
    else if (a === '-e' || a === '--env') env = argv.slice(++i)
    else if (a === '-o' || a === '--output') output = argv[++i]
    else if (!evalFile) evalFile = a
  }
  if (!evalFile) {
    console.error('Usage: bun evaluation.ts <eval.xml> -t stdio -c "command" [...]')
    process.exit(1)
  }

  const conn = createConnection(transport, {
    command,
    args,
    env: parseEnv(env),
    url,
    headers: parseHeaders(headers)
  })
  try {
    await conn.connect()
    console.log('Connected successfully')
    const report = await runEvaluation(evalFile, conn, model)
    if (output) {
      writeFileSync(output, report)
      console.log(`Report saved to ${output}`)
    } else {
      console.log('\n' + report)
    }
  } finally {
    await conn.close().catch(() => {})
  }
}

const thisFile = fileURLToPath(import.meta.url)
if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(thisFile)) {
  void main().catch(err => {
    console.error(String(err))
    process.exit(1)
  })
}
