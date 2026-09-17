import type { SessaoUsuario } from "@/models/entities/usuario";
import {
  encontrarPlanoMembro,
  type DetalhesImpulsionamento,
  type ResultadoUsoCupom,
  type StatusAssinatura,
} from "@/models/entities/impulsionamento";
import {
  buscarAnuncioParaImpulsionar,
  buscarCustomerStripeDoUsuario,
  atualizarCompraCuponsPorCheckout,
  prepararCompraCupons,
  sincronizarAssinatura,
  usarCupom,
  vincularCheckoutAssinatura,
  vincularCheckoutCompraCupons,
} from "@/models/repositories/impulsionamento.repository";
import {
  consultarAssinaturaStripe,
  consultarCheckoutStripe,
  criarCheckoutAssinaturaStripe,
  criarCheckoutCuponsExtrasStripe,
  criarPortalAssinaturaStripe,
  type StripeAssinatura,
  type StripeEvento,
} from "@/models/repositories/stripe.repository";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export class ImpulsionamentoError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ImpulsionamentoError";
  }
}

function validarAnuncioId(anuncioId: string): void {
  if (!UUID.test(anuncioId)) throw new ImpulsionamentoError("Anúncio inválido.");
}

function validarOrigem(origem: string): string {
  try {
    const url = new URL(origem);
    if (!["http:", "https:"].includes(url.protocol)) throw new Error();
    return url.origin;
  } catch {
    throw new ImpulsionamentoError("Endereço da aplicação inválido.");
  }
}

function idStripe(valor: string | { id: string } | null | undefined): string | null {
  if (!valor) return null;
  return typeof valor === "string" ? valor : valor.id;
}

function statusAssinaturaStripe(status: string): StatusAssinatura {
  if (["active", "trialing"].includes(status)) return "ativa";
  if (["past_due", "unpaid", "paused"].includes(status)) return "inadimplente";
  if (["canceled", "incomplete_expired"].includes(status)) return "cancelada";
  return "pendente";
}

function statusCompraCheckout(checkout: {
  payment_status?: "paid" | "unpaid" | "no_payment_required";
  status?: "open" | "complete" | "expired" | null;
}): "pendente" | "processando" | "aprovado" | "recusado" | "cancelado" {
  if (checkout.payment_status === "paid" || checkout.payment_status === "no_payment_required") return "aprovado";
  if (checkout.status === "expired") return "cancelado";
  if (checkout.status === "complete") return "processando";
  return "pendente";
}

function periodoAssinatura(assinatura: StripeAssinatura): { inicio: string; fim: string } {
  const item = assinatura.items?.data?.[0];
  const inicio = assinatura.current_period_start ?? item?.current_period_start;
  const fim = assinatura.current_period_end ?? item?.current_period_end;
  if (!inicio || !fim) throw new Error("O Stripe não informou o período atual da assinatura.");
  return {
    inicio: new Date(inicio * 1000).toISOString(),
    fim: new Date(fim * 1000).toISOString(),
  };
}

async function persistirAssinaturaStripe(
  assinatura: StripeAssinatura,
  opcoes: { checkoutSessionId?: string | null; referenciaCredito?: string | null } = {},
): Promise<void> {
  const usuarioId = assinatura.metadata.usuario_id;
  const plano = encontrarPlanoMembro(assinatura.metadata.plano);
  if (!UUID.test(usuarioId ?? "") || !plano) {
    throw new Error("Assinatura do Stripe sem metadados válidos do Ciclo.");
  }
  const periodo = periodoAssinatura(assinatura);
  await sincronizarAssinatura({
    usuarioId,
    plano: plano.id,
    status: statusAssinaturaStripe(assinatura.status),
    stripeCustomerId: assinatura.customer,
    stripeSubscriptionId: assinatura.id,
    stripeCheckoutSessionId: opcoes.checkoutSessionId,
    periodoInicio: periodo.inicio,
    periodoFim: periodo.fim,
    cancelarAoFim: assinatura.cancel_at_period_end,
    referenciaCredito: opcoes.referenciaCredito,
  });
}

export async function obterDetalhesImpulsionamento(
  sessao: SessaoUsuario,
  anuncioId: string,
): Promise<DetalhesImpulsionamento | null> {
  validarAnuncioId(anuncioId);
  return buscarAnuncioParaImpulsionar(sessao, anuncioId);
}

export async function iniciarCheckoutAssinatura(
  sessao: SessaoUsuario | null,
  anuncioId: string,
  planoId: string,
  origem: string,
): Promise<{ url: string }> {
  if (!sessao) throw new ImpulsionamentoError("Entre na sua conta para assinar o Ciclo Membro.");
  validarAnuncioId(anuncioId);
  const plano = encontrarPlanoMembro(planoId);
  if (!plano) throw new ImpulsionamentoError("Escolha um plano de assinatura válido.");

  const detalhes = await buscarAnuncioParaImpulsionar(sessao, anuncioId);
  if (!detalhes) throw new ImpulsionamentoError("Anúncio não encontrado ou sem permissão.");
  if (detalhes.assinatura && ["ativa", "inadimplente"].includes(detalhes.assinatura.status)) {
    throw new ImpulsionamentoError("Você já possui uma assinatura. Gerencie seu plano atual antes de criar outra.");
  }

  const checkout = await criarCheckoutAssinaturaStripe({
    usuarioId: sessao.usuarioId,
    anuncioId,
    plano: plano.id,
    nomePlano: plano.nome,
    cuponsMensais: plano.cuponsMensais,
    valorCentavos: plano.valorCentavos,
    email: sessao.email,
    origem: validarOrigem(origem),
  });
  if (!checkout.url) throw new Error("O Stripe não devolveu o endereço do checkout.");
  await vincularCheckoutAssinatura(sessao, anuncioId, plano.id, checkout.id);
  return { url: checkout.url };
}

export async function utilizarCupomImpulsionamento(
  sessao: SessaoUsuario | null,
  anuncioId: string,
): Promise<ResultadoUsoCupom> {
  if (!sessao) throw new ImpulsionamentoError("Entre na sua conta para utilizar um cupom.");
  validarAnuncioId(anuncioId);
  try {
    return await usarCupom(sessao, anuncioId);
  } catch (erro) {
    const mensagem = erro instanceof Error ? erro.message : "";
    if (/assinatura|cupom|anúncio|anuncio|impulsionado|proprietário|proprietario/i.test(mensagem)) {
      throw new ImpulsionamentoError(mensagem);
    }
    throw erro;
  }
}

export async function iniciarCheckoutCompraCupons(
  sessao: SessaoUsuario | null,
  anuncioId: string,
  quantidadeInformada: number,
  origem: string,
): Promise<{ url: string }> {
  if (!sessao) throw new ImpulsionamentoError("Entre na sua conta para comprar cupons.");
  validarAnuncioId(anuncioId);
  if (![1, 2, 5].includes(quantidadeInformada)) {
    throw new ImpulsionamentoError("Escolha um pacote de cupons válido.");
  }
  const quantidade = quantidadeInformada as 1 | 2 | 5;
  const detalhes = await buscarAnuncioParaImpulsionar(sessao, anuncioId);
  if (!detalhes?.assinatura || detalhes.assinatura.status !== "ativa") {
    throw new ImpulsionamentoError("É necessária uma assinatura ativa para comprar cupons extras.");
  }
  if (detalhes.assinatura.cuponsMensais > 0) {
    throw new ImpulsionamentoError("Os pacotes extras ficam disponíveis quando os cupons mensais acabam.");
  }

  const compra = await prepararCompraCupons(sessao, quantidade);
  const checkout = await criarCheckoutCuponsExtrasStripe({
    ...compra,
    usuarioId: sessao.usuarioId,
    anuncioId,
    email: sessao.email,
    origem: validarOrigem(origem),
  });
  if (!checkout.url) throw new Error("O Stripe não devolveu o endereço do checkout.");
  await vincularCheckoutCompraCupons(sessao, compra.compraId, checkout.id);
  return { url: checkout.url };
}

export async function sincronizarRetornoImpulsionamento(
  sessao: SessaoUsuario,
  anuncioId: string,
  checkoutSessionId: string,
): Promise<void> {
  validarAnuncioId(anuncioId);
  if (!/^cs_test_[A-Za-z0-9]+$/.test(checkoutSessionId)) {
    throw new ImpulsionamentoError("Identificador do checkout inválido.");
  }
  const checkout = await consultarCheckoutStripe(checkoutSessionId);
  if (checkout.metadata.tipo === "compra_cupons") {
    if (
      checkout.metadata.usuario_id !== sessao.usuarioId
      || checkout.metadata.anuncio_id !== anuncioId
      || checkout.client_reference_id !== checkout.metadata.compra_id
    ) {
      throw new ImpulsionamentoError("A compra de cupons não pertence a esta conta.");
    }
    await atualizarCompraCuponsPorCheckout(
      checkout.id,
      statusCompraCheckout(checkout),
      checkout.payment_intent,
    );
    return;
  }
  if (
    checkout.metadata.tipo !== "assinatura_membro"
    || checkout.metadata.usuario_id !== sessao.usuarioId
    || checkout.metadata.anuncio_id !== anuncioId
    || checkout.client_reference_id !== sessao.usuarioId
  ) {
    throw new ImpulsionamentoError("O checkout não pertence a esta conta.");
  }
  const subscriptionId = checkout.subscription;
  if (!subscriptionId) throw new ImpulsionamentoError("O Stripe ainda não confirmou a assinatura.");

  const assinatura = await consultarAssinaturaStripe(subscriptionId);
  const invoiceId = idStripe(assinatura.latest_invoice);
  await persistirAssinaturaStripe(assinatura, {
    checkoutSessionId,
    referenciaCredito: invoiceId ? `invoice:${invoiceId}` : null,
  });
}

export async function abrirPortalAssinatura(
  sessao: SessaoUsuario | null,
  origem: string,
): Promise<{ url: string }> {
  if (!sessao) throw new ImpulsionamentoError("Entre na sua conta para gerenciar a assinatura.");
  const customerId = await buscarCustomerStripeDoUsuario(sessao);
  if (!customerId) throw new ImpulsionamentoError("Assinatura não encontrada.");
  const portal = await criarPortalAssinaturaStripe(customerId, `${validarOrigem(origem)}/perfil`);
  if (!portal.url) throw new Error("O Stripe não devolveu o endereço do portal.");
  return portal;
}

function subscriptionIdDoEvento(evento: StripeEvento): string | null {
  const objeto = evento.data.object;
  return idStripe(objeto.subscription)
    ?? idStripe(objeto.parent?.subscription_details?.subscription)
    ?? (objeto.id.startsWith("sub_") ? objeto.id : null);
}

export async function processarEventoAssinatura(evento: StripeEvento): Promise<boolean> {
  const objeto = evento.data.object;
  if (objeto.metadata?.tipo === "compra_cupons" && objeto.id.startsWith("cs_")) {
    let status: "pendente" | "processando" | "aprovado" | "recusado" | "cancelado";
    switch (evento.type) {
      case "checkout.session.completed":
        status = objeto.payment_status === "paid" ? "aprovado" : "processando";
        break;
      case "checkout.session.async_payment_succeeded":
        status = "aprovado";
        break;
      case "checkout.session.async_payment_failed":
        status = "recusado";
        break;
      case "checkout.session.expired":
        status = "cancelado";
        break;
      default:
        return false;
    }
    await atualizarCompraCuponsPorCheckout(objeto.id, status, objeto.payment_intent ?? null);
    return true;
  }
  const ehCheckoutAssinatura = objeto.metadata?.tipo === "assinatura_membro"
    || evento.type.startsWith("customer.subscription.")
    || evento.type.startsWith("invoice.");
  if (!ehCheckoutAssinatura) return false;

  const subscriptionId = subscriptionIdDoEvento(evento);
  if (!subscriptionId) return false;
  const assinatura = await consultarAssinaturaStripe(subscriptionId);

  if (evento.type === "invoice.paid") {
    await persistirAssinaturaStripe(assinatura, { referenciaCredito: `invoice:${objeto.id}` });
    return true;
  }
  if (evento.type === "checkout.session.completed") {
    const invoiceId = idStripe(assinatura.latest_invoice);
    await persistirAssinaturaStripe(assinatura, {
      checkoutSessionId: objeto.id,
      referenciaCredito: invoiceId ? `invoice:${invoiceId}` : null,
    });
    return true;
  }
  if (["invoice.payment_failed", "customer.subscription.updated", "customer.subscription.deleted"].includes(evento.type)) {
    await persistirAssinaturaStripe(assinatura);
    return true;
  }
  return false;
}
