import { carregarFeed } from "@/controllers/feed.controller";
import { BarraFiltros } from "@/views/feed/BarraFiltros";
import { CardItem } from "@/views/feed/CardItem";
import { AcessoRestrito } from "@/views/auth/AcessoRestrito";

export const dynamic = "force-dynamic";

export default async function FeedPage({ searchParams }: PageProps<"/feed">) {
  const parametros = await searchParams;
  const categoria = typeof parametros.categoria === "string" ? parametros.categoria : undefined;
  const {
    itens,
    categorias,
    filtroSelecionado,
    listaDesejosSelecionada,
    autenticado,
  } = await carregarFeed(categoria);
  const destinoFeed = filtroSelecionado
    ? `/feed?categoria=${encodeURIComponent(filtroSelecionado)}`
    : "/feed";
  return <main className="mx-auto w-full max-w-[1280px] px-6 py-8">
    <BarraFiltros categorias={categorias} filtroSelecionado={filtroSelecionado} />
    {listaDesejosSelecionada && !autenticado ? (
      <AcessoRestrito
        titulo="Entre para ver sua lista de desejos"
        descricao="Salve seus itens preferidos e encontre todos eles aqui."
        destino="/feed?categoria=lista-de-desejos"
      />
    ) : itens.length ? <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
      {itens.map((item) => <CardItem key={item.id} item={item} autenticado={autenticado} destino={destinoFeed} />)}
    </div> : <p className="mt-12 text-center text-muted">
      {listaDesejosSelecionada
        ? "Sua lista de desejos está vazia. Use o coração dos anúncios para salvar itens."
        : "Nenhum item disponível no momento."}
    </p>}
  </main>;
}
