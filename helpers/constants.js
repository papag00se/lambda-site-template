export const localExtensions = ['.html', '.js', '.jpg', '.png', '.svg', '.css', '.ico', '.glb'];
export const isServer = (typeof process !== 'undefined') && (typeof process.versions.node !== 'undefined');
export const _desiredOrder = ['Stratum_Database', 'Technical_Dossier', 'Factions', 'Armory'];
export const basePath = isServer ? process.env.BASE_FOLDER ?? '' : window?.location?.pathname?.startsWith('/lore') ? '/lore' : ''