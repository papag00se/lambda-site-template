import '../helpers/shim.js';
import { Request } from '../helpers/http.js';
import { processRequest } from './process_request.js';
import { createServer } from 'http';
import { generateBundle } from '../helpers/bundler.js';
import { localExtensions } from '../helpers/constants.js';
import path from 'path';
import { localhostHandler } from './handlers/localhost_handler.js';

/**
 * @param {import('http').IncomingMessage} req
 * @param {import('http').ServerResponse} res
 */
const requestListener = async (req, res) => {
    /** @type {Record<string, string>} */
    const headers = {};
    if (req.headers) {
        for (const [, [key, value]] of Object.entries(req.headers).entries()) {
            const normalized = Array.isArray(value) ? value.join(',') : value ?? '';
            headers[key] = normalized;
        }
    }

    const request = new Request({
        headers,
        method: req.method || 'GET',
        url: new URL(req.url || '', `http://${headers['host']}`)
    });

    const response = await processRequest(request, async (rq, rs) => {
        const hostHeader = headers['host'];
        if (hostHeader?.includes('localhost') && localExtensions.includes(path.extname(request.url.pathname || ''))) {
            return await localhostHandler(rq, rs);
        }
        return false;
    });
    if (response.headers) {
        for (const [, [key, value]] of Object.entries(response.headers).entries()) {
            res.setHeader(key, value);
        }
    }
    res.statusCode = response.status;
    const encoding = response.headers['Content-Type']?.startsWith('image') ? 'base64' : 'utf8';
    res.write(response.body || '', encoding);
    res.end();
};

const startApp = async () => {
    /***************************
    Cache the initial main request on app startup
    ****************************/
    console.log('*** CACHING main.js ***');
    await generateBundle('frontend/main.js');

    const host = 4077;

    // Start server
    const server = createServer(requestListener);
    server.listen(host);

    console.log('****************************************************');
    console.log(`      APP LISTENING AT http://localhost:${host}        `);
    console.log('****************************************************');
};

startApp();
