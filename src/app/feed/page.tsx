import { Suspense } from "react";
import { carregarFeed } from "@/controllers/feed.controller";
import { BarraFiltros } from "@/views/feed/BarraFiltros";
import { CampoBusca } from "@/views/feed/CampoBusca";
import { ListaItensFeed } from "@/views/feed/ListaItensFeed";
import { IconeCiclo } from "@/views/comuns/Icones";
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
    <header className="relative mb-7 overflow-hidden rounded-[2rem] border border-white/15 bg-[#7054b2] px-6 py-9 text-white shadow-xl shadow-[#392567]/20 sm:px-9 sm:py-11">
      <span aria-hidden="true" className="absolute inset-0 bg-cover bg-[position:68%_54%] opacity-20" style={{ backgroundImage: "url('/auth-background.jpg')" }} />
      <span aria-hidden="true" className="absolute inset-0 bg-[#6545a8]/80" />
      <span aria-hidden="true" className="absolute inset-0 bg-gradient-to-r from-[#5b4786]/90 via-[#654f91]/65 to-[#504a70]/75" />
      <span aria-hidden="true" className="absolute -right-16 -top-24 h-64 w-64 rounded-full border-[34px] border-white/10" />
      <span aria-hidden="true" className="absolute -bottom-32 left-1/3 h-56 w-[34rem] -rotate-6 rounded-[50%] border-[38px] border-[#c9b9ed]/15" />
      <span aria-hidden="true" className="absolute right-1/4 top-1/2 h-24 w-24 -translate-y-1/2 rounded-full bg-[#bca7ec]/25 blur-2xl" />
      <div className="relative flex max-w-5xl items-center gap-4 sm:gap-6">
        <span className="grid h-14 w-14 shrink-0 -rotate-6 place-items-center rounded-2xl border border-white/30 bg-gradient-to-br from-[#f6d778] to-[#e9b949] text-[#4d2898] shadow-[0_12px_30px_rgba(39,22,72,.3)] ring-4 ring-white/10 sm:h-16 sm:w-16">
          <IconeCiclo className="h-8 w-8 sm:h-9 sm:w-9" />
        </span>
        <h1 className="text-2xl font-extrabold leading-tight tracking-tight drop-shadow-sm sm:text-3xl lg:text-[2rem]">
          Precisa de algo <span className="relative inline-block text-[#ffe28a] after:absolute after:inset-x-0 after:-bottom-0.5 after:h-1 after:origin-left after:-rotate-1 after:rounded-full after:bg-[#f2c94c]/70">agora?</span>
          <span className="mt-1 block text-white/90">Pegue emprestado perto de você. <span className="inline-block rounded-lg bg-white/95 px-2 py-0.5 text-[#4d2898] shadow-md shadow-[#392567]/20">Evite uma compra desnecessária.</span></span>
        </h1>
      </div>
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
