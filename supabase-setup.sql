-- ════════════════════════════════════════════════════════════════════════════
-- Setup Supabase para Consejopontuladrillo
-- Pegar TODO esto en: Supabase Dashboard → SQL Editor → New query → Run
-- ════════════════════════════════════════════════════════════════════════════

-- ── 1. Tabla donations ──────────────────────────────────────────────────────
create table if not exists public.donations (
  id                     text primary key,
  zone_id                text not null,           -- nombre del miembro del Consejo
  part_id                text not null,
  name                   text not null,
  message                text default '',
  amount                 numeric not null,
  is_company             boolean default false,
  logo_url               text,
  receipt_url            text,
  transfer_first_name    text,
  transfer_last_name     text,
  transfer_rut           text,
  created_at             timestamptz default now()
);

create index if not exists donations_zone_id_idx     on public.donations (zone_id);
create index if not exists donations_created_at_idx  on public.donations (created_at desc);

-- ── 2. Habilitar RLS ────────────────────────────────────────────────────────
alter table public.donations enable row level security;

-- ── 3. Políticas RLS — permitir INSERT y SELECT públicos ────────────────────
-- Insert público: cualquiera puede registrar un aporte desde la web.
drop policy if exists "Anyone can insert donations" on public.donations;
create policy "Anyone can insert donations"
  on public.donations for insert
  to anon, authenticated
  with check (true);

-- Select público: la web muestra el feed de donantes.
drop policy if exists "Anyone can read donations" on public.donations;
create policy "Anyone can read donations"
  on public.donations for select
  to anon, authenticated
  using (true);

-- ── 4. Habilitar Realtime para realtime feed ────────────────────────────────
alter publication supabase_realtime add table public.donations;

-- ── 5. Bucket de comprobantes ───────────────────────────────────────────────
insert into storage.buckets (id, name, public)
values ('comprobantes', 'comprobantes', true)
on conflict (id) do update set public = true;

-- ── 6. Políticas del Storage ────────────────────────────────────────────────
-- Upload público (cualquiera puede subir su comprobante)
drop policy if exists "Anyone can upload comprobantes" on storage.objects;
create policy "Anyone can upload comprobantes"
  on storage.objects for insert
  to anon, authenticated
  with check (bucket_id = 'comprobantes');

-- Read público (cualquiera con la URL puede ver el comprobante)
drop policy if exists "Anyone can read comprobantes" on storage.objects;
create policy "Anyone can read comprobantes"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'comprobantes');
