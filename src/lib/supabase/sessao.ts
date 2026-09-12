/**
 * Utilitário sem regra de negócio: lê a sessão do usuário a partir dos cookies.
 *
 * Este é o único ponto que precisará ser adaptado quando o fluxo de
 * autenticação da aplicação for integrado.
 */

import type { SessaoUsuario } from "@/models/entities/usuario";
import { createClient } from "@/lib/supabase/server";
import { credenciaisSupabase } from "@/lib/supabase/rest";

export async function sessaoAtual(): Promise<SessaoUsuario | null> {
  if (!credenciaisSupabase()) return null;

  try {
    const supabase = await createClient();
    const [{ data: dadosUsuario, error: erroUsuario }, { data: dadosSessao }] =
      await Promise.all([supabase.auth.getUser(), supabase.auth.getSession()]);
    const usuario = dadosUsuario.user;
    const sessao = dadosSessao.session;
    if (erroUsuario || !usuario || !sessao) return null;

    return {
      usuarioId: usuario.id,
      email: usuario.email ?? "",
      token: sessao.access_token,
    };
  } catch {
    return null;
  }
}
