import nodeResolve from '@rollup/plugin-node-resolve';
import * as fs from 'fs';
import { rollup } from 'rollup';
import { ApplicationCache } from './cache.js';

/**
 * Bundles the requested entry file and caches the generated output.
 * @param {string} entryFile
 * @returns {Promise<string>}
 */
export const generateBundle = async (entryFile) => {
    if (!fs.existsSync(entryFile)) {
        throw new Error(`File not found: ${entryFile}`);
    }

    const bundle = await rollup({
        input: entryFile,
        plugins: [nodeResolve()]
    });
    const { output } = await bundle.generate({ format: 'es', inlineDynamicImports: true });
    if (!fs.existsSync('./temp')) {
        fs.mkdirSync('./temp');
    }

    const chunks = output.filter((item) => item.type === 'chunk');
    if (!chunks.length) {
        throw new Error(`No chunk output generated for ${entryFile}`);
    }

    for (const chunk of chunks) {
        fs.writeFileSync(`./temp/${chunk.fileName}`, chunk.code);
        ApplicationCache.cache[chunk.fileName] = chunk.code;
    }

    return chunks[0].code;
};
