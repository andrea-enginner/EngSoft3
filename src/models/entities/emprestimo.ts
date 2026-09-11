import type { UnidadeDuracao } from "@/models/entities/item";

export type StatusEmprestimo = "andamento" | "devolucao" | "concluido" | "aguardando" | "negociacao" | "recusado";
export type PapelEmprestimo = "dono" | "interessado";

export type Emprestimo = {
  id: string;
  anuncioId: string;
  papel: PapelEmprestimo;
  nome: string;
  pessoa: string;
  inicioEm: string;
  fimEm: string;
  criadoEm: string;
  status: StatusEmprestimo;
  valorUnitarioCentavos: number;
  valorTotalCentavos: number;
  duracaoQuantidade: number;
  duracaoUnidade: UnidadeDuracao;
  imagem: string | null;
};
