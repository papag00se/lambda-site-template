/**
 * @typedef {Record<string, string>} Headers
 */

export class Request {
    /**
     * @param {{method: string, headers: Headers, url: URL, body?: string}} req
     */
    constructor(req) {
        /** @type {string} */
        this.method = req.method;
        /** @type {Headers} */
        this.headers = req.headers;
        /** @type {URL} */
        this.url = req.url;
        /** @type {string | undefined} */
        this.body = req.body;
    }

    /**
     * @param {string} key
     * @returns {string | undefined}
     */
    getCookie(key) {
        let cookies = this.headers['Cookie'];
        if (!cookies) {
            cookies = this.headers['cookie'];
        }
        let cookie = this._searchCookie(cookies, key);
        if (!cookie) {
            // multicookiejar is how we get around Lambda's MultiValueHeader lameness
            const multicookiejar = this._searchCookie(cookies, 'multicookiejar');
            cookie = this._searchCookie(
                multicookiejar ? decodeURIComponent(multicookiejar).replace(/\|/g, '; ') : undefined,
                key
            );
        }
        return cookie;
    }

    /**
     * @param {string | undefined} cookies
     * @param {string} key
     * @returns {string | undefined}
     * @private
     */
    _searchCookie(cookies, key) {
        return cookies
            ?.split(/;\s?/gi)
            .find((cookie) => cookie.toLowerCase().startsWith(key.toLowerCase()))
            ?.split('=')?.[1];
    }
}

/**
 * @typedef {{domain?: string, maxAge?: number, path?: string}} CookieOptions
 */

export class Response {
    /**
     * @param {{body?: unknown, headers?: Headers, status?: number, cookies?: string[]}} [res]
     */
    constructor(res = {}) {
        /** @type {unknown} */
        this.body = res.body;
        /** @type {Headers} */
        this.headers = res.headers ?? {};
        /** @type {string[]} */
        this.cookies = res.cookies ?? [];
        /** @type {number} */
        this.status = res.status ?? 200;
    }

    /**
     * @param {string} key
     * @param {string} value
     * @param {CookieOptions} [options]
     * @returns {void}
     */
    setCookie(key, value, options) {
        this.cookies.push(
            `${key}=${value}; ${options?.domain ? `Domain=${options.domain}; ` : ''}${
                options?.maxAge ? `Max-Age=${options.maxAge}; ` : ''
            }${options?.path ? `Path=${options.path}; ` : ''}Secure; HttpOnly`
        );
    }
}
