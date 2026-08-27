-- Run this once in Supabase Dashboard > SQL Editor for existing projects.
-- It keeps the existing auth.users trigger and adds Google profile-name support.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
    insert into public.profiles (id, name, email, role)
    values (
        new.id,
        coalesce(
            nullif(new.raw_user_meta_data->>'name', ''),
            nullif(new.raw_user_meta_data->>'full_name', ''),
            nullif(new.raw_user_meta_data->>'user_name', ''),
            split_part(new.email, '@', 1),
            ''
        ),
        coalesce(new.email, ''),
        'user'
    )
    on conflict (id) do update
    set email = excluded.email,
        name = coalesce(nullif(public.profiles.name, ''), excluded.name);
    return new;
end;
$$;
