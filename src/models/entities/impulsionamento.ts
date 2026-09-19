import type { AnuncioResumo } from "@/models/entities/item";

export type PlanoMembroId = "essencial" | "plus" | "premium";
export type StatusAssinatura = "pendente" | "ativa" | "inadimplente" | "cancelada";

export type PlanoMembro = {
  id: PlanoMembroId;
  nome: string;
  cuponsMensais: number;
  valorCentavos: number;
  descricao: string;
  recomendado?: boolean;
};

export type PacoteCupons = {
  quantidade: 1 | 2 | 5;
  valorCentavos: number;
};

export const DIAS_POR_CUPOM = 7;

export const PLANOS_MEMBRO: readonly PlanoMembro[] = [
  {
    id: "essencial",
    nome: "Essencial",
    cuponsMensais: 3,
    valorCentavos: 990,
    descricao: "Para quem anuncia ocasionalmente",
  },
  {
    id: "plus",
    nome: "Plus",
    cuponsMensais: 8,
    valorCentavos: 1990,
    descricao: "Mais oportunidades durante o mês",
    recomendado: true,
  },
  {
    id: "premium",
    nome: "Premium",
    cuponsMensais: 20,
    valorCentavos: 3490,
    descricao: "Para quem publica com frequência",
  },
] as const;

export const PACOTES_CUPONS: readonly PacoteCupons[] = [
  { quantidade: 1, valorCentavos: 490 },
  { quantidade: 2, valorCentavos: 790 },
  { quantidade: 5, valorCentavos: 1490 },
] as const;

export type AssinaturaMembro = {
  plano: PlanoMembroId;
  status: StatusAssinatura;
  cuponsDisponiveis: number;
  cuponsMensais: number;
  cuponsExtras: number;
  cuponsPorCiclo: number;
  periodoFim: string | null;
  cancelarAoFim: boolean;
};

export type DetalhesImpulsionamento = {
  anuncio: AnuncioResumo;
  assinatura: AssinaturaMembro | null;
  impulsionadoAte: string | null;
};

export type ResultadoUsoCupom = {
  impulsionadoAte: string;
  cuponsDisponiveis: number;
  cuponsMensais: number;
  cuponsExtras: number;
};

export function encontrarPlanoMembro(id: string): PlanoMembro | undefined {
  return PLANOS_MEMBRO.find((plano) => plano.id === id);
}
