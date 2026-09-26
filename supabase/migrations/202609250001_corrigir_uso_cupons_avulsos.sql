-- Considera o saldo mensal do ciclo atual e os cupons avulsos sem vencimento.
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
  if v_usuario_id is null then
    raise exception 'Autenticação obrigatória.';
  end if;

  select * into v_assinatura
  from public.assinaturas_membro assinatura
  where assinatura.usuario_id = v_usuario_id
  for update;

  if not found or v_assinatura.status <> 'ativa' or v_assinatura.periodo_fim <= now() then
    raise exception 'É necessária uma assinatura ativa para utilizar cupons.';
  end if;

  if not exists (
    select 1
    from public.anuncios anuncio
    where anuncio.id = p_anuncio_id
      and anuncio.usuario_id = v_usuario_id
      and anuncio.ativo
      and anuncio.tipo = 'emprestimo'
  ) then
    raise exception 'Anúncio não encontrado ou sem permissão.';
  end if;

  if exists (
    select 1
    from public.impulsionamentos_anuncio impulsionamento
    where impulsionamento.anuncio_id = p_anuncio_id
      and impulsionamento.fim_em > now()
  ) then
    raise exception 'Este anúncio já está impulsionado.';
  end if;

  select coalesce(sum(movimentacao.quantidade), 0)
  into v_mensais
  from public.movimentacoes_cupons movimentacao
  where movimentacao.usuario_id = v_usuario_id
    and movimentacao.ciclo_inicio = v_assinatura.periodo_inicio;

  select coalesce(sum(movimentacao.quantidade), 0)
  into v_extras
  from public.movimentacoes_cupons movimentacao
  where movimentacao.usuario_id = v_usuario_id
    and movimentacao.ciclo_inicio is null;

  if v_mensais + v_extras < 1 then
    raise exception 'Você não possui cupons disponíveis.';
  end if;

  -- Consome primeiro o saldo mensal. Sem mensal, registra o uso sem ciclo para
  -- que a movimentação desconte do saldo dos cupons avulsos.
  v_ciclo_uso := case
    when v_mensais > 0 then v_assinatura.periodo_inicio
    else null
  end;

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

  if v_mensais > 0 then
    v_mensais := v_mensais - 1;
  else
    v_extras := v_extras - 1;
  end if;

  return query select
    v_fim,
    (v_mensais + v_extras)::integer,
    v_mensais::integer,
    v_extras::integer;
end;
$$;

revoke all on function public.usar_cupom_impulsionamento(uuid) from public, anon;
grant execute on function public.usar_cupom_impulsionamento(uuid) to authenticated;
