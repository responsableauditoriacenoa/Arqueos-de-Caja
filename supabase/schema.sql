create table if not exists public.audits (
  id text primary key,
  numero text unique not null,
  fecha date not null,
  sucursal_id text not null,
  sucursal_nombre text not null,
  auditor text not null,
  responsable text not null,
  tipo text not null,
  estado text not null,
  observacion_general text not null default '',
  rubros jsonb not null default '[]'::jsonb,
  hallazgos jsonb not null default '[]'::jsonb,
  recomendaciones jsonb not null default '[]'::jsonb,
  firmas jsonb not null default '[]'::jsonb,
  cumplimiento_total integer not null default 0,
  resultado_final text not null default '',
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now()
);

create index if not exists audits_estado_idx on public.audits (estado);
create index if not exists audits_actualizado_en_idx on public.audits (actualizado_en desc);

create table if not exists public.app_config (
  id integer primary key,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

create table if not exists public.app_sequences (
  scope text primary key,
  value integer not null default 0
);

insert into public.app_sequences (scope, value)
values ('audit', 0)
on conflict (scope) do nothing;

create or replace function public.next_audit_number()
returns text
language plpgsql
as $$
declare
  next_value integer;
begin
  insert into public.app_sequences (scope, value)
  values ('audit', 1)
  on conflict (scope)
  do update set value = public.app_sequences.value + 1
  returning value into next_value;

  return 'AUD-' || extract(year from now())::int || '-' || lpad(next_value::text, 3, '0');
end;
$$;

alter table public.audits enable row level security;
alter table public.app_config enable row level security;
alter table public.app_sequences enable row level security;

drop policy if exists "Public read audits" on public.audits;
drop policy if exists "Public insert audits" on public.audits;
drop policy if exists "Public update audits" on public.audits;
drop policy if exists "Public delete audits" on public.audits;

create policy "Public read audits"
on public.audits for select
to anon
using (true);

create policy "Public insert audits"
on public.audits for insert
to anon
with check (true);

create policy "Public update audits"
on public.audits for update
to anon
using (true)
with check (true);

create policy "Public delete audits"
on public.audits for delete
to anon
using (true);

drop policy if exists "Public read config" on public.app_config;
drop policy if exists "Public insert config" on public.app_config;
drop policy if exists "Public update config" on public.app_config;

create policy "Public read config"
on public.app_config for select
to anon
using (true);

create policy "Public insert config"
on public.app_config for insert
to anon
with check (true);

create policy "Public update config"
on public.app_config for update
to anon
using (true)
with check (true);

grant execute on function public.next_audit_number() to anon;
