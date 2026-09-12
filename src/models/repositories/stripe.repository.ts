import { createHmac, timingSafeEqual } from "node:crypto";

type StripeErro = {
  error?: { message?: string; code?: string };
};

export type StripeCheckoutSession = {
  id: string;
  url: string | null;
  status: "open" | "complete" | "expired" | null;
  payment_status: "paid" | "unpaid" | "no_payment_required";
  payment_intent: string | null;
  client_reference_id: string | null;
  metadata: Record<string, string>;
};

export type StripeEvento = {
  id: string;
  type: string;
  data: {
    object: {
      id: string;
      payment_status?: StripeCheckoutSession["payment_status"];
      payment_intent?: string | null;
      metadata?: Record<string, string>;
      last_payment_error?: { code?: string } | null;
    };
  };
};

function chaveStripe(): string {
  const chave = process.env.STRIPE_SECRET_KEY;
  if (!chave) throw new Error("STRIPE_SECRET_KEY não foi configurada.");
  if (!chave.startsWith("sk_test_")) {
    throw new Error("A simulação aceita somente uma chave de teste do Stripe (sk_test_...).");
  }
  return chave;
}

async function requisicaoStripe<T>(
  caminho: string,
  opcoes: { method?: "GET" | "POST"; body?: URLSearchParams; idempotencyKey?: string } = {},
): Promise<T> {
  const resposta = await fetch(`https://api.stripe.com/v1/${caminho}`, {
    method: opcoes.method ?? "GET",
    headers: {
      Authorization: `Bearer ${chaveStripe()}`,
      ...(opcoes.body ? { "Content-Type": "application/x-www-form-urlencoded" } : {}),
      ...(opcoes.idempotencyKey ? { "Idempotency-Key": opcoes.idempotencyKey } : {}),
    },
    body: opcoes.body,
    cache: "no-store",
  });

  const dados = (await resposta.json()) as T & StripeErro;
  if (!resposta.ok) {
    throw new Error(dados.error?.message ?? `Stripe respondeu com status ${resposta.status}.`);
  }
  return dados;
}

export async function criarCheckoutStripe(dados: {
  pagamentoId: string;
  solicitacaoId: string;
  titulo: string;
  valorCentavos: number;
  email: string;
  origem: string;
}): Promise<StripeCheckoutSession> {
  const retorno = `${dados.origem}/emprestimos/${dados.solicitacaoId}/pagamento`;
  const parametros = new URLSearchParams({
    mode: "payment",
    success_url: `${retorno}?resultado=sucesso&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${retorno}?resultado=cancelado`,
    client_reference_id: dados.pagamentoId,
    "payment_method_types[0]": "card",
    "line_items[0][quantity]": "1",
    "line_items[0][price_data][currency]": "brl",
    "line_items[0][price_data][unit_amount]": String(dados.valorCentavos),
    "line_items[0][price_data][product_data][name]": `Empréstimo: ${dados.titulo}`,
    "line_items[0][price_data][product_data][description]": "Simulação de pagamento no ambiente de testes do Ciclo",
    "metadata[pagamento_id]": dados.pagamentoId,
    "metadata[solicitacao_id]": dados.solicitacaoId,
    "payment_intent_data[metadata][pagamento_id]": dados.pagamentoId,
    "payment_intent_data[metadata][solicitacao_id]": dados.solicitacaoId,
  });
  if (dados.email) parametros.set("customer_email", dados.email);

  return requisicaoStripe<StripeCheckoutSession>("checkout/sessions", {
    method: "POST",
    body: parametros,
    idempotencyKey: `checkout-${dados.pagamentoId}-${Date.now()}`,
  });
}

export async function consultarCheckoutStripe(sessionId: string): Promise<StripeCheckoutSession> {
  return requisicaoStripe<StripeCheckoutSession>(`checkout/sessions/${encodeURIComponent(sessionId)}`);
}

export function validarEventoStripe(corpo: string, assinatura: string | null): StripeEvento {
  const segredo = process.env.STRIPE_WEBHOOK_SECRET;
  if (!segredo) throw new Error("STRIPE_WEBHOOK_SECRET não foi configurado.");
  if (!assinatura) throw new Error("Assinatura do webhook não informada.");

  const partes = assinatura.split(",");
  const timestamp = partes.find((parte) => parte.startsWith("t="))?.slice(2);
  const assinaturas = partes
    .filter((parte) => parte.startsWith("v1="))
    .map((parte) => parte.slice(3));

  if (!timestamp || assinaturas.length === 0) throw new Error("Assinatura do webhook inválida.");
  if (Math.abs(Date.now() / 1000 - Number(timestamp)) > 300) {
    throw new Error("Assinatura do webhook expirada.");
  }

  const esperada = createHmac("sha256", segredo)
    .update(`${timestamp}.${corpo}`, "utf8")
    .digest("hex");
  const esperadaBuffer = Buffer.from(esperada, "hex");
  const corresponde = assinaturas.some((recebida) => {
    const recebidaBuffer = Buffer.from(recebida, "hex");
    return recebidaBuffer.length === esperadaBuffer.length
      && timingSafeEqual(recebidaBuffer, esperadaBuffer);
  });

  if (!corresponde) throw new Error("Assinatura do webhook inválida.");
  return JSON.parse(corpo) as StripeEvento;
}
