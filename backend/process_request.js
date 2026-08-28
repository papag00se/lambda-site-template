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


    /***************************************/
    /*          GLOBAL HEADERS             */
    /***************************************/
    res.headers['Access-Control-Allow-Origin'] = '*';
    res.headers['Access-Control-Allow-Headers'] = '*';
    res.headers['Access-Control-Allow-Methods'] = '*';

    // -----          CORS           -------/
    if (req.method == 'OPTIONS') {
        res.status = 200;
        return res;
    }

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

    // Static assets (css, js, images) — served by S3 in prod, localhost handler in dev
    if (localExtensions.includes(path.extname(req.url.pathname || ''))) {
        return s3Handler(req, res);
    }

    // API routes (explicit, before the page renderer catches them)
    if (req.url.pathname == '/api/test') {
        return {
            status: 200,
            body: 'Successful request to the backend API',
            headers: res.headers
        };
    }

    // Pages — Eleventy-built HTML, dispatched by URL path. renderHandler returns
    // its own 404 (with X-Component: render_handler) if the page doesn't exist.
    return renderHandler(req, res);
};
