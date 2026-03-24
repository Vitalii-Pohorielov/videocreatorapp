create extension if not exists pgcrypto;

create table if not exists public.video_projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete cascade,
  name text not null default 'Untitled project',
  payload jsonb not null,
  deleted boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

alter table public.video_projects
add column if not exists deleted boolean not null default false;

alter table public.video_projects
add column if not exists user_id uuid references auth.users (id) on delete cascade;

alter table public.video_projects
alter column user_id set default auth.uid();

create or replace function public.set_video_projects_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists set_video_projects_updated_at on public.video_projects;

create trigger set_video_projects_updated_at
before update on public.video_projects
for each row
execute function public.set_video_projects_updated_at();

alter table public.video_projects enable row level security;

drop policy if exists "Public can read projects" on public.video_projects;
drop policy if exists "Public can insert projects" on public.video_projects;
drop policy if exists "Public can update projects" on public.video_projects;
drop policy if exists "Public can delete projects" on public.video_projects;
drop policy if exists "Users can read own projects" on public.video_projects;
drop policy if exists "Users can insert own projects" on public.video_projects;
drop policy if exists "Users can update own projects" on public.video_projects;
drop policy if exists "Users can delete own projects" on public.video_projects;

create policy "Users can read own projects"
on public.video_projects
for select
to authenticated
using (auth.uid() = user_id);

create policy "Users can insert own projects"
on public.video_projects
for insert
to authenticated
with check (auth.uid() = user_id);

create policy "Users can update own projects"
on public.video_projects
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can delete own projects"
on public.video_projects
for delete
to authenticated
using (auth.uid() = user_id);

insert into storage.buckets (id, name, public)
values ('project-images', 'project-images', true)
on conflict (id) do nothing;

drop policy if exists "Public can read project images" on storage.objects;
drop policy if exists "Public can upload project images" on storage.objects;
drop policy if exists "Users can read own project images" on storage.objects;
drop policy if exists "Users can upload own project images" on storage.objects;

create policy "Users can read own project images"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'project-images'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "Users can upload own project images"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'project-images'
  and (storage.foldername(name))[1] = auth.uid()::text
);
