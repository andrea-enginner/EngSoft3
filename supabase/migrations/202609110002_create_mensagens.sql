-- Conversas em tempo real ligadas a uma solicitacao de emprestimo.
-- A migration preserva os registros antigos de emprestimos e adiciona os
-- relacionamentos necessarios para o novo fluxo.

create table if not exists public.conversas (
  id uuid primary key default gen_random_uuid(),
  anuncio_id uuid not null references public.anuncios (id) on delete cascade,
  proprietario_id uuid not null references auth.users (id) on delete cascade,
  interessado_id uuid not null references auth.users (id) on delete cascade,
  criada_em timestamptz not null default now(),
  atualizada_em timestamptz not null default now(),
  constraint conversa_participantes_diferentes check (proprietario_id <> interessado_id),
  constraint conversa_unica_por_interessado unique (anuncio_id, interessado_id)
);

create table if not exists public.mensagens (
  id uuid primary key default gen_random_uuid(),
  conversa_id uuid not null references public.conversas (id) on delete cascade,
  remetente_id uuid references auth.users (id) on delete set null,
  conteudo text not null,
  tipo text not null default 'texto'
    check (tipo in ('texto', 'solicitacao', 'sistema')),
  criada_em timestamptz not null default now(),
  lida_em timestamptz,
  constraint mensagem_conteudo_valido
    check (char_length(btrim(conteudo)) between 1 and 500)
);

create index if not exists conversas_do_proprietario_idx
  on public.conversas (proprietario_id, atualizada_em desc);
create index if not exists conversas_do_interessado_idx
  on public.conversas (interessado_id, atualizada_em desc);
create index if not exists mensagens_da_conversa_idx
  on public.mensagens (conversa_id, criada_em);

alter table public.emprestimos
  add column if not exists conversa_id uuid references public.conversas (id) on delete set null,
  add column if not exists anuncio_id uuid references public.anuncios (id) on delete set null,
  add column if not exists proprietario_id uuid references auth.users (id) on delete cascade,
  add column if not exists solicitante_id uuid references auth.users (id) on delete cascade,
  add column if not exists solicitado_em timestamptz not null default now(),
  add column if not exists respondido_em timestamptz;

alter table public.emprestimos alter column nome drop not null;
alter table public.emprestimos alter column pessoa drop not null;
alter table public.emprestimos alter column data drop not null;
alter table public.emprestimos drop constraint if exists emprestimos_status_check;
alter table public.emprestimos
  add constraint emprestimos_status_check
  check (status in ('aguardando', 'aceito', 'recusado', 'negociacao', 'andamento', 'devolucao', 'concluido'));

create unique index if not exists emprestimo_da_conversa_idx
  on public.emprestimos (conversa_id)
  where conversa_id is not null;
create index if not exists emprestimos_do_proprietario_idx
  on public.emprestimos (proprietario_id, solicitado_em desc);
create index if not exists emprestimos_do_solicitante_idx
  on public.emprestimos (solicitante_id, solicitado_em desc);

alter table public.conversas enable row level security;
alter table public.mensagens enable row level security;

drop policy if exists "conversas_select_participantes" on public.conversas;
create policy "conversas_select_participantes" on public.conversas
  for select to authenticated
  using ((select auth.uid()) in (proprietario_id, interessado_id));

drop policy if exists "mensagens_select_participantes" on public.mensagens;
create policy "mensagens_select_participantes" on public.mensagens
  for select to authenticated
  using (
    exists (
      select 1
      from public.conversas conversa
      where conversa.id = mensagens.conversa_id
        and (select auth.uid()) in (conversa.proprietario_id, conversa.interessado_id)
    )
  );

drop policy if exists "emprestimos_select_publico" on public.emprestimos;
drop policy if exists "emprestimos_select_participantes" on public.emprestimos;
create policy "emprestimos_select_participantes" on public.emprestimos
  for select to authenticated
  using ((select auth.uid()) in (proprietario_id, solicitante_id));

revoke all on table public.conversas from anon;
revoke all on table public.mensagens from anon;
revoke all on table public.emprestimos from anon;
revoke insert, update, delete on table public.conversas from authenticated;
revoke insert, update, delete on table public.mensagens from authenticated;
revoke insert, update, delete on table public.emprestimos from authenticated;
grant select on table public.conversas, public.mensagens, public.emprestimos to authenticated;

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
  v_titulo text;
  v_imagem text;
  v_nome_interessado text;
  v_conversa_id uuid;
  v_nova_conversa boolean := false;
begin
  if v_usuario_id is null then
    raise exception 'Entre na sua conta para enviar uma mensagem.';
  end if;

  if char_length(btrim(p_conteudo)) not between 1 and 500 then
    raise exception 'A mensagem deve ter entre 1 e 500 caracteres.';
  end if;

  select anuncio.usuario_id, anuncio.titulo, anuncio.imagem_url
    into v_proprietario_id, v_titulo, v_imagem
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

  insert into public.conversas (anuncio_id, proprietario_id, interessado_id)
  values (p_anuncio_id, v_proprietario_id, v_usuario_id)
  on conflict (anuncio_id, interessado_id) do nothing
  returning id into v_conversa_id;

  if v_conversa_id is not null then
    v_nova_conversa := true;

    select coalesce(nullif(btrim(perfil.nome), ''), 'Pessoa interessada')
      into v_nome_interessado
    from public.perfis perfil
    where perfil.id = v_usuario_id;

    insert into public.emprestimos (
      id, conversa_id, anuncio_id, proprietario_id, solicitante_id,
      nome, pessoa, data, status, emoji, cor
    ) values (
      gen_random_uuid()::text, v_conversa_id, p_anuncio_id,
      v_proprietario_id, v_usuario_id, v_titulo,
      coalesce(v_nome_interessado, 'Pessoa interessada'),
      'Solicitado agora', 'aguardando', '📚',
      'from-violet-100 to-purple-200'
    );
  else
    select conversa.id into v_conversa_id
    from public.conversas conversa
    where conversa.anuncio_id = p_anuncio_id
      and conversa.interessado_id = v_usuario_id;
  end if;

  insert into public.mensagens (conversa_id, remetente_id, conteudo, tipo)
  values (
    v_conversa_id,
    v_usuario_id,
    btrim(p_conteudo),
    case when v_nova_conversa then 'solicitacao' else 'texto' end
  );

  update public.conversas
  set atualizada_em = now()
  where id = v_conversa_id;

  return v_conversa_id;
end;
$$;

create or replace function public.enviar_mensagem(
  p_conversa_id uuid,
  p_conteudo text
)
returns table (
  id uuid,
  conversa_id uuid,
  remetente_id uuid,
  conteudo text,
  tipo text,
  criada_em timestamptz,
  lida_em timestamptz
)
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_usuario_id uuid := auth.uid();
begin
  if v_usuario_id is null then
    raise exception 'Entre na sua conta para enviar uma mensagem.';
  end if;
  if char_length(btrim(p_conteudo)) not between 1 and 500 then
    raise exception 'A mensagem deve ter entre 1 e 500 caracteres.';
  end if;
  if not exists (
    select 1 from public.conversas conversa
    where conversa.id = p_conversa_id
      and v_usuario_id in (conversa.proprietario_id, conversa.interessado_id)
  ) then
    raise exception 'Conversa nao encontrada.';
  end if;

  update public.conversas set atualizada_em = now() where conversas.id = p_conversa_id;

  return query
  insert into public.mensagens (conversa_id, remetente_id, conteudo)
  values (p_conversa_id, v_usuario_id, btrim(p_conteudo))
  returning mensagens.id, mensagens.conversa_id, mensagens.remetente_id,
    mensagens.conteudo, mensagens.tipo, mensagens.criada_em, mensagens.lida_em;
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

  update public.emprestimos
  set status = v_status, respondido_em = now()
  where conversa_id = p_conversa_id
    and proprietario_id = v_usuario_id
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

create or replace function public.marcar_mensagens_lidas(p_conversa_id uuid)
returns void
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_usuario_id uuid := auth.uid();
begin
  if not exists (
    select 1 from public.conversas conversa
    where conversa.id = p_conversa_id
      and v_usuario_id in (conversa.proprietario_id, conversa.interessado_id)
  ) then
    raise exception 'Conversa nao encontrada.';
  end if;

  update public.mensagens
  set lida_em = now()
  where conversa_id = p_conversa_id
    and remetente_id is distinct from v_usuario_id
    and lida_em is null;
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
    (
      select count(*)
      from public.mensagens nao_lida
      where nao_lida.conversa_id = conversa.id
        and nao_lida.remetente_id is distinct from auth.uid()
        and nao_lida.lida_em is null
    ),
    coalesce(emprestimo.status, 'aguardando'),
    conversa.proprietario_id = auth.uid()
  from public.conversas conversa
  join public.anuncios anuncio on anuncio.id = conversa.anuncio_id
  left join public.perfis interlocutor on interlocutor.id = case
    when conversa.proprietario_id = auth.uid()
      then conversa.interessado_id else conversa.proprietario_id end
  left join public.emprestimos emprestimo on emprestimo.conversa_id = conversa.id
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

create or replace function public.listar_mensagens(p_conversa_id uuid)
returns table (
  id uuid,
  conversa_id uuid,
  remetente_id uuid,
  conteudo text,
  tipo text,
  criada_em timestamptz,
  lida_em timestamptz
)
language sql
security definer
set search_path = public, extensions
stable
as $$
  select mensagem.id, mensagem.conversa_id, mensagem.remetente_id,
    mensagem.conteudo, mensagem.tipo, mensagem.criada_em, mensagem.lida_em
  from public.mensagens mensagem
  where mensagem.conversa_id = p_conversa_id
    and exists (
      select 1 from public.conversas conversa
      where conversa.id = p_conversa_id
        and auth.uid() in (conversa.proprietario_id, conversa.interessado_id)
    )
  order by mensagem.criada_em;
$$;

create or replace function public.listar_emprestimos()
returns table (
  id text,
  conversa_id uuid,
  nome text,
  pessoa text,
  data text,
  status text,
  emoji text,
  cor text,
  papel text
)
language sql
security definer
set search_path = public, extensions
stable
as $$
  select emprestimo.id, emprestimo.conversa_id, emprestimo.nome,
    emprestimo.pessoa, emprestimo.data, emprestimo.status,
    emprestimo.emoji, emprestimo.cor,
    case when emprestimo.proprietario_id = auth.uid()
      then 'proprietario' else 'solicitante' end
  from public.emprestimos emprestimo
  where auth.uid() in (emprestimo.proprietario_id, emprestimo.solicitante_id)
  order by emprestimo.solicitado_em desc;
$$;

revoke all on function public.iniciar_conversa(uuid, text) from public, anon;
revoke all on function public.enviar_mensagem(uuid, text) from public, anon;
revoke all on function public.responder_solicitacao(uuid, boolean) from public, anon;
revoke all on function public.marcar_mensagens_lidas(uuid) from public, anon;
revoke all on function public.listar_conversas() from public, anon;
revoke all on function public.listar_mensagens(uuid) from public, anon;
revoke all on function public.listar_emprestimos() from public, anon;
grant execute on function public.iniciar_conversa(uuid, text) to authenticated;
grant execute on function public.enviar_mensagem(uuid, text) to authenticated;
grant execute on function public.responder_solicitacao(uuid, boolean) to authenticated;
grant execute on function public.marcar_mensagens_lidas(uuid) to authenticated;
grant execute on function public.listar_conversas() to authenticated;
grant execute on function public.listar_mensagens(uuid) to authenticated;
grant execute on function public.listar_emprestimos() to authenticated;

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'mensagens'
  ) then
    alter publication supabase_realtime add table public.mensagens;
  end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'emprestimos'
  ) then
    alter publication supabase_realtime add table public.emprestimos;
  end if;
end;
$$;
