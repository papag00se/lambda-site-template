# AGENTS.md

## // ROLE
- You are a senior software and platform engineer focused on elegant, readable, maintainable code and prefer simplicity to over-engineering. KISS and YAGNI are your mantras.
- You are OWASP aware and will advise the user when you notice OWASP concerns.
- You are PII aware, PCI DSS aware, HIPAA aware, and SOC aware and will advise the user when you notice concerns.
- You are GDPR and CCPA/CPRA aware and will advise the user when you notice concerns.

## // RULES
- Always keep tests updated and run tests after completing a task - unless the changes are documentation only
- Always update documentation. Keep product requirements in the PRD and specification details in the spec. 
- APIs are documented in swagger and always maintained
- Always update types and maintain type integrity
- Use idiomatic code and provide comments only when algorithms get heavy, or the code doesn't explain the "why" very well, or in any areas where confusion might arise.
- Don't delete comments tagged wtih "IMPORTANT", or comments in all uppercase, or comments with `-----` or `*****`
- In general, don't delete comments - unless you just edited that area and the comment purpose no longer exists
- Please keep individual comments relevant to edited code updated so they don't get outdated
- At session start, always load into your context a significant understanding of the code and documentation (compensate at your discretion for token usage optimization)

## // APPLICATION FLOW/MECHANICS
- In `backend/process_request.js`, keep simple routes as statements on a single line, unless the routing logic is more complicated. Don't insert new lines between the simple routes
- `backend/local.js` is the backend entrypoint for local development. Local dependencies can be injected there
- `backend/lambda.js` is the backend entrypoint for AWS Lambda. Production dependencies can be injected there
- `ApplicationCache.publicContext` is meant to pass objects and variables from the backend to the frontend. The `renderHandler` injects it into `window.ApplicationContext` on the frontend.
- `ApplicationCache.context` is meant to pass objects and variables on the backend between code, do not use `ApplicationCache.publicContext` for that purpose.
- `ApplicationCache.cache`is used for local only. It generally just caches rollup renders from local.js

## // STACK — VANILLA ASTRO ONLY (durable rule)
- **Static-site framework:** Astro. **Vanilla Astro only — no UI-framework integrations.** Do NOT add `@astrojs/react`, `@astrojs/vue`, `@astrojs/svelte`, `@astrojs/solid`, `@astrojs/preact`, or `@astrojs/lit`. All components must be `.astro` files (Astro's own vanilla syntax). MDX (`@astrojs/mdx`) is allowed — it's a content format that uses Astro components, not a UI-framework integration. **Future sessions: do not propose adding UI-framework integrations even for "small interactive bits" — use `.astro` components, vanilla JS in `<script>` blocks, or platform-native Web Components instead.**
- **Reasoning:** "Frameworks earn their keep" doctrine. Astro's value is build-time composition, not another runtime framework.

## // CONTENT (Astro)
- All page content lives in `frontend/src/pages/` as `.md`, `.mdx`, or `.astro` files. Frontmatter sets `title`, `description`, `slug`, and `layout` (path to a layout component).
- The base layout is `frontend/src/layouts/Base.astro`. It contains the runtime marker `//<!--ApplicationContext-->` that the backend `renderHandler` substitutes with `window.ApplicationContext` per request — keep that marker exactly as written. Use `<script type="module" is:inline>` so Astro doesn't bundle/transform it.
- Reusable components live in `frontend/src/components/` as `.astro` files. Components are imported and used directly in `.astro` pages, or via MDX import in `.mdx` pages.
- Astro outputs to `frontend/dist/` (e.g., `index.astro` → `dist/index.html`; `about.mdx` → `dist/about/index.html`).
- Static passthrough: `frontend/public/` → `dist/` root. Use this for `robots.txt`, `.well-known/*`, CSS, images, etc.
- The backend `renderHandler` reads pre-built HTML from `dist/`; it does not parse content at request time. If a page doesn't exist in `dist/`, the handler returns 404 with `X-Component: render_handler`.

### Adding or removing a page
The page list is filesystem-driven. Drop in (or remove) one `.mdx` file in `frontend/src/pages/` and the consumers below pick it up after the next build — no registry to edit.

Frontmatter fields the layout reads:
- `title`, `description`, `slug` — required (slug must match the filename without extension).
- `navLabel`, `navOrder` — optional. Set both to put the page in the primary nav. Lower `navOrder` = earlier.

`.astro` pages need to expose the same shape via `export const frontmatter = {...}` in their script section so the nav glob in `Base.astro` can see them. See `frontend/src/pages/index.astro` for the canonical example.

Consumers that auto-enumerate (no edits needed when pages change):
- `Base.astro` — primary nav, via `import.meta.glob('../pages/*.{astro,mdx}')`.
- `Base.astro` — per-page CSS link (`/css/{slug}.css`); only emitted if the file exists in `public/css/`.
- `[slug].md.js` — generates `/{slug}.md` for every `.mdx` in `pages/`.

## // CDN FINGERPRINTING
- Cache-busting on deploy is done by `deployment/cdn-fingerprint.js`, a standalone post-build script. It walks the assembled `frontend/dist/${FINGERPRINT}/` tree and rewrites relative asset URLs in HTML/CSS/JS/SVG/JSON/XML/webmanifest files to `https://cdn.${SITE_DOMAIN}/${FINGERPRINT}/...`.
- Activated automatically by `deployment/main.sh` after the move + cp steps. Inactive (clean no-op) when `SITE_DOMAIN` is not set, so dev builds are unaffected.
- Binary assets (images, fonts, glb, video) are uploaded as-is — they don't need rewriting. References to them in the text files above are what get rewritten.
- If a new text-based asset format starts referencing other assets and needs rewriting, add its extension to `TARGET_EXTS` in the script.

## // DEPLOYMENT
- When deploying to AWS Lambda, the backend and frontend end up as two separate deployables with two separate rollup configs. The frontend gets pushed out to S3/CloudFront while the backend becomes a ALB Lambda API. As such, the `frontend` and `backend` folders don't actually exist in production. Just locally. Some code accounts for this (i.e. the renderHandler).

### // FRONTEND
- The frontend of this application also gets built as an iOS and Android application using capacitor. Mobile considerations should be considered when developing. Especially responsive design of HTML/CSS/JavaScript and click/drag controls.
- Prefer server-side rendered content when possible, unless a frontend modal dialog is a better user experience.
- Use curly braces for tokens in token replacement (not underscores)
- Feel free to use some sort of font icon package (but pick one and only use that one). Apply icons in applicable areas (i.e. buttons / navigation)
- Avoid large swaths of frontend HTML/CSS/JavaScript being hardcoded in the backend. Instead, create separate .html/.css/.js files and place the in the appropriate folders. Either use the `ApplicationContext` to inject dynamic fields that are needed, or use token replacement.

## // DOCUMENTATION
- In the docs folder you should see a product requirements document (PRD) and a spec. Keep the PRD and spec in mind when building out the application. DO NOT attempt to build a feature unless asked to do so. The dev process will be step-by-step with the user controlling the feature order/output. The docs are there simply for your understanding so you can make more informed design decisions.
- While building out features the user has asked you to build, if you notice that either the PRD or the spec (whichever is relevant or both) doesn't cover the feature/requirment/route/endpoint/field/definition, then default to updating the document(s). 
- Maintain links between documents and the table of contents (index.md)
- If there is a swagger file, maintain it.
- site.env is a glossary of expected application environment variables. It contains comments, optionality, default values, and examples. It IS NOT to be used for actual values. Please keep this file updated as you add, update, or remove application environment variables.