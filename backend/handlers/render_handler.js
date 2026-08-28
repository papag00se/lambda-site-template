import { Request, Response } from '../../helpers/http.js';
import fs from 'fs';
import path from 'path';
import { ApplicationCache } from '../../helpers/cache.js';
import { isLocalHost } from '../../helpers/constants.js';

/**
 * Resolve a request path to a built HTML file under the dist directory.
 * "/" maps to "<dist>/index.html"; "/about" maps to "<dist>/about/index.html".
 *
 * @param {string} distRoot
 * @param {string} pathname
 * @returns {string|null}
 */
const resolvePagePath = (distRoot, pathname) => {
    const cleaned = (pathname || '').toLowerCase().replace(/\/+$/, '');
    if (cleaned === '') {
        return path.join(distRoot, 'index.html');
    }
    const candidate = path.join(distRoot, cleaned, 'index.html');
    return fs.existsSync(candidate) ? candidate : null;
};

/**
 * Serve a pre-built HTML page (built by Eleventy) and inject the per-request
 * ApplicationContext at the runtime marker.
 *
 * @param {Request} req
 * @param {Response} res
 * @returns {Promise<Response>}
 */
export const renderHandler = async (req, res) => {
    // Locally we read from frontend/dist; in Lambda the bundle is flattened
    // so dist contents end up at the root of the deployable
    const distRoot = isLocalHost(req.headers.host.split(':')[0]) ? './frontend/dist' : '.';
    const pageFile = resolvePagePath(distRoot, req.url.pathname);

    if (!pageFile) {
        res.status = 404;
        res.headers['Content-Type'] = 'text/plain';
        res.headers['X-Component'] = 'render_handler';
        res.body = 'Not Found';
        return res;
    }

    ApplicationCache.publicContext['page'] = req.url.pathname || '/';

    const html = fs.readFileSync(pageFile, 'utf8');
    const appContext = `window.ApplicationContext = ${JSON.stringify(ApplicationCache.publicContext)};`;
    const finalBody = req.method === 'HEAD' ? '' : html.replace('//<!--ApplicationContext-->', appContext);

    res.status = 200;
    res.headers['Content-Type'] = 'text/html; charset=utf-8';
    res.body = finalBody;
    return res;
};
