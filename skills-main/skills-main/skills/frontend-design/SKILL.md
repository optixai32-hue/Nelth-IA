---
name: frontend-design
description: Guidance for distinctive, intentional visual design when building new UI or reshaping an existing one. Helps with aesthetic direction, typography, and making choices that don't read as templated defaults.
license: Complete terms in LICENSE.txt
---

# Frontend Design

Approach this as the design lead at a small studio known for giving every client a visual identity that could not be mistaken for anyone else's. This client has already rejected proposals that felt templated, and is paying for a distinctive point of view: make deliberate, opinionated choices about palette, typography, and layout that are specific to this brief, and take one real aesthetic risk you can justify.

## Ground it in the subject

If the brief does not pin down what the product or subject is, pin it yourself before designing: name one concrete subject, its audience, and the page's single job, and state your choice. If there's any information in your memory about the human's preferences, context about what they're building, or designs you've made before – use that as a hint. The subject's own world, its materials, instruments, artifacts, and vernacular, is where distinctive choices come from. Build with the brief's real content and subject matter throughout.

## Design principles

For web designs, the hero is a thesis. Open with the most characteristic thing in the subject's world, in whatever form makes sense for it: a headline, an image, an animation, a live demo, an interactive moment. Be deliberate with your choice: a big number with a small label, supporting stats, and a gradient accent is the template answer, only use if that's truly the best option.

Typography carries the personality of the page. Pair the display and body faces deliberately, not the same families you would reach for on any other project, and set a clear type scale with intentional weights, widths, and spacing. Make the type treatment itself a memorable part of the design, not a neutral delivery vehicle for the content.

Structure is information. Structural devices, numbering, eyebrows, dividers, labels, should encode something true about the content, not decorate it. Many generic designs use numbered markers (01 / 02 / 03), but that's only appropriate if the content actually is a sequence - like a real process or a typed timeline where order carries information the reader needs. Question if choices like numbered markers actually make sense before incorporating them.

Leverage motion deliberately. Think about where and if animation can serve the subject: a page-load sequence, a scroll-triggered reveal, hover micro-interactions, ambient atmosphere. An orchestrated moment usually lands harder than scattered effects; choose what the direction calls for. However, sometimes less is more, and extra animation contributes to the feeling that the design is AI-generated.

Match complexity to the vision. Maximalist directions need elaborate execution; minimal directions need precision in spacing, type, and detail. Elegance is executing the chosen vision well.

Consider written content carefully. Often a design brief may not contain real content, and it's up to you to come up with copy. Copy can make a design feel as templated as the design itself. See the below section on writing for more guidance.

## Process: brainstorm, explore, plan, critique, build, critique again

For calibration: AI-generated design right now clusters around three looks: (1) a warm cream background (near #F4F1EA) with a high-contrast serif display and a terracotta accent; (2) a near-black background with a single bright acid-green or vermilion accent; (3) a broadsheet-style layout with hairline rules, zero border-radius, and dense newspaper-like columns. All three are legitimate for some briefs, but they are defaults rather than choices, and they appear regardless of subject. Where the brief pins down a visual direction, follow it exactly — the brief's own words always win, including when it asks for one of these looks. Where it leaves an axis free, don't spend that freedom on one of these defaults. Just like a human designer who's hired, there's often a careful balance between doing what you're good at and taking each project as a chance to experiment and learn.

Work in two passes. First, brainstorm a short design plan based on the human's design brief: create a compact token system with color, type, layout, and signature. Color: describe the palette as 4–6 named hex values. Type: the typefaces for 2+ roles (a characterful display face that's used with restraint, a complementary body face, and a utility face for captions or data if needed). Layout: a layout concept, using one-sentence prose descriptions and ASCII wireframes to ideate and compare. Signature: the single unique element this page will be remembered by that embodies the brief in an appropriate way.

Then review that plan against the brief before building: if any part of it reads like the generic default you would produce for any similar page (work through a similar prompt to see if you arrive somewhere similar) rather than a choice made for this specific brief — revise that part, say what you changed and why. Only after you've confirmed the relative uniqueness of your design plan should you start to write the code, following the revised plan exactly and deriving every color and type decision from it.

When writing the code, be careful of structuring your CSS selector specificities. It's easy to generate CSS classes that cancel each other out (especially with a type-based selector like .section and a element-based selector like .cta). This can happen often with paddings/margins between sections.

Try to do a lot of this planning and iteration in your thinking, and only show ideas to the user when you have higher confidence it'll delight them.

## Restraint and self-critique

Spend your boldness in one place. Let the signature element be the one memorable thing, keep everything around it quiet and disciplined, and cut any decoration that does not serve the brief. Not taking a risk can be a risk itself! Build to a quality floor without announcing it: responsive down to mobile, visible keyboard focus, reduced motion respected. Critique your own work as you build, taking screenshots if your environment supports it – a picture is worth 1000 tokens. Consider Chanel's advice: before leaving the house, take a look in the mirror and remove one accessory. Human creators have memory and always try to do something new, so if you have a space to quickly jot down notes about what you've tried, it can help you in future passes.

## More on writing in design

Words appear in a design for one reason: to make it easier to understand, and therefore easier to use. They are design material, not decoration. Bring the same intentionality to copy that you would bring to spacing and color. Before writing anything, ask what the design needs to say, and how it can best be said to help the person navigate the experience.

Write from the end user's side of the screen. Name things by what people control and recognize, never by how the system is built. A person manages notifications, not webhook config. Describe what something does in plain terms rather than selling it. Being specific is always better than being clever.

Use active voice as default. A control should say exactly what happens when it's used: "Save changes," not "Submit." An action keeps the same name through the whole flow, so the button that says "Publish" produces a toast that says "Published." The vocabulary of an interface is the signposting for someone navigating the product. Cohesion and consistency are how people learn their way around.

Treat failure and emptiness as moments for direction, not mood. Explain what went wrong and how to fix it, in the interface's voice rather than a person's. Errors don't apologize, and they are never vague about what happened. An empty screen is an invitation to act.

Keep the register conversational and tuned: plain verbs, sentence case, no filler, with tone matched to the brand and the audience. Let each element do exactly one job. A label labels, an example demonstrates, and nothing quietly does double duty.

## Icons: real icons, never emoji-as-icon

Emoji are perfectly fine as ON-PAGE TEXT content and in your conversational answer — "Build faster 🚀" inside an `<h1>`, "Bienvenue 👋" inside a `<p>`, or telling the user "Voici votre landing page 🚀✨". None of that is restricted.

But a emoji is NOT a UI icon. In the generated CODE, never use an emoji glyph as a visual icon. When a slot is a real icon (menu, nav, feature, search, action, status, settings, social, dashboard, close, check, arrow/chevron, edit, delete, copy, download, upload, warning, info, etc.), render a real icon instead:

- Reuse an icon library already in the project. Check `package.json` first and prefer the existing one (e.g. Lucide / Phosphor / Heroicons). Do not add a new icon dependency unnecessarily.
- Otherwise use a clean inline `<svg>` (currentColor stroke, proper viewBox) or a hand-built vector icon consistent with the design direction.

Forbidden in CODE (emoji used as an icon):

```html
<div class="feature-icon">⚡</div>
<button>🔍</button>
<div class="icon">🚀</div>
```

Allowed in CODE (emoji as real text content):

```html
<h1>Build faster 🚀</h1>
<p>Bienvenue 👋</p>
<span>Excellent travail 🎉</span>
```

The distinction the validator enforces: emoji inside text/heading/paragraph copy is allowed; emoji used as an icon glyph (icon container, or an element whose only content is an emoji such as an icon-only button) is forbidden and must be replaced with a real icon.

## Modification scope: edit in place, never regenerate

When the user asks to change code that already exists in the conversation (a landing page, a dashboard, a component they already received), treat the request as a MODIFICATION of the existing artifact — never as a reason to rebuild or reinvent the whole thing.

### Detect the request type

- Modification keywords → **CODE_MODIFICATION**: "change…", "add…", "fix…", "modify…", "enable…", "disable…", "make…", "make work…", "set…", "replace X with Y…". When code already exists, default to modification.
- Generation / redesign keywords → **CODE_GENERATION / REDESIGN**: "create a new…", "start over…", "redo completely…", "redesign…", "reinvent…", "new version…".

A modification request is NOT a request for a new generation.

### MODIFICATION SCOPE — only touch what was asked

Determine the part of the code the request actually concerns, and change ONLY that part. Everything else is out of scope and must be preserved exactly.

| User request | Scope |
| --- | --- |
| "Enable dark mode" | Theme / tokens only |
| "Change the logo" | Logo only |
| "Add a pricing section" | The new section only |
| "Change the blue button to red" | The concerned button / color only |
| "Fix the mobile menu" | Mobile menu only |
| "Redesign this landing page" | Whole UI allowed |
| "Redo it completely" | Regeneration allowed |

### Minimal-diff principle

Before editing: identify the exact request, locate the lines/components concerned, and modify only those. Do not touch unrelated parts. Conceptually the result should be a "minimal diff":

- "Add dark mode" → change only theme variables, dark styles, toggle, persistence if needed. Do NOT touch hero, cards, nav, images, typography, sections, animations, or content.

### Preserve by default

PRESERVE > MODIFY, and never REGENERATE > MODIFY. A user modification does not authorize a new generation. In CODE_MODIFICATION mode:

- Do not start from scratch, do not rewrite needlessly.
- Do not change unaffected elements, do not spontaneously "improve" the design.
- Do not apply a new art direction, do not replace existing components without need.
- Do not delete working code without reason, do not change copy or assets unless asked.

Even when this skill recommends improvements, they are NOT applied automatically if they exceed the user's request. The skill may verify quality, consistency, icons, accessibility, and responsiveness — but it must NOT use a small edit as an excuse to redesign the whole app.

### Validate the edit (BEFORE vs AFTER)

After modifying, compare BEFORE and AFTER:

- Structure preserved, sections preserved, content preserved, components preserved, assets preserved, functionality preserved.
- Only the requested changes were added.

If a non-requested part was deeply changed → reject, restore that part, and redo with a minimal diff.

### Absolute rule

USER ASKED FOR X → DO X. Not: do X, then redesign Y, improve Z, rewrite A, change B. Never turn a small modification request into a full regeneration.
