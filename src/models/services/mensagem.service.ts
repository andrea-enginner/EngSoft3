import type { SessaoUsuario } from "@/models/entities/usuario";
import {
  buscarPainelMensagens,
  criarConversa,
  salvarLeitura,
  salvarMensagem,
  salvarRespostaSolicitacao,
} from "@/models/repositories/mensagem.repository";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export class MensagemInvalidaError extends Error {}

function validarConteudo(conteudo: string): string {
  const normalizado = conteudo.trim();
  if (!normalizado) throw new MensagemInvalidaError("Escreva uma mensagem antes de enviar.");
  if (normalizado.length > 500) {
    throw new MensagemInvalidaError("A mensagem deve ter no máximo 500 caracteres.");
  }
  return normalizado;
}

function exigirSessao(sessao: SessaoUsuario | null): SessaoUsuario {
  if (!sessao) throw new MensagemInvalidaError("Entre na sua conta para usar as mensagens.");
  return sessao;
}

export async function carregarPainelMensagens(
  sessao: SessaoUsuario | null,
  conversaId?: string,
) {
  return buscarPainelMensagens(sessao, conversaId);
}

export async function iniciarConversa(
  sessao: SessaoUsuario | null,
  anuncioId: string,
  conteudo: string,
) {
  const mensagem = validarConteudo(conteudo);
  if (!UUID.test(anuncioId)) {
    return { conversaId: "demo-solicitado", fonte: "demonstracao" as const };
  }
  const conversaId = await criarConversa(exigirSessao(sessao), anuncioId, mensagem);
  return { conversaId, fonte: "supabase" as const };
}

export async function enviarMensagem(
  sessao: SessaoUsuario | null,
  conversaId: string,
  conteudo: string,
) {
  return salvarMensagem(exigirSessao(sessao), conversaId, validarConteudo(conteudo));
}

export async function responderSolicitacao(
  sessao: SessaoUsuario | null,
  conversaId: string,
  aceitar: boolean,
) {
  return salvarRespostaSolicitacao(exigirSessao(sessao), conversaId, aceitar);
}

export async function marcarConversaComoLida(
  sessao: SessaoUsuario | null,
  conversaId: string,
) {
  if (!sessao) return;
  await salvarLeitura(sessao, conversaId);
}
