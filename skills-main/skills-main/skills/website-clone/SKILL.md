---
name: website-clone
description: Cleanly recreate a website or a section inspired by a reference URL (e.g. "clone the Apple site", "fais comme ce site", "recreate Stripe's pricing page") as original code in this project's stack. Use it to produce faithful-but-original layouts without scraping copyrighted assets, mixing CSS frameworks, bloating files, or emitting broken/weird output. Trigger phrases include "clone", "recreate", "copy the look of", "fais comme", "clone le site web de", or any named brand/site.
---

# Website Clone

When the human asks to "clone", "recreate", "copy the look of", or "fais comme" a real website (Apple, Stripe, Linear, etc.), your job is NOT to download and paste their HTML. Your job is to **rebuild the design as original code in THIS project's stack**, capturing the visual language (layout rhythm, typography, spacing, color, motion) while producing clean, maintainable, accessible output.

This project is **Morphic**: Next.js (App Router) + React + TypeScript + Tailwind CSS + shadcn/ui. Every clone must be expressed in that stack, not in raw HTML files, inline `<style>` blocks, or a foreign framework.

## Why clones go weird (and how this skill prevents it)

Cloning goes wrong for predictable reasons. Guard against each:

- **Scraping copyrighted assets** → never hotlink or download the target's images, logos, fonts, or copy verbatim. Recreate the *look* with original placeholder assets, original copy, and system/Google fonts. If you need the real brand mark, link to it as a referenced asset only when the human explicitly asks and accepts the licensing risk.
- **Mixing CSS frameworks** → do not combine Tailwind with Bootstrap, with a `<style>` soup, or with random CDN stylesheets. Use Tailwind utilities + shadcn/ui primitives only.
- **One giant file** → split into components under `components/` (or a feature folder) and compose them in an `app/` route. A 2000-line `page.tsx` is a failure.
- **Emoji-as-icon** → same rule as `frontend-design`: emoji is fine as on-page TEXT, forbidden as a UI icon. Use `lucide-react` (already available) or clean inline `<svg>`.
- **Broken responsive / a11y** → mobile-first, visible focus, `prefers-reduced-motion` respected, semantic landmarks.
- **Inventing fake APIs** → a clone is a static/visual artifact. Do not wire it to fake backend calls. If it must be interactive, use local state only.

## Modes

Detect the mode from the human's phrasing and constraints. Both modes follow the same quality floor; they differ only in how many passes you show.

### Quick mode
Triggered by "quick", "fast", "just do it", "rapidement", time pressure, or a single-pass expectation.
- Do ONE disciplined pass: analyze → plan (brief, in thinking) → build the full page in clean components → self-critique silently.
- Do not over-ask. Make reasonable choices for unspecified details and state them in one line.
- Aim for a complete, working, good-looking result in a single delivery.

### Adaptive mode
Triggered by "adaptive", "iterate", "refine", "make it better", or when the human gives feedback / asks for changes.
- Build a first version, then critique it against the brief and the reference, then improve.
- Treat follow-up requests as MODIFICATIONS of the existing artifact (see `frontend-design` modification scope): change ONLY what was asked, preserve everything else, never regenerate from scratch unless explicitly told to.
- Keep a short mental note of decisions so later passes stay coherent.

If the mode is ambiguous, default to **adaptive** but deliver a complete first version.

## Process

### 1. Analyze the reference (do not download it)
- Identify the subject, audience, and the page's single job (hero thesis).
- Note the *design system*: color palette (4–6 named hex), type scale (display + body + utility faces), spacing rhythm, signature element (the one memorable thing), and motion language.
- Capture structure: section order, grid behavior, nav pattern, footer.
- State these in compact form in your thinking before writing code.

### 2. Plan (brief)
- ASCII wireframe of the key sections.
- Token list: colors, fonts (use Google Fonts or system stack already in the project), radii, shadows.
- Component breakdown: which components you'll create and where they live.

### 3. Build in the Morphic stack
- Create a route under `app/` (e.g. `app/clone/[brand]/page.tsx`) or a demo component, composed of small components in `components/`.
- Use Tailwind utilities + existing shadcn/ui primitives from `components/ui/`. Check `components/ui/` and `package.json` before adding any dependency.
- Prefer `lucide-react` for icons.
- Keep each component focused (< ~150 lines). Extract repeated patterns into a shared component.
- Use original copy. If you echo the brand's wording for layout fidelity, keep it minimal and clearly placeholder-able.

### 4. Self-critique (silent, then fix)
- Responsive down to mobile? Focus visible? Reduced motion handled?
- Any CSS specificity collisions between sections? (Watch `.section` vs element selectors on padding/margin.)
- Any emoji used as an icon? Any hotlinked copyrighted asset? Any foreign CSS? Any single bloated file?
- Fix before showing the result.

## Output contract
- Deliver real, runnable Next.js + Tailwind + shadcn/ui code in this repo's conventions.
- One-line summary of the choices you made for unspecified details.
- If something genuinely needs a decision from the human (e.g. "Apple has a video hero — recreate with a poster image?"), ask ONE question, otherwise proceed.
