import { Request, Response } from '../../helpers/http.js';
import fs from 'fs';
import { URLPattern } from 'urlpattern-polyfill';
import { ApplicationCache } from '../../helpers/cache.js';

if (!globalThis.URLPattern) {
    globalThis.URLPattern = URLPattern;
}

/**
 * @param {Request} req
 * @param {Response} res
 * @returns {Promise<Response>}
 */
export const renderHandler = async (req, res) => {
    const indexFile = req.headers.host?.includes('localhost') ? './frontend/index.html' : `./index.html`;
    const index = fs.readFileSync(indexFile).toString('utf8');
    res.headers['content-type'] = 'text/html';
    res.status = 200;
    const appContext = `window.ApplicationContext = ${JSON.stringify(ApplicationCache.publicContext)};`;

    res.body = index.replace('<!--ApplicationContext-->', appContext);

    return res;
};
