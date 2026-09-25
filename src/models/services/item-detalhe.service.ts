import { buscarItemPorId } from "@/models/repositories/item-detalhe.repository";
import { listarItensAtivos } from "@/models/repositories/item.repository";
import { obterIdsDesejados } from "@/models/services/lista-desejos.service";

export async function obterItemDetalhe(id: string, token: string | null = null) {
  const idNormalizado = id.trim();
  if (!idNormalizado) return null;

  const [item, itensAtivos, idsDaListaDesejos] = await Promise.all([
    buscarItemPorId(idNormalizado),
    listarItensAtivos(),
    obterIdsDesejados(token),
  ]);
  if (!item) return null;

  const idsDesejados = new Set(idsDaListaDesejos);
  const relacionados = itensAtivos
    .filter((anuncio) =>
      anuncio.id !== idNormalizado
      && anuncio.tipo === "emprestimo"
      && anuncio.impulsionado === true
    )
    .sort((a, b) => {
      const categoriaA = a.categoria === item.categoria ? 1 : 0;
      const categoriaB = b.categoria === item.categoria ? 1 : 0;
      return categoriaB - categoriaA;
    })
    .slice(0, 4)
    .map((anuncio) => ({
      ...anuncio,
      naListaDesejos: idsDesejados.has(anuncio.id),
    }));

  return {
    item: {
      ...item,
      naListaDesejos: idsDesejados.has(idNormalizado),
    },
    relacionados,
  };
}
