import http from 'node:http';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

const fixture = process.argv.includes('--fixture');
const root = process.cwd();
const types = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.mp3': 'audio/mpeg', '.svg': 'image/svg+xml' };
http.createServer(async (request, response) => {
    try {
        const url = new URL(request.url, 'http://localhost');
        const name = decodeURIComponent(url.pathname === '/' ? '/index.html' : url.pathname);
        const file = path.resolve(root, `.${name}`);
        if (!file.startsWith(root + path.sep)) throw new Error('Outside root');
        let body = await readFile(file);
        if (fixture && name.endsWith('.html')) {
            body = Buffer.from(body.toString().replace(/<script src="https:\/\/cdn.jsdelivr.net[^>]+><\/script>/, '<script src="tests/fixture.js"></script>')
                .replace('<script src="assets/js/supabase-client.js"></script>', ''));
        }
        response.writeHead(200, { 'Content-Type': `${types[path.extname(file)] || 'application/octet-stream'}; charset=utf-8`, 'Cache-Control': 'no-store' });
        response.end(body);
    } catch {
        response.writeHead(404); response.end('Not found');
    }
}).listen(fixture ? 8001 : 8000, '127.0.0.1', () => console.log(`Music: http://127.0.0.1:${fixture ? 8001 : 8000}${fixture ? ' (isolated test data)' : ''}`));
