import fs from 'node:fs';
import path from 'node:path';
import { isLocalHost } from './constants.js';

const LEGACY_TEMPLATE_DIR = path.resolve('templates');
const FRONTEND_TEMPLATE_DIR = path.resolve('frontend/templates');
const FRONTEND_CSS_DIR = path.resolve('frontend/css');

/**
 * Load a template or stylesheet from the templates directory.
 * Falls back through the new frontend paths (templates/css) and the old backend templates folder.
 * @param {string} filename
 * @param {string} [host]
 * @returns {string}
 */
export function loadTemplateFile(filename, host = '') {
    const candidates = [];

    const hostName = host?.split?.(':')?.[0] ?? '';
    const preferFrontend = hostName ? isLocalHost(hostName) : true;

    if (preferFrontend && filename.endsWith('.css')) {
        candidates.push(path.join(FRONTEND_CSS_DIR, filename));
    }
    if (preferFrontend) {
        candidates.push(path.join(FRONTEND_TEMPLATE_DIR, filename));
    }

    // Legacy / backend fallback locations
    if (!preferFrontend && filename.endsWith('.css')) {
        candidates.push(path.join(LEGACY_TEMPLATE_DIR, filename));
    }
    candidates.push(path.join(LEGACY_TEMPLATE_DIR, filename));

    // Direct path (for compatibility with tests passing full paths)
    candidates.push(filename);

    for (const file of candidates) {
        if (fs.existsSync(file)) {
            return fs.readFileSync(file, 'utf8');
        }
    }

    throw new Error(`Template file not found: ${filename}`);
}

/**
 * Replace {{TOKENS}} in template with provided string values.
 * @param {string} template
 * @param {Record<string, string>} replacements
 * @returns {string}
 */
export function applyTemplate(template, replacements) {
    return Object.entries(replacements).reduce((acc, [token, value]) => {
        const pattern = new RegExp(`{{${token}}}`, 'g');
        return acc.replace(pattern, value ?? '');
    }, template);
}

/**
 * HTML-escape a string for safe rendering.
 * @param {string|number|null|undefined} value
 * @returns {string}
 */
export function escapeHtml(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

/**
 * Escape attribute value, including backticks to avoid template literal breaks.
 * @param {string} value
 * @returns {string}
 */
export function escapeAttribute(value) {
    return escapeHtml(value).replace(/`/g, '&#96;');
}
