/**
 * Camada MODEL — de onde vêm as avaliações recebidas pelo usuário.
 *
 * A tabela ainda não é alimentada por nenhuma tela: a consulta existe para que
 * a aba "Avaliações" e a nota de reputação passem a funcionar assim que o
 * histórico começar a ser gravado, sem mexer nas camadas de cima.
 */

import type { Avaliacao } from "@/models/entities/avaliacao";
import type { SessaoUsuario } from "@/models/entities/usuario";
import { consultarSupabase } from "@/lib/supabase/rest";

type RegistroAvaliacao = {
  id: string | number;
  autor_nome?: string | null;
  autor_avatar_url?: string | null;
  nota?: number | null;
  comentario?: string | null;
  criado_em?: string | null;
};

function normalizar(registro: RegistroAvaliacao): Avaliacao {
  return {
    id: String(registro.id),
    autor: registro.autor_nome?.trim() || "Usuário do Ciclo",
    avatarAutor: registro.autor_avatar_url?.trim() || null,
    nota: registro.nota ?? 0,
    comentario: registro.comentario?.trim() || "",
    criadaEm: registro.criado_em ?? new Date().toISOString(),
  };
}

export async function buscarAvaliacoesDoUsuario(sessao: SessaoUsuario | null): Promise<Avaliacao[]> {
  if (!sessao) return [];

  const registros = await consultarSupabase<RegistroAvaliacao>(
    `avaliacoes?select=*&avaliado_id=eq.${sessao.usuarioId}&order=criado_em.desc`,
    sessao.token,
  );
  return registros ? registros.map(normalizar) : [];
}
