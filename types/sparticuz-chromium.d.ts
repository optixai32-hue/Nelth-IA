// Ambient declaration for @sparticuz/chromium.
//
// This dependency is only installed/required in serverless deployments (Vercel,
// AWS Lambda); it is intentionally NOT a hard requirement locally (where the
// Playwright-bundled Chromium is used instead). The dynamic import in
// lib/skills/document-pdf-html.ts casts to this minimal shape, and this ambient
// module keeps `tsc` happy when the package is absent from node_modules. When
// the real package is present, TypeScript resolves its own types and ignores
// this fallback declaration.

declare module '@sparticuz/chromium' {
  const chromium: {
    /** Toggle GPU/graphics subsystems (set false to keep the binary lean). */
    setGraphicsMode: boolean
    /** Recommended launch args for serverless Chromium. */
    args: string[]
    /** Resolve (and decompress if needed) the serverless Chromium path. */
    executablePath(): Promise<string>
  }
  export default chromium
}
