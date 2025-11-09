if (globalThis.window === undefined) {
    //const window = getWindow({});
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
