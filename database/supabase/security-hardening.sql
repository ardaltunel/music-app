-- Run after schema.sql and admin-actions-policies.sql, for new and existing installs.
-- No rows or files are deleted. The transaction makes policy changes atomic.
begin;

-- Enforce future writes without rejecting or rewriting legacy rows during upgrade.
do $$ begin
    if not exists (select 1 from pg_constraint where conname = 'songs_valid_text' and conrelid = 'public.songs'::regclass) then
        alter table public.songs add constraint songs_valid_text
            check (length(btrim(name)) between 1 and 100 and length(artist) <= 100) not valid;
    end if;
end $$;

drop policy if exists "Users can submit songs" on public.songs;
create policy "Users can submit songs" on public.songs
for insert to authenticated with check (
    user_id = (select auth.uid())
    and length(btrim(name)) between 1 and 100
    and length(artist) <= 100
    and (public.is_admin() or (
        status = 'pending'
        and music_url is null and album_url is null
        and music_path like (select auth.uid())::text || '/music/%'
        and (album_path is null or album_path like (select auth.uid())::text || '/albums/%')
    ))
);

-- A user may edit only their display name, never role, id or email.
revoke update on public.profiles from anon, authenticated;
grant update (name) on public.profiles to authenticated;
drop policy if exists "Profiles can update own name" on public.profiles;
create policy "Profiles can update own name" on public.profiles
for update to authenticated
using (id = (select auth.uid()))
with check (id = (select auth.uid()) and length(name) <= 100);

-- Public bucket delivery stays compatible. Anonymous callers cannot enumerate files.
drop policy if exists "Public can read music files" on storage.objects;
drop policy if exists "Owners and admins can list music files" on storage.objects;
create policy "Owners and admins can list music files" on storage.objects
for select to authenticated using (
    bucket_id = 'music-files'
    and ((storage.foldername(name))[1] = (select auth.uid())::text or public.is_admin())
);

create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to authenticated;

-- Definer is necessary to detect references hidden by songs RLS. Never expose this
-- schema through the Data API. Caller identity and ownership are checked inside.
create or replace function private.can_delete_music_file(object_name text)
returns boolean language sql stable security definer set search_path = '' as $$
    select auth.uid() is not null
       and (split_part(object_name, '/', 1) = auth.uid()::text or public.is_admin())
       and not exists (
           select 1 from public.songs
           where music_path = object_name or album_path = object_name
       );
$$;
revoke all on function private.can_delete_music_file(text) from public, anon;
grant execute on function private.can_delete_music_file(text) to authenticated;

drop policy if exists "Owners and admins can delete music files" on storage.objects;
create policy "Owners and admins can delete music files" on storage.objects
for delete to authenticated using (
    bucket_id = 'music-files' and private.can_delete_music_file(name)
);

create index if not exists songs_approved_created_index
    on public.songs(created_at desc, id desc) where status = 'approved';
create index if not exists songs_music_path_index on public.songs(music_path) where music_path is not null;
create index if not exists songs_album_path_index on public.songs(album_path) where album_path is not null;

revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated;

-- Shared quota guard across all Edge isolates. Only the Edge service role can call it.
create table if not exists private.youtube_search_budget (
    day date primary key,
    requests integer not null check (requests > 0)
);
alter table private.youtube_search_budget enable row level security;
create or replace function public.consume_youtube_search_budget(daily_limit integer default 80)
returns boolean language plpgsql security definer set search_path = '' as $$
declare accepted boolean;
begin
    if daily_limit < 1 or daily_limit > 90 then return false; end if;
    insert into private.youtube_search_budget(day, requests)
    values ((now() at time zone 'America/Los_Angeles')::date, 1)
    on conflict (day) do update
    set requests = private.youtube_search_budget.requests + 1
    where private.youtube_search_budget.requests < daily_limit
    returning true into accepted;
    return coalesce(accepted, false);
end;
$$;
revoke all on function public.consume_youtube_search_budget(integer) from public, anon, authenticated;
grant execute on function public.consume_youtube_search_budget(integer) to service_role;
commit;
