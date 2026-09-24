-- Expõe no resumo da conversa a reputação de quem está do outro lado do chat.
-- Para o proprietário do item, o interlocutor é o interessado; para o
-- interessado, o interlocutor é o proprietário.

drop function if exists public.listar_conversas();
create function public.listar_conversas()
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
  usuario_e_proprietario boolean,
  interlocutor_nota numeric,
  interlocutor_total_avaliacoes bigint
)
language sql
security definer
set search_path = ''
stable
as $$
  select
    conversa.id,
    conversa.anuncio_id,
    interlocutor_ref.id,
    coalesce(nullif(btrim(interlocutor.nome), ''), 'Membro do Ciclo'),
    interlocutor.avatar_url,
    anuncio.titulo,
    anuncio.imagem_url,
    coalesce(ultima.conteudo, 'Conversa iniciada'),
    coalesce(ultima.criada_em, conversa.criada_em),
    (
      select count(*)
      from public.mensagens nao_lida
      where nao_lida.conversa_id = conversa.id
        and nao_lida.remetente_id is distinct from auth.uid()
        and nao_lida.lida_em is null
    ),
    coalesce(solicitacao.status, 'aguardando'),
    conversa.proprietario_id = auth.uid(),
    reputacao.nota,
    reputacao.total
  from public.conversas conversa
  cross join lateral (
    select case
      when conversa.proprietario_id = auth.uid()
        then conversa.interessado_id
      else conversa.proprietario_id
    end as id
  ) interlocutor_ref
  join public.anuncios anuncio on anuncio.id = conversa.anuncio_id
  left join public.perfis interlocutor on interlocutor.id = interlocutor_ref.id
  left join public.solicitacoes_emprestimo solicitacao
    on solicitacao.conversa_id = conversa.id
  left join lateral (
    select
      round(avg(avaliacao.nota)::numeric, 1) as nota,
      count(*) as total
    from public.avaliacoes avaliacao
    where avaliacao.avaliado_id = interlocutor_ref.id
  ) reputacao on true
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

revoke all on function public.listar_conversas() from public, anon;
grant execute on function public.listar_conversas() to authenticated;

notify pgrst, 'reload schema';
