-- ============================================================
-- LibertyMatch — Migración 03
-- Comentarios en experiencias, conexiones (solicitud + aceptar),
-- y categoría de interés en planes (para recomendaciones)
--
-- Ejecuta esto DESPUÉS de schema.sql y migration_02
-- Supabase: SQL Editor > New query > pega todo > Run
-- ============================================================

-- --- Categoría del plan (para poder recomendarlo según intereses) ---
alter table planes add column if not exists categoria text;

-- --- Comentarios en experiencias del blog ---
create table if not exists comentarios (
  id uuid primary key default gen_random_uuid(),
  experiencia_id uuid references experiencias(id) on delete cascade not null,
  autor_id uuid references profiles(id) on delete cascade not null,
  contenido text not null,
  created_at timestamptz default now()
);

alter table comentarios enable row level security;

create policy "Comentarios visibles para todos" on comentarios for select using (true);
create policy "Usuario comenta" on comentarios for insert with check (auth.uid() = autor_id);
create policy "Usuario borra su comentario" on comentarios for delete using (auth.uid() = autor_id);

-- --- Conexiones (solicitud + aceptación, como "amigos") ---
create table if not exists conexiones (
  id uuid primary key default gen_random_uuid(),
  solicitante_id uuid references profiles(id) on delete cascade not null,
  receptor_id uuid references profiles(id) on delete cascade not null,
  estado text not null default 'pendiente', -- pendiente | aceptada | rechazada
  created_at timestamptz default now(),
  unique (solicitante_id, receptor_id)
);

alter table conexiones enable row level security;

create policy "Ver mis conexiones" on conexiones for select
  using (auth.uid() = solicitante_id or auth.uid() = receptor_id);
create policy "Usuario envia solicitud" on conexiones for insert
  with check (auth.uid() = solicitante_id);
create policy "Aceptar o rechazar solicitud" on conexiones for update
  using (auth.uid() = receptor_id or auth.uid() = solicitante_id);
create policy "Usuario borra su conexion" on conexiones for delete
  using (auth.uid() = solicitante_id or auth.uid() = receptor_id);
