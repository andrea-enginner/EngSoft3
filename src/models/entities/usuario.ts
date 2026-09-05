/**
 * Camada MODEL — entidade Usuário.
 *
 * Tipos e funções puras do domínio. Nada de React, banco ou formatação de tela.
 */

export type Usuario = {
  id: string;
  nome: string;
  email: string;
  local: string;
  avatar: string | null;
  membroDesde: string;
};

/**
 * Identificação do usuário autenticado. O `token` é repassado ao PostgREST
 * para que as políticas de RLS enxerguem `auth.uid()`.
 */
export type SessaoUsuario = {
  usuarioId: string;
  email: string;
  token: string;
};

export type DadosBasicos = {
  nome: string;
  email: string;
  avatar: string | null;
};

export function iniciaisDe(nome: string): string {
  const partes = nome.trim().split(/\s+/).filter(Boolean);
  if (partes.length === 0) return "?";
  const primeira = partes[0].charAt(0);
  const ultima = partes.length > 1 ? partes[partes.length - 1].charAt(0) : "";
  return `${primeira}${ultima}`.toUpperCase();
}
