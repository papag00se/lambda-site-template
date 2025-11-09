export class ApplicationCache {
    /** @type {Record<string, unknown>} */
    static cache = {};

    /** @type {Record<string, unknown>} */
    static context = globalThis.window?.ApplicationContext ?? {};

    /** @type {Record<string, unknown>} */
    static publicContext = {};
}
