-- ============================================================
-- LibertyMatch — Migración 04
-- Mensajes directos (solo entre conexiones aceptadas)
-- y soporte para planes recurrentes
--
-- Ejecuta esto DESPUÉS de schema.sql, migration_02 y migration_03
-- Supabase: SQL Editor > New query > pega todo > Run
-- ============================================================

-- --- Mensajes directos ---
create table if not exists mensajes (
  id uuid primary key default gen_random_uuid(),
  remitente_id uuid references profiles(id) on delete cascade not null,
  destinatario_id uuid references profiles(id) on delete cascade not null,
  contenido text not null,
  leido boolean default false,
  created_at timestamptz default now()
);

alter table mensajes enable row level security;

drop policy if exists "Ver mis mensajes" on mensajes;
create policy "Ver mis mensajes" on mensajes for select
  using (auth.uid() = remitente_id or auth.uid() = destinatario_id);

-- Solo puedes escribirle a alguien con quien tienes una conexión ACEPTADA
drop policy if exists "Enviar mensaje a una conexion aceptada" on mensajes;
create policy "Enviar mensaje a una conexion aceptada" on mensajes for insert
  with check (
    auth.uid() = remitente_id
    and remitente_id <> destinatario_id
    and exists (
      select 1 from conexiones c
      where c.estado = 'aceptada'
        and (
          (c.solicitante_id = remitente_id and c.receptor_id = destinatario_id)
          or (c.solicitante_id = destinatario_id and c.receptor_id = remitente_id)
        )
    )
  );

drop policy if exists "Marcar mensaje como leido" on mensajes;
create policy "Marcar mensaje como leido" on mensajes for update
  using (auth.uid() = destinatario_id);

-- --- Planes recurrentes: columna para agrupar una serie de planes ---
alter table planes add column if not exists serie_id uuid;
