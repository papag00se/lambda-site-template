#!/usr/bin/env node
/**
 * Post-build CDN fingerprinting pass.
 *
 * Walks a target directory recursively and rewrites relative asset URLs in any
 * text-based file that can reference other assets to point at
 * https://cdn.${SITE_DOMAIN}/${FINGERPRINT}/...
 *
 * Activates only when SITE_DOMAIN is set in the build env. FINGERPRINT is set by
 * deployment/main.sh as a per-deploy cache-buster (sha256-of-timestamp truncated
 * to 30 chars).
 *
 * File types walked:
 *   - .html, .htm     — page markup
 *   - .css            — stylesheets (url(...))
 *   - .js, .mjs       — bundled scripts (dynamic imports, hardcoded asset paths)
 *   - .svg            — can contain <image href> / <use href> / xlink:href
 *   - .json           — manifests, configs that reference assets
 *   - .xml            — sitemaps, RSS, feeds
 *   - .webmanifest    — PWA manifests
 *
 * Binary assets (images, fonts, glb, video) don't have URLs inside them and are
 * uploaded as-is. References TO them in the text files above are what get rewritten.
 *
 * Patterns matched (only relative paths — schemes like http://, //, data: are skipped):
 *   - HTML/JS:   src="...", href="...", import('...')
 *   - CSS:       url(...) (quoted or unquoted)
 *
 * Usage:
 *   SITE_DOMAIN=jesselanderson.com FINGERPRINT=abc123 node deployment/cdn-fingerprint.js [target-dir]
 *
 * Default target-dir is `frontend/dist`. The deploy script invokes this after
 * assembling the full `frontend/dist/${FINGERPRINT}` tree.
 */
import fs from 'node:fs';
import path from 'node:path';

const TARGET_DIR = process.argv[2] || 'frontend/dist';
const TARGET_EXTS = new Set([
    '.html', '.htm',
    '.css',
    '.js', '.mjs',
    '.svg',
    '.json', '.webmanifest',
    '.xml'
]);

if (!process.env.SITE_DOMAIN) {
    // No-op outside of deploy environments
    process.exit(0);
}

const cdnBase = `https://cdn.${process.env.SITE_DOMAIN}/${process.env.FINGERPRINT || ''}`;

// Each pattern captures the relative path in group 1. Replacement uses a function
// so each match is rewritten exactly once (preventing double-prefixing when the
// same path appears multiple times in the same file).
const PATTERNS = [
    // <tag src="..."> / <tag href="..."> / xlink:href="..." / import('...')
    /(?:src|href|xlink:href|import\()=?(?:'|")(?!https?:|\/\/|data:)([^'"]*?\.[a-z0-9]{1,8})(?:'|")/gim,
    // CSS url(...) — quoted or unquoted
    /url\(\s*(?:'|"|)(?!https?:|\/\/|data:)([^'")\s]+?\.[a-z0-9]{1,8})(?:'|"|)\s*\)/gim
];

/**
 * @param {string} filePath
 * @returns {boolean} true if the file was modified
 */
const rewriteFile = (filePath) => {
    const original = fs.readFileSync(filePath, 'utf8');
    let next = original;
    for (const pattern of PATTERNS) {
        next = next.replace(pattern, (match, p1) => match.replace(p1, `${cdnBase}${p1}`));
    }
    if (next !== original) {
        fs.writeFileSync(filePath, next);
        return true;
    }
    return false;
};

/**
 * @param {string} dir
 * @returns {number} count of files rewritten
 */
const walk = (dir) => {
    if (!fs.existsSync(dir)) return 0;
    let count = 0;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            count += walk(fullPath);
        } else if (TARGET_EXTS.has(path.extname(entry.name).toLowerCase())) {
            if (rewriteFile(fullPath)) count++;
        }
    }
    return count;
};

const rewritten = walk(TARGET_DIR);
console.log(`CDN fingerprinting applied to ${rewritten} file(s) under ${TARGET_DIR} → ${cdnBase}`);
