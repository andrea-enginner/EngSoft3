import { Suspense } from "react";
import { carregarFeed } from "@/controllers/feed.controller";
import { BarraFiltros } from "@/views/feed/BarraFiltros";
import { CampoBusca } from "@/views/feed/CampoBusca";
import { ListaItensFeed } from "@/views/feed/ListaItensFeed";
import { sessaoAtual } from "@/lib/supabase/sessao";

export const dynamic = "force-dynamic";

export default async function FeedPage({ searchParams }: PageProps<"/feed">) {
  const parametros = await searchParams;
  const categoria = typeof parametros.categoria === "string" ? parametros.categoria : undefined;
  const buscaBruta = typeof parametros.busca === "string" ? parametros.busca.trim() : "";
  const termo = buscaBruta || undefined;
  const sessao = await sessaoAtual();
  const parametrosDestino = new URLSearchParams();
  if (categoria) parametrosDestino.set("categoria", categoria);
  if (termo) parametrosDestino.set("busca", termo);
  const destino = parametrosDestino.size
    ? `/feed?${parametrosDestino.toString()}`
    : "/feed";

  const { itens, categorias, filtroSelecionado } = await carregarFeed(
    categoria,
    termo,
    sessao?.token ?? null,
  );
  const mensagemVazio = termo ? `Nenhum item encontrado para "${termo}".` : "Nenhum item disponível no momento.";

  return <main className="mx-auto w-full max-w-[1280px] px-6 py-8">
    <header className="mb-7">
      <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary-500">Catálogo da comunidade</p>
      <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-primary-900 sm:text-3xl">Encontre o que precisa sem precisar comprar</h1>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-muted sm:text-base">Todos os itens deste catálogo estão disponíveis para empréstimo. Escolha o período, envie sua solicitação e combine a retirada com o proprietário.</p>
    </header>
    <div className="flex flex-wrap items-end justify-between gap-3">
      <Suspense fallback={<div className="h-11 w-full min-w-[280px] flex-1 rounded-[10px] border border-border bg-white sm:max-w-md" />}>
        <CampoBusca termoInicial={termo} />
      </Suspense>
      <BarraFiltros categorias={categorias} filtroSelecionado={filtroSelecionado} />
    </div>
    {itens.length ? (
      <ListaItensFeed
        itens={itens}
        autenticado={Boolean(sessao)}
        destino={destino}
      />
    ) : <p className="mt-12 text-center text-muted">{mensagemVazio}</p>}
  </main>;
}
