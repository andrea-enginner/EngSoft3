import type { SessaoUsuario } from "@/models/entities/usuario";
import {
  buscarPainelMensagens,
  criarDownloadAnexo,
  criarConversa,
  salvarAnexoMensagem,
  salvarLeitura,
  salvarMensagem,
  salvarRespostaSolicitacao,
} from "@/models/repositories/mensagem.repository";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const VINTE_MIB = 20 * 1024 * 1024;
const TIPOS_ANEXO = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

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

function normalizarNomeArquivo(nome: string): string {
  const normalizado = nome
    .split(/[\\/]/)
    .pop()
    ?.replace(/[\u0000-\u001f\u007f]/g, "")
    .trim() ?? "";
  if (!normalizado || normalizado.length > 180) {
    throw new MensagemInvalidaError("O nome do arquivo deve ter até 180 caracteres.");
  }
  return normalizado;
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

export async function enviarAnexo(
  sessao: SessaoUsuario | null,
  conversaId: string,
  arquivo: File,
  legenda: string,
) {
  const usuario = exigirSessao(sessao);
  if (!UUID.test(conversaId)) throw new MensagemInvalidaError("Conversa inválida.");
  if (!(arquivo instanceof File) || arquivo.size === 0) {
    throw new MensagemInvalidaError("Selecione um arquivo para enviar.");
  }
  if (arquivo.size > VINTE_MIB) {
    throw new MensagemInvalidaError("O arquivo deve ter no máximo 20 MiB.");
  }
  if (!TIPOS_ANEXO.has(arquivo.type)) {
    throw new MensagemInvalidaError(
      "Formato não permitido. Envie JPEG, PNG, WebP, PDF ou DOCX.",
    );
  }

  const nome = normalizarNomeArquivo(arquivo.name);
  const legendaNormalizada = legenda.trim();
  if (legendaNormalizada.length > 500) {
    throw new MensagemInvalidaError("A legenda deve ter no máximo 500 caracteres.");
  }

  try {
    return await salvarAnexoMensagem(
      usuario,
      conversaId,
      legendaNormalizada || `📎 ${nome}`,
      arquivo,
      nome,
    );
  } catch (erro) {
    throw new MensagemInvalidaError(
      "Não foi possível enviar o arquivo. Tente novamente.",
      { cause: erro },
    );
  }
}

export async function obterDownloadAnexo(
  sessao: SessaoUsuario | null,
  mensagemId: string,
) {
  if (!UUID.test(mensagemId)) throw new MensagemInvalidaError("Anexo inválido.");
  return criarDownloadAnexo(exigirSessao(sessao), mensagemId);
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
