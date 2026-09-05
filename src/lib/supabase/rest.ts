/**
 * Utilitário sem regra de negócio: acesso HTTP ao PostgREST do Supabase.
 *
 * Os repositórios usam este módulo em vez do cliente `@supabase/ssr` porque a
 * camada Model não pode importar nada de `next/*` (ver ARQUITETURA.md), e o
 * cliente de servidor depende de `next/headers`. Quem tem acesso aos cookies é
 * o Controller: ele resolve a sessão e repassa o `token` para cá.
 */

type Credenciais = { url: string; chave: string };

export function credenciaisSupabase(): Credenciais | null {
  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const chave =
    process.env.SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !chave) return null;
  return { url, chave };
}

function cabecalhos(credenciais: Credenciais, token: string | null) {
  return {
    apikey: credenciais.chave,
    Authorization: `Bearer ${token ?? credenciais.chave}`,
    "Content-Type": "application/json",
  };
}

/** Retorna `null` quando o Supabase não está configurado no ambiente. */
export async function consultarSupabase<T>(
  consulta: string,
  token: string | null,
): Promise<T[] | null> {
  const credenciais = credenciaisSupabase();
  if (!credenciais) return null;

  const resposta = await fetch(`${credenciais.url}/rest/v1/${consulta}`, {
    headers: cabecalhos(credenciais, token),
    cache: "no-store",
  });
  if (!resposta.ok) {
    throw new Error(`Supabase respondeu com status ${resposta.status}.`);
  }
  return (await resposta.json()) as T[];
}

export async function atualizarSupabase(
  consulta: string,
  token: string | null,
  corpo: Record<string, unknown>,
): Promise<void> {
  const credenciais = credenciaisSupabase();
  if (!credenciais) {
    throw new Error("Supabase não está configurado neste ambiente.");
  }

  const resposta = await fetch(`${credenciais.url}/rest/v1/${consulta}`, {
    method: "PATCH",
    headers: { ...cabecalhos(credenciais, token), Prefer: "return=minimal" },
    body: JSON.stringify(corpo),
    cache: "no-store",
  });
  if (!resposta.ok) {
    throw new Error(`Supabase respondeu com status ${resposta.status}.`);
  }
}
