---
name: visual-craft
description: Production-grade visual front-end craft for SVG, HTML, CSS, and UI — composition, valid viewBox, gradients, shadows, responsive layout, accessibility, and purposeful interaction design.
license: MIT
metadata:
  author: Skill Router
  version: "1.0.0"
  domain: "frontend"
  triggers: "svg, html, css, ui, interface, dashboard, landing, frontend, web, design, animation, component, visual, responsive, hero, navbar, page, index.html"
  role: specialist
  scope: implementation
  output-format: code
  related-skills: react-expert, typescript-pro
---

# Visual Craft

Use this skill for any deliverable whose primary value is *visual*: SVG illustrations,
icons, and graphics; complete HTML pages; CSS / styling; and UI composition. The goal
is a polished, professional result — not a prototype or a placeholder.

## When to use
- "Create an SVG of …", "draw … in SVG"
- "Build an index.html …", "a landing page", "a dashboard UI"
- Any request where the artifact must *look* finished: spacing, typography, color,
  depth, responsiveness, accessibility, and interaction polish.

## Core principles
1. **Visual hierarchy** — one clear focal point; secondary elements support it.
2. **Spacing rhythm** — consistent, intentional gaps (use a spacing scale, not ad-hoc
   pixels). Breathing room separates regions.
3. **Typography** — readable scale, limited weights, deliberate pairing; fluid sizing
   with `clamp()` where responsive.
4. **Color & depth** — purposeful gradients, soft shadows, and contrast. Prefer a small
   cohesive palette; use opacity/shadow for elevation, not heavy outlines.
5. **Scalability** — SVG must use a correct `viewBox`; nothing hardcoded to one size.
6. **Accessibility** — semantic structure, sufficient contrast, focus/hover states,
   `aria-*` where needed, reduced-motion respect.
7. **Interactions** — hover/focus/active states, transitions (140–240ms ease), and
   micro-feedback; never break keyboard navigation.

## SVG craft
- Always open with a valid `viewBox` (e.g. `viewBox="0 0 400 400"`) and `xmlns`.
- Compose with groups (`<g>`) and meaningful ids/classes; keep transforms readable.
- Use `<defs>` for reusable gradients (`<linearGradient>`/`<radialGradient>`) and
  filters (`<filter>` with `feDropShadow` / `feGaussianBlur`) for soft shadows.
- Build depth with layered shapes + gradient fills + a subtle drop shadow rather than
  flat fills. Add detail: highlights, rim light, texture via low-opacity overlays.
- Keep it valid and renderable; prefer shapes over massive path data when clearer.
- Make it self-contained and scalable — no external dependencies unless required.

## HTML / CSS craft
- Semantic markup (`<header>`, `<main>`, `<section>`, `<nav>`, `<footer>`).
- Modern CSS only: custom properties, grid/flex, `clamp()` typography, logical
  properties. Responsive via `min()`/`clamp()`/grid, not fixed breakpoints alone.
- A real, cohesive design system: tokens for color/spacing/radius, a type scale,
  and consistent component-like structure even in a single file.
- Dark-mode aware where relevant; smooth, purposeful transitions.
- Functional, realistic content (not lorem ipsum placeholders) and working JS only
  where it adds value.

## Workflow
1. **Analyze** the subject/goal and the required visual tone.
2. **Compose** the structure (layout for HTML; scene graph for SVG).
3. **Establish hierarchy & spacing** before details.
4. **Apply color, gradients, and shadows** for depth and polish.
5. **Add interaction / motion** (hover, focus, transitions) where appropriate.
6. **Validate** against the checklist below; correct before finishing.

## Validation checklist
- Composition is balanced and the focal point is clear.
- Proportions and spacing are coherent; no awkward gaps or overflow.
- Colors/gradients/shadows are purposeful and cohesive.
- SVG: valid `viewBox`, scalable, renders correctly, no broken references.
- HTML/CSS: responsive across desktop/tablet/mobile; valid and accessible.
- Interactions are present and keyboard-safe; respects reduced motion.
- The artifact reads as a finished, professional product.
