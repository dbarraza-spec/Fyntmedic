-- =====================================================================
-- FyntMedic · 0001 · Esquema base
-- Varias clínicas en un mismo sistema, 5 roles, reglas NOM-004 en la BD.
-- Correr UNA vez en Supabase → SQL Editor, en un proyecto NUEVO y vacío.
-- =====================================================================

create extension if not exists pgcrypto with schema extensions;

-- ---------- Tipos ----------
create type public.rol_usuario as enum ('admin', 'medico', 'enfermeria', 'recepcion');
create type public.estado_nota as enum ('borrador', 'firmada');
create type public.estado_cita as enum ('programada', 'confirmada', 'atendida', 'no_asistio', 'cancelada');

-- ---------- Clínicas y usuarios ----------
create table public.superadmins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  creado_en timestamptz not null default now()
);

create table public.clinicas (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  color text not null default '#0077b6' check (color ~ '^#[0-9a-fA-F]{6}$'),
  logo_path text,
  domicilio text,
  telefono text,
  licencia text,
  plan text not null default 'consultorio' check (plan in ('consultorio','profesional','clinica','hospital')),
  activa boolean not null default true,
  siguiente_folio integer not null default 1,
  creado_en timestamptz not null default now()
);

create table public.miembros (
  id uuid primary key default gen_random_uuid(),
  clinica_id uuid not null references public.clinicas(id) on delete restrict,
  user_id uuid not null references auth.users(id) on delete restrict,
  rol public.rol_usuario not null,
  titulo text,
  nombre text not null,
  cedula text,
  especialidad text,
  cedula_especialidad text,
  universidad text,
  firma_path text,
  activo boolean not null default true,
  creado_en timestamptz not null default now(),
  unique (clinica_id, user_id)
);
create index on public.miembros (user_id);

-- ---------- Funciones de permisos (las usa RLS) ----------
create or replace function public.es_superadmin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.superadmins where user_id = auth.uid());
$$;

create or replace function public.mi_rol(p_clinica uuid)
returns public.rol_usuario language sql stable security definer set search_path = public as $$
  select rol from public.miembros
  where clinica_id = p_clinica and user_id = auth.uid() and activo
  limit 1;
$$;

create or replace function public.es_miembro(p_clinica uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select public.mi_rol(p_clinica) is not null;
$$;

-- ¿Puede ver lo clínico (notas, recetas, historia, estudios)? Recepción NO.
create or replace function public.ve_clinico(p_clinica uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select public.mi_rol(p_clinica) in ('admin','medico','enfermeria');
$$;

create or replace function public.es_medico(p_clinica uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select public.mi_rol(p_clinica) = 'medico';
$$;

create or replace function public.es_admin(p_clinica uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select public.mi_rol(p_clinica) = 'admin';
$$;

-- ---------- Pacientes ----------
create table public.pacientes (
  id uuid primary key default gen_random_uuid(),
  clinica_id uuid not null references public.clinicas(id) on delete restrict,
  folio integer not null,
  nombre text not null,
  apellido_paterno text not null,
  apellido_materno text,
  curp text check (curp is null or curp ~ '^[A-Z]{4}[0-9]{6}[HM][A-Z]{5}[A-Z0-9][0-9]$'),
  fecha_nacimiento date not null,
  sexo text not null check (sexo in ('Femenino','Masculino')),
  estado_civil text, ocupacion text, escolaridad text,
  telefono text not null,
  correo text,
  domicilio jsonb not null default '{}'::jsonb,
  contacto_emergencia jsonb not null default '{}'::jsonb,
  tipo_sangre text check (tipo_sangre in ('A+','A-','B+','B-','AB+','AB-','O+','O-','No sabe')),
  alergias text[] not null default '{}',
  niega_alergias boolean not null default false,
  enfermedades jsonb not null default '[]'::jsonb,   -- [{c:'E11.9', d:'...'}]
  cirugias text,
  medicamentos text,
  acepta_privacidad boolean not null check (acepta_privacidad),
  acepta_whatsapp boolean not null default false,
  creado_por uuid references auth.users(id),
  creado_en timestamptz not null default now(),
  unique (clinica_id, folio)
);
create index on public.pacientes (clinica_id, apellido_paterno, nombre);
create index on public.pacientes (clinica_id, telefono);

-- Folio consecutivo por clínica, sin huecos por choques.
create or replace function public.asignar_folio()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  update public.clinicas set siguiente_folio = siguiente_folio + 1
  where id = new.clinica_id
  returning siguiente_folio - 1 into new.folio;
  new.creado_por := auth.uid();
  new.creado_en := now();
  return new;
end $$;
create trigger t_folio before insert on public.pacientes
  for each row execute function public.asignar_folio();

-- ---------- Notas de evolución ----------
create table public.notas (
  id uuid primary key default gen_random_uuid(),
  clinica_id uuid not null references public.clinicas(id) on delete restrict,
  paciente_id uuid not null references public.pacientes(id) on delete restrict,
  motivo text,
  signos jsonb not null default '{}'::jsonb,
  subjetivo text,
  exploracion text,
  diagnosticos jsonb not null default '[]'::jsonb,  -- [{c,d}], el primero es el principal
  pronostico text,
  plan text,
  estado public.estado_nota not null default 'borrador',
  medico_id uuid references auth.users(id),
  medico_nombre text,
  medico_cedula text,
  firmada_en timestamptz,
  sello text,                                       -- SHA-256 calculado por la BD
  creado_por uuid references auth.users(id),
  creado_en timestamptz not null default now()
);
create index on public.notas (paciente_id, creado_en desc);

create table public.notas_versiones (
  id bigint generated always as identity primary key,
  nota_id uuid not null references public.notas(id) on delete restrict,
  datos jsonb not null,
  sello text,
  guardada_por uuid references auth.users(id),
  guardada_en timestamptz not null default now()
);

create table public.addenda (
  id uuid primary key default gen_random_uuid(),
  nota_id uuid not null references public.notas(id) on delete restrict,
  clinica_id uuid not null references public.clinicas(id) on delete restrict,
  texto text not null check (length(trim(texto)) > 0),
  autor_id uuid references auth.users(id),
  autor_nombre text,
  creado_en timestamptz not null default now()
);

-- Sello: huella del contenido clínico de la nota.
create or replace function public.sello_nota(n public.notas)
returns text language sql immutable set search_path = public, extensions as $$
  select encode(extensions.digest(convert_to(jsonb_build_object(
    'paciente', n.paciente_id, 'creado', n.creado_en, 'motivo', n.motivo, 'signos', n.signos,
    'subjetivo', n.subjetivo, 'exploracion', n.exploracion, 'dx', n.diagnosticos,
    'pronostico', n.pronostico, 'plan', n.plan, 'medico', n.medico_id,
    'cedula', n.medico_cedula, 'firmada', n.firmada_en)::text, 'UTF8'), 'sha256'), 'hex');
$$;

-- Reglas NOM-004: firmar, corregir solo 24 h, guardar versión anterior, nunca borrar.
create or replace function public.reglas_nota()
returns trigger language plpgsql security definer set search_path = public as $$
declare m public.miembros;
begin
  if tg_op = 'DELETE' then
    raise exception 'Las notas médicas no se pueden borrar (NOM-004).';
  end if;

  if tg_op = 'INSERT' then
    new.creado_por := auth.uid();
    new.creado_en := now();
    new.estado := 'borrador'; new.firmada_en := null; new.sello := null;
    return new;
  end if;

  -- UPDATE
  if new.clinica_id <> old.clinica_id or new.paciente_id <> old.paciente_id or new.creado_en <> old.creado_en then
    raise exception 'No se puede cambiar el paciente, la clínica ni la fecha de la nota.';
  end if;

  if old.estado = 'firmada' then
    if new.estado <> 'firmada' then
      raise exception 'Una nota firmada no puede volver a borrador.';
    end if;
    if now() - old.firmada_en > interval '24 hours' then
      raise exception 'La nota ya está sellada. Solo se pueden agregar addendums.';
    end if;
    if old.medico_id is distinct from auth.uid() then
      raise exception 'Solo el médico que firmó puede corregir la nota.';
    end if;
    insert into public.notas_versiones (nota_id, datos, sello, guardada_por)
      values (old.id, to_jsonb(old), old.sello, auth.uid());
    new.firmada_en := old.firmada_en;
    new.medico_id := old.medico_id; new.medico_nombre := old.medico_nombre; new.medico_cedula := old.medico_cedula;
    new.sello := public.sello_nota(new);
    return new;
  end if;

  -- old = borrador
  if new.estado = 'firmada' then
    select * into m from public.miembros
      where clinica_id = new.clinica_id and user_id = auth.uid() and activo and rol = 'medico';
    if not found then raise exception 'Solo un médico puede firmar notas.'; end if;
    if m.cedula is null or length(trim(m.cedula)) = 0 then raise exception 'Falta la cédula profesional del médico.'; end if;
    if jsonb_array_length(new.diagnosticos) = 0 then raise exception 'La nota necesita al menos un diagnóstico CIE-10.'; end if;
    if coalesce(trim(new.plan), '') = '' then raise exception 'La nota necesita plan de tratamiento.'; end if;
    new.medico_id := auth.uid();
    new.medico_nombre := trim(coalesce(m.titulo,'') || ' ' || m.nombre);
    new.medico_cedula := m.cedula;
    new.firmada_en := now();
    new.sello := public.sello_nota(new);
  else
    new.firmada_en := null; new.sello := null;
  end if;
  return new;
end $$;
create trigger t_reglas_nota before insert or update or delete on public.notas
  for each row execute function public.reglas_nota();

-- ---------- Historia clínica (una por paciente) ----------
create table public.historias (
  paciente_id uuid primary key references public.pacientes(id) on delete restrict,
  clinica_id uuid not null references public.clinicas(id) on delete restrict,
  datos jsonb not null default '{}'::jsonb,
  firmada_en timestamptz,
  firmada_por uuid references auth.users(id),
  sello text,
  actualizado_en timestamptz not null default now()
);

create or replace function public.reglas_historia()
returns trigger language plpgsql security definer set search_path = public, extensions as $$
begin
  if tg_op = 'DELETE' then raise exception 'La historia clínica no se puede borrar.'; end if;
  if tg_op = 'UPDATE' and old.firmada_en is not null then
    raise exception 'La historia clínica ya está firmada y no se puede modificar.';
  end if;
  new.actualizado_en := now();
  if new.firmada_en is not null then
    if not public.es_medico(new.clinica_id) then raise exception 'Solo un médico puede firmar la historia clínica.'; end if;
    new.firmada_en := now(); new.firmada_por := auth.uid();
    new.sello := encode(extensions.digest(convert_to(new.datos::text, 'UTF8'), 'sha256'), 'hex');
  end if;
  return new;
end $$;
create trigger t_reglas_historia before insert or update or delete on public.historias
  for each row execute function public.reglas_historia();

-- ---------- Recetas (inmutables) ----------
create table public.recetas (
  id uuid primary key default gen_random_uuid(),
  clinica_id uuid not null references public.clinicas(id) on delete restrict,
  paciente_id uuid not null references public.pacientes(id) on delete restrict,
  nota_id uuid references public.notas(id) on delete restrict,
  medicamentos jsonb not null check (jsonb_array_length(medicamentos) > 0),
  indicaciones text,
  peso text, talla text,
  medico_id uuid references auth.users(id),
  medico_nombre text,
  medico_cedula text,
  sello text,
  creado_en timestamptz not null default now()
);

create or replace function public.reglas_receta()
returns trigger language plpgsql security definer set search_path = public, extensions as $$
declare m public.miembros;
begin
  if tg_op <> 'INSERT' then raise exception 'Las recetas no se modifican ni se borran. Si hay error, haz una nueva.'; end if;
  select * into m from public.miembros
    where clinica_id = new.clinica_id and user_id = auth.uid() and activo and rol = 'medico';
  if not found then raise exception 'Solo un médico puede firmar recetas.'; end if;
  new.medico_id := auth.uid();
  new.medico_nombre := trim(coalesce(m.titulo,'') || ' ' || m.nombre);
  new.medico_cedula := m.cedula;
  new.creado_en := now();
  new.sello := encode(extensions.digest(convert_to(jsonb_build_object('p', new.paciente_id, 'm', new.medicamentos,
    'i', new.indicaciones, 'c', new.medico_cedula, 't', new.creado_en)::text, 'UTF8'), 'sha256'), 'hex');
  return new;
end $$;
create trigger t_reglas_receta before insert or update or delete on public.recetas
  for each row execute function public.reglas_receta();

-- ---------- Estudios, citas, inventario ----------
create table public.estudios (
  id uuid primary key default gen_random_uuid(),
  clinica_id uuid not null references public.clinicas(id) on delete restrict,
  paciente_id uuid not null references public.pacientes(id) on delete restrict,
  nota_id uuid references public.notas(id),
  tipo text not null, nombre text not null, fecha date not null,
  laboratorio text, resultado text,
  archivo_path text,
  subido_por uuid references auth.users(id),
  creado_en timestamptz not null default now()
);

create table public.citas (
  id uuid primary key default gen_random_uuid(),
  clinica_id uuid not null references public.clinicas(id) on delete restrict,
  paciente_id uuid references public.pacientes(id) on delete restrict,
  nombre_nuevo text, telefono_nuevo text,
  medico_id uuid references auth.users(id),
  inicio timestamptz not null,
  duracion_min integer not null default 30 check (duracion_min between 5 and 480),
  motivo text,
  estado public.estado_cita not null default 'programada',
  creado_por uuid references auth.users(id),
  creado_en timestamptz not null default now(),
  check (paciente_id is not null or nombre_nuevo is not null)
);
create index on public.citas (clinica_id, inicio);

create table public.inventario (
  id uuid primary key default gen_random_uuid(),
  clinica_id uuid not null references public.clinicas(id) on delete restrict,
  tipo text not null default 'Medicamento',
  generico text not null, comercial text, presentacion text not null,
  lote text not null, caducidad date not null,
  cantidad integer not null default 0 check (cantidad >= 0),
  minimo integer not null default 0 check (minimo >= 0),
  unidad text not null default 'piezas',
  controlado boolean not null default false,
  creado_en timestamptz not null default now()
);

-- ---------- Bitácora (solo se agregan renglones) ----------
create table public.bitacora (
  id bigint generated always as identity primary key,
  clinica_id uuid references public.clinicas(id) on delete restrict,
  user_id uuid,
  accion text not null,
  tabla text not null,
  registro_id text,
  paciente_id uuid,
  detalle jsonb,
  creado_en timestamptz not null default now()
);
create index on public.bitacora (clinica_id, creado_en desc);
create index on public.bitacora (paciente_id, creado_en desc);

create or replace function public.bitacora_inmutable()
returns trigger language plpgsql as $$
begin raise exception 'La bitácora no se puede modificar ni borrar.'; end $$;
create trigger t_bitacora_inmutable before update or delete on public.bitacora
  for each row execute function public.bitacora_inmutable();

create or replace function public.registrar()
returns trigger language plpgsql security definer set search_path = public as $$
declare r jsonb; v_clinica uuid; v_pac uuid; v_acc text;
begin
  r := to_jsonb(coalesce(new, old));
  if tg_table_name = 'clinicas' and tg_op = 'UPDATE' and (to_jsonb(new) - 'siguiente_folio') = (to_jsonb(old) - 'siguiente_folio') then
    return new;  -- solo avanzó el folio: no es un cambio que auditar
  end if;
  v_clinica := coalesce(nullif(r->>'clinica_id','')::uuid, case when tg_table_name = 'clinicas' then (r->>'id')::uuid end);
  v_pac := coalesce(nullif(r->>'paciente_id','')::uuid, case when tg_table_name = 'pacientes' then (r->>'id')::uuid end);
  v_acc := case tg_op when 'INSERT' then 'crear' when 'UPDATE' then 'modificar' else 'borrar' end;
  if tg_table_name = 'notas' and tg_op = 'UPDATE' then
    if to_jsonb(old)->>'estado' = 'borrador' and to_jsonb(new)->>'estado' = 'firmada' then v_acc := 'firmar';
    elsif to_jsonb(old)->>'estado' = 'firmada' then v_acc := 'corregir'; end if;
  end if;
  insert into public.bitacora (clinica_id, user_id, accion, tabla, registro_id, paciente_id, detalle)
  values (v_clinica, auth.uid(), v_acc, tg_table_name, r->>'id', v_pac,
          case when tg_op = 'UPDATE' then jsonb_build_object('antes', to_jsonb(old)) else null end);
  return coalesce(new, old);
end $$;

do $$ declare t text;
begin
  foreach t in array array['pacientes','notas','addenda','historias','recetas','estudios','citas','inventario','miembros','clinicas'] loop
    execute format('create trigger t_bitacora after insert or update or delete on public.%I for each row execute function public.registrar()', t);
  end loop;
end $$;

-- Registrar también cuando alguien ABRE un expediente (lo pide la auditoría).
create or replace function public.registrar_consulta(p_paciente uuid)
returns void language plpgsql security definer set search_path = public as $$
declare v_clinica uuid;
begin
  select clinica_id into v_clinica from public.pacientes where id = p_paciente;
  if v_clinica is null or not public.es_miembro(v_clinica) then raise exception 'Sin acceso.'; end if;
  insert into public.bitacora (clinica_id, user_id, accion, tabla, registro_id, paciente_id)
  values (v_clinica, auth.uid(), 'consultar', 'pacientes', p_paciente::text, p_paciente);
end $$;

-- ---------- Seguridad por renglón (RLS) ----------
alter table public.superadmins enable row level security;
alter table public.clinicas enable row level security;
alter table public.miembros enable row level security;
alter table public.pacientes enable row level security;
alter table public.notas enable row level security;
alter table public.notas_versiones enable row level security;
alter table public.addenda enable row level security;
alter table public.historias enable row level security;
alter table public.recetas enable row level security;
alter table public.estudios enable row level security;
alter table public.citas enable row level security;
alter table public.inventario enable row level security;
alter table public.bitacora enable row level security;

create policy sa_ver on public.superadmins for select using (user_id = auth.uid());

create policy cli_ver on public.clinicas for select using (public.es_miembro(id) or public.es_superadmin());
create policy cli_editar on public.clinicas for update using (public.es_admin(id) or public.es_superadmin());
create policy cli_crear on public.clinicas for insert with check (public.es_superadmin());

create policy mie_ver on public.miembros for select using (public.es_miembro(clinica_id) or public.es_superadmin());
create policy mie_crear on public.miembros for insert with check (public.es_admin(clinica_id) or public.es_superadmin());
create policy mie_editar on public.miembros for update using (public.es_admin(clinica_id) or public.es_superadmin());

-- Cada usuario solo puede guardar SU firma (no puede tocar su rol).
create or replace function public.guardar_mi_firma(p_clinica uuid, p_path text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if p_path not like p_clinica::text || '/firmas/' || auth.uid()::text || '.png' then raise exception 'Ruta de firma inválida.'; end if;
  update public.miembros set firma_path = p_path where clinica_id = p_clinica and user_id = auth.uid();
end $$;

-- Pacientes: todos los roles de la clínica (recepción da altas).
create policy pac_ver on public.pacientes for select using (public.es_miembro(clinica_id));
create policy pac_crear on public.pacientes for insert with check (public.es_miembro(clinica_id));
create policy pac_editar on public.pacientes for update using (public.es_miembro(clinica_id));

-- Lo clínico: recepción no lo ve.
create policy not_ver on public.notas for select using (public.ve_clinico(clinica_id));
create policy not_crear on public.notas for insert with check (public.es_medico(clinica_id) or public.mi_rol(clinica_id) = 'enfermeria');
create policy not_editar on public.notas for update using (public.es_medico(clinica_id) or (public.mi_rol(clinica_id) = 'enfermeria' and estado = 'borrador'));

create policy ver_ver on public.notas_versiones for select
  using (exists (select 1 from public.notas n where n.id = nota_id and public.ve_clinico(n.clinica_id)));

create policy add_ver on public.addenda for select using (public.ve_clinico(clinica_id));
create policy add_crear on public.addenda for insert with check (public.es_medico(clinica_id) and autor_id = auth.uid());

create policy his_ver on public.historias for select using (public.ve_clinico(clinica_id));
create policy his_crear on public.historias for insert with check (public.ve_clinico(clinica_id));
create policy his_editar on public.historias for update using (public.ve_clinico(clinica_id));

create policy rec_ver on public.recetas for select using (public.ve_clinico(clinica_id));
create policy rec_crear on public.recetas for insert with check (public.es_medico(clinica_id));

create policy est_ver on public.estudios for select using (public.ve_clinico(clinica_id));
create policy est_crear on public.estudios for insert with check (public.ve_clinico(clinica_id));

create policy cit_ver on public.citas for select using (public.es_miembro(clinica_id));
create policy cit_crear on public.citas for insert with check (public.es_miembro(clinica_id));
create policy cit_editar on public.citas for update using (public.es_miembro(clinica_id));

create policy inv_ver on public.inventario for select using (public.ve_clinico(clinica_id));
create policy inv_crear on public.inventario for insert with check (public.ve_clinico(clinica_id));
create policy inv_editar on public.inventario for update using (public.ve_clinico(clinica_id));

create policy bit_ver on public.bitacora for select using (public.es_admin(clinica_id) or public.es_superadmin());

-- Nadie borra datos clínicos desde la app: no hay políticas de DELETE.

-- ---------- Archivos (Storage) ----------
-- Rutas: <clinica_id>/<paciente_id>/<archivo>  ·  marca: <clinica_id>/logo.png, <clinica_id>/firmas/<user_id>.png
insert into storage.buckets (id, name, public) values ('estudios', 'estudios', false) on conflict do nothing;
insert into storage.buckets (id, name, public) values ('marca', 'marca', false) on conflict do nothing;

create policy est_arch_ver on storage.objects for select
  using (bucket_id = 'estudios' and public.ve_clinico(((storage.foldername(name))[1])::uuid));
create policy est_arch_subir on storage.objects for insert
  with check (bucket_id = 'estudios' and public.ve_clinico(((storage.foldername(name))[1])::uuid));
create policy marca_ver on storage.objects for select
  using (bucket_id = 'marca' and public.es_miembro(((storage.foldername(name))[1])::uuid));
create policy marca_subir on storage.objects for insert
  with check (bucket_id = 'marca' and (public.es_admin(((storage.foldername(name))[1])::uuid)
    or (public.es_miembro(((storage.foldername(name))[1])::uuid) and name like '%/firmas/' || auth.uid()::text || '.png')));
create policy marca_cambiar on storage.objects for update
  using (bucket_id = 'marca' and (public.es_admin(((storage.foldername(name))[1])::uuid)
    or (public.es_miembro(((storage.foldername(name))[1])::uuid) and name like '%/firmas/' || auth.uid()::text || '.png')));

-- ---------- Alta de una clínica nueva (solo súper admin) ----------
create or replace function public.crear_clinica(p_nombre text, p_admin uuid, p_admin_nombre text, p_plan text default 'consultorio')
returns uuid language plpgsql security definer set search_path = public as $$
declare v uuid;
begin
  if not public.es_superadmin() then raise exception 'Solo el súper admin puede crear clínicas.'; end if;
  insert into public.clinicas (nombre, plan) values (p_nombre, p_plan) returning id into v;
  insert into public.miembros (clinica_id, user_id, rol, nombre) values (v, p_admin, 'admin', p_admin_nombre);
  return v;
end $$;
