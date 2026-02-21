import assert from 'node:assert/strict';
import test from 'node:test';

import { Request, Response } from '../../helpers/http.js';

test('Request.getCookie reads standard cookie header values', () => {
    const req = new Request({
        method: 'GET',
        headers: { cookie: 'theme=dark; accountId=abc123' },
        url: new URL('http://localhost/')
    });

    assert.equal(req.getCookie('theme'), 'dark');
    assert.equal(req.getCookie('accountId'), 'abc123');
});

test('Request.getCookie reads values from multicookiejar fallback', () => {
    const req = new Request({
        method: 'GET',
        headers: {
            cookie: `multicookiejar=${encodeURIComponent('theme=light|accountId=user_42')}`
        },
        url: new URL('http://localhost/')
    });

    assert.equal(req.getCookie('theme'), 'light');
    assert.equal(req.getCookie('accountId'), 'user_42');
});

test('Response.setCookie includes security attributes and options', () => {
    const res = new Response();

    res.setCookie('session', 'token123', {
        domain: 'example.com',
        maxAge: 3600,
        path: '/'
    });

    assert.equal(
        res.cookies[0],
        'session=token123; Domain=example.com; Max-Age=3600; Path=/; Secure; HttpOnly'
    );
});
