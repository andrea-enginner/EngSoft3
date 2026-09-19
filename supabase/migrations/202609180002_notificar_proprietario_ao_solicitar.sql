-- A reserva e a primeira mensagem passam a ser uma unica transacao. Se a
-- conversa ou a mensagem falhar, a solicitacao tambem nao e confirmada.
drop function if exists public.solicitar_reserva(uuid, timestamptz, integer, text);

create function public.solicitar_reserva(
  p_anuncio_id uuid,
  p_inicio_em timestamptz,
  p_duracao_quantidade integer,
  p_duracao_unidade text
)
returns table (solicitacao_id uuid, conversa_id uuid)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_usuario_id uuid := auth.uid();
  v_anuncio public.anuncios%rowtype;
  v_duracao_dias bigint;
  v_limite_dias bigint;
  v_fim_em timestamptz;
  v_valor_unitario integer;
  v_total bigint;
  v_solicitacao_id uuid;
  v_conversa_id uuid;
begin
  if v_usuario_id is null then raise exception 'Autenticacao obrigatoria'; end if;
  if p_inicio_em is null or p_inicio_em <= now() then raise exception 'A data de inicio deve estar no futuro'; end if;
  if p_duracao_quantidade is null or p_duracao_quantidade not between 1 and 69993 then raise exception 'Duracao invalida'; end if;
  if p_duracao_unidade not in ('dias', 'semanas') then raise exception 'Unidade de duracao invalida'; end if;

  select * into v_anuncio
  from public.anuncios
  where id = p_anuncio_id and ativo and tipo = 'emprestimo';

  if not found then raise exception 'Anuncio indisponivel'; end if;
  if v_anuncio.usuario_id = v_usuario_id then raise exception 'O dono nao pode reservar o proprio anuncio'; end if;
  if v_anuncio.valor_unitario_centavos is null or v_anuncio.duracao_quantidade is null
    or v_anuncio.duracao_unidade not in ('dias', 'semanas') then
    raise exception 'O anuncio nao possui condicoes completas';
  end if;
  if v_anuncio.duracao_unidade = 'dias' and p_duracao_unidade <> 'dias' then
    raise exception 'A unidade solicitada nao e permitida para este anuncio';
  end if;

  v_duracao_dias := p_duracao_quantidade::bigint * case p_duracao_unidade when 'semanas' then 7 else 1 end;
  v_limite_dias := v_anuncio.duracao_quantidade::bigint * case v_anuncio.duracao_unidade when 'semanas' then 7 else 1 end;
  if v_duracao_dias > v_limite_dias then
    raise exception 'A duracao solicitada ultrapassa o limite do anuncio';
  end if;

  v_valor_unitario := case
    when v_anuncio.duracao_unidade = 'semanas' and p_duracao_unidade = 'dias'
      then round(v_anuncio.valor_unitario_centavos::numeric / 7)::integer
    else v_anuncio.valor_unitario_centavos
  end;
  v_total := v_valor_unitario::bigint * p_duracao_quantidade;
  v_fim_em := p_inicio_em + v_duracao_dias::double precision * interval '1 day';

  begin
    insert into public.solicitacoes_emprestimo (
      anuncio_id, dono_id, interessado_id, inicio_em, fim_em,
      valor_unitario_centavos, duracao_quantidade, duracao_unidade, valor_total_centavos
    ) values (
      v_anuncio.id, v_anuncio.usuario_id, v_usuario_id, p_inicio_em, v_fim_em,
      v_valor_unitario, p_duracao_quantidade, p_duracao_unidade, v_total
    ) returning id into v_solicitacao_id;
  exception
    when unique_violation then
      raise exception 'Voce ja possui uma solicitacao ativa para este anuncio';
  end;

  insert into public.conversas (anuncio_id, proprietario_id, interessado_id)
  values (v_anuncio.id, v_anuncio.usuario_id, v_usuario_id)
  on conflict (anuncio_id, interessado_id) do nothing
  returning id into v_conversa_id;

  if v_conversa_id is null then
    select conversa.id into v_conversa_id
    from public.conversas conversa
    where conversa.anuncio_id = v_anuncio.id
      and conversa.interessado_id = v_usuario_id;
  end if;

  -- Uma conversa por par anuncio/interessado: a nova reserva passa a ser a
  -- vinculada ao chat quando ja houve uma solicitacao anterior.
  update public.solicitacoes_emprestimo solicitacao
  set conversa_id = null
  where solicitacao.conversa_id = v_conversa_id;

  update public.solicitacoes_emprestimo solicitacao
  set conversa_id = v_conversa_id
  where solicitacao.id = v_solicitacao_id;

  insert into public.mensagens (conversa_id, remetente_id, conteudo, tipo)
  values (
    v_conversa_id,
    v_usuario_id,
    format('Olá! Solicitei a reserva do item "%s". Podemos combinar os detalhes?', left(v_anuncio.titulo, 300)),
    'solicitacao'
  );

  update public.conversas
  set atualizada_em = now()
  where id = v_conversa_id;

  return query select v_solicitacao_id, v_conversa_id;
end;
$$;

revoke all on function public.solicitar_reserva(uuid, timestamptz, integer, text) from public, anon;
grant execute on function public.solicitar_reserva(uuid, timestamptz, integer, text) to authenticated;

-- Recupera solicitacoes pendentes criadas antes da correcao. Cada uma ganha
-- conversa e aviso apenas se ainda nao estava vinculada a um chat.
do $$
declare
  v_solicitacao record;
  v_conversa_id uuid;
begin
  for v_solicitacao in
    select solicitacao.id, solicitacao.anuncio_id, solicitacao.dono_id,
      solicitacao.interessado_id, anuncio.titulo
    from public.solicitacoes_emprestimo solicitacao
    join public.anuncios anuncio on anuncio.id = solicitacao.anuncio_id
    where solicitacao.status = 'aguardando'
      and solicitacao.conversa_id is null
    order by solicitacao.criado_em
  loop
    v_conversa_id := null;
    insert into public.conversas (anuncio_id, proprietario_id, interessado_id)
    values (v_solicitacao.anuncio_id, v_solicitacao.dono_id, v_solicitacao.interessado_id)
    on conflict (anuncio_id, interessado_id) do nothing
    returning id into v_conversa_id;

    if v_conversa_id is null then
      select conversa.id into v_conversa_id
      from public.conversas conversa
      where conversa.anuncio_id = v_solicitacao.anuncio_id
        and conversa.interessado_id = v_solicitacao.interessado_id;
    end if;

    update public.solicitacoes_emprestimo
    set conversa_id = null
    where conversa_id = v_conversa_id;

    update public.solicitacoes_emprestimo
    set conversa_id = v_conversa_id
    where id = v_solicitacao.id;

    insert into public.mensagens (conversa_id, remetente_id, conteudo, tipo)
    values (
      v_conversa_id,
      v_solicitacao.interessado_id,
      format('Olá! Solicitei a reserva do item "%s". Podemos combinar os detalhes?', left(v_solicitacao.titulo, 300)),
      'solicitacao'
    );

    update public.conversas
    set atualizada_em = now()
    where id = v_conversa_id;
  end loop;
end;
$$;

notify pgrst, 'reload schema';
