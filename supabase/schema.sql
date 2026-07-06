-- =====================================================================
-- Photobooth de Festa — Schema Supabase (rodar no SQL Editor do painel)
-- =====================================================================

create table if not exists events (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,           -- ex: "kamilly3anos", usado na URL
  nome text not null,
  data_festa date,
  criado_em timestamp default now()
);

create table if not exists frames (
  id uuid primary key default gen_random_uuid(),
  event_id uuid references events(id) on delete cascade,
  nome text,
  imagem_url text not null,            -- PNG com fundo transparente
  ordem int default 0
);

create table if not exists photos (
  id uuid primary key default gen_random_uuid(),
  event_id uuid references events(id) on delete cascade,
  frame_id uuid references frames(id),
  imagem_url text not null,            -- foto final já com moldura aplicada
  autor_nome text,
  criado_em timestamp default now()
);

-- ---------------------------------------------------------------------
-- RLS: leitura pública de tudo; convidados (anon) só podem inserir fotos
-- ---------------------------------------------------------------------
alter table events enable row level security;
alter table frames enable row level security;
alter table photos enable row level security;

create policy "leitura publica de eventos" on events for select using (true);
create policy "leitura publica de molduras" on frames for select using (true);
create policy "leitura publica de fotos" on photos for select using (true);
create policy "convidados publicam fotos" on photos for insert with check (true);

-- ---------------------------------------------------------------------
-- Storage: bucket "frames" (molduras, upload manual) e "photos" (público)
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('frames', 'frames', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('photos', 'photos', true)
on conflict (id) do nothing;

create policy "leitura publica frames" on storage.objects
  for select using (bucket_id = 'frames');

create policy "leitura publica photos" on storage.objects
  for select using (bucket_id = 'photos');

create policy "upload publico photos" on storage.objects
  for insert with check (bucket_id = 'photos');

-- ---------------------------------------------------------------------
-- Seed do primeiro evento (Fase 1 — criado manualmente)
-- Depois de rodar, faça upload das molduras no bucket "frames" e
-- atualize as imagem_url abaixo com as URLs públicas geradas.
-- ---------------------------------------------------------------------
insert into events (slug, nome, data_festa)
values ('kamilly3anos', 'Confeitaria da Kamilly Maria', null)
on conflict (slug) do nothing;

-- Exemplo (troque SEU-PROJETO pela ref do seu projeto Supabase):
-- insert into frames (event_id, nome, imagem_url, ordem)
-- select id, 'Moldura Confeitaria 1',
--   'https://SEU-PROJETO.supabase.co/storage/v1/object/public/frames/moldura1.png', 0
-- from events where slug = 'kamilly3anos';
--
-- insert into frames (event_id, nome, imagem_url, ordem)
-- select id, 'Moldura Confeitaria 2',
--   'https://SEU-PROJETO.supabase.co/storage/v1/object/public/frames/moldura2.png', 1
-- from events where slug = 'kamilly3anos';
