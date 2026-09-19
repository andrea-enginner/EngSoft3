"use server";

import { sessaoAtual } from "@/lib/supabase/sessao";
import { atualizarEmprestimo, PublicacaoInvalidaError, publicarEmprestimo } from "@/models/services/publicar-emprestimo.service";

export type EstadoPublicacao = { erro: string; itemId?: string };

export async function publicarEmprestimoAction(
  _estado: EstadoPublicacao,
  dados: FormData,
): Promise<EstadoPublicacao> {
  try {
    const sessao = await sessaoAtual();
    const anuncioId = String(dados.get("anuncioId") ?? "");
    const fotos = dados.getAll("fotos").filter((valor): valor is File => valor instanceof File);
    const entrada = {
      titulo: String(dados.get("titulo") ?? ""),
      categoria: String(dados.get("categoria") ?? ""),
      condicao: String(dados.get("condicao") ?? ""),
      descricao: String(dados.get("descricao") ?? ""),
      valorUnitarioCentavos: Number(dados.get("valorUnitarioCentavos")),
      duracaoQuantidade: Number(dados.get("duracaoQuantidade")),
      duracaoUnidade: String(dados.get("duracaoUnidade") ?? ""),
    };
    const itemId = anuncioId
      ? await atualizarEmprestimo(sessao, anuncioId, entrada)
      : await publicarEmprestimo(sessao, entrada, fotos);
    return { erro: "", itemId };
  } catch (erro) {
    if (erro instanceof PublicacaoInvalidaError) return { erro: erro.message };
    console.error("Falha ao salvar empréstimo", erro);
    return { erro: "Não foi possível salvar agora. Tente novamente." };
  }
}
