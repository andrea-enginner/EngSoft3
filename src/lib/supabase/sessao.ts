/**
 * Utilitário sem regra de negócio: lê a sessão do usuário a partir dos cookies.
 *
 * Enquanto a autenticação não estiver implementada, `sessaoAtual()` devolve
 * `null` e a tela cai no modo demonstração — mesmo comportamento já adotado em
 * `emprestimo.repository.ts`.
 */

import type { SessaoUsuario } from "@/models/entities/usuario";
import { createClient } from "@/lib/supabase/server";
import { credenciaisSupabase } from "@/lib/supabase/rest";

export async function sessaoAtual(): Promise<SessaoUsuario | null> {
  if (!credenciaisSupabase()) return null;

  try {
    const supabase = await createClient();
    const { data } = await supabase.auth.getSession();
    const sessao = data.session;
    if (!sessao?.user) return null;

    return {
      usuarioId: sessao.user.id,
      email: sessao.user.email ?? "",
      token: sessao.access_token,
    };
  } catch {
    return null;
  }
}
