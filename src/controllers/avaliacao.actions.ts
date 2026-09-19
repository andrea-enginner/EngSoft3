"use server";

import { revalidatePath } from "next/cache";
import { sessaoAtual } from "@/lib/supabase/sessao";
import { AvaliacaoInvalidaError, avaliarUsuario } from "@/models/services/avaliacao.service";

export type EstadoAvaliacao = { erro: string; sucesso: boolean };

export async function avaliarUsuarioAction(
  _estado: EstadoAvaliacao,
  dados: FormData,
): Promise<EstadoAvaliacao> {
  try {
    await avaliarUsuario(
      await sessaoAtual(),
      String(dados.get("solicitacaoId") ?? ""),
      String(dados.get("nota") ?? ""),
      String(dados.get("comentario") ?? ""),
    );
    revalidatePath("/emprestimos");
    revalidatePath("/perfil");
    return { erro: "", sucesso: true };
  } catch (erro) {
    if (erro instanceof AvaliacaoInvalidaError) return { erro: erro.message, sucesso: false };
    console.error("Falha ao registrar avaliação", erro);
    return { erro: "Não foi possível registrar a avaliação. Tente novamente.", sucesso: false };
  }
}
