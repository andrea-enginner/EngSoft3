import { listarItensAtivos } from "@/models/repositories/item.repository";
import { obterIdsDesejados } from "@/models/services/lista-desejos.service";

export const FILTRO_LISTA_DESEJOS = "lista-de-desejos";

function compararCategoria(valor: string) {
  return valor.trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

export async function carregarItensDoFeed(
  categoria?: string,
  token: string | null = null,
) {
  const idsDesejados = new Set(await obterIdsDesejados(token));
  const emprestimos = (await listarItensAtivos()).filter(
    (item) => item.tipo === "emprestimo",
  ).map((item) => ({
    ...item,
    naListaDesejos: idsDesejados.has(item.id),
  }));
  const categorias = Array.from(
    new Set(
      emprestimos
        .map((item) => item.categoria?.trim())
        .filter((valor): valor is string => Boolean(valor)),
    ),
  ).sort((a, b) => a.localeCompare(b, "pt-BR"));
  const categoriaValida = categorias.find(
    (opcao) => compararCategoria(opcao) === compararCategoria(categoria ?? ""),
  );
  const listaDesejosSelecionada = categoria === FILTRO_LISTA_DESEJOS;

  return {
    categorias,
    filtroSelecionado: listaDesejosSelecionada
      ? FILTRO_LISTA_DESEJOS
      : categoriaValida,
    listaDesejosSelecionada,
    itens: listaDesejosSelecionada
      ? emprestimos.filter((item) => item.naListaDesejos)
      : categoriaValida
      ? emprestimos.filter(
          (item) =>
            item.categoria &&
            compararCategoria(item.categoria) === compararCategoria(categoriaValida),
        )
      : emprestimos,
  };
}
