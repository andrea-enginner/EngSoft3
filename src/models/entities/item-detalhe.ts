export type TipoAnuncio = "doacao" | "emprestimo";

export type DonoItem = {
  id: string;
  nome: string;
  avatar?: string;
  avaliacao: number;
  quantidadeEmprestimos: number;
  confiavel: boolean;
};

export type ItemDetalhe = {
  id: string;
  tipo: TipoAnuncio;
  titulo: string;
  descricao: string;
  condicao: string;
  localizacao: string;
  publicadoEm: string;
  aceitaPropostas: boolean;
  imagens?: string[];
  dono: DonoItem;
};
