/**
 * Rota `/feed` — feed de itens.
 *
 * ESTA PÁGINA É SÓ O VISUAL. A lista abaixo está fixa no arquivo de
 * propósito, só para desenhar a tela.
 *
 * Quando você montar as camadas, o caminho é:
 *   1. mover o tipo `ItemFeed` para `src/models/entities/item.ts`;
 *   2. criar `src/models/repositories/item.repository.ts` (de onde o dado vem);
 *   3. criar `src/models/services/item.service.ts` (as regras: filtro, ordem);
 *   4. criar `src/controllers/item.controller.ts` (o que a página chama);
 *   5. apagar a constante ITENS daqui e trocar por:
 *        const itens = await itemController.carregarFeed();
 *
 * A página fica com duas linhas: uma chamada ao controller e o JSX.
 */

import { BarraFiltros } from "@/views/feed/BarraFiltros";
import { CardItem, type ItemFeed } from "@/views/feed/CardItem";

// TODO: dado fixo temporário — sai daqui assim que existir o Model.
const ITENS: ItemFeed[] = [
  {
    id: "1",
    tipo: "doacao",
    titulo: "Furadeira Makita 12V com Maleta",
    descricao:
      "Ainda funciona, mas tem que trocar a bateria por uma nova. Acompanha maleta e brocas.",
    condicao: "Quase Novo",
    local: "Petrolina, PE",
    imagem: "/itens/furadeira_2000.jpg",  
    favorito: true,
  },
  {
    id: "2",
    tipo: "emprestimo",
    titulo: "Livro: O Design do Dia a Dia",
    descricao:
      "Empresto por até 15 dias. Ótima leitura para designers e quem gosta de usabilidade.",
    condicao: "Bem Cuidado",
    local: "Pinheiros, SP",
    imagem: "/itens/livro_legal.jpg",  
    avaliacao: 4.9,
  },
  {
    id: "3",
    tipo: "doacao",
    titulo: "Violão Acústico Giannini",
    descricao:
      "Doando pra quem estiver precisando. Precisa afinar e trocar as cordas.",
    condicao: "Usado com marcas",
    local: "Centro, SP",
    imagem: "/itens/violao_guitarra.jpg",
  },
  {
    id: "4",
    tipo: "emprestimo",
    titulo: "Barraca de Camping 4 Pessoas",
    descricao:
      "Disponível para empréstimo aos finais de semana. Ideal para trilhas e acampamentos.",
    condicao: "Excelente",
    local: "Butantã, SP",
    imagem: "/itens/acampar_lindo.jpg",  
    avaliacao: 4.9,
  },
];

export default function FeedPage() {
  return (
    <main className="mx-auto w-full max-w-[1280px] px-6 py-8">
      <BarraFiltros />

      <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {ITENS.map((item) => (
          <CardItem key={item.id} item={item} />
        ))}
      </div>

      {/* Vira <button onClick={...}> ou um <Link> paginado depois */}
      <div className="mt-7 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <span className="rounded-full bg-primary-100 px-6 py-2.5 text-sm font-semibold text-primary-700">
          Carregar mais itens
        </span>
      </div>
    </main>
  );
}
