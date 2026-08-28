import '../helpers/shim.js';
// DO NOT REMOVE THIS COMMENT! It is needed to keep the shim on top
import { Request } from '../helpers/http.js';
import { processRequest } from './process_request.js';
import { createServer } from 'http';
import { generateBundle } from '../helpers/bundler.js';
import { isLocalHost, localExtensions } from '../helpers/constants.js';
import path from 'path';
import { localhostHandler } from './handlers/localhost_handler.js';
import { readRequestBody } from '../helpers/requestBody.js';

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

    // Read request body for non-GET methods (POST/PUT/PATCH need it for API/MCP routes)
    const method = req.method || 'GET';
    const body = ['GET', 'HEAD', 'OPTIONS'].includes(method) ? '' : await readRequestBody(req);

    const request = new Request({
        body,
        headers,
        method,
        url: new URL(req.url || '', `http://${headers['host']}`)
    });

    const response = await processRequest(request, async (rq, rs) => {
        const hostHeader = headers['host'];
        if (isLocalHost(hostHeader.split(':')[0]) && localExtensions.includes(path.extname(request.url.pathname || ''))) {
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
    const encoding = response.headers ? 
        (response.headers['Content-Type']?.startsWith('image') ? 'base64' : 'utf8') 
        : 'utf8';
    res.write(response.body || '', encoding);
    res.end();
};

const startApp = async () => {
    /***************************
    Cache the initial main request on app startup
    ****************************/
    console.log('*** CACHING main.js ***');
    await generateBundle('frontend/main.js');

    const port = 4077;

    // Start server. Bind explicitly to 0.0.0.0 so WSL2 / Docker / Windows host
    // browsers can reach the server through 127.0.0.1 (default dual-stack bind
    // is IPv6-only on some Node versions, which Windows localhost can't reach).
    const server = createServer(requestListener);
    server.listen(port, '0.0.0.0');

    console.log('****************************************************');
    console.log(`      APP LISTENING AT http://localhost:${port}        `);
    console.log('****************************************************');

    // Graceful shutdown — release port 4077 cleanly on SIGTERM/SIGINT so the
    // next `npm run dev` doesn't hit EADDRINUSE. Without this, when a parent
    // process (concurrently, the terminal, etc.) dies, this Node process can
    // outlive it as an orphan still bound to the port.
    const shutdown = (signal) => {
        console.log(`\n*** Received ${signal} — closing server ***`);
        server.close(() => process.exit(0));
        // If close hangs (e.g., a long-lived connection), force exit after 3s
        setTimeout(() => {
            console.log('*** Force exit ***');
            process.exit(1);
        }, 3000).unref();
    };
    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGHUP', () => shutdown('SIGHUP'));
};

startApp();
  