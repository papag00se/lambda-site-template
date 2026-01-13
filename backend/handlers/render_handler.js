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
    // mobile emulators have different IPs and lambda uses rollup and doesn't contain the `frontend` folder
    const folder = isLocalHost(req.headers.host.split(':')[0]) ? './frontend' : '.';
    let page = (req.url.pathname || '').replace(/^\/+/, '').toLowerCase();

    if (page == '') {
        page = 'home'
    }

    ApplicationCache.publicContext['page'] = page;
    let pageHtml = '';
    pageHtml = fs.readFileSync(`${folder}/templates/${page}.html`).toString('utf8');

    const TITLE_RE = /<title\b[^>]*>([\s\S]*?)<\/title>/i;
    const DESCRIPTION_RE = /<description\b[^>]*>([\s\S]*?)<\/description>/i;
    const MAIN_RE = /(<main\b[^>]*>[\s\S]*?<\/main>)/i;

    let title = ApplicationCache.context.title || pageHtml.match(TITLE_RE)?.[1] || '';
    let description = ApplicationCache.context.description || pageHtml.match(DESCRIPTION_RE)?.[1] || '';
    let main = ApplicationCache.context.main || pageHtml.match(MAIN_RE)?.[1] || '';
    res.status = 200;

    const appContext = `window.ApplicationContext = ${JSON.stringify(ApplicationCache.publicContext)};`;
    const indexHtml = fs.readFileSync(`${folder}/index.html`).toString('utf8')
        .replace('{{META_DESCRIPTION}}', description)
        .replace('{{TITLE}}', title)
        .replace('{{MAIN}}', main)
        .replace('{{PAGE}}', page);
    const finalBody = req.method === 'HEAD' ? '' : indexHtml.replace('//<!--ApplicationContext-->', appContext);
    res.headers['content-type'] = 'text/html; charset=utf-8';
    res.headers['Content-Type'] = 'text/html; charset=utf-8';
    res.body = finalBody;

    return res;
};
