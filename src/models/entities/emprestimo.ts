import type { UnidadeDuracao } from "@/models/entities/item";
import type { StatusPagamento } from "@/models/entities/pagamento";

export type StatusEmprestimo =
  | "aguardando"
  | "aceito"
  | "negociacao"
  | "andamento"
  | "devolucao"
  | "concluido"
  | "recusado";

export type PapelEmprestimo = "dono" | "interessado";

export type Emprestimo = {
  id: string;
  anuncioId: string;
  conversaId?: string;
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
  statusPagamento?: StatusPagamento;
};
