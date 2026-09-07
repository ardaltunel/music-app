import { readFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { JSDOM } from 'jsdom';

const core = await readFile('assets/js/core.js', 'utf8');
const app = await readFile('assets/js/app.js', 'utf8');
const tick = () => new Promise(resolve => setTimeout(resolve, 10));
async function open(page = 'index', client = null) {
    const dom = new JSDOM(await readFile(`${page}.html`, 'utf8'), { url: `http://localhost/${page}.html`, runScripts: 'outside-only' });
    dom.window.fetch = async () => ({ ok: true, json: async () => JSON.parse(await readFile('assets/data/songs.json', 'utf8')) });
    dom.window.AbortSignal = AbortSignal;
    dom.window.HTMLMediaElement.prototype.pause = function () {};
    dom.window.HTMLMediaElement.prototype.play = async function () {};
    dom.window.HTMLMediaElement.prototype.load = function () {};
    dom.window.musicSupabase = { configured: !!client, client, bucket: 'music-files' };
    dom.window.eval(core);
    dom.window.eval(app);
    await tick();
    return dom;
}
test('Turkish search treats case, dotted I and accents consistently', async () => {
    const dom = await open();
    const normalize = dom.window.MusicCore.normalizeText;
    assert.equal(normalize('İSTANBUL'), normalize('istanbul'));
    assert.equal(normalize('Ay Tenli Kadın'), normalize('ay tenli kadin'));
    dom.window.close();
});
test('media links reject executable, data and credential URLs', async () => {
    const dom = await open();
    const safe = dom.window.MusicCore.safeMediaUrl;
    for (const url of ['javascript:alert(1)', 'data:text/html,test', 'https://user:pass@example.com/a']) assert.equal(safe(url, 'https://example.test/'), '');
    assert.equal(safe('assets/test.mp3', 'https://example.test/music/'), 'https://example.test/music/assets/test.mp3');
    dom.window.close();
});
test('static catalogue renders songs, metadata and distinct accessible actions', async () => {
    const dom = await open();
    const songs = JSON.parse(await readFile('assets/data/songs.json', 'utf8'));
    assert.equal(dom.window.document.querySelectorAll('[data-song-grid] .play').length, songs.length);
    assert.match(dom.window.document.querySelector('[data-song-count]').textContent, /25/);
    assert.equal(dom.window.document.querySelector('[data-play-all]').disabled, false);
    dom.window.close();
});
test('upload validation rejects SVG, empty files and excessive covers', async () => {
    const dom = await open();
    const validate = dom.window.MusicCore.validateUpload;
    assert.throws(() => validate({ name: 'x.svg', type: 'image/svg+xml', size: 100 }, 'albums'));
    assert.throws(() => validate({ name: 'x.mp3', type: 'audio/mpeg', size: 0 }, 'music'));
    assert.throws(() => validate({ name: 'x.png', type: 'image/png', size: 11 * 1024 * 1024 }, 'albums'));
    assert.doesNotThrow(() => validate({ name: 'x.mp3', type: 'audio/mpeg', size: 100 }, 'music'));
    dom.window.close();
});
test('registration reads the name input (not HTMLFormElement.name)', async () => {
    let payload;
    const dom = await open('register', { auth: { getSession: async () => ({ data: {} }), signUp: async value => { payload = value; return { data: {} }; } } });
    const form = dom.window.document.querySelector('form');
    form.elements.namedItem('name').value = 'Ada Test';
    form.elements.email.value = 'ada@example.test';
    form.elements.password.value = form.elements.password_confirm.value = 'example-password';
    form.dispatchEvent(new dom.window.Event('submit', { cancelable: true }));
    await tick();
    assert.equal(payload.options.data.name, 'Ada Test');
    assert.match(form.textContent, /Kayıt oluşturuldu/);
    dom.window.close();
});
test('login network rejection re-enables submit and reports an error', async () => {
    let calls = 0;
    const dom = await open('login', { auth: { getSession: async () => ({ data: {} }), signInWithPassword: async () => { calls++; await tick(); throw new Error('offline'); } } });
    const form = dom.window.document.querySelector('form');
    form.dispatchEvent(new dom.window.Event('submit', { cancelable: true }));
    form.dispatchEvent(new dom.window.Event('submit', { cancelable: true }));
    await tick(); await tick();
    assert.equal(calls, 1);
    assert.equal(form.querySelector('[type=submit]').disabled, false);
    assert.match(form.querySelector('[role=alert]').textContent, /tamamlanamadı/);
    dom.window.close();
});
test('player opens, advances and closes without leaving scroll locked', async () => {
    const dom = await open();
    dom.window.document.querySelector('.play').click();
    assert.equal(dom.window.document.querySelector('.music-player').getAttribute('aria-hidden'), 'false');
    const first = dom.window.document.querySelector('#player-title').textContent;
    dom.window.document.querySelector('#next_song_button').click();
    assert.notEqual(dom.window.document.querySelector('#player-title').textContent, first);
    dom.window.document.querySelector('#close').click();
    assert.equal(dom.window.document.body.classList.contains('modal-open'), false);
    dom.window.close();
});
test('every page has one main landmark, one h1 and labels on visible inputs', async () => {
    for (const page of ['index', 'search', 'login', 'register', 'upload', 'admin']) {
        const dom = new JSDOM(await readFile(`${page}.html`, 'utf8'));
        assert.equal(dom.window.document.querySelectorAll('main').length, 1, page);
        assert.equal(dom.window.document.querySelectorAll('h1').length, 1, page);
        for (const input of dom.window.document.querySelectorAll('input:not([type=hidden])')) assert.ok(input.labels.length || input.hasAttribute('aria-label'), `${page}: ${input.name}`);
        dom.window.close();
    }
});

test('successful admin edit never rolls back its new file when old-file cleanup fails', async () => {
    const removed = [];
    let updated;
    const song = { id: 1, name: 'Original', artist: 'Artist', status: 'approved', music_path: 'owner/music/old.mp3' };
    const client = {
        auth: { getSession: async () => ({ data: { session: { user: { id: 'owner' } } } }) },
        storage: { from: () => ({
            getPublicUrl: path => ({ data: { publicUrl: `https://example.test/${path}` } }),
            upload: async () => ({ error: null }),
            remove: async paths => { removed.push(...paths); throw new Error('cleanup unavailable'); }
        }) },
        from(table) {
            const query = {
                select: () => query, eq: () => query, order: () => query, abortSignal: () => query,
                maybeSingle: async () => ({ data: { role: 'admin', name: 'Admin' } }),
                update: value => { updated = value; return query; },
                single: async () => ({ data: { id: 1 } }),
                then: resolve => Promise.resolve({ data: table === 'songs' ? [song] : null }).then(resolve)
            };
            return query;
        }
    };
    const dom = await open('admin', client);
    dom.window.document.querySelector('[aria-label="Düzenle"]').click();
    await tick();
    const form = dom.window.document.querySelector('[data-admin-edit-form]');
    Object.defineProperty(form.elements.music, 'files', { value: [new dom.window.File(['audio'], 'new.mp3', { type: 'audio/mpeg' })] });
    form.dispatchEvent(new dom.window.Event('submit', { cancelable: true }));
    await tick(); await tick();
    assert.ok(updated.music_path.includes('/music/'));
    assert.deepEqual(removed, ['owner/music/old.mp3']);
    assert.equal(dom.window.document.querySelector('[data-admin-edit-panel]').hidden, true);
    dom.window.close();
});

test('an unavailable configured catalogue displays retry rather than stale static songs', async () => {
    const client = {
        auth: { getSession: async () => ({ data: {} }) },
        from() {
            const query = { select: () => query, eq: () => query, order: () => query, abortSignal: () => query, then: resolve => Promise.resolve({ error: new Error('offline') }).then(resolve) };
            return query;
        }
    };
    const dom = await open('index', client);
    assert.equal(dom.window.document.querySelectorAll('[data-song-grid] .play').length, 0);
    assert.equal(dom.window.document.querySelector('[data-song-grid] button').textContent, 'Tekrar dene');
    assert.equal(dom.window.document.querySelector('[data-song-grid]').getAttribute('aria-busy'), 'false');
    dom.window.close();
});
