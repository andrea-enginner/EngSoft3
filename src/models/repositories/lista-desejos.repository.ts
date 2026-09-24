import {
  consultarSupabase,
  executarRpcSupabase,
} from "@/lib/supabase/rest";

type RegistroDesejo = { anuncio_id: string };

export async function listarIdsDesejados(token: string): Promise<string[]> {
  const registros = await consultarSupabase<RegistroDesejo>(
    "lista_desejos?select=anuncio_id&order=criado_em.desc",
    token,
  );
  return registros?.map((registro) => registro.anuncio_id) ?? [];
}

export async function verificarItemDesejado(
  token: string,
  anuncioId: string,
): Promise<boolean> {
  const registros = await consultarSupabase<RegistroDesejo>(
    `lista_desejos?select=anuncio_id&anuncio_id=eq.${encodeURIComponent(anuncioId)}&limit=1`,
    token,
  );
  return Boolean(registros?.length);
}

export function alternarItemDesejado(
  token: string,
  anuncioId: string,
): Promise<boolean> {
  return executarRpcSupabase<boolean>("alternar_lista_desejos", token, {
    p_anuncio_id: anuncioId,
  });
}
