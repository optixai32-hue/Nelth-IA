import { describe, expect, test } from 'vitest'

import { wrapBareSpecBlocks } from '../wrap-bare-spec'

describe('wrapBareSpecBlocks', () => {
  test('wraps a bare run of spec JSONL lines', () => {
    const input = [
      'Here are some results.',
      '',
      '{"op":"add","path":"/elements/main","value":{"type":"Stack","children":["q1"]}}',
      '{"op":"add","path":"/elements/q1","value":{"type":"Button","props":{"text":"Follow up?"}}}',
      '',
      'That is all.'
    ].join('\n')

    const result = wrapBareSpecBlocks(input)
    expect(result).toContain('```spec')
    expect(result).toContain('That is all.')
    // The bare JSONL spec lines must be wrapped inside a fence, not left as
    // raw lines at the document root.
    expect(result).toMatch(/```spec\n\{"op"/)
    expect(result).not.toMatch(/\n\n\{"op"/)
  })

  test('repairs a malformed ```spec fence closed by a bare `spec` line', () => {
    // Some models open a ```spec fence but emit a lone `spec` line as the
    // closing delimiter (without backticks), then keep streaming JSON.
    const input = [
      'Answer text.',
      '',
      '```spec',
      '{"op":"add","path":"/root","value":"main"}',
      'spec',
      '{"op":"add","path":"/elements/main","value":{"type":"Stack","children":["q1"]}}',
      '{"op":"add","path":"/elements/q1","value":{"type":"Button","props":{"text":"Q?"}}}',
      '```'
    ].join('\n')

    const result = wrapBareSpecBlocks(input)
    // The bare `spec` line should become a proper closing fence, and the JSON
    // that followed it should be re-wrapped into its own spec block.
    const fences = result.match(/```spec/g) ?? []
    expect(fences.length).toBeGreaterThanOrEqual(1)
    expect(result).not.toContain('\nspec\n')
    expect(result).toContain('{"op":"add","path":"/elements/main"')
  })

  test('does not touch text without spec lines', () => {
    const input = 'Just a normal answer with no special blocks.'
    expect(wrapBareSpecBlocks(input)).toBe(input)
  })
})
