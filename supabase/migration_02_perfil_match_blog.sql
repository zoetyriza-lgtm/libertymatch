-- ============================================================
-- LibertyMatch — Migración 02
-- Perfil (foto, bio, intereses), match, fotos en planes,
-- blog de experiencias y almacenamiento de imágenes
--
-- IMPORTANTE: ejecuta esto DESPUÉS de haber corrido schema.sql
-- (no lo reemplaza, se suma a lo que ya tienes)
-- Supabase: SQL Editor > New query > pega todo > Run
-- ============================================================

-- --- Perfil: foto, bio, intereses ---
alter table profiles add column if not exists foto_url text;
alter table profiles add column if not exists bio text;
alter table profiles add column if not exists intereses text[] default '{}';

-- --- Foto en los planes ---
alter table planes add column if not exists foto_url text;

-- --- Blog de experiencias ---
create table if not exists experiencias (
  id uuid primary key default gen_random_uuid(),
  autor_id uuid references profiles(id) on delete cascade not null,
  plan_id uuid references planes(id) on delete set null,
  titulo text not null,
  contenido text not null,
  foto_url text,
  created_at timestamptz default now()
);

alter table experiencias enable row level security;

create policy "Experiencias visibles para todos" on experiencias for select using (true);
create policy "Usuario publica su experiencia" on experiencias for insert with check (auth.uid() = autor_id);
create policy "Usuario edita su experiencia" on experiencias for update using (auth.uid() = autor_id);
create policy "Usuario borra su experiencia" on experiencias for delete using (auth.uid() = autor_id);

-- --- Buckets de almacenamiento para imágenes ---
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('planes', 'planes', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('experiencias', 'experiencias', true)
on conflict (id) do nothing;

-- Cualquiera puede VER las imágenes (son públicas); solo usuarios
-- autenticados pueden SUBIR
create policy "Lectura publica avatars" on storage.objects for select using (bucket_id = 'avatars');
create policy "Usuarios autenticados suben avatars" on storage.objects for insert
  to authenticated with check (bucket_id = 'avatars');

create policy "Lectura publica fotos de planes" on storage.objects for select using (bucket_id = 'planes');
create policy "Usuarios autenticados suben fotos de planes" on storage.objects for insert
  to authenticated with check (bucket_id = 'planes');

create policy "Lectura publica fotos de experiencias" on storage.objects for select using (bucket_id = 'experiencias');
create policy "Usuarios autenticados suben fotos de experiencias" on storage.objects for insert
  to authenticated with check (bucket_id = 'experiencias');
