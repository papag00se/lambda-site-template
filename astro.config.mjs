import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';

// Vanilla Astro only — no UI-framework integrations.
// See AGENTS.md "// STACK" and docs/jesse.md "Tech Opinions" for the rule.
// MDX is allowed because it uses Astro's own component model, not React/etc.

export default defineConfig({
    srcDir: './frontend/src',
    publicDir: './frontend/public',
    outDir: './frontend/dist',
    integrations: [mdx()],
    build: {
        // /about → /about/index.html (matches the renderHandler's path resolution)
        format: 'directory'
    },
    // Disable Astro's built-in dev server hostname for local Lambda emulator parity.
    // The dev flow is: `astro build` → backend/local.js serves frontend/dist/.
    devToolbar: { enabled: false }
});
