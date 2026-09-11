"use server";

import { sessaoAtual } from "@/lib/supabase/sessao";
import { PublicacaoInvalidaError, publicarEmprestimo } from "@/models/services/publicar-emprestimo.service";

export type EstadoPublicacao = { erro: string; itemId?: string };

export async function publicarEmprestimoAction(
  _estado: EstadoPublicacao,
  dados: FormData,
): Promise<EstadoPublicacao> {
  try {
    const fotos = dados.getAll("fotos").filter((valor): valor is File => valor instanceof File);
    const itemId = await publicarEmprestimo(
      await sessaoAtual(),
      {
        titulo: String(dados.get("titulo") ?? ""),
        categoria: String(dados.get("categoria") ?? ""),
        condicao: String(dados.get("condicao") ?? ""),
        descricao: String(dados.get("descricao") ?? ""),
        valorCentavos: Number(dados.get("valorCentavos")),
      },
      fotos,
    );
    return { erro: "", itemId };
  } catch (erro) {
    if (erro instanceof PublicacaoInvalidaError) return { erro: erro.message };
    console.error("Falha ao publicar empréstimo", erro);
    return { erro: "Não foi possível publicar agora. Tente novamente." };
  }
}
