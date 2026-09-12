import type { StatusEmprestimo } from "@/models/entities/emprestimo";

export type StatusPagamento =
  | "pendente"
  | "processando"
  | "aprovado"
  | "recusado"
  | "cancelado";

export type DetalhesPagamento = {
  solicitacaoId: string;
  anuncioId: string;
  titulo: string;
  proprietario: string;
  papel: "dono" | "interessado";
  inicioEm: string;
  fimEm: string;
  statusSolicitacao: StatusEmprestimo;
  valorCentavos: number;
  imagem: string | null;
  pagamentoId: string | null;
  statusPagamento: StatusPagamento | null;
  checkoutSessionId: string | null;
};

export type CheckoutPagamento = {
  pagamentoId: string;
  titulo: string;
  valorCentavos: number;
};

export type ResultadoCheckout = {
  url: string;
  checkoutSessionId: string;
};
