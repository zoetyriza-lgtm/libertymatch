-- ============================================================
-- LibertyMatch — Esquema de base de datos
-- Ejecuta TODO este archivo en Supabase: SQL Editor > New query
-- ============================================================

create extension if not exists "pgcrypto";

-- Perfiles de usuario (extiende auth.users, que administra Supabase)
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nombre text not null,
  created_at timestamptz default now()
);

-- Planes publicados
create table planes (
  id uuid primary key default gen_random_uuid(),
  creador_id uuid references profiles(id) on delete cascade not null,
  actividad text not null,
  descripcion text,
  fecha timestamptz not null,
  lugar text not null,
  cupo_maximo int not null check (cupo_maximo > 0),
  estado text not null default 'abierto', -- abierto | lleno | cancelado
  created_at timestamptz default now()
);

-- Inscripciones a planes
create table inscripciones (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid references planes(id) on delete cascade not null,
  usuario_id uuid references profiles(id) on delete cascade not null,
  created_at timestamptz default now(),
  unique (plan_id, usuario_id)
);

-- Notificaciones internas
create table notificaciones (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid references profiles(id) on delete cascade not null,
  mensaje text not null,
  leida boolean default false,
  created_at timestamptz default now()
);

-- ============================================================
-- Seguridad a nivel de fila (RLS)
-- ============================================================
alter table profiles enable row level security;
alter table planes enable row level security;
alter table inscripciones enable row level security;
alter table notificaciones enable row level security;

create policy "Perfiles visibles para todos" on profiles for select using (true);
create policy "Usuario crea su perfil" on profiles for insert with check (auth.uid() = id);
create policy "Usuario actualiza su perfil" on profiles for update using (auth.uid() = id);

create policy "Planes visibles para todos" on planes for select using (true);
create policy "Usuario crea sus planes" on planes for insert with check (auth.uid() = creador_id);
create policy "Creador actualiza su plan" on planes for update using (auth.uid() = creador_id);

create policy "Inscripciones visibles para todos" on inscripciones for select using (true);
create policy "Usuario se inscribe a si mismo" on inscripciones for insert with check (auth.uid() = usuario_id);
create policy "Usuario cancela su inscripcion" on inscripciones for delete using (auth.uid() = usuario_id);

create policy "Usuario ve sus notificaciones" on notificaciones for select using (auth.uid() = usuario_id);
create policy "Sistema crea notificaciones" on notificaciones for insert with check (true);
create policy "Usuario marca como leida" on notificaciones for update using (auth.uid() = usuario_id);

-- ============================================================
-- Trigger: crear perfil automáticamente al registrarse
-- ============================================================
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, nombre)
  values (new.id, coalesce(new.raw_user_meta_data->>'nombre', split_part(new.email, '@', 1)));
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================
-- Función atómica: inscribirse a un plan
-- Usa "for update" para bloquear la fila y evitar que dos
-- personas ocupen el mismo último cupo al mismo tiempo
-- (ver sección 3.4 del documento de planeación)
-- ============================================================
create or replace function inscribirse_a_plan(p_plan_id uuid)
returns text as $$
declare
  v_cupo_maximo int;
  v_inscritos int;
  v_creador uuid;
  v_actividad text;
  v_nombre text;
begin
  select cupo_maximo, creador_id, actividad into v_cupo_maximo, v_creador, v_actividad
  from planes where id = p_plan_id for update;

  if v_cupo_maximo is null then
    return 'plan_no_existe';
  end if;

  select count(*) into v_inscritos from inscripciones where plan_id = p_plan_id;

  if v_inscritos >= v_cupo_maximo then
    return 'cupo_lleno';
  end if;

  if exists (select 1 from inscripciones where plan_id = p_plan_id and usuario_id = auth.uid()) then
    return 'ya_inscrito';
  end if;

  insert into inscripciones (plan_id, usuario_id) values (p_plan_id, auth.uid());

  select nombre into v_nombre from profiles where id = auth.uid();

  if v_inscritos + 1 >= v_cupo_maximo then
    update planes set estado = 'lleno' where id = p_plan_id;
    insert into notificaciones (usuario_id, mensaje)
      values (v_creador, 'Tu plan "' || v_actividad || '" alcanzó el cupo máximo');
  else
    insert into notificaciones (usuario_id, mensaje)
      values (v_creador, coalesce(v_nombre, 'Alguien') || ' se unió a tu plan "' || v_actividad || '"');
  end if;

  return 'ok';
end;
$$ language plpgsql security definer;

-- ============================================================
-- Función: cancelar inscripción
-- ============================================================
create or replace function cancelar_inscripcion(p_plan_id uuid)
returns text as $$
declare
  v_creador uuid;
  v_actividad text;
  v_nombre text;
begin
  if not exists (select 1 from inscripciones where plan_id = p_plan_id and usuario_id = auth.uid()) then
    return 'no_inscrito';
  end if;

  delete from inscripciones where plan_id = p_plan_id and usuario_id = auth.uid();

  select creador_id, actividad into v_creador, v_actividad from planes where id = p_plan_id;
  select nombre into v_nombre from profiles where id = auth.uid();

  update planes set estado = 'abierto' where id = p_plan_id and estado = 'lleno';

  if auth.uid() != v_creador then
    insert into notificaciones (usuario_id, mensaje)
      values (v_creador, coalesce(v_nombre, 'Alguien') || ' canceló su inscripción a "' || v_actividad || '"');
  end if;

  return 'ok';
end;
$$ language plpgsql security definer;
