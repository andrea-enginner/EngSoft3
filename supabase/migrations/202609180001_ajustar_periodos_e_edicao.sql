alter table public.anuncios drop constraint if exists anuncios_duracao_check;
alter table public.anuncios add constraint anuncios_duracao_check
  check (
    (duracao_quantidade is null and duracao_unidade is null)
    or (duracao_quantidade between 1 and 9999 and duracao_unidade in ('dias', 'semanas'))
  ) not valid;

create or replace function public.atualizar_emprestimo(
  p_id uuid,
  p_titulo text,
  p_categoria text,
  p_condicao text,
  p_descricao text,
  p_valor_unitario_centavos integer,
  p_duracao_quantidade integer,
  p_duracao_unidade text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then raise exception 'Autenticação obrigatória'; end if;
  if nullif(btrim(p_titulo), '') is null or char_length(btrim(p_titulo)) > 100 then raise exception 'Título inválido'; end if;
  if p_categoria not in ('ferramentas', 'livros', 'eletronicos', 'esporte', 'casa', 'outros') then raise exception 'Categoria inválida'; end if;
  if p_condicao not in ('novo_quase_novo', 'marcas_de_uso') then raise exception 'Condição inválida'; end if;
  if nullif(btrim(p_descricao), '') is null or char_length(btrim(p_descricao)) > 500 then raise exception 'Descrição inválida'; end if;
  if p_valor_unitario_centavos is null or p_valor_unitario_centavos <= 0 then raise exception 'Valor inválido'; end if;
  if p_duracao_quantidade is null or p_duracao_quantidade not between 1 and 9999 then raise exception 'Duração inválida'; end if;
  if p_duracao_unidade not in ('dias', 'semanas') then raise exception 'Unidade de duração inválida'; end if;

  update public.anuncios
  set titulo = btrim(p_titulo),
      categoria = p_categoria,
      condicao = p_condicao,
      descricao = btrim(p_descricao),
      valor_unitario_centavos = p_valor_unitario_centavos,
      duracao_quantidade = p_duracao_quantidade,
      duracao_unidade = p_duracao_unidade
  where id = p_id and usuario_id = auth.uid() and tipo = 'emprestimo';

  if not found then raise exception 'Anúncio indisponível ou sem permissão para edição'; end if;
end;
$$;

revoke all on function public.atualizar_emprestimo(uuid,text,text,text,text,integer,integer,text) from public, anon;
grant execute on function public.atualizar_emprestimo(uuid,text,text,text,text,integer,integer,text) to authenticated;

revoke all on function public.solicitar_reserva(uuid,timestamptz) from authenticated;
drop function if exists public.solicitar_reserva(uuid,timestamptz);

create function public.solicitar_reserva(
  p_anuncio_id uuid,
  p_inicio_em timestamptz,
  p_duracao_quantidade integer
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_usuario_id uuid := auth.uid();
  v_anuncio public.anuncios%rowtype;
  v_fator_segundos bigint;
  v_fim_em timestamptz;
  v_total bigint;
  v_id uuid;
begin
  if v_usuario_id is null then raise exception 'Autenticação obrigatória'; end if;
  if p_inicio_em is null or p_inicio_em <= now() then raise exception 'A data de início deve estar no futuro'; end if;
  if p_duracao_quantidade is null or p_duracao_quantidade not between 1 and 9999 then raise exception 'Duração inválida'; end if;

  select * into v_anuncio
  from public.anuncios
  where id = p_anuncio_id and ativo and tipo = 'emprestimo';

  if not found then raise exception 'Anúncio indisponível'; end if;
  if v_anuncio.usuario_id = v_usuario_id then raise exception 'O dono não pode reservar o próprio anúncio'; end if;
  if v_anuncio.valor_unitario_centavos is null or v_anuncio.duracao_unidade not in ('dias', 'semanas') then
    raise exception 'O anúncio não possui condições completas';
  end if;

  v_fator_segundos := case v_anuncio.duracao_unidade when 'dias' then 86400 else 604800 end;
  v_fim_em := p_inicio_em
    + (p_duracao_quantidade::bigint * v_fator_segundos)::double precision * interval '1 second';
  v_total := v_anuncio.valor_unitario_centavos::bigint * p_duracao_quantidade;

  insert into public.solicitacoes_emprestimo (
    anuncio_id, dono_id, interessado_id, inicio_em, fim_em,
    valor_unitario_centavos, duracao_quantidade, duracao_unidade, valor_total_centavos
  ) values (
    v_anuncio.id, v_anuncio.usuario_id, v_usuario_id, p_inicio_em, v_fim_em,
    v_anuncio.valor_unitario_centavos, p_duracao_quantidade,
    v_anuncio.duracao_unidade, v_total
  ) returning id into v_id;

  return v_id;
exception
  when unique_violation then
    raise exception 'Você já possui uma solicitação ativa para este anúncio';
end;
$$;

revoke all on function public.solicitar_reserva(uuid,timestamptz,integer) from public, anon;
grant execute on function public.solicitar_reserva(uuid,timestamptz,integer) to authenticated;
