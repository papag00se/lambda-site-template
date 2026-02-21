import assert from 'node:assert/strict';
import test from 'node:test';

import { applyTemplate, escapeAttribute, escapeHtml } from '../../helpers/templateUtils.js';

test('applyTemplate replaces curly brace tokens', () => {
    const template = '<title>{{TITLE}}</title><main>{{BODY}}</main>';
    const result = applyTemplate(template, { TITLE: 'Hello', BODY: 'World' });

    assert.equal(result, '<title>Hello</title><main>World</main>');
});

test('escapeHtml escapes HTML special characters', () => {
    const escaped = escapeHtml(`<div class="x">'&"</div>`);
    assert.equal(escaped, '&lt;div class=&quot;x&quot;&gt;&#39;&amp;&quot;&lt;/div&gt;');
});

test('escapeAttribute escapes backticks in addition to HTML entities', () => {
    const escaped = escapeAttribute('`quoted`');
    assert.equal(escaped, '&#96;quoted&#96;');
});
