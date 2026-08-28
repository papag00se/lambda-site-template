import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import test from 'node:test';
import { setTimeout as delay } from 'node:timers/promises';

const HOST = '127.0.0.1';
const PORT = 4077;
const BASE_URL = `http://${HOST}:${PORT}`;

/** @type {import('node:child_process').ChildProcessWithoutNullStreams | null} */
let serverProcess = null;

const waitForServer = async (timeoutMs = 20_000) => {
    const startedAt = Date.now();
    /** @type {unknown} */
    let lastError = null;

    while (Date.now() - startedAt < timeoutMs) {
        try {
            const response = await fetch(`${BASE_URL}/api/test`);
            if (response.status === 200) {
                return;
            }
        } catch (error) {
            lastError = error;
        }
        await delay(250);
    }

    throw new Error(`Local server did not start in time: ${String(lastError)}`);
};

test.before(async () => {
    serverProcess = spawn(process.execPath, ['backend/local.js'], {
        cwd: process.cwd(),
        env: { ...process.env, NODE_ENV: 'test' },
        stdio: 'pipe'
    });
    await waitForServer();
});

test.after(async () => {
    if (!serverProcess) {
        return;
    }
    if (serverProcess.exitCode !== null || serverProcess.signalCode !== null) {
        return;
    }

    const exited = once(serverProcess, 'exit');
    serverProcess.kill('SIGTERM');
    await Promise.race([exited, delay(2_000)]);

    if (serverProcess.exitCode === null && serverProcess.signalCode === null) {
        serverProcess.kill('SIGKILL');
        await exited;
    }
});

test('GET /api/test responds with expected content and cors headers', async () => {
    const response = await fetch(`${BASE_URL}/api/test`);

    assert.equal(response.status, 200);
    assert.equal(await response.text(), 'Successful request to the backend API');
    assert.equal(response.headers.get('access-control-allow-origin'), '*');
});

test('OPTIONS /api/test short-circuits with 200', async () => {
    const response = await fetch(`${BASE_URL}/api/test`, { method: 'OPTIONS' });

    assert.equal(response.status, 200);
    assert.equal(response.headers.get('access-control-allow-methods'), '*');
});

test('GET /missing-route returns 404 from render handler', async () => {
    const response = await fetch(`${BASE_URL}/missing-route`);

    assert.equal(response.status, 404);
    assert.equal(response.headers.get('x-component'), 'render_handler');
    assert.equal(await response.text(), 'Not Found');
});
