-- ============================================================
-- LibertyMatch — Migración 05
-- Calificaciones (reputación) entre compañeros de plan
--
-- Ejecuta esto DESPUÉS de schema.sql, migration_02, 03 y 04
-- Supabase: SQL Editor > New query > pega todo > Run
-- ============================================================

create table if not exists calificaciones (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid references planes(id) on delete cascade not null,
  calificador_id uuid references profiles(id) on delete cascade not null,
  calificado_id uuid references profiles(id) on delete cascade not null,
  estrellas int not null check (estrellas between 1 and 5),
  comentario text,
  created_at timestamptz default now(),
  unique (plan_id, calificador_id, calificado_id)
);

alter table calificaciones enable row level security;

-- Cualquiera puede ver las calificaciones (para mostrar el promedio en perfil/match)
drop policy if exists "Calificaciones visibles para todos" on calificaciones;
create policy "Calificaciones visibles para todos" on calificaciones for select using (true);

-- Solo puedes calificar:
--  - a ti mismo insertando como calificador (no en nombre de otro)
--  - a alguien distinto de ti
--  - de un plan cuya fecha ya pasó
--  - si ambos (tú y la persona calificada) participaron en ese plan
drop policy if exists "Calificar companeros de plan pasado" on calificaciones;
create policy "Calificar companeros de plan pasado" on calificaciones for insert
  with check (
    auth.uid() = calificador_id
    and calificador_id <> calificado_id
    and exists (
      select 1 from planes p where p.id = plan_id and p.fecha < now()
    )
    and exists (
      select 1 from inscripciones i
      where i.plan_id = calificaciones.plan_id and i.usuario_id = calificador_id
    )
    and exists (
      select 1 from inscripciones i
      where i.plan_id = calificaciones.plan_id and i.usuario_id = calificado_id
    )
  );

drop policy if exists "Usuario edita su calificacion" on calificaciones;
create policy "Usuario edita su calificacion" on calificaciones for update
  using (auth.uid() = calificador_id);

drop policy if exists "Usuario borra su calificacion" on calificaciones;
create policy "Usuario borra su calificacion" on calificaciones for delete
  using (auth.uid() = calificador_id);
