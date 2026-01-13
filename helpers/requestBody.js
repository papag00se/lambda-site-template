/**
 * Read the full request body from a Node.js IncomingMessage.
 * @param {import('http').IncomingMessage} incoming
 * @returns {Promise<string>}
 */
export function readRequestBody(incoming) {
    return new Promise((resolve, reject) => {
        let body = '';
        incoming.setEncoding('utf8');
        incoming.on('data', (chunk) => {
            body += chunk;
        });
        incoming.on('end', () => resolve(body));
        incoming.on('error', reject);
    });
}
