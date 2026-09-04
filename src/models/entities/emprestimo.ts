export type StatusEmprestimo = "andamento" | "devolucao" | "concluido" | "aguardando" | "negociacao" | "recusado";

export type Emprestimo = {
  id: string;
  nome: string;
  pessoa: string;
  data: string;
  status: StatusEmprestimo;
  emoji: string;
  cor: string;
};
