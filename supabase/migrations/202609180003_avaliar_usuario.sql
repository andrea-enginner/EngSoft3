-- Habilita o envio de avaliações: cada participante de um empréstimo
-- concluído pode avaliar o outro lado, uma única vez por empréstimo.

-- A tabela nunca recebeu uma linha real até aqui — não existia política nem
-- RPC de escrita —, então dá para exigir os dois campos novos sem backfill.
alter table public.avaliacoes
  add column autor_id uuid not null references auth.users (id) on delete cascade,
  add column solicitacao_id uuid not null references public.solicitacoes_emprestimo (id) on delete cascade;

alter table public.avaliacoes
  add constraint avaliacoes_comentario_tamanho check (char_length(comentario) <= 500);

create unique index avaliacoes_uma_por_autor_e_solicitacao_idx
  on public.avaliacoes (solicitacao_id, autor_id);

create index avaliacoes_por_solicitacao_idx
  on public.avaliacoes (solicitacao_id);

-- Nenhuma política de INSERT é criada de propósito: toda escrita passa pela
-- RPC abaixo (security definer), igual ao padrão de solicitacoes_emprestimo.
-- A policy de select pública existente (avaliacoes_select_publico) não muda.
revoke insert, update, delete on public.avaliacoes from anon, authenticated;

create function public.avaliar_usuario(
  p_solicitacao_id uuid,
  p_nota smallint,
  p_comentario text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_usuario_id uuid := auth.uid();
  v_solicitacao public.solicitacoes_emprestimo%rowtype;
  v_avaliado_id uuid;
  v_autor_nome text;
  v_autor_avatar text;
  v_id uuid;
begin
  if v_usuario_id is null then
    raise exception 'Entre na sua conta para avaliar.';
  end if;
  if p_nota is null or p_nota < 1 or p_nota > 5 then
    raise exception 'A nota deve estar entre 1 e 5.';
  end if;

  select solicitacao.*
  into v_solicitacao
  from public.solicitacoes_emprestimo solicitacao
  where solicitacao.id = p_solicitacao_id
  for update;

  if not found then
    raise exception 'Empréstimo não encontrado.';
  end if;
  if v_usuario_id not in (v_solicitacao.dono_id, v_solicitacao.interessado_id) then
    raise exception 'Você não participou deste empréstimo.';
  end if;
  if v_solicitacao.status <> 'concluido' then
    raise exception 'Só é possível avaliar depois que o empréstimo for concluído.';
  end if;

  -- dono_id <> interessado_id é garantido por constraint na tabela, então
  -- autoavaliação é estruturalmente impossível aqui.
  v_avaliado_id := case
    when v_solicitacao.dono_id = v_usuario_id then v_solicitacao.interessado_id
    else v_solicitacao.dono_id
  end;

  select coalesce(nullif(trim(perfil.nome), ''), 'Membro da comunidade'), perfil.avatar_url
  into v_autor_nome, v_autor_avatar
  from public.perfis perfil
  where perfil.id = v_usuario_id;

  insert into public.avaliacoes (
    avaliado_id, autor_id, solicitacao_id, autor_nome, autor_avatar_url, nota, comentario
  ) values (
    v_avaliado_id, v_usuario_id, v_solicitacao.id,
    coalesce(v_autor_nome, 'Membro da comunidade'), v_autor_avatar,
    p_nota, coalesce(trim(p_comentario), '')
  )
  returning id into v_id;

  return v_id;
exception
  when unique_violation then
    raise exception 'Você já avaliou esta pessoa neste empréstimo.';
end;
$$;

revoke all on function public.avaliar_usuario(uuid, smallint, text) from public, anon;
grant execute on function public.avaliar_usuario(uuid, smallint, text) to authenticated;
