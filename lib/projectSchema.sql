create extension if not exists pgcrypto;

create table if not exists public.video_projects (
  id uuid primary key default gen_random_uuid(),
  name text not null default 'Untitled project',
  payload jsonb not null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

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

create policy "Public can read projects"
on public.video_projects
for select
to anon, authenticated
using (true);

create policy "Public can insert projects"
on public.video_projects
for insert
to anon, authenticated
with check (true);

create policy "Public can update projects"
on public.video_projects
for update
to anon, authenticated
using (true)
with check (true);

insert into storage.buckets (id, name, public)
values ('project-images', 'project-images', true)
on conflict (id) do nothing;

create policy "Public can read project images"
on storage.objects
for select
to anon, authenticated
using (bucket_id = 'project-images');

create policy "Public can upload project images"
on storage.objects
for insert
to anon, authenticated
with check (bucket_id = 'project-images');
