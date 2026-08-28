export const localExtensions = [
    // Web binaries / images
    '.html', '.js', '.mjs', '.jpg', '.jpeg', '.png', '.svg', '.css', '.ico', '.glb',
    '.woff', '.woff2', '.ttf', '.otf',
    // Text-based static endpoints (AI-aware surfaces, manifests, sitemaps)
    '.md', '.txt', '.json', '.xml', '.webmanifest'
];
export const isServer = (typeof process !== 'undefined') && (typeof process.versions.node !== 'undefined');
export const isLocalHost = (host) => ['localhost', '127.0.0.1', '10.0.2.2'].includes(host)
