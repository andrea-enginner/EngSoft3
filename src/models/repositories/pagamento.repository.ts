import {
  credenciaisSupabase,
  executarRpc,
  executarRpcSupabase,
  urlPublicaStorage,
} from "@/lib/supabase/rest";
import type { StatusEmprestimo } from "@/models/entities/emprestimo";
import type {
  CheckoutPagamento,
  DetalhesPagamento,
  StatusPagamento,
} from "@/models/entities/pagamento";
import type { SessaoUsuario } from "@/models/entities/usuario";

type RegistroDetalhes = {
  solicitacao_id: string;
  anuncio_id: string;
  titulo: string;
  proprietario: string;
  papel: string;
  inicio_em: string;
  fim_em: string;
  status_solicitacao: StatusEmprestimo;
  valor_centavos: number;
  imagem: string | null;
  pagamento_id: string | null;
  status_pagamento: StatusPagamento | null;
  checkout_session_id: string | null;
};

type RegistroCheckout = {
  pagamento_id: string;
  titulo: string;
  valor_centavos: number;
};

function normalizarImagem(imagem: string | null): string | null {
  const valor = imagem?.trim();
  if (!valor) return null;
  return valor.startsWith("http") || valor.startsWith("/")
    ? valor
    : urlPublicaStorage("anuncios", valor);
}

export async function buscarDetalhesPagamento(
  sessao: SessaoUsuario,
  solicitacaoId: string,
): Promise<DetalhesPagamento | null> {
  const registros = await executarRpc<RegistroDetalhes>(
    "obter_pagamento_emprestimo",
    { p_solicitacao_id: solicitacaoId },
    sessao.token,
  );
  const registro = registros?.[0];
  if (!registro) return null;

  return {
    solicitacaoId: registro.solicitacao_id,
    anuncioId: registro.anuncio_id,
    titulo: registro.titulo,
    proprietario: registro.proprietario,
    papel: registro.papel === "dono" ? "dono" : "interessado",
    inicioEm: registro.inicio_em,
    fimEm: registro.fim_em,
    statusSolicitacao: registro.status_solicitacao,
    valorCentavos: Number(registro.valor_centavos),
    imagem: normalizarImagem(registro.imagem),
    pagamentoId: registro.pagamento_id,
    statusPagamento: registro.status_pagamento,
    checkoutSessionId: registro.checkout_session_id,
  };
}

export async function prepararPagamento(
  sessao: SessaoUsuario,
  solicitacaoId: string,
): Promise<CheckoutPagamento> {
  const registros = await executarRpcSupabase<RegistroCheckout[]>(
    "preparar_pagamento_emprestimo",
    sessao.token,
    { p_solicitacao_id: solicitacaoId },
  );
  const registro = registros?.[0];
  if (!registro) throw new Error("Não foi possível preparar o pagamento.");
  return {
    pagamentoId: registro.pagamento_id,
    titulo: registro.titulo,
    valorCentavos: Number(registro.valor_centavos),
  };
}

export async function vincularCheckout(
  sessao: SessaoUsuario,
  pagamentoId: string,
  checkoutSessionId: string,
): Promise<void> {
  await executarRpcSupabase<void>("vincular_checkout_pagamento", sessao.token, {
    p_pagamento_id: pagamentoId,
    p_checkout_session_id: checkoutSessionId,
  });
}

type AtualizacaoPagamento = {
  status: StatusPagamento;
  payment_intent_id?: string | null;
  codigo_falha?: string | null;
  pago_em?: string | null;
};

async function atualizarComoAdministrador(
  filtro: "id" | "checkout_session_id",
  valor: string,
  atualizacao: AtualizacaoPagamento,
): Promise<void> {
  const credenciais = credenciaisSupabase();
  const chave = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!credenciais || !chave) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY não foi configurada.");
  }

  const naoRebaixarAprovado = atualizacao.status === "aprovado" ? "" : "&status=neq.aprovado";
  const resposta = await fetch(
    `${credenciais.url}/rest/v1/pagamentos_emprestimo?${filtro}=eq.${encodeURIComponent(valor)}${naoRebaixarAprovado}`,
    {
      method: "PATCH",
      headers: {
        apikey: chave,
        Authorization: `Bearer ${chave}`,
        "Content-Type": "application/json",
        Prefer: "return=minimal",
      },
      body: JSON.stringify({
        ...atualizacao,
        atualizado_em: new Date().toISOString(),
      }),
      cache: "no-store",
    },
  );

  if (!resposta.ok) {
    throw new Error(`Supabase respondeu com status ${resposta.status} ao sincronizar o pagamento.`);
  }
}

export function atualizarPagamentoPorCheckout(
  checkoutSessionId: string,
  atualizacao: AtualizacaoPagamento,
): Promise<void> {
  return atualizarComoAdministrador("checkout_session_id", checkoutSessionId, atualizacao);
}

export function atualizarPagamentoPorId(
  pagamentoId: string,
  atualizacao: AtualizacaoPagamento,
): Promise<void> {
  return atualizarComoAdministrador("id", pagamentoId, atualizacao);
}
