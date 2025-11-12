import { Request, Response } from '../helpers/http.js';
import path from 'path';
import { ApplicationCache } from '../helpers/cache.js';
import { localExtensions } from '../helpers/constants.js';
import { s3Handler } from './handlers/s3_handler.js';
import { renderHandler } from './handlers/render_handler.js';

/**
 * @callback MiddlewareHandler
 * @param {Request} req
 * @param {Response} res
 * @returns {Promise<boolean> | boolean}
 */

/**
 * Handles the lifecycle of a request, including middleware and fallback routing.
 * @param {Request} req
 * @param {MiddlewareHandler} [handler]
 * @returns {Promise<Response>}
 */
export const processRequest = async (req, handler) => {
    const res = new Response({ headers: {} });

    // -----          CORS           -------/
    if (req.method === 'OPTIONS') {
        res.headers['Access-Control-Allow-Origin'] = '*';
        res.headers['Access-Control-Allow-Headers'] = '*';
        res.headers['Access-Control-Allow-Methods'] = '*';
        res.status = 200;
        return res;
    }

    /***************************************/
    /*          GLOBAL HEADERS             */
    /***************************************/
    res.headers['kora-application'] = 'hal.handle.me';

    /***************************************/
    /*            MIDDLEWARE               */
    /***************************************/
    const theme = req.getCookie('theme');
    if (theme) {
        ApplicationCache.context['theme'] = theme;
        ApplicationCache.publicContext['theme'] = theme;
    }

    // -----           DB            -------/
    // SETUP DB HERE

    // -----  SERVER SIDE RENDERING  ------/
    // This is workaround code for @lit-labs/router
    if (globalThis.window) {
        globalThis.window.location.href = req.url.toString();
        globalThis.location = globalThis.window.location;
    }

    // -----    LOCALHOST HANDLING    ------/
    if (handler && (await handler(req, res))) {
        return res;
    }

    /***************************************/
    /*             ROUTES                  */
    /***************************************/

    if (localExtensions.includes(path.extname(req.url.pathname || ''))) {
        return s3Handler(req, res);
    }

    if (req.url.pathname == '/') {
        return renderHandler(req, res);
    }

    if (req.url.pathname == '/api/test') {
        return {
            status: 200,
            body: 'Successful request to the backend API'
        };
    }

    // -----          404            -------/
    res.body = 'Not Found';
    res.headers['Content-Type'] = 'text/plain';
    res.headers['X-Component'] = 'process_request';
    res.status = 404;
    // Context is only meant per request, so clear at end of request
    ApplicationCache.context = {};
    return res;
};
