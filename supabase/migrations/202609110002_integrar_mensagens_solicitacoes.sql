alter table public.solicitacoes_emprestimo
  add column if not exists conversa_id uuid
  references public.conversas (id) on delete set null;

create unique index if not exists solicitacao_da_conversa_idx
  on public.solicitacoes_emprestimo (conversa_id)
  where conversa_id is not null;

alter table public.solicitacoes_emprestimo
  drop constraint if exists solicitacoes_emprestimo_status_check;

alter table public.solicitacoes_emprestimo
  add constraint solicitacoes_emprestimo_status_check
  check (status in ('aguardando', 'aceito', 'recusado', 'negociacao', 'andamento', 'devolucao', 'concluido'));

create or replace function public.iniciar_conversa(
  p_anuncio_id uuid,
  p_conteudo text
)
returns uuid
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_usuario_id uuid := auth.uid();
  v_proprietario_id uuid;
  v_solicitacao_id uuid;
  v_conversa_id uuid;
  v_nova_conversa boolean := false;
begin
  if v_usuario_id is null then
    raise exception 'Entre na sua conta para enviar uma mensagem.';
  end if;
  if char_length(btrim(p_conteudo)) not between 1 and 500 then
    raise exception 'A mensagem deve ter entre 1 e 500 caracteres.';
  end if;

  select anuncio.usuario_id into v_proprietario_id
  from public.anuncios anuncio
  where anuncio.id = p_anuncio_id
    and anuncio.ativo
    and anuncio.tipo = 'emprestimo';

  if v_proprietario_id is null then
    raise exception 'Este anuncio nao esta disponivel para emprestimo.';
  end if;
  if v_proprietario_id = v_usuario_id then
    raise exception 'Voce nao pode solicitar o proprio item.';
  end if;

  select solicitacao.id into v_solicitacao_id
  from public.solicitacoes_emprestimo solicitacao
  where solicitacao.anuncio_id = p_anuncio_id
    and solicitacao.interessado_id = v_usuario_id
  order by solicitacao.criado_em desc
  limit 1;

  if v_solicitacao_id is null then
    raise exception 'Envie uma solicitacao de reserva antes de iniciar a conversa.';
  end if;

  insert into public.conversas (anuncio_id, proprietario_id, interessado_id)
  values (p_anuncio_id, v_proprietario_id, v_usuario_id)
  on conflict (anuncio_id, interessado_id) do nothing
  returning id into v_conversa_id;

  if v_conversa_id is not null then
    v_nova_conversa := true;
  else
    select conversa.id into v_conversa_id
    from public.conversas conversa
    where conversa.anuncio_id = p_anuncio_id
      and conversa.interessado_id = v_usuario_id;
  end if;

  update public.solicitacoes_emprestimo
  set conversa_id = v_conversa_id
  where id = v_solicitacao_id;

  insert into public.mensagens (conversa_id, remetente_id, conteudo, tipo)
  values (
    v_conversa_id,
    v_usuario_id,
    btrim(p_conteudo),
    case when v_nova_conversa then 'solicitacao' else 'texto' end
  );

  update public.conversas set atualizada_em = now() where id = v_conversa_id;
  return v_conversa_id;
end;
$$;

create or replace function public.responder_solicitacao(
  p_conversa_id uuid,
  p_aceitar boolean
)
returns text
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_usuario_id uuid := auth.uid();
  v_status text := case when p_aceitar then 'aceito' else 'recusado' end;
  v_atualizados integer;
begin
  if v_usuario_id is null then
    raise exception 'Entre na sua conta para responder.';
  end if;

  update public.solicitacoes_emprestimo
  set status = v_status
  where conversa_id = p_conversa_id
    and dono_id = v_usuario_id
    and status = 'aguardando';
  get diagnostics v_atualizados = row_count;

  if v_atualizados = 0 then
    raise exception 'Solicitacao nao encontrada ou ja respondida.';
  end if;

  insert into public.mensagens (conversa_id, remetente_id, conteudo, tipo)
  values (
    p_conversa_id,
    v_usuario_id,
    case when p_aceitar
      then 'O proprietario aceitou a solicitacao de emprestimo.'
      else 'O proprietario recusou a solicitacao de emprestimo.'
    end,
    'sistema'
  );
  update public.conversas set atualizada_em = now() where id = p_conversa_id;
  return v_status;
end;
$$;

create or replace function public.listar_conversas()
returns table (
  id uuid,
  anuncio_id uuid,
  interlocutor_id uuid,
  interlocutor_nome text,
  interlocutor_avatar text,
  titulo_item text,
  imagem_item text,
  ultima_mensagem text,
  ultima_mensagem_em timestamptz,
  nao_lidas bigint,
  status text,
  usuario_e_proprietario boolean
)
language sql
security definer
set search_path = public, extensions
stable
as $$
  select
    conversa.id,
    conversa.anuncio_id,
    case when conversa.proprietario_id = auth.uid()
      then conversa.interessado_id else conversa.proprietario_id end,
    coalesce(nullif(btrim(interlocutor.nome), ''), 'Membro do Ciclo'),
    interlocutor.avatar_url,
    anuncio.titulo,
    anuncio.imagem_url,
    coalesce(ultima.conteudo, 'Conversa iniciada'),
    coalesce(ultima.criada_em, conversa.criada_em),
    (select count(*) from public.mensagens nao_lida
      where nao_lida.conversa_id = conversa.id
        and nao_lida.remetente_id is distinct from auth.uid()
        and nao_lida.lida_em is null),
    coalesce(solicitacao.status, 'aguardando'),
    conversa.proprietario_id = auth.uid()
  from public.conversas conversa
  join public.anuncios anuncio on anuncio.id = conversa.anuncio_id
  left join public.perfis interlocutor on interlocutor.id = case
    when conversa.proprietario_id = auth.uid()
      then conversa.interessado_id else conversa.proprietario_id end
  left join public.solicitacoes_emprestimo solicitacao on solicitacao.conversa_id = conversa.id
  left join lateral (
    select mensagem.conteudo, mensagem.criada_em
    from public.mensagens mensagem
    where mensagem.conversa_id = conversa.id
    order by mensagem.criada_em desc
    limit 1
  ) ultima on true
  where auth.uid() in (conversa.proprietario_id, conversa.interessado_id)
  order by coalesce(ultima.criada_em, conversa.criada_em) desc;
$$;

drop function if exists public.listar_minhas_solicitacoes_emprestimo();
create function public.listar_minhas_solicitacoes_emprestimo()
returns table (
  id uuid, anuncio_id uuid, conversa_id uuid, papel text, titulo text, pessoa text,
  inicio_em timestamptz, fim_em timestamptz, criado_em timestamptz, status text,
  valor_unitario_centavos integer, duracao_quantidade integer,
  duracao_unidade text, valor_total_centavos bigint, imagem text
)
language sql
stable
security definer
set search_path = ''
as $$
  select s.id, s.anuncio_id, s.conversa_id,
    case when s.dono_id = auth.uid() then 'dono' else 'interessado' end,
    a.titulo,
    coalesce(nullif(trim(p.nome), ''), 'Membro da comunidade'),
    s.inicio_em, s.fim_em, s.criado_em, s.status,
    s.valor_unitario_centavos, s.duracao_quantidade,
    s.duracao_unidade, s.valor_total_centavos,
    coalesce(
      (select ai.caminho from public.anuncio_imagens ai where ai.anuncio_id = s.anuncio_id order by ai.ordem limit 1),
      a.imagem_url
    )
  from public.solicitacoes_emprestimo s
  join public.anuncios a on a.id = s.anuncio_id
  left join public.perfis p on p.id = case when s.dono_id = auth.uid() then s.interessado_id else s.dono_id end
  where auth.uid() is not null and (s.dono_id = auth.uid() or s.interessado_id = auth.uid())
  order by s.criado_em desc;
$$;

revoke all on function public.listar_minhas_solicitacoes_emprestimo() from public, anon;
grant execute on function public.listar_minhas_solicitacoes_emprestimo() to authenticated;
