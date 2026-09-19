/**
 * Camada MODEL — de onde vêm e para onde vão as avaliações de usuário.
 *
 * A escrita passa sempre pela RPC `avaliar_usuario` (security definer): quem
 * é "o outro lado" do empréstimo é decidido no banco, então este repositório
 * nunca precisa saber o id de quem está sendo avaliado.
 */

import type { Avaliacao } from "@/models/entities/avaliacao";
import type { SessaoUsuario } from "@/models/entities/usuario";
import { consultarSupabase, executarRpcSupabase } from "@/lib/supabase/rest";

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

/**
 * Empréstimos (solicitação por solicitação) que o usuário logado já avaliou
 * como autor. Usado só para decidir se o pop-up de avaliação deve aparecer —
 * não precisa de RPC nova, a policy de select pública já cobre esta consulta.
 */
export async function buscarSolicitacoesAvaliadas(sessao: SessaoUsuario | null): Promise<Set<string>> {
  if (!sessao) return new Set();

  const registros = await consultarSupabase<{ solicitacao_id: string }>(
    `avaliacoes?select=solicitacao_id&autor_id=eq.${sessao.usuarioId}`,
    sessao.token,
  );
  return new Set((registros ?? []).map((registro) => registro.solicitacao_id));
}

export async function criarAvaliacao(
  sessao: SessaoUsuario,
  solicitacaoId: string,
  nota: number,
  comentario: string,
): Promise<string> {
  const id = await executarRpcSupabase<string>(
    "avaliar_usuario",
    sessao.token,
    { p_solicitacao_id: solicitacaoId, p_nota: nota, p_comentario: comentario },
  );
  return String(id ?? "");
}
