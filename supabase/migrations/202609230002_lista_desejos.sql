create table if not exists public.lista_desejos (
  usuario_id uuid not null references auth.users (id) on delete cascade,
  anuncio_id uuid not null references public.anuncios (id) on delete cascade,
  criado_em timestamptz not null default now(),
  primary key (usuario_id, anuncio_id)
);

create index if not exists lista_desejos_usuario_criado_idx
  on public.lista_desejos (usuario_id, criado_em desc);

alter table public.lista_desejos enable row level security;

drop policy if exists "lista_desejos_select_propria" on public.lista_desejos;
create policy "lista_desejos_select_propria" on public.lista_desejos
  for select to authenticated
  using (auth.uid() = usuario_id);

revoke all on public.lista_desejos from anon, authenticated;
grant select on public.lista_desejos to authenticated;

drop function if exists public.alternar_lista_desejos(uuid);
create function public.alternar_lista_desejos(p_anuncio_id uuid)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_usuario_id uuid := auth.uid();
begin
  if v_usuario_id is null then
    raise exception 'Usuário não autenticado';
  end if;

  if not exists (
    select 1
    from public.anuncios a
    where a.id = p_anuncio_id and a.ativo
  ) then
    raise exception 'Anúncio não encontrado ou inativo';
  end if;

  delete from public.lista_desejos
  where usuario_id = v_usuario_id and anuncio_id = p_anuncio_id;

  if found then
    return false;
  end if;

  insert into public.lista_desejos (usuario_id, anuncio_id)
  values (v_usuario_id, p_anuncio_id);

  return true;
end;
$$;

revoke all on function public.alternar_lista_desejos(uuid) from public, anon;
grant execute on function public.alternar_lista_desejos(uuid) to authenticated;
