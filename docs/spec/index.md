# Technical Specs

## Table Of Contents
- [Testing Stack](./testing.md)

## Content & Templating

The frontend uses **Astro** (vanilla — see hard rule below) as the static site generator. HTML is built at build time, not at request time.

### Hard rule — vanilla Astro only

No `@astrojs/react`, `@astrojs/vue`, `@astrojs/svelte`, `@astrojs/solid`, `@astrojs/preact`, or `@astrojs/lit`. All components are `.astro` files. MDX (`@astrojs/mdx`) is allowed because it's a content format using Astro's own component model — not a UI-framework integration. Interactive bits use vanilla JS in `<script>` blocks or platform-native Web Components.

### Layout

```
astro.config.mjs        # srcDir, publicDir, outDir, integrations
frontend/
  src/
    layouts/
      Base.astro        # Master layout (with the runtime ApplicationContext marker)
    components/         # .astro components (PageHeader, Project, etc. as projects need)
    pages/              # .astro / .md / .mdx — file-based routing
      index.astro       # Home page
      about.mdx         # ...
    styles/             # (optional)
  public/               # Passthrough copy → dist/ root
    css/
    images/
    robots.txt          # (project-level, if used)
  main.js               # Frontend JS entry, bundled by Rollup
  dist/                 # Astro + Rollup output (gitignored)
```

### Page model

Pages can be `.astro`, `.md`, or `.mdx`. Markdown pages declare a layout via frontmatter:

```markdown
---
layout: ../layouts/Base.astro
title: Page Title
description: Meta description
slug: about
---

Page content here. MDX can `import` and use `.astro` components inline.
```

`.astro` pages compose the layout directly:

```astro
---
import Base from '../layouts/Base.astro';
---
<Base title="..." description="..." slug="...">
    <main class="page-wrapper">...</main>
</Base>
```

### Build pipeline

1. `npm run build:content` — Astro reads `frontend/src/`, applies layouts, writes HTML + passthrough to `frontend/dist/`.
2. `npm run build:js` — Rollup bundles `frontend/main.js` to `frontend/dist/main.js`.
3. `npm run build:frontend` — orchestrates both, plus copies `env.js`.

`npm run dev` runs Astro in watch mode (via nodemon → `astro build`) alongside the backend server, under `concurrently`.

### Request flow

The backend `renderHandler` reads pre-built HTML from `frontend/dist/` (or the flattened root in Lambda) and injects per-request `ApplicationContext` at the `//<!--ApplicationContext-->` marker in the layout. The layout's `<script>` tag uses `type="module" is:inline` so Astro does not bundle or transform it (the marker survives untouched). If the page doesn't exist in `dist/`, the handler returns 404 with header `X-Component: render_handler`.

### Why Astro

Earlier the template used regex parsing of `<title>`, `<description>`, and `<main>` tags from per-page HTML files at request time, then briefly Eleventy. Astro replaces both with first-class frontmatter + layouts + components, eliminates the regex parsing, and gives content collections, MDX, and per-component scoped CSS for free — without dragging in a UI framework.

## CDN Fingerprinting

Cache-busting on production deploys is handled by `deployment/cdn-fingerprint.js`, a standalone post-build script invoked by `deployment/main.sh`.

**Trigger:** runs only when `SITE_DOMAIN` is set in the build environment. `FINGERPRINT` is generated per deploy as a sha256-of-timestamp truncated to 30 chars.

**Behavior:** walks the assembled `frontend/dist/${FINGERPRINT}/` tree. For every text file that can reference other assets (`.html`, `.css`, `.js`, `.mjs`, `.svg`, `.json`, `.webmanifest`, `.xml`), it rewrites relative asset URLs to absolute CDN URLs of the form `https://cdn.${SITE_DOMAIN}/${FINGERPRINT}/...`.

**Patterns matched:**
- HTML/JS attribute and import paths: `src="..."`, `href="..."`, `xlink:href="..."`, `import('...')`
- CSS `url(...)` (quoted or unquoted)
- Schemes (`http://`, `https://`, `//`, `data:`) are skipped — only relative paths are rewritten

**Idempotency:** each match is rewritten exactly once via a function-form replacement. Running the script twice on the same dist would *not* double-prefix (the second run sees absolute CDN URLs and skips them).

**Binaries:** images, fonts, video, and other binary assets are not opened — they're uploaded as-is. References *to* them in the text files above are what get fingerprinted.

**Adding a new file type:** if a new text-based format needs rewriting, add its extension to `TARGET_EXTS` at the top of the script.
