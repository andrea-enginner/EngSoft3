import { carregarFeed } from "@/controllers/feed.controller";
import { BarraFiltros } from "@/views/feed/BarraFiltros";
import { CardItem } from "@/views/feed/CardItem";

export const dynamic = "force-dynamic";

export default async function FeedPage() {
  const itens = await carregarFeed();
  return <main className="mx-auto w-full max-w-[1280px] px-6 py-8">
    <BarraFiltros />
    {itens.length ? <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
      {itens.map((item) => <CardItem key={item.id} item={item} />)}
    </div> : <p className="mt-12 text-center text-muted">Nenhum item disponível no momento.</p>}
  </main>;
}
