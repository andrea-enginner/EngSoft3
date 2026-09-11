/**
 * Camada MODEL — as regras do perfil.
 *
 * Decide o que conta como anúncio ativo, como a reputação é derivada e o que é
 * um dado básico válido. Não conhece `FormData`, `Response` nem JSX.
 */

import type { Anuncio } from "@/models/entities/anuncio";
import type { Avaliacao } from "@/models/entities/avaliacao";
import type { Emprestimo, StatusEmprestimo } from "@/models/entities/emprestimo";
import type { EstatisticasPerfil, Perfil } from "@/models/entities/perfil";
import type { DadosBasicos, DadosLocalizacao, SessaoUsuario, Usuario } from "@/models/entities/usuario";
import { contarAtivos } from "@/models/entities/anuncio";
import { calcularReputacao } from "@/models/entities/avaliacao";
import { anunciosDeDemonstracao, buscarAnunciosDoUsuario } from "@/models/repositories/anuncio.repository";
import { buscarAvaliacoesDoUsuario } from "@/models/repositories/avaliacao.repository";
import {
  buscarUsuario,
  salvarDadosBasicos,
  salvarLocalizacao,
  usuarioDeDemonstracao,
} from "@/models/repositories/usuario.repository";
import { listarMeusEmprestimos } from "@/models/services/emprestimo.service";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const UF_VALIDA = /^[A-Z]{2}$/;

export class DadosInvalidosError extends Error {}

/**
 * O histórico e o total de empréstimos vêm de outra funcionalidade. Se aquela
 * tabela ainda não existir, o perfil continua abrindo com listas vazias em
 * vez de quebrar a página — inclusive para um perfil novo, que ainda não tem
 * nenhum empréstimo.
 */
async function buscarEmprestimos(): Promise<Emprestimo[]> {
  try {
    const { dados } = await listarMeusEmprestimos();
    return dados;
  } catch {
    return [];
  }
}

/**
 * Um empréstimo entra no histórico quando a transação já terminou. Nesta
 * regra de negócio, "devolução" já conta como concluído — não é uma etapa
 * intermediária.
 */
const STATUS_NO_HISTORICO: StatusEmprestimo[] = ["concluido", "devolucao"];

function montarHistorico(emprestimos: Emprestimo[]): Emprestimo[] {
  return emprestimos.filter((emprestimo) => STATUS_NO_HISTORICO.includes(emprestimo.status));
}

function montarEstatisticas(anuncios: Anuncio[], avaliacoes: Avaliacao[], emprestimos: number): EstatisticasPerfil {
  return {
    reputacao: calcularReputacao(avaliacoes),
    emprestimos,
    ativos: contarAtivos(anuncios),
  };
}

export async function carregarPerfil(sessao: SessaoUsuario | null): Promise<Perfil> {
  const [usuario, anuncios, avaliacoes, emprestimos] = await Promise.all([
    buscarUsuario(sessao),
    buscarAnunciosDoUsuario(sessao),
    buscarAvaliacoesDoUsuario(sessao),
    buscarEmprestimos(),
  ]);

  const historico = montarHistorico(emprestimos);

  if (!usuario) {
    const demonstracao = anunciosDeDemonstracao();
    return {
      usuario: usuarioDeDemonstracao(),
      estatisticas: montarEstatisticas(demonstracao, [], emprestimos.length),
      anuncios: demonstracao,
      avaliacoes: [],
      historico,
      fonte: "demonstracao",
    };
  }

  const publicados = anuncios ?? [];
  return {
    usuario,
    estatisticas: montarEstatisticas(publicados, avaliacoes, emprestimos.length),
    anuncios: publicados,
    avaliacoes,
    historico,
    fonte: "supabase",
  };
}

function validar(dados: DadosBasicos): DadosBasicos {
  const nome = dados.nome.trim();
  const email = dados.email.trim();
  const avatar = dados.avatar?.trim() ?? "";

  if (nome.length < 3) {
    throw new DadosInvalidosError("Informe um nome com pelo menos 3 caracteres.");
  }
  if (!EMAIL.test(email)) {
    throw new DadosInvalidosError("Informe um e-mail válido.");
  }
  if (avatar && !/^(https?:\/\/|\/|data:image\/)/.test(avatar)) {
    throw new DadosInvalidosError("A foto enviada não é uma imagem válida.");
  }

  return { nome, email, avatar: avatar || null };
}

export async function atualizarDadosBasicos(
  sessao: SessaoUsuario | null,
  dados: DadosBasicos,
): Promise<Usuario> {
  const validados = validar(dados);

  if (!sessao) {
    throw new DadosInvalidosError(
      "Entre na sua conta para salvar as alterações do perfil.",
    );
  }

  await salvarDadosBasicos(sessao, validados);
  const atualizado = await buscarUsuario(sessao);
  if (!atualizado) {
    throw new DadosInvalidosError("Não foi possível confirmar a atualização do perfil.");
  }
  return atualizado;
}

function validarLocalizacao(dados: DadosLocalizacao): DadosLocalizacao {
  const cidade = dados.cidade.trim();
  const estado = dados.estado.trim().toUpperCase();

  if (cidade.length < 2) {
    throw new DadosInvalidosError("Informe uma cidade válida.");
  }
  if (!UF_VALIDA.test(estado)) {
    throw new DadosInvalidosError("Informe a sigla do estado com 2 letras (ex: PE).");
  }

  return { cidade, estado };
}

export async function atualizarLocalizacao(
  sessao: SessaoUsuario | null,
  dados: DadosLocalizacao,
): Promise<Usuario> {
  const validados = validarLocalizacao(dados);

  if (!sessao) {
    throw new DadosInvalidosError(
      "Entre na sua conta para salvar as alterações de localização.",
    );
  }

  await salvarLocalizacao(sessao, validados);
  const atualizado = await buscarUsuario(sessao);
  if (!atualizado) {
    throw new DadosInvalidosError("Não foi possível confirmar a atualização do perfil.");
  }
  return atualizado;
}
