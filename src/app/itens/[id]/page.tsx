import { notFound } from "next/navigation";
import { carregarItemDetalhe } from "@/controllers/item-detalhe.controller";
import { sessaoAtual } from "@/lib/supabase/sessao";
import { DetalheItemView } from "@/views/itens/DetalheItemView";

export default async function PaginaDetalheItem({ params }: PageProps<"/itens/[id]">) {
  const { id } = await params;
  const item = await carregarItemDetalhe(id);

  if (!item) notFound();

  return <DetalheItemView item={item} autenticado={Boolean(await sessaoAtual())} />;
}
