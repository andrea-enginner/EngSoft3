import { buscarMeusEmprestimos, criarSolicitacaoEmprestimo } from "@/models/repositories/emprestimo.repository";
import type { SessaoUsuario } from "@/models/entities/usuario";

export async function listarMeusEmprestimos(sessao: SessaoUsuario | null) {
  return buscarMeusEmprestimos(sessao);
}

export class SolicitacaoEmprestimoError extends Error {}

export async function solicitarEmprestimo(sessao: SessaoUsuario | null, anuncioId: string, inicioEm: string, confirmado: boolean) {
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
