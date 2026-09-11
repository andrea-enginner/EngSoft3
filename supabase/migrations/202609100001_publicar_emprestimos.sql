alter table public.anuncios
  add column if not exists categoria text,
  add column if not exists condicao text,
  add column if not exists valor_centavos integer,
  add column if not exists duracao_quantidade integer,
  add column if not exists duracao_unidade text;

alter table public.anuncios drop constraint if exists anuncios_condicao_check;
alter table public.anuncios add constraint anuncios_condicao_check
  check (condicao is null or condicao in ('novo_quase_novo', 'marcas_de_uso'));
alter table public.anuncios drop constraint if exists anuncios_valor_centavos_check;
alter table public.anuncios add constraint anuncios_valor_centavos_check
  check (valor_centavos is null or valor_centavos > 0);
alter table public.anuncios drop constraint if exists anuncios_duracao_check;
alter table public.anuncios add constraint anuncios_duracao_check
  check (
    (duracao_quantidade is null and duracao_unidade is null)
    or (duracao_quantidade > 0 and duracao_unidade in ('minutos', 'horas', 'dias', 'semanas'))
  );

-- Toda escrita passa por funções validadas. Edição e exclusão futuras devem
-- ganhar RPCs próprias para manter banco e Storage consistentes.
drop policy if exists "anuncios_escrita_do_dono" on public.anuncios;
drop policy if exists "anuncios_delete_dono" on public.anuncios;
revoke insert, update, delete on public.anuncios from anon, authenticated;
grant select on public.anuncios to anon, authenticated;

create table if not exists public.anuncio_imagens (
  anuncio_id uuid not null references public.anuncios (id) on delete cascade,
  caminho text not null,
  ordem smallint not null check (ordem between 0 and 3),
  primary key (anuncio_id, ordem),
  unique (caminho)
);

alter table public.anuncio_imagens enable row level security;

drop policy if exists "anuncio_imagens_select_ativas" on public.anuncio_imagens;
create policy "anuncio_imagens_select_ativas" on public.anuncio_imagens
  for select to anon, authenticated
  using (exists (
    select 1 from public.anuncios a
    where a.id = anuncio_id and (a.ativo or a.usuario_id = auth.uid())
  ));

drop policy if exists "anuncio_imagens_insert_dono" on public.anuncio_imagens;
revoke insert, update, delete on public.anuncio_imagens from anon, authenticated;
grant select on public.anuncio_imagens to anon, authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'anuncios', 'anuncios', true, 5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "anuncios_storage_insert_dono" on storage.objects;
create policy "anuncios_storage_insert_dono" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'anuncios' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "anuncios_storage_delete_dono" on storage.objects;
create policy "anuncios_storage_delete_dono" on storage.objects
  for delete to authenticated
  using (bucket_id = 'anuncios' and (storage.foldername(name))[1] = auth.uid()::text);

drop function if exists public.publicar_emprestimo(uuid,text,text,text,text,integer,text[]);
drop function if exists public.publicar_emprestimo(uuid,text,text,text,text,integer,integer,text,text[]);
create function public.publicar_emprestimo(
  p_id uuid,
  p_titulo text,
  p_categoria text,
  p_condicao text,
  p_descricao text,
  p_valor_centavos integer,
  p_duracao_quantidade integer,
  p_duracao_unidade text,
  p_imagens text[]
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_usuario_id uuid := auth.uid();
  v_caminho text;
  v_ordem integer;
begin
  if v_usuario_id is null then raise exception 'Usuário não autenticado'; end if;
  if p_titulo is null or length(trim(p_titulo)) not between 1 and 100 then raise exception 'Título inválido'; end if;
  if p_categoria is null or p_categoria not in ('ferramentas','livros','eletronicos','esporte','casa','outros') then raise exception 'Categoria inválida'; end if;
  if p_condicao is null or p_condicao not in ('novo_quase_novo','marcas_de_uso') then raise exception 'Condição inválida'; end if;
  if p_descricao is null or length(trim(p_descricao)) not between 1 and 500 then raise exception 'Descrição inválida'; end if;
  if p_valor_centavos is null or p_valor_centavos <= 0 then raise exception 'Valor inválido'; end if;
  if p_duracao_quantidade is null or p_duracao_quantidade <= 0 then raise exception 'Duração inválida'; end if;
  if p_duracao_unidade is null or p_duracao_unidade not in ('minutos','horas','dias','semanas') then raise exception 'Unidade de duração inválida'; end if;
  if coalesce(array_length(p_imagens, 1), 0) not between 1 and 4 then raise exception 'Quantidade de imagens inválida'; end if;

  foreach v_caminho in array p_imagens loop
    if v_caminho not like v_usuario_id::text || '/' || p_id::text || '/%' then
      raise exception 'Caminho de imagem inválido';
    end if;
    if not exists (
      select 1 from storage.objects o
      where o.bucket_id = 'anuncios'
        and o.name = v_caminho
        and o.owner_id = v_usuario_id::text
    ) then
      raise exception 'Imagem não encontrada ou sem propriedade';
    end if;
  end loop;

  insert into public.anuncios (id, usuario_id, tipo, titulo, categoria, condicao, descricao, valor_centavos, duracao_quantidade, duracao_unidade, imagem_url)
  values (p_id, v_usuario_id, 'emprestimo', trim(p_titulo), p_categoria, p_condicao, trim(p_descricao), p_valor_centavos, p_duracao_quantidade, p_duracao_unidade, p_imagens[1]);

  for v_ordem in 1..array_length(p_imagens, 1) loop
    insert into public.anuncio_imagens (anuncio_id, caminho, ordem)
    values (p_id, p_imagens[v_ordem], v_ordem - 1);
  end loop;
  return p_id;
end;
$$;

revoke all on function public.publicar_emprestimo(uuid,text,text,text,text,integer,integer,text,text[]) from public, anon;
grant execute on function public.publicar_emprestimo(uuid,text,text,text,text,integer,integer,text,text[]) to authenticated;

drop function if exists public.listar_anuncios_publicos(uuid);
create function public.listar_anuncios_publicos(p_id uuid default null)
returns table (
  id uuid, tipo text, titulo text, descricao text, categoria text, condicao text,
  valor_centavos integer, duracao_quantidade integer, duracao_unidade text,
  criado_em timestamptz, usuario_id uuid, dono_nome text,
  dono_avatar text, cidade text, estado text, avaliacao numeric, imagens text[]
)
language sql
stable
security definer
set search_path = ''
as $$
  select a.id, a.tipo, a.titulo, a.descricao, a.categoria, a.condicao,
    a.valor_centavos, a.duracao_quantidade, a.duracao_unidade, a.criado_em, a.usuario_id,
    coalesce(nullif(trim(p.nome), ''), 'Membro da comunidade'), p.avatar_url, p.cidade, p.estado,
    coalesce((select round(avg(av.nota)::numeric, 1) from public.avaliacoes av where av.avaliado_id = a.usuario_id), 0),
    coalesce((select array_agg(ai.caminho order by ai.ordem) from public.anuncio_imagens ai where ai.anuncio_id = a.id),
      case when a.imagem_url is null then array[]::text[] else array[a.imagem_url] end)
  from public.anuncios a
  left join public.perfis p on p.id = a.usuario_id
  where a.ativo and (p_id is null or a.id = p_id)
  order by a.criado_em desc;
$$;

revoke all on function public.listar_anuncios_publicos(uuid) from public;
grant execute on function public.listar_anuncios_publicos(uuid) to anon, authenticated;
