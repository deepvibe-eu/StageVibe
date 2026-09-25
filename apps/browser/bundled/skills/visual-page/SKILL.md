---
name: Visual Page
description: Build a self-contained HTML page when structure communicates better than text — diagrams, comparisons, timelines, dashboards. Use proactively for such content, or when the user asks for a page/visualization.
user-invocable: true
agent-invocable: true
---

# Visual Page

Deliver one self-contained HTML file the user can open directly. Use it when the
information is structural: a flow, a comparison, a hierarchy, a timeline, a small
dashboard. If a paragraph already says it best, don't build a page.

## Workflow

1. **Pick the path**: the user's path if given; otherwise next to the input file;
   otherwise a descriptive `.html` in the workspace.
2. **Write one document** with all CSS and JS inline. Reach for a CDN
   (Mermaid, Chart.js) only when hand-rolling would be worse.
3. **Check it opens**: no missing local assets, no broken relative links,
   readable on a narrow window.
4. **Open it** in a browser tab so the user can see it. When they ask for a
   change, edit the same file — don't spawn `page-v2.html`.

## Design stance

**The picture carries the point; the text annotates it.** Start from "which
diagram or chart tells this story?" not "which paragraphs explain it?". If a
section is three paragraphs without a visual, find the visual.

- One headline, one conclusion the eye reaches in seconds.
- Every element earns its place; empty space is a feature.
- Prefer a chart, table or inline SVG over prose for any structured comparison.

## Pick a mode before styling

| Mode | For | Look |
|---|---|---|
| Data | dashboards, charts, tables | light neutral background, sans-serif |
| Report | research, design docs | warm off-white, sans body, serif headings |
| Terminal | logs, code demos | dark (never pure `#000`), monospace-first |

## Rules

- **Color**: neutral backgrounds, one accent, sufficient contrast. No pure
  black, no blue-to-purple "AI" gradients, no neon glow.
- **Typography**: at most two families; headline sets the tone, body stays
  quiet. Limit line length.
- **Layout**: responsive by default; group related items; don't nest cards in
  cards.
- **Data**: label axes and units; don't truncate a scale in a way that
  exaggerates; no decorative numbers without meaning.
- **No secrets** and no external requests that leak the user's data.

## Failure handling

- If a page genuinely cannot be opened or previewed, fall back to a concise
  Markdown summary and say why.
- If the content is mostly prose with one small diagram, put the diagram in chat
  or in the document instead of a whole page.
