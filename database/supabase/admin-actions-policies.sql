-- Run this if admin hide/approve/delete buttons do not update rows.

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
    select exists (
        select 1
        from public.profiles
        where id = auth.uid()
          and role = 'admin'
    );
$$;

drop policy if exists "Admins can read all songs" on public.songs;
create policy "Admins can read all songs"
on public.songs
for select
to authenticated
using (public.is_admin());

drop policy if exists "Admins can update songs" on public.songs;
create policy "Admins can update songs"
on public.songs
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Admins can delete songs" on public.songs;
create policy "Admins can delete songs"
on public.songs
for delete
to authenticated
using (public.is_admin());

drop policy if exists "Owners and admins can delete music files" on storage.objects;
create policy "Owners and admins can delete music files"
on storage.objects
for delete
to authenticated
using (
    bucket_id = 'music-files'
    and (
        (storage.foldername(name))[1] = auth.uid()::text
        or public.is_admin()
    )
);
