import { HTMLElement, Element, Event, CustomEvent, EventTarget, CustomElementRegistry, } from '@lit-labs/ssr-dom-shim';

/**
 * Constructs a fresh instance of the "window" vm context to use for evaluating
 * user SSR code. Includes a minimal shim of DOM APIs.
 *
 * @param includeJSBuiltIns Whether certain standard JS context globals like
 *  `console` and `setTimeout` should also be added to the global. Should
 *  generally only be true when adding window to a fresh VM context that
 *  starts with nothing.
 * @param props Additional properties to add to the window global
 */
export const getWindow = ({ includeJSBuiltIns = false, props = {}, }) => {
    class ShadowRoot {
    }
    class Document {
        get adoptedStyleSheets() {
            return [];
        }
        createTreeWalker() {
            return {};
        }
        createTextNode() {
            return {};
        }
        createElement() {
            return {};
        }
    }
    class CSSStyleSheet {
        replace() { }
    }
    const window = {
        EventTarget,
        Event: globalThis.Event ?? Event,
        CustomEvent: globalThis.CustomEvent ?? CustomEvent,
        Element,
        HTMLElement,
        Document,
        document: new Document(),
        CSSStyleSheet,
        ShadowRoot,
        CustomElementRegistry,
        customElements: new CustomElementRegistry(),
        btoa(s) {
            return Buffer.from(s, 'binary').toString('base64');
        },
        fetch: (url, init) => 
        // TODO(aomarks) The typings from node-fetch are wrong because they don't
        // allow URL.
        fetch(url, init),
        location: new URL('http://localhost'),
        MutationObserver: class {
            observe() { }
        },
        // No-op any async tasks
        requestAnimationFrame() { },
        // Set below
        window: undefined,
        // User-provided globals, like `require`
        ...props,
    };
    if (includeJSBuiltIns) {
        Object.assign(window, {
            // No-op any async tasks
            setTimeout() { },
            clearTimeout() { },
            // Required for node-fetch
            Buffer,
            URL,
            URLSearchParams,
            console: {
                log(...args) {
                    console.log(...args);
                },
                info(...args) {
                    console.info(...args);
                },
                warn(...args) {
                    console.warn(...args);
                },
                debug(...args) {
                    console.debug(...args);
                },
                error(...args) {
                    console.error(...args);
                },
                assert(bool, msg) {
                    if (!bool) {
                        throw new Error(msg);
                    }
                },
            },
        });
    }
    return window;
};

if (globalThis.window === undefined) {
    const window = getWindow({});
    globalThis.window = window;
    globalThis.document = window.document;
    globalThis.location = window.location;
    globalThis.Element = window.Element;
    globalThis.HTMLElement = window.HTMLElement;
    globalThis.Document = window.Document;
    globalThis.CSSStyleSheet = window.CSSStyleSheet;
    globalThis.ShadowRoot = window.ShadowRoot;
    globalThis.CustomElementRegistry = window.CustomElementRegistry;
    globalThis.customElements = window.customElements;
    globalThis.MutationObserver = window.MutationObserver;
    globalThis.requestAnimationFrame = window.requestAnimationFrame;
}
