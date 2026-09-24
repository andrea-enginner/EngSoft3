-- Adiciona busca por nome (título) ao feed público. A função é recriada
-- porque acrescentar parâmetro muda a assinatura (CREATE OR REPLACE não
-- permite isso quando a lista de argumentos muda).
drop function if exists public.listar_anuncios_publicos(uuid);

create function public.listar_anuncios_publicos(p_id uuid default null, p_termo text default null)
returns table (
  id uuid, tipo text, titulo text, descricao text, categoria text, condicao text,
  valor_unitario_centavos integer, duracao_quantidade integer, duracao_unidade text,
  criado_em timestamptz, usuario_id uuid, dono_nome text,
  dono_avatar text, cidade text, estado text, avaliacao numeric, imagens text[],
  impulsionado boolean, impulsionado_ate timestamptz
)
language sql
stable
security definer
set search_path = ''
as $$
  select a.id, a.tipo, a.titulo, a.descricao, a.categoria, a.condicao,
    a.valor_unitario_centavos, a.duracao_quantidade, a.duracao_unidade, a.criado_em, a.usuario_id,
    coalesce(nullif(trim(p.nome), ''), 'Membro da comunidade'), p.avatar_url, p.cidade, p.estado,
    coalesce((select round(avg(av.nota)::numeric, 1) from public.avaliacoes av where av.avaliado_id = a.usuario_id), 0),
    coalesce((select array_agg(ai.caminho order by ai.ordem) from public.anuncio_imagens ai where ai.anuncio_id = a.id),
      case when a.imagem_url is null then array[]::text[] else array[a.imagem_url] end),
    impulso.fim_em is not null,
    impulso.fim_em
  from public.anuncios a
  left join public.perfis p on p.id = a.usuario_id
  left join lateral (
    select max(i.fim_em) as fim_em
    from public.impulsionamentos_anuncio i
    where i.anuncio_id = a.id and i.fim_em > now()
  ) impulso on true
  where a.ativo and (p_id is null or a.id = p_id)
    and (p_termo is null or nullif(trim(p_termo), '') is null or a.titulo ilike '%' || trim(p_termo) || '%')
  order by (impulso.fim_em is not null) desc, impulso.fim_em desc nulls last, a.criado_em desc;
$$;

revoke all on function public.listar_anuncios_publicos(uuid, text) from public;
grant execute on function public.listar_anuncios_publicos(uuid, text) to anon, authenticated;
