import type { ItemDetalhe } from "@/models/entities/item-detalhe";

const ITENS: ItemDetalhe[] = [
  {
    id: "1",
    tipo: "doacao",
    titulo: "Furadeira Makita 12V com Maleta",
    descricao:
      "Ainda funciona, mas tem que trocar a bateria por uma nova. Acompanha maleta e brocas.",
    condicao: "Quase Novo",
    localizacao: "Petrolina, PE",
    publicadoEm: "2026-09-02T12:00:00-03:00",
    aceitaPropostas: true,
    imagens: ["/itens/furadeira_2000.jpg"],
    dono: {
      id: "damiao-silva",
      nome: "Damião Silva",
      avaliacao: 4.8,
      quantidadeEmprestimos: 24,
      confiavel: true,
    },
  },
  {
    id: "2",
    tipo: "emprestimo",
    titulo: "Livro: O Design do Dia a Dia",
    descricao:
      "Empresto por até 15 dias. Ótima leitura para designers e quem gosta de usabilidade.",
    condicao: "Bem Cuidado",
    localizacao: "Pinheiros, SP",
    publicadoEm: "2026-09-01T12:00:00-03:00",
    aceitaPropostas: false,
    imagens: ["/itens/livro_legal.jpg"],
    dono: {
      id: "lucas-martins",
      nome: "Lucas Martins",
      avaliacao: 4.9,
      quantidadeEmprestimos: 18,
      confiavel: true,
    },
  },
  {
    id: "3",
    tipo: "doacao",
    titulo: "Violão Acústico Giannini",
    descricao:
      "Doando pra quem estiver precisando. Precisa afinar e trocar as cordas.",
    condicao: "Usado com marcas",
    localizacao: "Centro, SP",
    publicadoEm: "2026-08-30T12:00:00-03:00",
    aceitaPropostas: true,
    imagens: ["/itens/violao_guitarra.jpg"],
    dono: {
      id: "ana-clara",
      nome: "Ana Clara",
      avaliacao: 4.7,
      quantidadeEmprestimos: 12,
      confiavel: true,
    },
  },
  {
    id: "4",
    tipo: "emprestimo",
    titulo: "Barraca de Camping 4 Pessoas",
    descricao:
      "Disponível para empréstimo aos finais de semana. Ideal para trilhas e acampamentos.",
    condicao: "Excelente",
    localizacao: "Butantã, SP",
    publicadoEm: "2026-08-28T12:00:00-03:00",
    aceitaPropostas: false,
    imagens: ["/itens/acampar_lindo.jpg"],
    dono: {
      id: "marina-souza",
      nome: "Marina Souza",
      avaliacao: 4.9,
      quantidadeEmprestimos: 31,
      confiavel: true,
    },
  },
];

export async function buscarItemPorId(id: string): Promise<ItemDetalhe | null> {
  return ITENS.find((item) => item.id === id) ?? null;
}
