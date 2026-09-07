import { readFile, appendFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';

export function readConfig(source) {
    const url = source.match(/\burl\s*:\s*['"]([^'"]+)['"]/)?.[1];
    const key = source.match(/\banonKey\s*:\s*['"]([^'"]+)['"]/)?.[1];
    if (!url || !/^https:\/\/[a-z0-9-]+\.supabase\.co$/.test(url) || !key) {
        throw new Error('Invalid Supabase URL or missing public API key.');
    }
    if (!key.startsWith('sb_publishable_')) {
        try {
            if (JSON.parse(Buffer.from(key.split('.')[1], 'base64url')).role !== 'anon') throw new Error();
        } catch {
            throw new Error('Health checks require a publishable or legacy anon key, never a privileged key.');
        }
    }
    return { url, key };
}

export async function checkDatabase(config, {
    fetcher = fetch,
    sleep = milliseconds => new Promise(resolve => setTimeout(resolve, milliseconds)),
    attempts = 4,
    report = console.log
} = {}) {
    const endpoint = new URL('/rest/v1/songs', config.url);
    endpoint.search = new URLSearchParams({ select: 'id', status: 'eq.approved', limit: '1' }).toString();
    let reason = 'Unknown error';
    for (let attempt = 1; attempt <= attempts; attempt++) {
        try {
            const response = await fetcher(endpoint, {
                // Publishable keys are API keys, not user JWTs.
                headers: { apikey: config.key, Accept: 'application/json', 'Cache-Control': 'no-cache' },
                cache: 'no-store',
                redirect: 'error',
                signal: AbortSignal.timeout(20000)
            });
            if (!response.ok) {
                const error = new Error(`Database returned HTTP ${response.status}.`);
                error.retryable = response.status === 429 || response.status >= 500;
                throw error;
            }
            if (!response.headers.get('content-type')?.includes('application/json')) {
                throw new Error('Database returned a non-JSON response.');
            }
            const rows = await response.json();
            if (!Array.isArray(rows) || rows.length > 1 || rows.some(row => !row || !['number', 'string'].includes(typeof row.id))) {
                throw new Error('Database returned an unexpected payload.');
            }
            report(`Database healthy: HTTP ${response.status}, valid catalogue query, ${rows.length} row(s), attempt ${attempt}.`);
            return { checked_at: new Date().toISOString(), rows: rows.length };
        } catch (error) {
            // Never log fetch URLs, keys, raw responses or user records.
            reason = error instanceof Error ? error.message : 'Request failed';
            if (error.retryable === false) throw new Error(reason);
            report(`Health check attempt ${attempt}/${attempts} failed: ${reason}`);
            if (attempt < attempts) await sleep(5000 * attempt);
        }
    }
    throw new Error(`Supabase is not healthy after ${attempts} attempts: ${reason}`);
}

async function main() {
    const config = readConfig(await readFile(new URL('../../assets/js/supabase-config.js', import.meta.url), 'utf8'));
    const result = await checkDatabase(config);
    if (process.env.GITHUB_STEP_SUMMARY) {
        await appendFile(process.env.GITHUB_STEP_SUMMARY,
            `### Supabase healthy\nVerified a real public catalogue query at ${result.checked_at}.\nSchedule: every third calendar day at 21:00 UTC. No song data was modified.\n`);
    }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
    main().catch(error => { console.error(error.message); process.exitCode = 1; });
}
