import { PGlite } from '@electric-sql/pglite';
import { readFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
import { test } from 'node:test';

test('SQL policies enforce approval, ownership, role protection, references and atomic quota', async () => {
    const db = new PGlite();
    try {
        await db.exec(`
            create role anon; create role authenticated; create role service_role;
            create schema auth; create schema storage;
            create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('test.uid', true), '')::uuid $$;
            create table auth.users (id uuid primary key, email text, raw_user_meta_data jsonb);
            create table storage.buckets (id text primary key, name text, public boolean, file_size_limit bigint, allowed_mime_types text[]);
            create table storage.objects (id bigint generated always as identity, bucket_id text, name text);
            alter table storage.objects enable row level security;
            create function storage.foldername(text) returns text[] language sql as $$ select string_to_array($1, '/') $$;
            grant usage on schema public, auth, storage to anon, authenticated, service_role;
        `);
        for (const file of ['schema.sql', 'admin-actions-policies.sql', 'security-hardening.sql']) await db.exec(await readFile(`database/supabase/${file}`, 'utf8'));
        // Verify the upgrade is safe to rerun.
        await db.exec(await readFile('database/supabase/security-hardening.sql', 'utf8'));
        await db.exec(`grant select, insert, update, delete on public.songs, public.profiles, storage.objects to authenticated;
            revoke update on public.profiles from authenticated;
            grant update(name) on public.profiles to authenticated;
            grant select on public.songs, storage.objects to anon;
            grant usage on all sequences in schema public, storage to authenticated;
            insert into auth.users values ('11111111-1111-1111-1111-111111111111','user@example.test','{"name":"User"}');
            insert into auth.users values ('22222222-2222-2222-2222-222222222222','admin@example.test','{"name":"Admin"}');
            update public.profiles set role='admin' where email='admin@example.test';
            set role authenticated;
            set test.uid = '11111111-1111-1111-1111-111111111111';`);
        const insert = (status, path = '11111111-1111-1111-1111-111111111111/music/test.mp3') => db.exec(`insert into public.songs(user_id,name,artist,status,music_path) values(auth.uid(),'Test','Artist','${status}','${path}')`);
        await assert.rejects(insert('approved'), /row-level security/);
        await assert.rejects(insert('pending', '22222222-2222-2222-2222-222222222222/music/test.mp3'), /row-level security/);
        await insert('pending');
        await assert.rejects(db.exec("update public.profiles set role='admin' where id=auth.uid()"), /permission denied/);
        await db.exec("update public.profiles set name='Updated' where id=auth.uid()");
        await db.exec("insert into storage.objects(bucket_id,name) values('music-files','11111111-1111-1111-1111-111111111111/music/test.mp3')");
        await db.exec('delete from storage.objects');
        assert.equal((await db.query('select * from storage.objects')).rows.length, 1, 'referenced file survives owner deletion');
        await db.exec("set role anon; set test.uid = '';");
        assert.equal((await db.query('select * from public.songs')).rows.length, 0);
        assert.equal((await db.query('select * from storage.objects')).rows.length, 0);
        await assert.rejects(db.query('select public.consume_youtube_search_budget(2)'), /permission denied/);
        await db.exec("set role authenticated; set test.uid='22222222-2222-2222-2222-222222222222'; update public.songs set status='approved';");
        await db.exec('set role anon');
        assert.equal((await db.query('select * from public.songs')).rows.length, 1);
        await db.exec('set role service_role');
        for (const expected of [true, true, false]) assert.equal((await db.query('select public.consume_youtube_search_budget(2) as allowed')).rows[0].allowed, expected);
    } finally { await db.close(); }
});
