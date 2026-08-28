import nodeResolve from '@rollup/plugin-node-resolve';

/**
 * Frontend bundle config.
 *
 * HTML is built by Eleventy (`.eleventy.js` → `frontend/dist/`). Rollup is now
 * scoped to JavaScript only: bundle `frontend/main.js` (and its imports) into
 * `frontend/dist/main.js`. The build pipeline runs Eleventy first, then Rollup.
 *
 * CDN fingerprinting (formerly handled here) lives in `.eleventy.js` as the
 * `cdn-fingerprint` transform. The previous BASE_FOLDER prefixing has been
 * dropped intentionally.
 */
const distDir = 'frontend/dist';

export default (async () => ({
    input: 'frontend/main.js',
    plugins: [
        nodeResolve()
    ],
    output: {
        dir: distDir,
        format: 'es'
    }
}))();
