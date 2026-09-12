/**
 * Utilitário sem regra de negócio: lê a sessão do usuário a partir dos cookies.
 *
 * Este é o único ponto que precisará ser adaptado quando o fluxo de
 * autenticação da aplicação for integrado.
 */

import type { SessaoUsuario } from "@/models/entities/usuario";
import { createClient } from "@/lib/supabase/server";
import { credenciaisSupabase } from "@/lib/supabase/rest";
import { cache } from "react";

export const sessaoAtual = cache(async (): Promise<SessaoUsuario | null> => {
  if (!credenciaisSupabase()) return null;

  try {
    const supabase = await createClient();
    const { data: dadosUsuario, error: erroUsuario } =
      await supabase.auth.getUser();
    const { data: dadosSessao } = await supabase.auth.getSession();
    const usuario = dadosUsuario.user;
    const sessao = dadosSessao.session;
    if (erroUsuario || !usuario || !sessao?.access_token) return null;

    return {
      usuarioId: usuario.id,
      email: usuario.email ?? "",
      token: sessao.access_token,
    };
  } catch {
    return null;
  }
});
