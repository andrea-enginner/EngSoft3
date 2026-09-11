import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { credenciaisSupabase } from "@/lib/supabase/rest";
import type { NovoEmprestimo } from "@/models/entities/item";
import type { SessaoUsuario } from "@/models/entities/usuario";

function clienteAutenticado(sessao: SessaoUsuario): SupabaseClient {
  const credenciais = credenciaisSupabase();
  if (!credenciais) throw new Error("Supabase não está configurado neste ambiente.");
  return createClient(credenciais.url, credenciais.chave, {
    global: { headers: { Authorization: `Bearer ${sessao.token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function extensao(arquivo: File): string {
  return { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" }[arquivo.type] ?? "bin";
}

export class FalhaRollbackStorageError extends Error {
  constructor(causaOriginal: unknown, causaLimpeza: unknown) {
    super("Falha ao desfazer o envio das imagens.", {
      cause: new AggregateError([causaOriginal, causaLimpeza]),
    });
  }
}

export async function salvarEmprestimo(
  sessao: SessaoUsuario,
  emprestimo: NovoEmprestimo,
  fotos: File[],
): Promise<string> {
  const supabase = clienteAutenticado(sessao);
  const caminhos: string[] = [];

  try {
    for (const [indice, foto] of fotos.entries()) {
      const caminho = `${sessao.usuarioId}/${emprestimo.id}/${indice + 1}.${extensao(foto)}`;
      const { error } = await supabase.storage.from("anuncios").upload(caminho, foto, {
        contentType: foto.type,
        upsert: false,
      });
      if (error) throw error;
      caminhos.push(caminho);
    }

    const { data, error } = await supabase.rpc("publicar_emprestimo", {
      p_id: emprestimo.id,
      p_titulo: emprestimo.titulo,
      p_categoria: emprestimo.categoria,
      p_condicao: emprestimo.condicao,
      p_descricao: emprestimo.descricao,
      p_valor_centavos: emprestimo.valorCentavos,
      p_imagens: caminhos,
    });
    if (error) throw error;
    return String(data ?? emprestimo.id);
  } catch (erro) {
    if (caminhos.length) {
      const { error: erroLimpeza } = await supabase.storage.from("anuncios").remove(caminhos);
      if (erroLimpeza) throw new FalhaRollbackStorageError(erro, erroLimpeza);
    }
    throw erro;
  }
}
