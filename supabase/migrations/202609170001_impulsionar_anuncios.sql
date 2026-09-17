-- Compatibilidade com a primeira versão da funcionalidade. As funções são
-- removidas porque o PostgreSQL não permite mudar o RETURNS TABLE via replace.
drop function if exists public.preparar_impulsionamento_anuncio(uuid, text);
drop function if exists public.vincular_checkout_impulsionamento(uuid, text);
drop function if exists public.atualizar_impulsionamento_por_checkout(text, text, text);
drop function if exists public.vincular_checkout_assinatura(uuid, text, text);
drop function if exists public.sincronizar_assinatura_membro(uuid, text, text, text, text, text, timestamptz, timestamptz, boolean, text);
drop function if exists public.usar_cupom_impulsionamento(uuid);
drop function if exists public.obter_customer_assinatura();
drop function if exists public.obter_anuncio_para_impulsionar(uuid);
drop function if exists public.listar_anuncios_publicos(uuid);

-- Se a tabela do modelo antigo (pagamento por anúncio) existir, ela é
-- preservada como legado. Nenhum dado anterior é apagado.
do $$
begin
  if to_regclass('public.impulsionamentos_anuncio') is not null
    and exists (
      select 1
      from information_schema.columns
      where table_schema = 'public'
        and table_name = 'impulsionamentos_anuncio'
        and column_name = 'plano'
    )
  then
    if to_regclass('public.impulsionamentos_anuncio_pagamentos_legado') is not null then
      raise exception 'A tabela de legado já existe; revise a migração anterior antes de continuar.';
    end if;

    alter table public.impulsionamentos_anuncio
      rename to impulsionamentos_anuncio_pagamentos_legado;
    alter table public.impulsionamentos_anuncio_pagamentos_legado
      rename constraint impulsionamentos_anuncio_pkey
      to impulsionamentos_anuncio_legado_pkey;

    if to_regclass('public.impulsionamentos_anuncio_ativos_idx') is not null then
      alter index public.impulsionamentos_anuncio_ativos_idx
        rename to impulsionamentos_anuncio_legado_ativos_idx;
    end if;
    if to_regclass('public.impulsionamentos_anuncio_usuario_idx') is not null then
      alter index public.impulsionamentos_anuncio_usuario_idx
        rename to impulsionamentos_anuncio_legado_usuario_idx;
    end if;
  end if;
end;
$$;

create table if not exists public.assinaturas_membro (
  usuario_id uuid primary key references auth.users (id) on delete cascade,
  plano text not null check (plano in ('essencial', 'plus', 'premium')),
  status text not null default 'pendente'
    check (status in ('pendente', 'ativa', 'inadimplente', 'cancelada')),
  cupons_por_ciclo smallint not null check (cupons_por_ciclo in (3, 8, 20)),
  stripe_customer_id text unique,
  stripe_subscription_id text unique,
  stripe_checkout_session_id text unique,
  periodo_inicio timestamptz,
  periodo_fim timestamptz,
  cancelar_ao_fim boolean not null default false,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  check (periodo_fim is null or periodo_inicio is null or periodo_fim > periodo_inicio)
);

create table if not exists public.movimentacoes_cupons (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references auth.users (id) on delete cascade,
  tipo text not null check (tipo in ('credito_mensal', 'uso_impulsionamento')),
  quantidade smallint not null check (quantidade <> 0),
  ciclo_inicio timestamptz not null,
  referencia_externa text not null unique,
  anuncio_id uuid references public.anuncios (id) on delete set null,
  criado_em timestamptz not null default now(),
  check (
    (tipo = 'credito_mensal' and quantidade > 0)
    or (tipo = 'uso_impulsionamento' and quantidade = -1 and anuncio_id is not null)
  )
);

create table if not exists public.impulsionamentos_anuncio (
  id uuid primary key default gen_random_uuid(),
  anuncio_id uuid not null references public.anuncios (id) on delete cascade,
  usuario_id uuid not null references auth.users (id) on delete cascade,
  inicio_em timestamptz not null default now(),
  fim_em timestamptz not null,
  criado_em timestamptz not null default now(),
  check (fim_em > inicio_em)
);

create index if not exists movimentacoes_cupons_saldo_idx
  on public.movimentacoes_cupons (usuario_id, ciclo_inicio, criado_em);
create index if not exists impulsionamentos_anuncio_ativos_idx
  on public.impulsionamentos_anuncio (anuncio_id, fim_em desc);
create index if not exists impulsionamentos_anuncio_usuario_idx
  on public.impulsionamentos_anuncio (usuario_id, criado_em desc);

alter table public.assinaturas_membro enable row level security;
alter table public.movimentacoes_cupons enable row level security;
alter table public.impulsionamentos_anuncio enable row level security;

drop policy if exists "membro_le_assinatura" on public.assinaturas_membro;
create policy "membro_le_assinatura" on public.assinaturas_membro
  for select to authenticated using (usuario_id = auth.uid());
drop policy if exists "membro_le_movimentacoes" on public.movimentacoes_cupons;
create policy "membro_le_movimentacoes" on public.movimentacoes_cupons
  for select to authenticated using (usuario_id = auth.uid());
drop policy if exists "dono_le_impulsionamentos" on public.impulsionamentos_anuncio;
create policy "dono_le_impulsionamentos" on public.impulsionamentos_anuncio
  for select to authenticated using (usuario_id = auth.uid());

revoke insert, update, delete on public.assinaturas_membro from anon, authenticated;
revoke insert, update, delete on public.movimentacoes_cupons from anon, authenticated;
revoke insert, update, delete on public.impulsionamentos_anuncio from anon, authenticated;
grant select on public.assinaturas_membro, public.movimentacoes_cupons, public.impulsionamentos_anuncio to authenticated;

create function public.vincular_checkout_assinatura(
  p_anuncio_id uuid,
  p_plano text,
  p_checkout_session_id text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_usuario_id uuid := auth.uid();
  v_cupons smallint;
begin
  if v_usuario_id is null then raise exception 'Autenticação obrigatória.'; end if;
  if not exists (
    select 1 from public.anuncios a
    where a.id = p_anuncio_id and a.usuario_id = v_usuario_id
      and a.ativo and a.tipo = 'emprestimo'
  ) then
    raise exception 'Anúncio não encontrado ou sem permissão.';
  end if;

  case p_plano
    when 'essencial' then v_cupons := 3;
    when 'plus' then v_cupons := 8;
    when 'premium' then v_cupons := 20;
    else raise exception 'Plano de assinatura inválido.';
  end case;

  if exists (
    select 1 from public.assinaturas_membro a
    where a.usuario_id = v_usuario_id and a.status in ('ativa', 'inadimplente')
  ) then
    raise exception 'Já existe uma assinatura para esta conta.';
  end if;

  insert into public.assinaturas_membro (
    usuario_id, plano, status, cupons_por_ciclo, stripe_checkout_session_id
  ) values (
    v_usuario_id, p_plano, 'pendente', v_cupons, p_checkout_session_id
  )
  on conflict (usuario_id) do update set
    plano = excluded.plano,
    status = 'pendente',
    cupons_por_ciclo = excluded.cupons_por_ciclo,
    stripe_checkout_session_id = excluded.stripe_checkout_session_id,
    atualizado_em = now();
end;
$$;

revoke all on function public.vincular_checkout_assinatura(uuid, text, text) from public, anon;
grant execute on function public.vincular_checkout_assinatura(uuid, text, text) to authenticated;

create function public.sincronizar_assinatura_membro(
  p_usuario_id uuid,
  p_plano text,
  p_status text,
  p_stripe_customer_id text,
  p_stripe_subscription_id text,
  p_stripe_checkout_session_id text,
  p_periodo_inicio timestamptz,
  p_periodo_fim timestamptz,
  p_cancelar_ao_fim boolean,
  p_referencia_credito text default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_cupons smallint;
begin
  if coalesce(auth.jwt() ->> 'role', '') <> 'service_role' then
    raise exception 'Operação restrita ao servidor.';
  end if;
  if p_status not in ('pendente', 'ativa', 'inadimplente', 'cancelada') then
    raise exception 'Status de assinatura inválido.';
  end if;
  case p_plano
    when 'essencial' then v_cupons := 3;
    when 'plus' then v_cupons := 8;
    when 'premium' then v_cupons := 20;
    else raise exception 'Plano de assinatura inválido.';
  end case;

  insert into public.assinaturas_membro (
    usuario_id, plano, status, cupons_por_ciclo, stripe_customer_id,
    stripe_subscription_id, stripe_checkout_session_id, periodo_inicio,
    periodo_fim, cancelar_ao_fim
  ) values (
    p_usuario_id, p_plano, p_status, v_cupons, p_stripe_customer_id,
    p_stripe_subscription_id, p_stripe_checkout_session_id, p_periodo_inicio,
    p_periodo_fim, p_cancelar_ao_fim
  )
  on conflict (usuario_id) do update set
    plano = excluded.plano,
    status = excluded.status,
    cupons_por_ciclo = excluded.cupons_por_ciclo,
    stripe_customer_id = excluded.stripe_customer_id,
    stripe_subscription_id = excluded.stripe_subscription_id,
    stripe_checkout_session_id = coalesce(excluded.stripe_checkout_session_id, public.assinaturas_membro.stripe_checkout_session_id),
    periodo_inicio = excluded.periodo_inicio,
    periodo_fim = excluded.periodo_fim,
    cancelar_ao_fim = excluded.cancelar_ao_fim,
    atualizado_em = now();

  if p_status = 'ativa' and p_referencia_credito is not null then
    insert into public.movimentacoes_cupons (
      usuario_id, tipo, quantidade, ciclo_inicio, referencia_externa
    ) values (
      p_usuario_id, 'credito_mensal', v_cupons, p_periodo_inicio, p_referencia_credito
    ) on conflict (referencia_externa) do nothing;
  end if;
end;
$$;

revoke all on function public.sincronizar_assinatura_membro(uuid, text, text, text, text, text, timestamptz, timestamptz, boolean, text) from public, anon, authenticated;
grant execute on function public.sincronizar_assinatura_membro(uuid, text, text, text, text, text, timestamptz, timestamptz, boolean, text) to service_role;

create function public.usar_cupom_impulsionamento(p_anuncio_id uuid)
returns table (impulsionado_ate timestamptz, cupons_disponiveis integer)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_usuario_id uuid := auth.uid();
  v_assinatura public.assinaturas_membro%rowtype;
  v_saldo bigint;
  v_impulsionamento_id uuid := gen_random_uuid();
  v_fim timestamptz := now() + interval '7 days';
begin
  if v_usuario_id is null then raise exception 'Autenticação obrigatória.'; end if;

  select * into v_assinatura
  from public.assinaturas_membro a
  where a.usuario_id = v_usuario_id
  for update;

  if not found or v_assinatura.status <> 'ativa' or v_assinatura.periodo_fim <= now() then
    raise exception 'É necessária uma assinatura ativa para utilizar cupons.';
  end if;
  if not exists (
    select 1 from public.anuncios a
    where a.id = p_anuncio_id and a.usuario_id = v_usuario_id
      and a.ativo and a.tipo = 'emprestimo'
  ) then
    raise exception 'Anúncio não encontrado ou sem permissão.';
  end if;
  if exists (
    select 1 from public.impulsionamentos_anuncio i
    where i.anuncio_id = p_anuncio_id and i.fim_em > now()
  ) then
    raise exception 'Este anúncio já está impulsionado.';
  end if;

  select coalesce(sum(m.quantidade), 0) into v_saldo
  from public.movimentacoes_cupons m
  where m.usuario_id = v_usuario_id
    and m.ciclo_inicio = v_assinatura.periodo_inicio;
  if v_saldo < 1 then raise exception 'Você não possui cupons disponíveis neste ciclo.'; end if;

  insert into public.impulsionamentos_anuncio (
    id, anuncio_id, usuario_id, inicio_em, fim_em
  ) values (
    v_impulsionamento_id, p_anuncio_id, v_usuario_id, now(), v_fim
  );
  insert into public.movimentacoes_cupons (
    usuario_id, tipo, quantidade, ciclo_inicio, referencia_externa, anuncio_id
  ) values (
    v_usuario_id, 'uso_impulsionamento', -1, v_assinatura.periodo_inicio,
    'impulso:' || v_impulsionamento_id::text, p_anuncio_id
  );

  return query select v_fim, (v_saldo - 1)::integer;
end;
$$;

revoke all on function public.usar_cupom_impulsionamento(uuid) from public, anon;
grant execute on function public.usar_cupom_impulsionamento(uuid) to authenticated;

create function public.obter_customer_assinatura()
returns table (stripe_customer_id text)
language sql
stable
security definer
set search_path = ''
as $$
  select a.stripe_customer_id
  from public.assinaturas_membro a
  where a.usuario_id = auth.uid();
$$;

revoke all on function public.obter_customer_assinatura() from public, anon;
grant execute on function public.obter_customer_assinatura() to authenticated;

create function public.obter_anuncio_para_impulsionar(p_anuncio_id uuid)
returns table (
  anuncio_id uuid, titulo text, descricao text, categoria text, condicao text,
  valor_unitario_centavos integer, duracao_quantidade integer, duracao_unidade text,
  criado_em timestamptz, ativo boolean, imagem text, cidade text, estado text,
  assinatura_plano text, assinatura_status text, cupons_disponiveis bigint,
  cupons_por_ciclo smallint, periodo_fim timestamptz, cancelar_ao_fim boolean,
  impulsionado_ate timestamptz
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    anuncio.id, anuncio.titulo, anuncio.descricao, anuncio.categoria,
    anuncio.condicao, anuncio.valor_unitario_centavos, anuncio.duracao_quantidade,
    anuncio.duracao_unidade, anuncio.criado_em, anuncio.ativo,
    coalesce(
      (select imagem.caminho from public.anuncio_imagens imagem
       where imagem.anuncio_id = anuncio.id order by imagem.ordem limit 1),
      anuncio.imagem_url
    ),
    perfil.cidade, perfil.estado,
    assinatura.plano, assinatura.status,
    coalesce((
      select sum(m.quantidade) from public.movimentacoes_cupons m
      where m.usuario_id = anuncio.usuario_id
        and m.ciclo_inicio = assinatura.periodo_inicio
    ), 0),
    assinatura.cupons_por_ciclo, assinatura.periodo_fim, assinatura.cancelar_ao_fim,
    impulso.fim_em
  from public.anuncios anuncio
  left join public.perfis perfil on perfil.id = anuncio.usuario_id
  left join public.assinaturas_membro assinatura on assinatura.usuario_id = anuncio.usuario_id
  left join lateral (
    select max(i.fim_em) as fim_em
    from public.impulsionamentos_anuncio i
    where i.anuncio_id = anuncio.id and i.fim_em > now()
  ) impulso on true
  where anuncio.id = p_anuncio_id
    and anuncio.usuario_id = auth.uid()
    and anuncio.tipo = 'emprestimo';
$$;

revoke all on function public.obter_anuncio_para_impulsionar(uuid) from public, anon;
grant execute on function public.obter_anuncio_para_impulsionar(uuid) to authenticated;

drop function if exists public.listar_anuncios_publicos(uuid);
create function public.listar_anuncios_publicos(p_id uuid default null)
returns table (
  id uuid, tipo text, titulo text, descricao text, categoria text, condicao text,
  valor_unitario_centavos integer, duracao_quantidade integer, duracao_unidade text,
  criado_em timestamptz, usuario_id uuid, dono_nome text,
  dono_avatar text, cidade text, estado text, avaliacao numeric, imagens text[],
  impulsionado boolean, impulsionado_ate timestamptz
)
language sql
stable
security definer
set search_path = ''
as $$
  select a.id, a.tipo, a.titulo, a.descricao, a.categoria, a.condicao,
    a.valor_unitario_centavos, a.duracao_quantidade, a.duracao_unidade, a.criado_em, a.usuario_id,
    coalesce(nullif(trim(p.nome), ''), 'Membro da comunidade'), p.avatar_url, p.cidade, p.estado,
    coalesce((select round(avg(av.nota)::numeric, 1) from public.avaliacoes av where av.avaliado_id = a.usuario_id), 0),
    coalesce((select array_agg(ai.caminho order by ai.ordem) from public.anuncio_imagens ai where ai.anuncio_id = a.id),
      case when a.imagem_url is null then array[]::text[] else array[a.imagem_url] end),
    impulso.fim_em is not null,
    impulso.fim_em
  from public.anuncios a
  left join public.perfis p on p.id = a.usuario_id
  left join lateral (
    select max(i.fim_em) as fim_em
    from public.impulsionamentos_anuncio i
    where i.anuncio_id = a.id and i.fim_em > now()
  ) impulso on true
  where a.ativo and (p_id is null or a.id = p_id)
  order by (impulso.fim_em is not null) desc, impulso.fim_em desc nulls last, a.criado_em desc;
$$;

revoke all on function public.listar_anuncios_publicos(uuid) from public;
grant execute on function public.listar_anuncios_publicos(uuid) to anon, authenticated;
