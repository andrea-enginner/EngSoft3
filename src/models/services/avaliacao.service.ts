/**
 * Camada MODEL — regras de negócio do envio de avaliação.
 *
 * A elegibilidade (participou do empréstimo, empréstimo concluído, ainda não
 * avaliado por este autor) é garantida pela RPC `avaliar_usuario` no banco —
 * esta camada só valida o formato da entrada e traduz os erros que o
 * Postgres devolve em mensagens que a tela já espera.
 */

import type { SessaoUsuario } from "@/models/entities/usuario";
import { buscarSolicitacoesAvaliadas, criarAvaliacao } from "@/models/repositories/avaliacao.repository";

export class AvaliacaoInvalidaError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AvaliacaoInvalidaError";
  }
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const COMENTARIO_MAXIMO = 500;

function traduzirErroAvaliacao(erro: unknown): never {
  const mensagem = erro instanceof Error ? erro.message : "";
  if (/entre na sua conta|não encontrad|participou|concluíd|avaliou|nota deve estar/i.test(mensagem)) {
    throw new AvaliacaoInvalidaError(mensagem);
  }
  throw erro;
}

export async function listarSolicitacoesAvaliadas(sessao: SessaoUsuario | null): Promise<Set<string>> {
  return buscarSolicitacoesAvaliadas(sessao);
}

export async function avaliarUsuario(
  sessao: SessaoUsuario | null,
  solicitacaoId: string,
  notaBruta: string,
  comentarioBruto: string,
): Promise<string> {
  if (!sessao) throw new AvaliacaoInvalidaError("Entre na sua conta para avaliar.");
  if (!UUID.test(solicitacaoId)) throw new AvaliacaoInvalidaError("Empréstimo inválido.");

  const nota = Number(notaBruta);
  if (!Number.isInteger(nota) || nota < 1 || nota > 5) {
    throw new AvaliacaoInvalidaError("Escolha uma nota de 1 a 5 estrelas.");
  }

  const comentario = comentarioBruto.trim();
  if (comentario.length > COMENTARIO_MAXIMO) {
    throw new AvaliacaoInvalidaError(`O comentário pode ter no máximo ${COMENTARIO_MAXIMO} caracteres.`);
  }

  try {
    return await criarAvaliacao(sessao, solicitacaoId, nota, comentario);
  } catch (erro) {
    traduzirErroAvaliacao(erro);
  }
}
