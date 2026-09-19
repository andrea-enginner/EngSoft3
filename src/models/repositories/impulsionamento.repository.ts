import {
  credenciaisSupabase,
  executarRpc,
  executarRpcSupabase,
  urlPublicaStorage,
} from "@/lib/supabase/rest";
import type {
  DetalhesImpulsionamento,
  PlanoMembroId,
  ResultadoUsoCupom,
  StatusAssinatura,
} from "@/models/entities/impulsionamento";
import type { SessaoUsuario } from "@/models/entities/usuario";

type RegistroDetalhes = {
  anuncio_id: string;
  titulo: string;
  descricao: string;
  categoria: string | null;
  condicao: string | null;
  valor_unitario_centavos: number | null;
  duracao_quantidade: number | null;
  duracao_unidade: string | null;
  criado_em: string;
  ativo: boolean;
  imagem: string | null;
  cidade: string | null;
  estado: string | null;
  assinatura_plano: PlanoMembroId | null;
  assinatura_status: StatusAssinatura | null;
  cupons_disponiveis: number | null;
  cupons_mensais: number | null;
  cupons_extras: number | null;
  cupons_por_ciclo: number | null;
  periodo_fim: string | null;
  cancelar_ao_fim: boolean | null;
  impulsionado_ate: string | null;
};

type RegistroUsoCupom = {
  impulsionado_ate: string;
  cupons_disponiveis: number;
  cupons_mensais: number;
  cupons_extras: number;
};

type RegistroCompraCupons = {
  compra_id: string;
  quantidade: number;
  valor_centavos: number;
};

export type CheckoutCompraCupons = {
  compraId: string;
  quantidade: number;
  valorCentavos: number;
};

export type SincronizacaoAssinatura = {
  usuarioId: string;
  plano: PlanoMembroId;
  status: StatusAssinatura;
  stripeCustomerId: string;
  stripeSubscriptionId: string;
  stripeCheckoutSessionId?: string | null;
  periodoInicio: string;
  periodoFim: string;
  cancelarAoFim: boolean;
  referenciaCredito?: string | null;
};

function normalizarImagem(caminho: string | null): string | null {
  const valor = caminho?.trim();
  if (!valor) return null;
  return valor.startsWith("http") || valor.startsWith("/")
    ? valor
    : urlPublicaStorage("anuncios", valor);
}

async function executarRpcAdministrador(
  funcao: string,
  corpo: Record<string, unknown>,
): Promise<void> {
  const credenciais = credenciaisSupabase();
  const chave = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!credenciais || !chave) throw new Error("SUPABASE_SERVICE_ROLE_KEY não foi configurada.");

  const resposta = await fetch(`${credenciais.url}/rest/v1/rpc/${funcao}`, {
    method: "POST",
    headers: {
      apikey: chave,
      Authorization: `Bearer ${chave}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(corpo),
    cache: "no-store",
  });
  if (!resposta.ok) {
    const detalhe = (await resposta.json().catch(() => null)) as { message?: string } | null;
    throw new Error(detalhe?.message ?? `Supabase respondeu com status ${resposta.status}.`);
  }
}

export async function buscarAnuncioParaImpulsionar(
  sessao: SessaoUsuario,
  anuncioId: string,
): Promise<DetalhesImpulsionamento | null> {
  const registros = await executarRpc<RegistroDetalhes>(
    "obter_anuncio_para_impulsionar",
    { p_anuncio_id: anuncioId },
    sessao.token,
  );
  const registro = registros?.[0];
  if (!registro) return null;

  const impulsionadoAte = registro.impulsionado_ate
    && new Date(registro.impulsionado_ate).getTime() > Date.now()
    ? registro.impulsionado_ate
    : null;
  const assinatura = registro.assinatura_plano && registro.assinatura_status
    ? {
        plano: registro.assinatura_plano,
        status: registro.assinatura_status,
        cuponsDisponiveis: Math.max(0, Number(registro.cupons_disponiveis ?? 0)),
        cuponsMensais: Math.max(0, Number(registro.cupons_mensais ?? registro.cupons_disponiveis ?? 0)),
        cuponsExtras: Math.max(0, Number(registro.cupons_extras ?? 0)),
        cuponsPorCiclo: Number(registro.cupons_por_ciclo ?? 0),
        periodoFim: registro.periodo_fim,
        cancelarAoFim: registro.cancelar_ao_fim ?? false,
      }
    : null;

  return {
    anuncio: {
      id: registro.anuncio_id,
      tipo: "emprestimo",
      titulo: registro.titulo,
      descricao: registro.descricao,
      categoria: registro.categoria,
      condicao: registro.condicao === "novo_quase_novo"
        ? "Novo/Quase novo"
        : registro.condicao === "marcas_de_uso"
          ? "Com marcas de uso"
          : "Não informada",
      localizacao: [registro.cidade, registro.estado].filter(Boolean).join(", ") || "Local não informado",
      imagem: normalizarImagem(registro.imagem),
      valorUnitarioCentavos: registro.valor_unitario_centavos,
      duracaoQuantidade: registro.duracao_quantidade,
      duracaoUnidade: ["minutos", "horas", "dias", "semanas"].includes(registro.duracao_unidade ?? "")
        ? registro.duracao_unidade as DetalhesImpulsionamento["anuncio"]["duracaoUnidade"]
        : null,
      publicadoEm: registro.criado_em,
      ativo: registro.ativo,
    },
    assinatura,
    impulsionadoAte,
  };
}

export async function vincularCheckoutAssinatura(
  sessao: SessaoUsuario,
  anuncioId: string,
  plano: PlanoMembroId,
  checkoutSessionId: string,
): Promise<void> {
  await executarRpcSupabase<void>("vincular_checkout_assinatura", sessao.token, {
    p_anuncio_id: anuncioId,
    p_plano: plano,
    p_checkout_session_id: checkoutSessionId,
  });
}

export async function usarCupom(
  sessao: SessaoUsuario,
  anuncioId: string,
): Promise<ResultadoUsoCupom> {
  const registros = await executarRpcSupabase<RegistroUsoCupom[]>(
    "usar_cupom_impulsionamento",
    sessao.token,
    { p_anuncio_id: anuncioId },
  );
  const registro = registros?.[0];
  if (!registro) throw new Error("Não foi possível utilizar o cupom.");
  return {
    impulsionadoAte: registro.impulsionado_ate,
    cuponsDisponiveis: Number(registro.cupons_disponiveis),
    cuponsMensais: Number(registro.cupons_mensais),
    cuponsExtras: Number(registro.cupons_extras),
  };
}

export async function prepararCompraCupons(
  sessao: SessaoUsuario,
  quantidade: 1 | 2 | 5,
): Promise<CheckoutCompraCupons> {
  const registros = await executarRpcSupabase<RegistroCompraCupons[]>(
    "preparar_compra_cupons",
    sessao.token,
    { p_quantidade: quantidade },
  );
  const registro = registros?.[0];
  if (!registro) throw new Error("Não foi possível preparar a compra de cupons.");
  return {
    compraId: registro.compra_id,
    quantidade: Number(registro.quantidade),
    valorCentavos: Number(registro.valor_centavos),
  };
}

export async function vincularCheckoutCompraCupons(
  sessao: SessaoUsuario,
  compraId: string,
  checkoutSessionId: string,
): Promise<void> {
  await executarRpcSupabase<void>("vincular_checkout_compra_cupons", sessao.token, {
    p_compra_id: compraId,
    p_checkout_session_id: checkoutSessionId,
  });
}

export function atualizarCompraCuponsPorCheckout(
  checkoutSessionId: string,
  status: "pendente" | "processando" | "aprovado" | "recusado" | "cancelado",
  paymentIntentId: string | null,
): Promise<void> {
  return executarRpcAdministrador("atualizar_compra_cupons_por_checkout", {
    p_checkout_session_id: checkoutSessionId,
    p_status: status,
    p_payment_intent_id: paymentIntentId,
  });
}

export function sincronizarAssinatura(dados: SincronizacaoAssinatura): Promise<void> {
  return executarRpcAdministrador("sincronizar_assinatura_membro", {
    p_usuario_id: dados.usuarioId,
    p_plano: dados.plano,
    p_status: dados.status,
    p_stripe_customer_id: dados.stripeCustomerId,
    p_stripe_subscription_id: dados.stripeSubscriptionId,
    p_stripe_checkout_session_id: dados.stripeCheckoutSessionId ?? null,
    p_periodo_inicio: dados.periodoInicio,
    p_periodo_fim: dados.periodoFim,
    p_cancelar_ao_fim: dados.cancelarAoFim,
    p_referencia_credito: dados.referenciaCredito ?? null,
  });
}

export async function buscarCustomerStripeDoUsuario(sessao: SessaoUsuario): Promise<string | null> {
  const registros = await executarRpc<{ stripe_customer_id: string | null }>(
    "obter_customer_assinatura",
    {},
    sessao.token,
  );
  return registros?.[0]?.stripe_customer_id ?? null;
}
