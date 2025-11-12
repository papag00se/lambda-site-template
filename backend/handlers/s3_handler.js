import { LogCategory, Logger } from '../../helpers/logger.js';
import { Request, Response } from '../../helpers/http.js';
import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3';
import path from 'path';

/**
 * Serves static assets from S3 when the CDN is bypassed.
 * @param {Request} req
 * @param {Response} res
 * @returns {Promise<Response>}
 */
export const s3Handler = async (req, res) => {
    try {
        // Frontend files normally handled by S3/CDN
        let file = decodeURI(req.url?.pathname || '');
        if (file === '/') {
            file = `/index.html`;
        }
        file = `/${process.env.VERSION_HASH}/${file.substring(1)}`;

        const s3Client = new S3Client({});

        const s3Res = await s3Client.send(
            new GetObjectCommand({
                Bucket: 'lambda.site',
                Key: file
            })
        );

        res.status = s3Res.$metadata.httpStatusCode || 200;
        res.headers['content-type'] = s3Res.ContentType || 'text/html';
        res.body = s3Res.Body?.transformToWebStream();
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        Logger.log({
            message: `FRONTEND FILE request failed: ${message}`,
            category: LogCategory.ERROR,
            event: 'express.frontEndFilesRequest'
        });
        res.status = 500;
        res.body = JSON.stringify({ error: 'Internal Server Error', message });
    }
    return res;
};
