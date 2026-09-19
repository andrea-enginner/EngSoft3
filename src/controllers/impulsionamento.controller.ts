import { sessaoAtual } from "@/lib/supabase/sessao";
import type { DetalhesImpulsionamento } from "@/models/entities/impulsionamento";
import {
  ImpulsionamentoError,
  obterDetalhesImpulsionamento,
  sincronizarRetornoImpulsionamento,
} from "@/models/services/impulsionamento.service";

export type ResultadoPaginaImpulsionamento = {
  detalhes: DetalhesImpulsionamento | null;
  requerLogin: boolean;
  erro?: string;
};

export async function carregarPaginaImpulsionamento(
  anuncioId: string,
  checkoutSessionId?: string,
): Promise<ResultadoPaginaImpulsionamento> {
  const sessao = await sessaoAtual();
  if (!sessao) return { detalhes: null, requerLogin: true };

  let erro: string | undefined;
  if (checkoutSessionId) {
    try {
      await sincronizarRetornoImpulsionamento(sessao, anuncioId, checkoutSessionId);
    } catch (falha) {
      console.error("Falha ao sincronizar retorno da assinatura", falha);
      erro = falha instanceof ImpulsionamentoError
        ? falha.message
        : "O pagamento ainda não pôde ser sincronizado. O webhook tentará novamente.";
    }
  }

  try {
    return {
      detalhes: await obterDetalhesImpulsionamento(sessao, anuncioId),
      requerLogin: false,
      erro,
    };
  } catch (falha) {
    console.error("Falha ao carregar impulsionamento", falha);
    return {
      detalhes: null,
      requerLogin: false,
      erro: falha instanceof ImpulsionamentoError
        ? falha.message
        : "Não foi possível carregar o anúncio para impulsionamento.",
    };
  }
}
