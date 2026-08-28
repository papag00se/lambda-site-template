import { Request, Response } from '../../helpers/http.js';
import fs from 'fs';
import path from 'path';
import mime from 'mime';
import { ApplicationCache } from '../../helpers/cache.js';
import { generateBundle } from '../../helpers/bundler.js';

/**
 * Resolve a request URL path to an on-disk source file.
 *
 * Resolution order:
 *   1. node_modules dependency imports (kept as-is)
 *   2. `frontend/dist/{path}` — Astro build output (HTML, CSS, images,
 *      static AI surfaces from public/ that Astro copied through)
 *   3. `frontend/{path}` — raw source for things not built by Astro
 *      (e.g., main.js bundled at request time)
 *
 * The per-page MD endpoint and llms-full.txt are produced by Astro custom
 * endpoints into `frontend/dist/` — see `frontend/src/pages/*.md.js`.
 *
 * @param {string} pathname
 * @returns {string|null} the resolved on-disk path, or null if no match
 */
const resolveLocalFile = (pathname) => {
    let urlFile = decodeURI(pathname || '');

    // node_modules passthrough (used for dev module imports)
    if (urlFile.startsWith('/node_modules')) {
        return urlFile.slice(1);
    }
    if (urlFile.startsWith('@')) {
        return `node_modules/${urlFile}`;
    }

    // Default: dist (Astro build output) first, then raw frontend
    const candidates = [`frontend/dist${urlFile}`, `frontend${urlFile}`];
    for (const candidate of candidates) {
        if (fs.existsSync(candidate)) {
            return candidate;
        }
    }
    return null;
};

/**
 * Serves local static assets (and bundles JS modules) when running in dev mode.
 * @param {Request} req
 * @param {Response} res
 * @returns {Promise<boolean>}
 */
export const localhostHandler = async (req, res) => {
    try {
        const pathname = req.url?.pathname || '';
        const mimeType = mime.getType(pathname) || 'application/octet-stream';
        const file = resolveLocalFile(pathname);

        /** @type {string | Buffer | undefined} */
        let responseText;

        // JS bundling: serve the rolled-up dist/main.js if it exists, otherwise
        // bundle on the fly from frontend/main.js (template's dev convention).
        // The on-the-fly bundle path is the only thing we cache here — bundling
        // is expensive and there's no Astro/Rollup process to invalidate it.
        // Reading dist files is uncached: dev rebuilds (Astro, Rollup) update
        // those on disk, and we want every request to pick up the latest bytes
        // without restarting the backend. The OS already caches reads.
        if (pathname.endsWith('.js')) {
            const distFile = `frontend/dist${pathname}`;
            if (fs.existsSync(distFile)) {
                responseText = fs.readFileSync(distFile, 'utf8');
            } else {
                const cacheKey = `frontend${pathname}`;
                responseText = ApplicationCache.cache[cacheKey] ?? await generateBundle(cacheKey);
                ApplicationCache.cache[cacheKey] = responseText;
            }
        } else if (file) {
            const binaryTypes = ['.glb', '.wasm', '.ttf', '.woff', '.woff2', '.otf', '.png', '.jpg', '.jpeg'];
            const ext = path.extname(file);
            if (binaryTypes.includes(ext)) {
                responseText = fs.readFileSync(file);
            } else {
                const encoding = mimeType.startsWith('image') ? 'base64' : 'utf8';
                responseText = fs.readFileSync(file, encoding);
            }
        } else {
            res.status = 404;
            res.body = 'Not Found';
            res.headers['X-Component'] = 'localhost_handler';
            return true;
        }

        res.status = 200;
        res.headers['Content-Type'] = mimeType;
        res.body = responseText;
        return true;
    } catch (err) {
        console.log('ERR', err);
        res.status = 500;
        return false;
    }
};
