import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import ts from 'typescript';
import assert from 'node:assert/strict';
import { test } from 'node:test';

const source = ts.transpileModule(await readFile('supabase/functions/youtube-search/index.ts', 'utf8'), { compilerOptions: { target: ts.ScriptTarget.ES2022 } }).outputText;
function server(budget = true) {
    let handler, requests = 0;
    const context = vm.createContext({
        Request, Response, URL, URLSearchParams, AbortSignal, TextDecoder, Uint8Array,
        console: { error() {} },
        Deno: { serve: value => { handler = value; }, env: { get: key => ({ YOUTUBE_API_KEY: 'test-only', SUPABASE_URL: 'https://test.invalid', SUPABASE_SERVICE_ROLE_KEY: 'server-test-only' })[key] } },
        fetch: async url => {
            requests++;
            return Response.json(String(url).includes('/rpc/') ? budget : { items: [{ id: { videoId: 'abcdefghijk' }, snippet: { title: 'Test song', channelTitle: 'Artist' } }] });
        }
    });
    vm.runInContext(source, context);
    return { call: (body, origin = 'https://ardaltunel.github.io') => handler(new Request('https://test.invalid', { method: 'POST', headers: { 'content-type': 'application/json', origin }, body: JSON.stringify(body) })), requests: () => requests };
}
test('Edge rejects malformed data, large requests and disallowed origins without spending quota', async () => {
    const edge = server();
    for (const body of [null, [], { query: {} }, { query: 123 }, { query: 'x' }]) assert.equal((await edge.call(body)).status, 400);
    assert.equal((await edge.call({ query: 'x'.repeat(3000) })).status, 413);
    assert.equal((await edge.call({ query: 'test' }, 'https://attacker.invalid')).status, 403);
    assert.equal(edge.requests(), 0);
});
test('Edge deduplicates concurrent queries and serves cached results with caller-specific CORS', async () => {
    const edge = server();
    const responses = await Promise.all([edge.call({ query: 'Test Song' }), edge.call({ query: 'Test Song' }, 'http://localhost:8000')]);
    assert.equal(responses[0].status, 200);
    assert.equal(responses[1].headers.get('access-control-allow-origin'), 'http://localhost:8000');
    assert.equal((await responses[0].json()).items[0].provider_id, 'abcdefghijk');
    assert.equal((await edge.call({ query: 'Test Song' })).status, 200);
    assert.equal(edge.requests(), 2, 'one budget and one YouTube call');
});
test('Edge fails closed when the shared daily quota is exhausted', async () => {
    const edge = server(false);
    assert.equal((await edge.call({ query: 'Test Song' })).status, 429);
    assert.equal(edge.requests(), 1, 'no YouTube call');
});
