import { Suspense } from "react";
import { carregarFeed } from "@/controllers/feed.controller";
import { BarraFiltros } from "@/views/feed/BarraFiltros";
import { CampoBusca } from "@/views/feed/CampoBusca";
import { CardItem } from "@/views/feed/CardItem";
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
    <div className="flex flex-wrap items-end justify-between gap-3">
      <Suspense fallback={<div className="h-11 w-full min-w-[280px] flex-1 rounded-[10px] border border-border bg-white sm:max-w-md" />}>
        <CampoBusca termoInicial={termo} />
      </Suspense>
      <BarraFiltros categorias={categorias} filtroSelecionado={filtroSelecionado} />
    </div>
    {itens.length ? <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
      {itens.map((item) => (
        <CardItem
          key={item.id}
          item={item}
          autenticado={Boolean(sessao)}
          destino={destino}
        />
      ))}
    </div> : <p className="mt-12 text-center text-muted">{mensagemVazio}</p>}
  </main>;
}
