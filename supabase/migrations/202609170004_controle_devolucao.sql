-- Controle do ciclo de devolução: o solicitante informa que devolveu o item
-- e o proprietário encerra o empréstimo ao confirmar o recebimento.
alter table public.solicitacoes_emprestimo
  add column if not exists devolucao_solicitada_em timestamptz,
  add column if not exists recebido_em timestamptz;

create index if not exists solicitacoes_emprestimo_prazo_idx
  on public.solicitacoes_emprestimo (fim_em)
  where status in ('aceito', 'andamento', 'devolucao');

-- Um pagamento aprovado coloca a solicitação no acompanhamento do empréstimo.
create or replace function public.ativar_emprestimo_apos_pagamento()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.solicitacoes_emprestimo
  set status = 'andamento'
  where id = new.solicitacao_id
    and status = 'aceito';

  return new;
end;
$$;

revoke all on function public.ativar_emprestimo_apos_pagamento() from public, anon, authenticated;

drop trigger if exists pagamento_aprovado_inicia_emprestimo
  on public.pagamentos_emprestimo;
create trigger pagamento_aprovado_inicia_emprestimo
  after insert or update of status on public.pagamentos_emprestimo
  for each row
  when (new.status = 'aprovado')
  execute function public.ativar_emprestimo_apos_pagamento();

-- Compatibilidade com pagamentos que já estavam aprovados antes da migration.
update public.solicitacoes_emprestimo solicitacao
set status = 'andamento'
from public.pagamentos_emprestimo pagamento
where pagamento.solicitacao_id = solicitacao.id
  and pagamento.status = 'aprovado'
  and solicitacao.status = 'aceito';

create or replace function public.registrar_devolucao_emprestimo(
  p_solicitacao_id uuid
)
returns timestamptz
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_usuario_id uuid := auth.uid();
  v_solicitacao public.solicitacoes_emprestimo%rowtype;
  v_momento timestamptz := now();
begin
  if v_usuario_id is null then
    raise exception 'Entre na sua conta para informar a devolução.';
  end if;

  select solicitacao.*
  into v_solicitacao
  from public.solicitacoes_emprestimo solicitacao
  where solicitacao.id = p_solicitacao_id
  for update;

  if not found then
    raise exception 'Empréstimo não encontrado.';
  end if;
  if v_solicitacao.interessado_id <> v_usuario_id then
    raise exception 'Somente quem pegou o item pode informar a devolução.';
  end if;
  if v_solicitacao.status not in ('aceito', 'andamento') then
    raise exception 'Este empréstimo não está disponível para devolução.';
  end if;
  if v_momento < v_solicitacao.inicio_em then
    raise exception 'A devolução poderá ser informada após o início do empréstimo.';
  end if;
  if not exists (
    select 1
    from public.pagamentos_emprestimo pagamento
    where pagamento.solicitacao_id = v_solicitacao.id
      and pagamento.status = 'aprovado'
  ) then
    raise exception 'É necessário ter um pagamento aprovado antes da devolução.';
  end if;

  update public.solicitacoes_emprestimo
  set status = 'devolucao',
      devolucao_solicitada_em = v_momento
  where id = v_solicitacao.id;

  if v_solicitacao.conversa_id is not null then
    insert into public.mensagens (conversa_id, remetente_id, conteudo, tipo)
    values (
      v_solicitacao.conversa_id,
      v_usuario_id,
      'O solicitante informou que devolveu o item. Aguardando a confirmação do proprietário.',
      'sistema'
    );

    update public.conversas
    set atualizada_em = v_momento
    where id = v_solicitacao.conversa_id;
  end if;

  return v_momento;
end;
$$;

revoke all on function public.registrar_devolucao_emprestimo(uuid) from public, anon;
grant execute on function public.registrar_devolucao_emprestimo(uuid) to authenticated;

create or replace function public.confirmar_recebimento_emprestimo(
  p_solicitacao_id uuid
)
returns timestamptz
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_usuario_id uuid := auth.uid();
  v_solicitacao public.solicitacoes_emprestimo%rowtype;
  v_momento timestamptz := now();
begin
  if v_usuario_id is null then
    raise exception 'Entre na sua conta para confirmar o recebimento.';
  end if;

  select solicitacao.*
  into v_solicitacao
  from public.solicitacoes_emprestimo solicitacao
  where solicitacao.id = p_solicitacao_id
  for update;

  if not found then
    raise exception 'Empréstimo não encontrado.';
  end if;
  if v_solicitacao.dono_id <> v_usuario_id then
    raise exception 'Somente o proprietário pode confirmar o recebimento do item.';
  end if;
  if v_solicitacao.status <> 'devolucao' then
    raise exception 'A confirmação fica disponível depois que o solicitante informar a devolução.';
  end if;

  update public.solicitacoes_emprestimo
  set status = 'concluido',
      recebido_em = v_momento
  where id = v_solicitacao.id;

  if v_solicitacao.conversa_id is not null then
    insert into public.mensagens (conversa_id, remetente_id, conteudo, tipo)
    values (
      v_solicitacao.conversa_id,
      v_usuario_id,
      'O proprietário confirmou o recebimento do item. Empréstimo concluído.',
      'sistema'
    );

    update public.conversas
    set atualizada_em = v_momento
    where id = v_solicitacao.conversa_id;
  end if;

  return v_momento;
end;
$$;

revoke all on function public.confirmar_recebimento_emprestimo(uuid) from public, anon;
grant execute on function public.confirmar_recebimento_emprestimo(uuid) to authenticated;

-- O formato de retorno mudou; por isso a função precisa ser removida antes de
-- ser recriada, em vez de usar create or replace.
drop function if exists public.listar_minhas_solicitacoes_emprestimo();
create function public.listar_minhas_solicitacoes_emprestimo()
returns table (
  id uuid, anuncio_id uuid, conversa_id uuid, papel text, titulo text, pessoa text,
  inicio_em timestamptz, fim_em timestamptz, criado_em timestamptz,
  devolucao_solicitada_em timestamptz, recebido_em timestamptz, status text,
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
    solicitacao.inicio_em, solicitacao.fim_em, solicitacao.criado_em,
    solicitacao.devolucao_solicitada_em, solicitacao.recebido_em,
    solicitacao.status,
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
    and auth.uid() in (solicitacao.dono_id, solicitacao.interessado_id)
  order by solicitacao.criado_em desc;
$$;

revoke all on function public.listar_minhas_solicitacoes_emprestimo() from public, anon;
grant execute on function public.listar_minhas_solicitacoes_emprestimo() to authenticated;
