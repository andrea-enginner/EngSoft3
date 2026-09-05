/**
 * Camada MODEL — entidade Perfil.
 *
 * Agrega tudo o que a tela de perfil precisa: quem é o usuário, seus números
 * e as listas que alimentam as abas.
 */

import type { Anuncio } from "@/models/entities/anuncio";
import type { Avaliacao, Reputacao } from "@/models/entities/avaliacao";
import type { Usuario } from "@/models/entities/usuario";

export type EstatisticasPerfil = {
  reputacao: Reputacao;
  emprestimos: number;
  ativos: number;
};

export type Perfil = {
  usuario: Usuario;
  estatisticas: EstatisticasPerfil;
  anuncios: Anuncio[];
  avaliacoes: Avaliacao[];
  fonte: "supabase" | "demonstracao";
};
