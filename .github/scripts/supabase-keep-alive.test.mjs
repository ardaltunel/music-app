import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readConfig, checkDatabase } from './supabase-keep-alive.mjs';

const config = { url: 'https://test.supabase.co', key: 'sb_publishable_test' };
const options = { sleep: async () => {}, report: () => {} };

test('reads public configuration without executing JavaScript', () => {
    assert.deepEqual(readConfig("window.config = {url: 'https://test.supabase.co', anonKey: 'sb_publishable_test'}; throw Error()"), config);
    assert.throws(() => readConfig("{url:'https://attacker.test',anonKey:'test'}"));
    assert.throws(() => readConfig("{url:'https://test.supabase.co',anonKey:'sb_secret_test'}"));
});
test('sends the publishable key only as apikey and validates an actual row response', async () => {
    const result = await checkDatabase(config, { ...options, fetcher: async (url, request) => {
        assert.equal(url.pathname, '/rest/v1/songs');
        assert.equal(url.searchParams.get('status'), 'eq.approved');
        assert.equal(request.headers.apikey, config.key);
        assert.equal(request.headers.Authorization, undefined);
        assert.equal(request.redirect, 'error');
        return Response.json([{ id: 28 }]);
    } });
    assert.equal(result.rows, 1);
});
test('an empty but valid catalogue is healthy', async () => {
    assert.equal((await checkDatabase(config, { ...options, fetcher: async () => Response.json([]) })).rows, 0);
});
test('transient failures retry and then recover', async () => {
    let calls = 0;
    await checkDatabase(config, { ...options, fetcher: async () => ++calls === 1 ? new Response('', { status: 503 }) : Response.json([]) });
    assert.equal(calls, 2);
});
test('authentication failure is not reported healthy or retried', async () => {
    let calls = 0;
    await assert.rejects(checkDatabase(config, { ...options, fetcher: async () => { calls++; return new Response('', { status: 401 }); } }), /401/);
    assert.equal(calls, 1);
});
test('HTTP 200 error pages and invalid JSON shapes cannot give a false success', async () => {
    for (const response of [new Response('<html>unavailable</html>'), Response.json({ error: 'paused' })]) {
        await assert.rejects(checkDatabase(config, { ...options, attempts: 1, fetcher: async () => response.clone() }));
    }
});
test('persistent network failure stops after the bounded retry count', async () => {
    let calls = 0;
    await assert.rejects(checkDatabase(config, { ...options, fetcher: async () => { calls++; throw new Error('Network unavailable'); } }), /after 4 attempts/);
    assert.equal(calls, 4);
});
