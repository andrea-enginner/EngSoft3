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
    const [{ data: usuario }, { data: dadosSessao }] = await Promise.all([
      supabase.auth.getUser(),
      supabase.auth.getSession(),
    ]);
    const sessao = dadosSessao.session;
    if (!usuario.user || !sessao?.access_token) return null;

    return {
      usuarioId: usuario.user.id,
      email: usuario.user.email ?? "",
      token: sessao.access_token,
    };
  } catch {
    return null;
  }
}
