export const localExtensions = ['.html', '.js', '.jpg', '.png', '.svg', '.css', '.ico', '.glb'];
export const isServer = (typeof process !== 'undefined') && (typeof process.versions.node !== 'undefined');
export const isLocalHost = (host) => ['localhost', '127.0.0.1', '10.0.2.2'].includes(host)
export const _desiredOrder = ['Stratum_Database', 'Technical_Dossier', 'Factions', 'Armory'];
export const basePath = isServer ? process.env.BASE_FOLDER ?? '' : window?.location?.pathname?.startsWith('/lore') ? '/lore' : ''