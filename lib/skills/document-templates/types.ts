export interface TemplateDef {
  label: string
  css: (accent: string) => string
  /** Optional custom wrapper around the rendered Markdown body. */
  wrap?: (body: string, accent: string) => string
}
