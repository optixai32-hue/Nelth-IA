/**
 * Related-question / follow-up buttons render as plain clickable labels, NOT
 * markdown. Some models emit markdown links (e.g. `[apple](https://…)`) as the
 * button `text` or submitted `query`. Strip that syntax so the label reads
 * naturally and the submitted query stays a clean string.
 */
export function stripMarkdownLinks(input: string): string {
  if (!input) return input
  return input
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/\bhttps?:\/\/\S+/gi, '')
    .replace(/\s+/g, ' ')
    .trim()
}
