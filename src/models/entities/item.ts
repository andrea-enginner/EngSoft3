export type TipoAnuncio = "doacao" | "emprestimo";
export type CondicaoItem = "novo_quase_novo" | "marcas_de_uso";

export type AnuncioResumo = {
  id: string;
  tipo: TipoAnuncio;
  titulo: string;
  descricao: string;
  condicao: string;
  localizacao: string;
  imagem: string | null;
  valorCentavos: number | null;
  publicadoEm: string;
  ativo: boolean;
  avaliacao?: number;
};

export type DonoAnuncio = {
  id: string;
  nome: string;
  avatar?: string;
  avaliacao: number;
  quantidadeEmprestimos: number;
  confiavel: boolean;
};

export type AnuncioDetalhe = AnuncioResumo & {
  imagens: string[];
  aceitaPropostas: boolean;
  dono: DonoAnuncio;
};

export type NovoEmprestimo = {
  id: string;
  tipo: "emprestimo";
  titulo: string;
  categoria: string;
  condicao: CondicaoItem;
  descricao: string;
  valorCentavos: number;
};
