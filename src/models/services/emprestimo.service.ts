import {
  buscarMeusEmprestimos,
  criarSolicitacaoEmprestimo,
  registrarDevolucaoEmprestimo,
  registrarRecebimentoEmprestimo,
} from "@/models/repositories/emprestimo.repository";
import type { SessaoUsuario } from "@/models/entities/usuario";

export async function listarMeusEmprestimos(sessao: SessaoUsuario | null = null) {
  return buscarMeusEmprestimos(sessao);
}

export class SolicitacaoEmprestimoError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SolicitacaoEmprestimoError";
  }
}

export class ControleEmprestimoError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ControleEmprestimoError";
  }
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function validarControle(sessao: SessaoUsuario | null, solicitacaoId: string): SessaoUsuario {
  if (!sessao) throw new ControleEmprestimoError("Entre na sua conta para atualizar o empréstimo.");
  if (!UUID.test(solicitacaoId)) throw new ControleEmprestimoError("Empréstimo inválido.");
  return sessao;
}

function traduzirErroControle(erro: unknown): never {
  const mensagem = erro instanceof Error ? erro.message : "";
  if (/somente|não encontrad|nao encontrad|pagamento|andamento|devolu|início|inicio/i.test(mensagem)) {
    throw new ControleEmprestimoError(mensagem);
  }
  throw erro;
}

export async function informarDevolucao(
  sessao: SessaoUsuario | null,
  solicitacaoId: string,
): Promise<string> {
  try {
    return await registrarDevolucaoEmprestimo(
      validarControle(sessao, solicitacaoId),
      solicitacaoId,
    );
  } catch (erro) {
    traduzirErroControle(erro);
  }
}

export async function confirmarRecebimento(
  sessao: SessaoUsuario | null,
  solicitacaoId: string,
): Promise<string> {
  try {
    return await registrarRecebimentoEmprestimo(
      validarControle(sessao, solicitacaoId),
      solicitacaoId,
    );
  } catch (erro) {
    traduzirErroControle(erro);
  }
}

export async function solicitarEmprestimo(
  sessao: SessaoUsuario | null,
  anuncioId: string,
  inicioEm: string,
  confirmado: boolean,
) {
  if (!sessao) throw new SolicitacaoEmprestimoError("Entre na sua conta para solicitar o empréstimo.");
  if (!confirmado) throw new SolicitacaoEmprestimoError("Confirme que leu as condições do empréstimo.");
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(anuncioId)) {
    throw new SolicitacaoEmprestimoError("Anúncio inválido.");
  }
  const inicio = new Date(inicioEm);
  if (!Number.isFinite(inicio.getTime()) || inicio.getTime() <= Date.now()) {
    throw new SolicitacaoEmprestimoError("Escolha uma data e hora de início futuras.");
  }
  return criarSolicitacaoEmprestimo(sessao, anuncioId, inicio.toISOString());
}
