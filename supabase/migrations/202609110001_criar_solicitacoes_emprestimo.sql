create table public.solicitacoes_emprestimo (
  id uuid primary key default gen_random_uuid(),
  anuncio_id uuid not null references public.anuncios (id) on delete cascade,
  dono_id uuid not null references auth.users (id) on delete cascade,
  interessado_id uuid not null references auth.users (id) on delete cascade,
  inicio_em timestamptz not null,
  fim_em timestamptz not null,
  valor_unitario_centavos integer not null check (valor_unitario_centavos > 0),
  duracao_quantidade integer not null check (duracao_quantidade > 0),
  duracao_unidade text not null check (duracao_unidade in ('minutos', 'horas', 'dias', 'semanas')),
  valor_total_centavos bigint not null check (valor_total_centavos > 0),
  status text not null default 'aguardando' check (status = 'aguardando'),
  criado_em timestamptz not null default now(),
  constraint solicitacao_periodo_valido check (fim_em > inicio_em),
  constraint solicitacao_partes_distintas check (dono_id <> interessado_id)
);

create index solicitacoes_do_dono_idx on public.solicitacoes_emprestimo (dono_id, criado_em desc);
create index solicitacoes_do_interessado_idx on public.solicitacoes_emprestimo (interessado_id, criado_em desc);
create unique index solicitacao_ativa_unica_idx
  on public.solicitacoes_emprestimo (anuncio_id, interessado_id)
  where status = 'aguardando';

alter table public.solicitacoes_emprestimo enable row level security;

create policy "partes_leem_solicitacoes" on public.solicitacoes_emprestimo
  for select to authenticated
  using (auth.uid() = dono_id or auth.uid() = interessado_id);

revoke insert, update, delete on public.solicitacoes_emprestimo from anon, authenticated;
grant select on public.solicitacoes_emprestimo to authenticated;

create function public.solicitar_reserva(p_anuncio_id uuid, p_inicio_em timestamptz)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_usuario_id uuid := auth.uid();
  v_anuncio public.anuncios%rowtype;
  v_fim_em timestamptz;
  v_fator_segundos bigint;
  v_total bigint;
  v_id uuid;
begin
  if v_usuario_id is null then raise exception 'Autenticação obrigatória'; end if;
  if p_inicio_em is null or p_inicio_em <= now() then raise exception 'O início deve estar no futuro'; end if;

  select * into v_anuncio
  from public.anuncios
  where id = p_anuncio_id and ativo and tipo = 'emprestimo';

  if not found then raise exception 'Anúncio indisponível'; end if;
  if v_anuncio.usuario_id = v_usuario_id then raise exception 'O dono não pode reservar o próprio anúncio'; end if;
  if v_anuncio.valor_unitario_centavos is null
    or v_anuncio.duracao_quantidade is null
    or v_anuncio.duracao_unidade is null then
    raise exception 'O anúncio não possui condições completas';
  end if;

  v_fator_segundos := case v_anuncio.duracao_unidade
    when 'minutos' then 60
    when 'horas' then 3600
    when 'dias' then 86400
    when 'semanas' then 604800
  end;
  v_fim_em := p_inicio_em
    + (v_anuncio.duracao_quantidade::bigint * v_fator_segundos)::double precision * interval '1 second';
  v_total := v_anuncio.valor_unitario_centavos::bigint * v_anuncio.duracao_quantidade;

  insert into public.solicitacoes_emprestimo (
    anuncio_id, dono_id, interessado_id, inicio_em, fim_em,
    valor_unitario_centavos, duracao_quantidade, duracao_unidade, valor_total_centavos
  ) values (
    v_anuncio.id, v_anuncio.usuario_id, v_usuario_id, p_inicio_em, v_fim_em,
    v_anuncio.valor_unitario_centavos, v_anuncio.duracao_quantidade,
    v_anuncio.duracao_unidade, v_total
  ) returning id into v_id;

  return v_id;
exception
  when unique_violation then
    raise exception 'Você já possui uma solicitação ativa para este anúncio';
end;
$$;

revoke all on function public.solicitar_reserva(uuid,timestamptz) from public, anon;
grant execute on function public.solicitar_reserva(uuid,timestamptz) to authenticated;

create function public.listar_minhas_solicitacoes_emprestimo()
returns table (
  id uuid, anuncio_id uuid, papel text, titulo text, pessoa text,
  inicio_em timestamptz, fim_em timestamptz, criado_em timestamptz, status text,
  valor_unitario_centavos integer, duracao_quantidade integer,
  duracao_unidade text, valor_total_centavos bigint, imagem text
)
language sql
stable
security definer
set search_path = ''
as $$
  select s.id, s.anuncio_id,
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
