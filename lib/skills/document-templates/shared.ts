/**
 * Shared CSS used by every premium template (resets + base element styling).
 * Templates append their own heading/layout rules, so keep this generic.
 * Accent color is injected by the renderer as the `--accent` CSS variable.
 */
export const BASE_CSS = `
* { box-sizing: border-box; }
html { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
body { margin: 0; color: #1a1a1e; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; font-size: 15px; line-height: 1.65; }
main { max-width: 760px; margin: 0 auto; padding: 8px 4px 24px; }
p { margin: 0.85em 0; }
a { color: var(--accent); text-decoration: none; border-bottom: 1px solid color-mix(in srgb, var(--accent) 30%, transparent); }
strong { font-weight: 700; }
em { font-style: italic; }
ul, ol { margin: 0.85em 0; padding-left: 1.5em; }
li { margin: 0.3em 0; }
code { font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace; font-size: 0.88em; background: #f4f4f7; padding: 0.15em 0.4em; border-radius: 5px; color: #b3205f; }
pre { background: #0d1117; color: #e6edf3; padding: 14px 16px; border-radius: 10px; overflow-x: auto; margin: 1em 0; }
pre code { background: transparent; color: inherit; padding: 0; font-size: 0.85em; line-height: 1.55; }
blockquote { margin: 1em 0; padding: 0.4em 1em; border-left: 4px solid var(--accent); background: color-mix(in srgb, var(--accent) 6%, #fff); color: #5b5b66; border-radius: 0 8px 8px 0; }
blockquote p { margin: 0.3em 0; }
hr { border: none; border-top: 1px solid #e4e4ea; margin: 1.6em 0; }
table { border-collapse: collapse; width: 100%; margin: 1em 0; font-size: 0.92em; }
th, td { border: 1px solid #e4e4ea; padding: 8px 10px; text-align: left; }
thead th { background: #f4f4f7; font-weight: 700; }
tbody tr:nth-child(even) { background: #fafafa; }
img { max-width: 100%; border-radius: 8px; }
`
