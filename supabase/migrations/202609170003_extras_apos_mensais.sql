-- Pacotes extras ficam disponíveis somente depois que os cupons mensais
-- do ciclo atual forem consumidos.
create or replace function public.preparar_compra_cupons(p_quantidade smallint)
returns table (compra_id uuid, quantidade smallint, valor_centavos integer)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_usuario_id uuid := auth.uid();
  v_periodo_inicio timestamptz;
  v_cupons_mensais bigint;
  v_valor integer;
  v_compra_id uuid;
begin
  if v_usuario_id is null then
    raise exception 'Autenticação obrigatória.';
  end if;

  select assinatura.periodo_inicio
  into v_periodo_inicio
  from public.assinaturas_membro assinatura
  where assinatura.usuario_id = v_usuario_id
    and assinatura.status = 'ativa'
    and assinatura.periodo_fim > now();

  if not found then
    raise exception 'É necessária uma assinatura ativa para comprar cupons extras.';
  end if;

  select coalesce(sum(movimentacao.quantidade), 0)
  into v_cupons_mensais
  from public.movimentacoes_cupons movimentacao
  where movimentacao.usuario_id = v_usuario_id
    and movimentacao.ciclo_inicio = v_periodo_inicio;

  if v_cupons_mensais > 0 then
    raise exception 'Os pacotes extras ficam disponíveis quando os cupons mensais acabam.';
  end if;

  case p_quantidade
    when 1 then v_valor := 490;
    when 2 then v_valor := 790;
    when 5 then v_valor := 1490;
    else raise exception 'Pacote de cupons inválido.';
  end case;

  insert into public.compras_cupons (usuario_id, quantidade, valor_centavos)
  values (v_usuario_id, p_quantidade, v_valor)
  returning id into v_compra_id;

  return query select v_compra_id, p_quantidade, v_valor;
end;
$$;

revoke all on function public.preparar_compra_cupons(smallint) from public, anon;
grant execute on function public.preparar_compra_cupons(smallint) to authenticated;
