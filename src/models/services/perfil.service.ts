/**
 * Camada MODEL — as regras do perfil.
 *
 * Decide o que conta como anúncio ativo, como a reputação é derivada e o que é
 * um dado básico válido. Não conhece `FormData`, `Response` nem JSX.
 */

import type { Anuncio } from "@/models/entities/anuncio";
import type { Avaliacao } from "@/models/entities/avaliacao";
import type { EstatisticasPerfil, Perfil } from "@/models/entities/perfil";
import type { DadosBasicos, SessaoUsuario, Usuario } from "@/models/entities/usuario";
import { contarAtivos } from "@/models/entities/anuncio";
import { calcularReputacao } from "@/models/entities/avaliacao";
import { anunciosDeDemonstracao, buscarAnunciosDoUsuario } from "@/models/repositories/anuncio.repository";
import { buscarAvaliacoesDoUsuario } from "@/models/repositories/avaliacao.repository";
import { buscarUsuario, salvarDadosBasicos, usuarioDeDemonstracao } from "@/models/repositories/usuario.repository";
import { listarMeusEmprestimos } from "@/models/services/emprestimo.service";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export class DadosInvalidosError extends Error {}

/**
 * O total de empréstimos vem de outra funcionalidade. Se aquela tabela ainda
 * não existir, o perfil continua abrindo com zero em vez de quebrar a página.
 */
async function contarEmprestimos(): Promise<number> {
  try {
    const { dados } = await listarMeusEmprestimos();
    return dados.length;
  } catch {
    return 0;
  }
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
    contarEmprestimos(),
  ]);

  if (!usuario) {
    const demonstracao = anunciosDeDemonstracao();
    return {
      usuario: usuarioDeDemonstracao(),
      estatisticas: montarEstatisticas(demonstracao, [], emprestimos),
      anuncios: demonstracao,
      avaliacoes: [],
      fonte: "demonstracao",
    };
  }

  const publicados = anuncios ?? [];
  return {
    usuario,
    estatisticas: montarEstatisticas(publicados, avaliacoes, emprestimos),
    anuncios: publicados,
    avaliacoes,
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
  if (avatar && !/^(https?:\/\/|\/)/.test(avatar)) {
    throw new DadosInvalidosError("O endereço da foto deve começar com http://, https:// ou /.");
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
