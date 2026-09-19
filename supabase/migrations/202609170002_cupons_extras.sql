-- Cupons comprados separadamente não expiram. Cupons mensais continuam
-- vinculados ao ciclo da assinatura e são consumidos primeiro.
alter table public.movimentacoes_cupons
  drop constraint if exists movimentacoes_cupons_tipo_check,
  drop constraint if exists movimentacoes_cupons_check;

alter table public.movimentacoes_cupons
  alter column ciclo_inicio drop not null;

alter table public.movimentacoes_cupons
  add constraint movimentacoes_cupons_tipo_check
    check (tipo in ('credito_mensal', 'compra_extra', 'uso_impulsionamento')),
  add constraint movimentacoes_cupons_origem_check
    check (
      (tipo = 'credito_mensal' and quantidade > 0 and ciclo_inicio is not null)
      or (tipo = 'compra_extra' and quantidade > 0 and ciclo_inicio is null)
      or (tipo = 'uso_impulsionamento' and quantidade = -1 and anuncio_id is not null)
    );

create table public.compras_cupons (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references auth.users (id) on delete cascade,
  quantidade smallint not null check (quantidade in (1, 2, 5)),
  valor_centavos integer not null check (valor_centavos in (490, 790, 1490)),
  checkout_session_id text unique,
  payment_intent_id text unique,
  status text not null default 'pendente'
    check (status in ('pendente', 'processando', 'aprovado', 'recusado', 'cancelado')),
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  pago_em timestamptz
);

create index compras_cupons_usuario_idx
  on public.compras_cupons (usuario_id, criado_em desc);

alter table public.compras_cupons enable row level security;
create policy "membro_le_compras_cupons" on public.compras_cupons
  for select to authenticated using (usuario_id = auth.uid());
revoke insert, update, delete on public.compras_cupons from anon, authenticated;
grant select on public.compras_cupons to authenticated;

create function public.preparar_compra_cupons(p_quantidade smallint)
returns table (compra_id uuid, quantidade smallint, valor_centavos integer)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_usuario_id uuid := auth.uid();
  v_valor integer;
  v_compra_id uuid;
begin
  if v_usuario_id is null then raise exception 'Autenticação obrigatória.'; end if;
  if not exists (
    select 1 from public.assinaturas_membro a
    where a.usuario_id = v_usuario_id
      and a.status = 'ativa'
      and a.periodo_fim > now()
  ) then
    raise exception 'É necessária uma assinatura ativa para comprar cupons extras.';
  end if;

  case p_quantidade
    when 1 then v_valor := 490;
    when 2 then v_valor := 790;
    when 5 then v_valor := 1490;
    else raise exception 'Pacote de cupons inválido.';
  end case;

  insert into public.compras_cupons (usuario_id, quantidade, valor_centavos)
  values (v_usuario_id, p_quantidade, v_valor)
  returning id into v_compra_id;

  return query select v_compra_id, p_quantidade, v_valor;
end;
$$;

revoke all on function public.preparar_compra_cupons(smallint) from public, anon;
grant execute on function public.preparar_compra_cupons(smallint) to authenticated;

create function public.vincular_checkout_compra_cupons(
  p_compra_id uuid,
  p_checkout_session_id text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then raise exception 'Autenticação obrigatória.'; end if;

  update public.compras_cupons
  set checkout_session_id = p_checkout_session_id,
      atualizado_em = now()
  where id = p_compra_id
    and usuario_id = auth.uid()
    and status = 'pendente';

  if not found then raise exception 'Compra de cupons não encontrada ou indisponível.'; end if;
end;
$$;

revoke all on function public.vincular_checkout_compra_cupons(uuid, text) from public, anon;
grant execute on function public.vincular_checkout_compra_cupons(uuid, text) to authenticated;

create function public.atualizar_compra_cupons_por_checkout(
  p_checkout_session_id text,
  p_status text,
  p_payment_intent_id text default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_compra public.compras_cupons%rowtype;
begin
  if coalesce(auth.jwt() ->> 'role', '') <> 'service_role' then
    raise exception 'Operação restrita ao servidor.';
  end if;
  if p_status not in ('pendente', 'processando', 'aprovado', 'recusado', 'cancelado') then
    raise exception 'Status de compra inválido.';
  end if;

  update public.compras_cupons
  set status = case when status = 'aprovado' then status else p_status end,
      payment_intent_id = coalesce(p_payment_intent_id, payment_intent_id),
      atualizado_em = now(),
      pago_em = case when p_status = 'aprovado' then coalesce(pago_em, now()) else pago_em end
  where checkout_session_id = p_checkout_session_id
  returning * into v_compra;

  if not found then raise exception 'Checkout da compra de cupons não encontrado.'; end if;

  if p_status = 'aprovado' then
    insert into public.movimentacoes_cupons (
      usuario_id, tipo, quantidade, ciclo_inicio, referencia_externa
    ) values (
      v_compra.usuario_id, 'compra_extra', v_compra.quantidade, null,
      'compra:' || p_checkout_session_id
    ) on conflict (referencia_externa) do nothing;
  end if;
end;
$$;

revoke all on function public.atualizar_compra_cupons_por_checkout(text, text, text) from public, anon, authenticated;
grant execute on function public.atualizar_compra_cupons_por_checkout(text, text, text) to service_role;

drop function if exists public.usar_cupom_impulsionamento(uuid);
create function public.usar_cupom_impulsionamento(p_anuncio_id uuid)
returns table (
  impulsionado_ate timestamptz,
  cupons_disponiveis integer,
  cupons_mensais integer,
  cupons_extras integer
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_usuario_id uuid := auth.uid();
  v_assinatura public.assinaturas_membro%rowtype;
  v_mensais bigint;
  v_extras bigint;
  v_impulsionamento_id uuid := gen_random_uuid();
  v_fim timestamptz := now() + interval '7 days';
  v_ciclo_uso timestamptz;
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

  select coalesce(sum(m.quantidade), 0) into v_mensais
  from public.movimentacoes_cupons m
  where m.usuario_id = v_usuario_id
    and m.ciclo_inicio = v_assinatura.periodo_inicio;

  select coalesce(sum(m.quantidade), 0) into v_extras
  from public.movimentacoes_cupons m
  where m.usuario_id = v_usuario_id
    and m.ciclo_inicio is null;

  if v_mensais + v_extras < 1 then
    raise exception 'Você não possui cupons disponíveis.';
  end if;
  v_ciclo_uso := case when v_mensais > 0 then v_assinatura.periodo_inicio else null end;

  insert into public.impulsionamentos_anuncio (
    id, anuncio_id, usuario_id, inicio_em, fim_em
  ) values (
    v_impulsionamento_id, p_anuncio_id, v_usuario_id, now(), v_fim
  );
  insert into public.movimentacoes_cupons (
    usuario_id, tipo, quantidade, ciclo_inicio, referencia_externa, anuncio_id
  ) values (
    v_usuario_id, 'uso_impulsionamento', -1, v_ciclo_uso,
    'impulso:' || v_impulsionamento_id::text, p_anuncio_id
  );

  if v_mensais > 0 then v_mensais := v_mensais - 1;
  else v_extras := v_extras - 1;
  end if;

  return query select v_fim, (v_mensais + v_extras)::integer,
    v_mensais::integer, v_extras::integer;
end;
$$;

revoke all on function public.usar_cupom_impulsionamento(uuid) from public, anon;
grant execute on function public.usar_cupom_impulsionamento(uuid) to authenticated;

create function public.obter_saldo_cupons()
returns table (
  cupons_disponiveis bigint,
  cupons_mensais bigint,
  cupons_extras bigint,
  status_assinatura text
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    greatest(0, coalesce(mensais.saldo, 0)) + greatest(0, coalesce(extras.saldo, 0)),
    greatest(0, coalesce(mensais.saldo, 0)),
    greatest(0, coalesce(extras.saldo, 0)),
    assinatura.status
  from public.assinaturas_membro assinatura
  left join lateral (
    select sum(m.quantidade) as saldo
    from public.movimentacoes_cupons m
    where m.usuario_id = assinatura.usuario_id
      and m.ciclo_inicio = assinatura.periodo_inicio
  ) mensais on true
  left join lateral (
    select sum(m.quantidade) as saldo
    from public.movimentacoes_cupons m
    where m.usuario_id = assinatura.usuario_id
      and m.ciclo_inicio is null
  ) extras on true
  where assinatura.usuario_id = auth.uid();
$$;

revoke all on function public.obter_saldo_cupons() from public, anon;
grant execute on function public.obter_saldo_cupons() to authenticated;

drop function if exists public.obter_anuncio_para_impulsionar(uuid);
create function public.obter_anuncio_para_impulsionar(p_anuncio_id uuid)
returns table (
  anuncio_id uuid, titulo text, descricao text, categoria text, condicao text,
  valor_unitario_centavos integer, duracao_quantidade integer, duracao_unidade text,
  criado_em timestamptz, ativo boolean, imagem text, cidade text, estado text,
  assinatura_plano text, assinatura_status text, cupons_disponiveis bigint,
  cupons_por_ciclo smallint, periodo_fim timestamptz, cancelar_ao_fim boolean,
  impulsionado_ate timestamptz, cupons_mensais bigint, cupons_extras bigint
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
    greatest(0, coalesce(saldos.mensais, 0)) + greatest(0, coalesce(saldos.extras, 0)),
    assinatura.cupons_por_ciclo, assinatura.periodo_fim, assinatura.cancelar_ao_fim,
    impulso.fim_em,
    greatest(0, coalesce(saldos.mensais, 0)),
    greatest(0, coalesce(saldos.extras, 0))
  from public.anuncios anuncio
  left join public.perfis perfil on perfil.id = anuncio.usuario_id
  left join public.assinaturas_membro assinatura on assinatura.usuario_id = anuncio.usuario_id
  left join lateral (
    select
      sum(m.quantidade) filter (where m.ciclo_inicio = assinatura.periodo_inicio) as mensais,
      sum(m.quantidade) filter (where m.ciclo_inicio is null) as extras
    from public.movimentacoes_cupons m
    where m.usuario_id = anuncio.usuario_id
  ) saldos on true
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
