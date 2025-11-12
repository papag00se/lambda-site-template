import { Request, Response } from '../../helpers/http.js';
import fs from 'fs';
import { URLPattern } from 'urlpattern-polyfill';
import { ApplicationCache } from '../../helpers/cache.js';
import { isLocalHost } from '../../helpers/constants.js';

if (!globalThis.URLPattern) {
    globalThis.URLPattern = URLPattern;
}

/**
 * @param {Request} req
 * @param {Response} res
 * @returns {Promise<Response>}
 */
export const renderHandler = async (req, res) => {
    console.log('INCOMING REQ HOST', req.headers.host)
    //                  mobile emulators have different IPs 
    const indexFile = isLocalHost(req.headers.host.split(':')[0]) ? './frontend/index.html' : `./index.html`;
    const index = fs.readFileSync(indexFile).toString('utf8');
    res.headers['content-type'] = 'text/html';
    res.status = 200;
    const appContext = `window.ApplicationContext = ${JSON.stringify(ApplicationCache.publicContext)};`;

    res.body = index.replace('//<!--ApplicationContext-->', appContext);

    return res;
};
