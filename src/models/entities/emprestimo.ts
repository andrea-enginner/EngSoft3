export type StatusEmprestimo = "andamento" | "devolucao" | "concluido" | "aguardando" | "aceito" | "negociacao" | "recusado";

export type Emprestimo = {
  id: string;
  conversaId?: string;
  nome: string;
  pessoa: string;
  data: string;
  status: StatusEmprestimo;
  emoji: string;
  cor: string;
  papel?: "proprietario" | "solicitante";
};
