import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { obterEmprestimoParaEdicao } from "@/controllers/publicar-emprestimo.controller";
import { sessaoAtual } from "@/lib/supabase/sessao";
import { AcessoRestrito } from "@/views/auth/AcessoRestrito";
import { PublicarEmprestimoView } from "@/views/publicar/PublicarEmprestimoView";

export const metadata: Metadata = {
  title: "Publicar empréstimo",
};

export default async function PublicarPage({ searchParams }: { searchParams: Promise<{ editar?: string | string[] }> }) {
  const sessao = await sessaoAtual();
  if (!sessao) {
    return <AcessoRestrito titulo="Entre para publicar um item" descricao="Crie uma conta ou entre para disponibilizar seus itens à comunidade." destino="/publicar" />;
  }

  const parametro = (await searchParams).editar;
  const id = Array.isArray(parametro) ? parametro[0] : parametro;
  const anuncio = id ? await obterEmprestimoParaEdicao(id) : undefined;
  if (id && !anuncio) notFound();

  return <PublicarEmprestimoView anuncio={anuncio ?? undefined} />;
}
