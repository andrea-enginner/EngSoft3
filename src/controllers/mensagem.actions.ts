"use server";

import { revalidatePath } from "next/cache";
import { sessaoAtual } from "@/lib/supabase/sessao";
import type {
  ResultadoConversa,
  ResultadoMensagem,
  ResultadoSolicitacao,
} from "@/models/entities/mensagem";
import {
  enviarAnexo,
  iniciarConversa,
  enviarMensagem,
  marcarConversaComoLida,
  MensagemInvalidaError,
  responderSolicitacao,
} from "@/models/services/mensagem.service";

function mensagemDeErro(erro: unknown): string {
  if (erro instanceof MensagemInvalidaError) return erro.message;
  if (erro instanceof Error && erro.message) return erro.message;
  return "Não foi possível concluir a operação. Tente novamente.";
}

export async function iniciarConversaAction(
  anuncioId: string,
  conteudo: string,
): Promise<ResultadoConversa> {
  try {
    const resultado = await iniciarConversa(await sessaoAtual(), anuncioId, conteudo);
    revalidatePath("/mensagens");
    revalidatePath("/emprestimos");
    return { sucesso: true, conversaId: resultado.conversaId, fonte: resultado.fonte };
  } catch (erro) {
    return { sucesso: false, erro: mensagemDeErro(erro) };
  }
}

export async function enviarMensagemAction(
  conversaId: string,
  conteudo: string,
): Promise<ResultadoMensagem> {
  try {
    const mensagem = await enviarMensagem(await sessaoAtual(), conversaId, conteudo);
    revalidatePath(`/mensagens/${conversaId}`);
    return { sucesso: true, mensagem };
  } catch (erro) {
    return { sucesso: false, erro: mensagemDeErro(erro) };
  }
}

export async function enviarAnexoAction(
  conversaId: string,
  dados: FormData,
): Promise<ResultadoMensagem> {
  try {
    const arquivo = dados.get("arquivo");
    if (!(arquivo instanceof File)) {
      throw new MensagemInvalidaError("Selecione um arquivo para enviar.");
    }

    const mensagem = await enviarAnexo(
      await sessaoAtual(),
      conversaId,
      arquivo,
      String(dados.get("legenda") ?? ""),
    );
    revalidatePath(`/mensagens/${conversaId}`);
    return { sucesso: true, mensagem };
  } catch (erro) {
    return { sucesso: false, erro: mensagemDeErro(erro) };
  }
}

export async function responderSolicitacaoAction(
  conversaId: string,
  aceitar: boolean,
): Promise<ResultadoSolicitacao> {
  try {
    const status = await responderSolicitacao(await sessaoAtual(), conversaId, aceitar);
    revalidatePath("/mensagens");
    revalidatePath(`/mensagens/${conversaId}`);
    revalidatePath("/emprestimos");
    return { sucesso: true, status };
  } catch (erro) {
    return { sucesso: false, erro: mensagemDeErro(erro) };
  }
}

export async function marcarConversaComoLidaAction(conversaId: string): Promise<void> {
  await marcarConversaComoLida(await sessaoAtual(), conversaId);
}
