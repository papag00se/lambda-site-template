// Per-page Markdown source endpoints — agents fetch /{slug}.md and get
// the raw Markdown the page was rendered from. Pair with the dynamic nav
// in Base.astro: drop a new .mdx page in this directory and it shows up
// in the nav AND becomes available at /{slug}.md with no edits here.
//
// `import` lines from MDX are stripped so the served body is closer to
// plain Markdown. Component tags (<MyComponent>...</MyComponent>) survive
// — they're agent-readable as structural hints. Strip those too if your
// site doesn't want them in the .md output.

import fs from 'node:fs';
import path from 'node:path';

// Astro/Vite bundles these endpoint files, so import.meta.url isn't
// reliable for resolving source paths. Use process.cwd() (Astro build
// runs from project root).
const PAGES_DIR = path.join(process.cwd(), 'frontend', 'src', 'pages');

const stripImports = (content) => content
    .replace(/^import\s+.*$/gm, '')
    .replace(/\n\n\n+/g, '\n\n')
    .trim();

const enumerateMdxSlugs = () => fs.existsSync(PAGES_DIR)
    ? fs.readdirSync(PAGES_DIR)
        .filter((name) => name.endsWith('.mdx'))
        .map((name) => name.replace(/\.mdx$/, ''))
    : [];

export const getStaticPaths = () => enumerateMdxSlugs().map((slug) => ({ params: { slug } }));

export const GET = ({ params }) => {
    const file = path.join(PAGES_DIR, `${params.slug}.mdx`);
    if (!fs.existsSync(file)) {
        return new Response('Not Found', { status: 404, headers: { 'Content-Type': 'text/plain' } });
    }
    const cleaned = stripImports(fs.readFileSync(file, 'utf8'));
    return new Response(cleaned + '\n', {
        headers: { 'Content-Type': 'text/markdown; charset=utf-8' }
    });
};
