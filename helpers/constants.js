export const localExtensions = ['.html', '.js', '.jpg', '.png', '.svg', '.css', '.ico', '.glb'];
export const isServer = (typeof process !== 'undefined') && (typeof process.versions.node !== 'undefined');
export const isLocalHost = (host) => ['localhost', '127.0.0.1', '10.0.2.2'].includes(host)