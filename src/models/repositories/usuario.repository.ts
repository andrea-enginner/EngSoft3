/**
 * Camada MODEL — de onde vem o dado do usuário.
 *
 * Trocar de banco mexe só aqui. Sem regra de negócio: apenas busca, gravação e
 * a tradução do registro cru para a entidade do domínio.
 */

import type { DadosBasicos, SessaoUsuario, Usuario } from "@/models/entities/usuario";
import { atualizarSupabase, consultarSupabase } from "@/lib/supabase/rest";

/**
 * Perfil exibido enquanto a autenticação não existe ou o Supabase não está
 * configurado. As iniciais "JP" acompanham o avatar provisório do cabeçalho.
 */
const USUARIO_DEMONSTRACAO: Usuario = {
  id: "demonstracao",
  nome: "João Pedro",
  email: "joao.pedro@exemplo.com",
  local: "Petrolina, PE",
  avatar: null,
  membroDesde: "2022-03-14T00:00:00.000Z",
};

type RegistroPerfil = {
  id: string;
  nome?: string | null;
  email?: string | null;
  cidade?: string | null;
  estado?: string | null;
  avatar_url?: string | null;
  criado_em?: string | null;
};

function normalizar(registro: RegistroPerfil, sessao: SessaoUsuario): Usuario {
  const local = [registro.cidade, registro.estado].filter(Boolean).join(", ");

  return {
    id: registro.id,
    nome: registro.nome?.trim() || "Sem nome",
    email: registro.email?.trim() || sessao.email,
    local: local || "Local não informado",
    avatar: registro.avatar_url?.trim() || null,
    membroDesde: registro.criado_em ?? new Date().toISOString(),
  };
}

export async function buscarUsuario(sessao: SessaoUsuario | null): Promise<Usuario | null> {
  if (!sessao) return null;

  const registros = await consultarSupabase<RegistroPerfil>(
    `perfis?select=*&id=eq.${sessao.usuarioId}&limit=1`,
    sessao.token,
  );
  const registro = registros?.[0];
  return registro ? normalizar(registro, sessao) : null;
}

export function usuarioDeDemonstracao(): Usuario {
  return USUARIO_DEMONSTRACAO;
}

export async function salvarDadosBasicos(
  sessao: SessaoUsuario,
  dados: DadosBasicos,
): Promise<void> {
  await atualizarSupabase(`perfis?id=eq.${sessao.usuarioId}`, sessao.token, {
    nome: dados.nome,
    email: dados.email,
    avatar_url: dados.avatar,
  });
}
