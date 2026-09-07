import { cp, mkdir, readFile, writeFile } from 'node:fs/promises';
import { JSDOM } from 'jsdom';
import path from 'node:path';

const pages = ['index.html', 'search.html', 'login.html', 'register.html', 'upload.html', 'admin.html', '404.html'];
await mkdir('dist', { recursive: true });
for (const file of pages) {
    const html = await readFile(file, 'utf8');
    const dom = new JSDOM(html);
    for (const element of dom.window.document.querySelectorAll('script[src], link[href], img[src]')) {
        const source = element.getAttribute('src') || element.getAttribute('href');
        if (/^(https?:|\/|#)/.test(source)) continue;
        await readFile(source.split('?')[0]);
    }
    dom.window.close();
    await writeFile(path.join('dist', file), html);
}
for (const file of ['assets', '.nojekyll', 'robots.txt', 'sitemap.xml']) await cp(file, path.join('dist', file), { recursive: true });
for (const song of JSON.parse(await readFile('assets/data/songs.json', 'utf8'))) {
    if (song.music) await readFile(path.join('assets/uploads/music', song.music));
    if (song.album) await readFile(path.join('assets/uploads/albums', song.album));
}
console.log('Static release verified and written to dist/ (test fixtures and database scripts excluded).');
