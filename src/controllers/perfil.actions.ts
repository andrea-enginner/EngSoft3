"use server";

/**
 * Camada CONTROLLER — escrita.
 *
 * Cada função aqui vira um endpoint POST público, então a validação acontece
 * obrigatoriamente no servidor (dentro do service). Este arquivo só traduz
 * `FormData` para o domínio e o erro do domínio para uma mensagem de tela.
 */

import { revalidatePath } from "next/cache";
import { sessaoAtual } from "@/lib/supabase/sessao";
import { DadosInvalidosError, atualizarDadosBasicos } from "@/models/services/perfil.service";

export type EstadoFormulario = {
  status: "sucesso" | "erro";
  mensagem: string;
};

export async function salvarDadosBasicosAction(formulario: FormData): Promise<EstadoFormulario> {
  try {
    await atualizarDadosBasicos(await sessaoAtual(), {
      nome: String(formulario.get("nome") ?? ""),
      email: String(formulario.get("email") ?? ""),
      avatar: String(formulario.get("avatar") ?? ""),
    });

    revalidatePath("/perfil");
    return { status: "sucesso", mensagem: "Perfil atualizado." };
  } catch (erro) {
    if (erro instanceof DadosInvalidosError) {
      return { status: "erro", mensagem: erro.message };
    }
    return { status: "erro", mensagem: "Não foi possível salvar o perfil. Tente novamente." };
  }
}
