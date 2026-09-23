-- Anexos privados do chat. O caminho do arquivo começa pelo id da conversa e
-- pelo id de quem enviou, permitindo que as políticas do Storage confirmem
-- tanto a participação na conversa quanto a propriedade do upload.

alter table public.mensagens
  add column if not exists arquivo_nome text,
  add column if not exists arquivo_caminho text,
  add column if not exists arquivo_tipo text,
  add column if not exists arquivo_tamanho bigint;

alter table public.mensagens
  drop constraint if exists mensagens_tipo_check;
alter table public.mensagens
  add constraint mensagens_tipo_check
  check (tipo in ('texto', 'solicitacao', 'sistema', 'arquivo'));

alter table public.mensagens
  drop constraint if exists mensagens_arquivo_valido;
alter table public.mensagens
  add constraint mensagens_arquivo_valido check (
    (
      tipo = 'arquivo'
      and arquivo_nome is not null
      and char_length(arquivo_nome) between 1 and 180
      and arquivo_caminho is not null
      and char_length(arquivo_caminho) between 1 and 1024
      and arquivo_tipo is not null
      and arquivo_tamanho between 1 and 20971520
    )
    or (
      tipo <> 'arquivo'
      and arquivo_nome is null
      and arquivo_caminho is null
      and arquivo_tipo is null
      and arquivo_tamanho is null
    )
  );

create unique index if not exists mensagens_arquivo_caminho_idx
  on public.mensagens (arquivo_caminho)
  where arquivo_caminho is not null;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'anexos-chat',
  'anexos-chat',
  false,
  20971520,
  array[
    'image/jpeg',
    'image/png',
    'image/webp',
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]::text[]
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "anexos_chat_insert_participante" on storage.objects;
create policy "anexos_chat_insert_participante" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'anexos-chat'
    and (storage.foldername(name))[2] = auth.uid()::text
    and exists (
      select 1
      from public.conversas conversa
      where conversa.id::text = (storage.foldername(name))[1]
        and auth.uid() in (conversa.proprietario_id, conversa.interessado_id)
    )
  );

drop policy if exists "anexos_chat_select_participante" on storage.objects;
create policy "anexos_chat_select_participante" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'anexos-chat'
    and exists (
      select 1
      from public.conversas conversa
      where conversa.id::text = (storage.foldername(name))[1]
        and auth.uid() in (conversa.proprietario_id, conversa.interessado_id)
    )
  );

drop policy if exists "anexos_chat_delete_remetente" on storage.objects;
create policy "anexos_chat_delete_remetente" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'anexos-chat'
    and (storage.foldername(name))[2] = auth.uid()::text
    and exists (
      select 1
      from public.conversas conversa
      where conversa.id::text = (storage.foldername(name))[1]
        and auth.uid() in (conversa.proprietario_id, conversa.interessado_id)
    )
  );

create or replace function public.enviar_anexo(
  p_conversa_id uuid,
  p_conteudo text,
  p_arquivo_nome text,
  p_arquivo_caminho text,
  p_arquivo_tipo text,
  p_arquivo_tamanho bigint
)
returns table (
  id uuid,
  conversa_id uuid,
  remetente_id uuid,
  conteudo text,
  tipo text,
  criada_em timestamptz,
  lida_em timestamptz,
  arquivo_nome text,
  arquivo_caminho text,
  arquivo_tipo text,
  arquivo_tamanho bigint
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_usuario_id uuid := auth.uid();
begin
  if v_usuario_id is null then
    raise exception 'Entre na sua conta para enviar um arquivo.';
  end if;
  if not exists (
    select 1
    from public.conversas conversa
    where conversa.id = p_conversa_id
      and v_usuario_id in (conversa.proprietario_id, conversa.interessado_id)
  ) then
    raise exception 'Conversa nao encontrada.';
  end if;
  if char_length(btrim(p_conteudo)) not between 1 and 500 then
    raise exception 'A legenda deve ter entre 1 e 500 caracteres.';
  end if;
  if char_length(btrim(p_arquivo_nome)) not between 1 and 180 then
    raise exception 'Nome de arquivo invalido.';
  end if;
  if p_arquivo_tamanho not between 1 and 20971520 then
    raise exception 'Tamanho de arquivo invalido.';
  end if;
  if p_arquivo_tipo not in (
    'image/jpeg',
    'image/png',
    'image/webp',
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ) then
    raise exception 'Formato de arquivo nao permitido.';
  end if;
  if p_arquivo_caminho not like
    p_conversa_id::text || '/' || v_usuario_id::text || '/%'
  then
    raise exception 'Caminho de arquivo invalido.';
  end if;
  if not exists (
    select 1
    from storage.objects objeto
    where objeto.bucket_id = 'anexos-chat'
      and objeto.name = p_arquivo_caminho
      and objeto.owner_id = v_usuario_id::text
  ) then
    raise exception 'Arquivo nao encontrado ou sem propriedade.';
  end if;

  update public.conversas
  set atualizada_em = now()
  where conversas.id = p_conversa_id;

  return query
  insert into public.mensagens (
    conversa_id,
    remetente_id,
    conteudo,
    tipo,
    arquivo_nome,
    arquivo_caminho,
    arquivo_tipo,
    arquivo_tamanho
  ) values (
    p_conversa_id,
    v_usuario_id,
    btrim(p_conteudo),
    'arquivo',
    btrim(p_arquivo_nome),
    p_arquivo_caminho,
    p_arquivo_tipo,
    p_arquivo_tamanho
  )
  returning mensagens.id, mensagens.conversa_id, mensagens.remetente_id,
    mensagens.conteudo, mensagens.tipo, mensagens.criada_em,
    mensagens.lida_em, mensagens.arquivo_nome, mensagens.arquivo_caminho,
    mensagens.arquivo_tipo, mensagens.arquivo_tamanho;
end;
$$;

drop function if exists public.listar_mensagens(uuid);
create function public.listar_mensagens(p_conversa_id uuid)
returns table (
  id uuid,
  conversa_id uuid,
  remetente_id uuid,
  conteudo text,
  tipo text,
  criada_em timestamptz,
  lida_em timestamptz,
  arquivo_nome text,
  arquivo_caminho text,
  arquivo_tipo text,
  arquivo_tamanho bigint
)
language sql
security definer
set search_path = ''
stable
as $$
  select mensagem.id, mensagem.conversa_id, mensagem.remetente_id,
    mensagem.conteudo, mensagem.tipo, mensagem.criada_em, mensagem.lida_em,
    mensagem.arquivo_nome, mensagem.arquivo_caminho, mensagem.arquivo_tipo,
    mensagem.arquivo_tamanho
  from public.mensagens mensagem
  where mensagem.conversa_id = p_conversa_id
    and exists (
      select 1
      from public.conversas conversa
      where conversa.id = p_conversa_id
        and auth.uid() in (conversa.proprietario_id, conversa.interessado_id)
    )
  order by mensagem.criada_em;
$$;

revoke all on function public.enviar_anexo(uuid,text,text,text,text,bigint)
  from public, anon;
grant execute on function public.enviar_anexo(uuid,text,text,text,text,bigint)
  to authenticated;
revoke all on function public.listar_mensagens(uuid) from public, anon;
grant execute on function public.listar_mensagens(uuid) to authenticated;

notify pgrst, 'reload schema';
