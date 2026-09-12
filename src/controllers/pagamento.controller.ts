import { sessaoAtual } from "@/lib/supabase/sessao";
import type { DetalhesPagamento } from "@/models/entities/pagamento";
import {
  obterDetalhesPagamento,
  PagamentoError,
  sincronizarRetornoPagamento,
} from "@/models/services/pagamento.service";

export type ResultadoPaginaPagamento = {
  detalhes: DetalhesPagamento | null;
  requerLogin: boolean;
  erro?: string;
};

export async function carregarPaginaPagamento(
  solicitacaoId: string,
  checkoutSessionId?: string,
): Promise<ResultadoPaginaPagamento> {
  const sessao = await sessaoAtual();
  if (!sessao) return { detalhes: null, requerLogin: true };

  let erro: string | undefined;
  if (checkoutSessionId) {
    try {
      await sincronizarRetornoPagamento(sessao, solicitacaoId, checkoutSessionId);
    } catch (falha) {
      console.error("Falha ao sincronizar retorno do Stripe", falha);
      erro = falha instanceof PagamentoError
        ? falha.message
        : "O retorno do Stripe ainda não pôde ser sincronizado. O webhook tentará novamente.";
    }
  }

  try {
    return {
      detalhes: await obterDetalhesPagamento(sessao, solicitacaoId),
      requerLogin: false,
      erro,
    };
  } catch (falha) {
    console.error("Falha ao carregar pagamento", falha);
    return {
      detalhes: null,
      requerLogin: false,
      erro: falha instanceof PagamentoError
        ? falha.message
        : "Não foi possível carregar os dados do pagamento.",
    };
  }
}
