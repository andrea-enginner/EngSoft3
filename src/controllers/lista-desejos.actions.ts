"use server";

import { revalidatePath } from "next/cache";
import { sessaoAtual } from "@/lib/supabase/sessao";
import {
  alternarListaDesejos,
  ListaDesejosError,
} from "@/models/services/lista-desejos.service";

export type ResultadoListaDesejos =
  | { sucesso: true; naListaDesejos: boolean }
  | { sucesso: false; erro: string };

export async function alternarListaDesejosAction(
  anuncioId: string,
): Promise<ResultadoListaDesejos> {
  try {
    const sessao = await sessaoAtual();
    const naListaDesejos = await alternarListaDesejos(
      sessao?.token ?? null,
      anuncioId,
    );
    revalidatePath("/feed");
    revalidatePath(`/itens/${anuncioId}`);
    return { sucesso: true, naListaDesejos };
  } catch (erro) {
    if (erro instanceof ListaDesejosError) {
      return { sucesso: false, erro: erro.message };
    }
    console.error("Falha ao atualizar lista de desejos", erro);
    return {
      sucesso: false,
      erro: "Não foi possível atualizar sua lista agora.",
    };
  }
}
