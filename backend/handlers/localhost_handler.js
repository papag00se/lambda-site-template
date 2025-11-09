import { Request, Response } from '../../helpers/http.js';
import fs from 'fs';
import mime from 'mime';
import { ApplicationCache } from '../../helpers/cache.js';
import { generateBundle } from '../../helpers/bundler.js';

/**
 * Serves local static assets (and bundles JS modules) when running in dev mode.
 * @param {Request} req
 * @param {Response} res
 * @returns {Promise<boolean>}
 */
export const localhostHandler = async (req, res) => {
    try {
        const mimeType = mime.getType(req.url?.pathname || '') || 'application/octet-stream';
        let file = decodeURI(req.url?.pathname || '');
        /** @type {string | Buffer | undefined} */
        let responseText;

        if (file.startsWith('/node_modules')) {
            file = file.slice(1);
        } else if (file.startsWith('@')) {
            file = `node_modules/${file}`;
        }

        if (!file.startsWith('node_modules/')) {
            file = `frontend${file}`;
        }

        if (ApplicationCache.cache[file]) {
            responseText = ApplicationCache.cache[file];
        } else if (file.endsWith('.js')) {
            responseText = await generateBundle(file);
        } else {
            if (!fs.existsSync(file)) {
                res.status = 404;
                res.body = 'Not Found';
                return true;
            }

            // ✅ READ GLB AND OTHER BINARY FILES SAFELY
            const binaryTypes = ['.glb', '.wasm', '.ttf'];
            const ext = file.slice(file.lastIndexOf('.'));

            if (binaryTypes.includes(ext)) {
                responseText = fs.readFileSync(file); // No encoding
            } else {
                const encoding = mimeType.startsWith('image') ? 'base64' : 'utf8';
                responseText = fs.readFileSync(file, encoding);
            }
        }

        if (responseText !== undefined) {
            ApplicationCache.cache[file] = responseText;
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
