-- Tabelas que alimentam a tela de perfil: dados do usuário, seus anúncios e
-- as avaliações que ele recebeu (origem da nota de reputação).

create table if not exists public.perfis (
  id uuid primary key references auth.users (id) on delete cascade,
  nome text not null default '',
  email text not null default '',
  cidade text,
  estado text,
  avatar_url text,
  criado_em timestamptz not null default now()
);

create table if not exists public.anuncios (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references auth.users (id) on delete cascade,
  tipo text not null check (tipo in ('doacao', 'emprestimo')),
  titulo text not null,
  descricao text not null default '',
  imagem_url text,
  ativo boolean not null default true,
  criado_em timestamptz not null default now()
);

create index if not exists anuncios_do_usuario_idx
  on public.anuncios (usuario_id, criado_em desc);

create table if not exists public.avaliacoes (
  id uuid primary key default gen_random_uuid(),
  avaliado_id uuid not null references auth.users (id) on delete cascade,
  autor_nome text not null,
  autor_avatar_url text,
  nota smallint not null check (nota between 1 and 5),
  comentario text not null default '',
  criado_em timestamptz not null default now()
);

create index if not exists avaliacoes_do_usuario_idx
  on public.avaliacoes (avaliado_id, criado_em desc);

alter table public.perfis enable row level security;
alter table public.anuncios enable row level security;
alter table public.avaliacoes enable row level security;

-- Perfil: cada pessoa enxerga e edita apenas o próprio registro.
drop policy if exists "perfis_select_proprio" on public.perfis;
create policy "perfis_select_proprio" on public.perfis
  for select to authenticated using (auth.uid() = id);

drop policy if exists "perfis_insert_proprio" on public.perfis;
create policy "perfis_insert_proprio" on public.perfis
  for insert to authenticated with check (auth.uid() = id);

drop policy if exists "perfis_update_proprio" on public.perfis;
create policy "perfis_update_proprio" on public.perfis
  for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);

-- Anúncios: o dono administra os seus; anúncios ativos são públicos porque o
-- feed precisa lê-los.
drop policy if exists "anuncios_select_ativos" on public.anuncios;
create policy "anuncios_select_ativos" on public.anuncios
  for select to anon, authenticated using (ativo or auth.uid() = usuario_id);

drop policy if exists "anuncios_escrita_do_dono" on public.anuncios;
create policy "anuncios_escrita_do_dono" on public.anuncios
  for all to authenticated using (auth.uid() = usuario_id) with check (auth.uid() = usuario_id);

-- Avaliações: leitura pública (compõem a reputação exibida no perfil).
drop policy if exists "avaliacoes_select_publico" on public.avaliacoes;
create policy "avaliacoes_select_publico" on public.avaliacoes
  for select to anon, authenticated using (true);

-- Cria o perfil junto com a conta, para que a tela nunca abra sem registro.
create or replace function public.criar_perfil_do_usuario()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.perfis (id, nome, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'nome', ''),
    coalesce(new.email, '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists ao_criar_usuario on auth.users;
create trigger ao_criar_usuario
  after insert on auth.users
  for each row execute function public.criar_perfil_do_usuario();
