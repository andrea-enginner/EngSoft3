create table public.pagamentos_emprestimo (
  id uuid primary key default gen_random_uuid(),
  solicitacao_id uuid not null unique
    references public.solicitacoes_emprestimo (id) on delete cascade,
  pagador_id uuid not null references auth.users (id) on delete cascade,
  valor_centavos bigint not null check (valor_centavos > 0),
  moeda text not null default 'brl' check (moeda = 'brl'),
  provedor text not null default 'stripe' check (provedor = 'stripe'),
  checkout_session_id text unique,
  payment_intent_id text unique,
  status text not null default 'pendente'
    check (status in ('pendente', 'processando', 'aprovado', 'recusado', 'cancelado')),
  codigo_falha text,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  pago_em timestamptz
);

create index pagamentos_pagador_idx
  on public.pagamentos_emprestimo (pagador_id, atualizado_em desc);

alter table public.pagamentos_emprestimo enable row level security;

create policy "partes_leem_pagamentos" on public.pagamentos_emprestimo
  for select to authenticated
  using (
    exists (
      select 1
      from public.solicitacoes_emprestimo solicitacao
      where solicitacao.id = pagamentos_emprestimo.solicitacao_id
        and auth.uid() in (solicitacao.dono_id, solicitacao.interessado_id)
    )
  );

revoke insert, update, delete on public.pagamentos_emprestimo from anon, authenticated;
grant select on public.pagamentos_emprestimo to authenticated;

create function public.preparar_pagamento_emprestimo(p_solicitacao_id uuid)
returns table (
  pagamento_id uuid,
  titulo text,
  valor_centavos bigint
)
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_usuario_id uuid := auth.uid();
  v_solicitacao public.solicitacoes_emprestimo%rowtype;
  v_titulo text;
  v_pagamento_id uuid;
begin
  if v_usuario_id is null then
    raise exception 'Entre na sua conta para realizar o pagamento.';
  end if;

  select solicitacao.*
    into v_solicitacao
  from public.solicitacoes_emprestimo solicitacao
  where solicitacao.id = p_solicitacao_id;

  if not found then
    raise exception 'Solicitacao de emprestimo nao encontrada.';
  end if;
  if v_solicitacao.interessado_id <> v_usuario_id then
    raise exception 'Somente quem solicitou o emprestimo pode realizar o pagamento.';
  end if;
  if v_solicitacao.status <> 'aceito' then
    raise exception 'O pagamento fica disponivel depois que o proprietario aceita a solicitacao.';
  end if;

  select anuncio.titulo into v_titulo
  from public.anuncios anuncio
  where anuncio.id = v_solicitacao.anuncio_id;

  select pagamento.id into v_pagamento_id
  from public.pagamentos_emprestimo pagamento
  where pagamento.solicitacao_id = p_solicitacao_id
    and pagamento.status = 'aprovado';

  if v_pagamento_id is not null then
    raise exception 'Este emprestimo ja possui um pagamento aprovado.';
  end if;

  insert into public.pagamentos_emprestimo (
    solicitacao_id,
    pagador_id,
    valor_centavos,
    status
  ) values (
    v_solicitacao.id,
    v_usuario_id,
    v_solicitacao.valor_total_centavos,
    'pendente'
  )
  on conflict (solicitacao_id) do update set
    pagador_id = excluded.pagador_id,
    valor_centavos = excluded.valor_centavos,
    checkout_session_id = null,
    payment_intent_id = null,
    status = 'pendente',
    codigo_falha = null,
    atualizado_em = now(),
    pago_em = null
  where pagamentos_emprestimo.status <> 'aprovado'
  returning id into v_pagamento_id;

  if v_pagamento_id is null then
    raise exception 'Este emprestimo ja possui um pagamento aprovado.';
  end if;

  return query select v_pagamento_id, v_titulo, v_solicitacao.valor_total_centavos;
end;
$$;

revoke all on function public.preparar_pagamento_emprestimo(uuid) from public, anon;
grant execute on function public.preparar_pagamento_emprestimo(uuid) to authenticated;

create function public.vincular_checkout_pagamento(
  p_pagamento_id uuid,
  p_checkout_session_id text
)
returns void
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  if auth.uid() is null then
    raise exception 'Autenticacao obrigatoria.';
  end if;

  update public.pagamentos_emprestimo
  set checkout_session_id = p_checkout_session_id,
      atualizado_em = now()
  where id = p_pagamento_id
    and pagador_id = auth.uid()
    and status = 'pendente';

  if not found then
    raise exception 'Pagamento nao encontrado ou indisponivel.';
  end if;
end;
$$;

revoke all on function public.vincular_checkout_pagamento(uuid, text) from public, anon;
grant execute on function public.vincular_checkout_pagamento(uuid, text) to authenticated;

create function public.obter_pagamento_emprestimo(p_solicitacao_id uuid)
returns table (
  solicitacao_id uuid,
  anuncio_id uuid,
  titulo text,
  proprietario text,
  papel text,
  inicio_em timestamptz,
  fim_em timestamptz,
  status_solicitacao text,
  valor_centavos bigint,
  imagem text,
  pagamento_id uuid,
  status_pagamento text,
  checkout_session_id text
)
language sql
stable
security definer
set search_path = public, extensions
as $$
  select
    solicitacao.id,
    solicitacao.anuncio_id,
    anuncio.titulo,
    coalesce(nullif(btrim(perfil.nome), ''), 'Membro da comunidade'),
    case when solicitacao.dono_id = auth.uid() then 'dono' else 'interessado' end,
    solicitacao.inicio_em,
    solicitacao.fim_em,
    solicitacao.status,
    solicitacao.valor_total_centavos,
    coalesce(
      (
        select imagem.caminho
        from public.anuncio_imagens imagem
        where imagem.anuncio_id = solicitacao.anuncio_id
        order by imagem.ordem
        limit 1
      ),
      anuncio.imagem_url
    ),
    pagamento.id,
    pagamento.status,
    pagamento.checkout_session_id
  from public.solicitacoes_emprestimo solicitacao
  join public.anuncios anuncio on anuncio.id = solicitacao.anuncio_id
  left join public.perfis perfil on perfil.id = solicitacao.dono_id
  left join public.pagamentos_emprestimo pagamento
    on pagamento.solicitacao_id = solicitacao.id
  where solicitacao.id = p_solicitacao_id
    and auth.uid() in (solicitacao.dono_id, solicitacao.interessado_id);
$$;

revoke all on function public.obter_pagamento_emprestimo(uuid) from public, anon;
grant execute on function public.obter_pagamento_emprestimo(uuid) to authenticated;

drop function if exists public.listar_minhas_solicitacoes_emprestimo();
create function public.listar_minhas_solicitacoes_emprestimo()
returns table (
  id uuid, anuncio_id uuid, conversa_id uuid, papel text, titulo text, pessoa text,
  inicio_em timestamptz, fim_em timestamptz, criado_em timestamptz, status text,
  valor_unitario_centavos integer, duracao_quantidade integer,
  duracao_unidade text, valor_total_centavos bigint, imagem text,
  status_pagamento text
)
language sql
stable
security definer
set search_path = ''
as $$
  select solicitacao.id, solicitacao.anuncio_id, solicitacao.conversa_id,
    case when solicitacao.dono_id = auth.uid() then 'dono' else 'interessado' end,
    anuncio.titulo,
    coalesce(nullif(trim(perfil.nome), ''), 'Membro da comunidade'),
    solicitacao.inicio_em, solicitacao.fim_em, solicitacao.criado_em, solicitacao.status,
    solicitacao.valor_unitario_centavos, solicitacao.duracao_quantidade,
    solicitacao.duracao_unidade, solicitacao.valor_total_centavos,
    coalesce(
      (
        select imagem.caminho
        from public.anuncio_imagens imagem
        where imagem.anuncio_id = solicitacao.anuncio_id
        order by imagem.ordem
        limit 1
      ),
      anuncio.imagem_url
    ),
    pagamento.status
  from public.solicitacoes_emprestimo solicitacao
  join public.anuncios anuncio on anuncio.id = solicitacao.anuncio_id
  left join public.perfis perfil on perfil.id = case
    when solicitacao.dono_id = auth.uid()
      then solicitacao.interessado_id else solicitacao.dono_id end
  left join public.pagamentos_emprestimo pagamento
    on pagamento.solicitacao_id = solicitacao.id
  where auth.uid() is not null
    and (solicitacao.dono_id = auth.uid() or solicitacao.interessado_id = auth.uid())
  order by solicitacao.criado_em desc;
$$;

revoke all on function public.listar_minhas_solicitacoes_emprestimo() from public, anon;
grant execute on function public.listar_minhas_solicitacoes_emprestimo() to authenticated;
