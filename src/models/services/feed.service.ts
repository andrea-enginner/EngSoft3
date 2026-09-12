import { listarItensAtivos } from "@/models/repositories/item.repository";

function compararCategoria(valor: string) {
  return valor.trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

export async function carregarItensDoFeed(categoria?: string) {
  const emprestimos = (await listarItensAtivos()).filter(
    (item) => item.tipo === "emprestimo",
  );
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

  return {
    categorias,
    categoriaSelecionada: categoriaValida,
    itens: categoriaValida
      ? emprestimos.filter(
          (item) =>
            item.categoria &&
            compararCategoria(item.categoria) === compararCategoria(categoriaValida),
        )
      : emprestimos,
  };
}
