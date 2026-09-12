import type { CheckoutPagamento, DetalhesPagamento, StatusPagamento } from "@/models/entities/pagamento";
import type { SessaoUsuario } from "@/models/entities/usuario";
import {
  atualizarPagamentoPorCheckout,
  atualizarPagamentoPorId,
  buscarDetalhesPagamento,
  prepararPagamento,
  vincularCheckout,
} from "@/models/repositories/pagamento.repository";
import {
  consultarCheckoutStripe,
  criarCheckoutStripe,
  type StripeCheckoutSession,
  type StripeEvento,
} from "@/models/repositories/stripe.repository";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export class PagamentoError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PagamentoError";
  }
}

function validarSolicitacaoId(solicitacaoId: string): void {
  if (!UUID.test(solicitacaoId)) throw new PagamentoError("Solicitação de empréstimo inválida.");
}

function statusDoCheckout(checkout: StripeCheckoutSession): StatusPagamento {
  if (checkout.payment_status === "paid" || checkout.payment_status === "no_payment_required") {
    return "aprovado";
  }
  if (checkout.status === "expired") return "cancelado";
  if (checkout.status === "complete") return "processando";
  return "pendente";
}

export async function obterDetalhesPagamento(
  sessao: SessaoUsuario,
  solicitacaoId: string,
): Promise<DetalhesPagamento | null> {
  validarSolicitacaoId(solicitacaoId);
  return buscarDetalhesPagamento(sessao, solicitacaoId);
}

export async function iniciarCheckoutPagamento(
  sessao: SessaoUsuario | null,
  solicitacaoId: string,
  origem: string,
): Promise<{ url: string }> {
  if (!sessao) throw new PagamentoError("Entre na sua conta para realizar o pagamento.");
  validarSolicitacaoId(solicitacaoId);

  let origemSegura: URL;
  try {
    origemSegura = new URL(origem);
  } catch {
    throw new PagamentoError("Endereço da aplicação inválido.");
  }
  if (!['http:', 'https:'].includes(origemSegura.protocol)) {
    throw new PagamentoError("Endereço da aplicação inválido.");
  }

  let pagamento: CheckoutPagamento;
  try {
    pagamento = await prepararPagamento(sessao, solicitacaoId);
  } catch (erro) {
    const mensagem = erro instanceof Error ? erro.message : "";
    if (/Somente quem|depois que|ja possui|não encontrada|nao encontrada/i.test(mensagem)) {
      throw new PagamentoError(mensagem);
    }
    throw erro;
  }
  const checkout = await criarCheckoutStripe({
    ...pagamento,
    solicitacaoId,
    email: sessao.email,
    origem: origemSegura.origin,
  });
  if (!checkout.url) throw new Error("O Stripe não devolveu o endereço do checkout.");

  await vincularCheckout(sessao, pagamento.pagamentoId, checkout.id);
  return { url: checkout.url };
}

export async function sincronizarRetornoPagamento(
  sessao: SessaoUsuario,
  solicitacaoId: string,
  checkoutSessionId: string,
): Promise<void> {
  validarSolicitacaoId(solicitacaoId);
  if (!/^cs_test_[A-Za-z0-9]+$/.test(checkoutSessionId)) {
    throw new PagamentoError("Identificador do checkout inválido.");
  }

  const detalhes = await buscarDetalhesPagamento(sessao, solicitacaoId);
  if (!detalhes?.pagamentoId || detalhes.papel !== "interessado") {
    throw new PagamentoError("Pagamento não encontrado para esta solicitação.");
  }

  const checkout = await consultarCheckoutStripe(checkoutSessionId);
  if (
    checkout.metadata.solicitacao_id !== solicitacaoId
    || checkout.metadata.pagamento_id !== detalhes.pagamentoId
    || checkout.client_reference_id !== detalhes.pagamentoId
  ) {
    throw new PagamentoError("O checkout não pertence a esta solicitação.");
  }

  const status = statusDoCheckout(checkout);
  await atualizarPagamentoPorId(detalhes.pagamentoId, {
    status,
    payment_intent_id: checkout.payment_intent,
    codigo_falha: null,
    ...(status === "aprovado" ? { pago_em: new Date().toISOString() } : {}),
  });
}

export async function processarEventoPagamento(evento: StripeEvento): Promise<void> {
  const objeto = evento.data.object;
  const paymentIntentId = objeto.id.startsWith("pi_")
    ? objeto.id
    : objeto.payment_intent ?? null;
  let status: StatusPagamento | null = null;

  switch (evento.type) {
    case "checkout.session.completed":
    case "checkout.session.async_payment_succeeded":
      status = objeto.payment_status === "paid" ? "aprovado" : "processando";
      break;
    case "checkout.session.async_payment_failed":
      status = "recusado";
      break;
    case "checkout.session.expired":
      status = "cancelado";
      break;
    default:
      return;
  }

  if (!status) return;

  const atualizacao = {
    status,
    payment_intent_id: paymentIntentId,
    codigo_falha: null,
    ...(status === "aprovado" ? { pago_em: new Date().toISOString() } : {}),
  };

  if (objeto.id.startsWith("cs_")) {
    await atualizarPagamentoPorCheckout(objeto.id, atualizacao);
  }
}
