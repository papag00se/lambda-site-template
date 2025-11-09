import '../helpers/shim.js';
import { processRequest } from './process_request.js';
import { Request } from '../helpers/http.js';

/**
 * @param {import('aws-lambda').ALBEvent} event
 * @param {import('aws-lambda').Context} context
 * @returns {Promise<import('aws-lambda').ALBResult>}
 */
export const lambdaHandler = async (event, context) => {
    void context;

    /** @type {Record<string, string>} */
    const headers = {};
    if (event.headers) {
        for (const [, [key, value]] of Object.entries(event.headers).entries()) {
            headers[key] = value || '';
        }
    }
    let queryString = '?';
    if (event.queryStringParameters) {
        Object.entries(event.queryStringParameters).forEach(([key, value]) => {
            queryString = `${queryString}&${key}=${value}`;
        });
    }
    const response = await processRequest(
        new Request({
            body: event.isBase64Encoded ? Buffer.from(event.body ?? '', 'base64').toString() : event.body ?? '',
            headers,
            method: event.httpMethod,
            url: new URL(`${event.path}${queryString}`, `http://${headers['host']}`)
        })
    );

    return {
        isBase64Encoded: false,
        statusCode: response.status,
        headers: response.headers,
        body: response.body
    };
};
