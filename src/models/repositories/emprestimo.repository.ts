import { credenciaisSupabase, executarRpc, executarRpcSupabase, urlPublicaStorage } from "@/lib/supabase/rest";
import type { Emprestimo, PapelEmprestimo, StatusEmprestimo } from "@/models/entities/emprestimo";
import type { UnidadeDuracao } from "@/models/entities/item";
import type { StatusPagamento } from "@/models/entities/pagamento";
import type { SessaoUsuario } from "@/models/entities/usuario";

const DEMONSTRACAO: Emprestimo[] = [{
  id: "demo-emprestimo",
  anuncioId: "2",
  conversaId: "demo-solicitado",
  papel: "interessado",
  nome: "Livro: O Design do Dia a Dia",
  pessoa: "Lucas Martins",
  inicioEm: new Date(Date.now() + 86_400_000).toISOString(),
  fimEm: new Date(Date.now() + 16 * 86_400_000).toISOString(),
  criadoEm: new Date().toISOString(),
  status: "aguardando",
  valorUnitarioCentavos: 2500,
  valorTotalCentavos: 37500,
  duracaoQuantidade: 15,
  duracaoUnidade: "dias",
  imagem: "/itens/livro_legal.jpg",
}];

type RegistroEmprestimo = {
  id: string;
  anuncio_id: string;
  conversa_id: string | null;
  papel: string;
  titulo: string;
  pessoa: string;
  inicio_em: string;
  fim_em: string;
  criado_em: string;
  devolucao_solicitada_em: string | null;
  recebido_em: string | null;
  status: string;
  valor_unitario_centavos: number;
  valor_total_centavos: number;
  duracao_quantidade: number;
  duracao_unidade: string;
  imagem: string | null;
  status_pagamento: string | null;
};

const STATUS: StatusEmprestimo[] = [
  "aguardando", "aceito", "negociacao", "andamento", "devolucao", "concluido", "recusado",
];
const UNIDADES: UnidadeDuracao[] = ["minutos", "horas", "dias", "semanas"];
const STATUS_PAGAMENTO: StatusPagamento[] = ["pendente", "processando", "aprovado", "recusado", "cancelado"];

function normalizar(registro: RegistroEmprestimo): Emprestimo {
  const imagem = registro.imagem?.trim();
  return {
    id: registro.id,
    anuncioId: registro.anuncio_id,
    conversaId: registro.conversa_id ?? undefined,
    papel: (registro.papel === "dono" ? "dono" : "interessado") as PapelEmprestimo,
    nome: registro.titulo,
    pessoa: registro.pessoa,
    inicioEm: registro.inicio_em,
    fimEm: registro.fim_em,
    criadoEm: registro.criado_em,
    devolucaoSolicitadaEm: registro.devolucao_solicitada_em ?? undefined,
    recebidoEm: registro.recebido_em ?? undefined,
    status: STATUS.includes(registro.status as StatusEmprestimo)
      ? registro.status as StatusEmprestimo
      : "aguardando",
    valorUnitarioCentavos: registro.valor_unitario_centavos,
    valorTotalCentavos: registro.valor_total_centavos,
    duracaoQuantidade: registro.duracao_quantidade,
    duracaoUnidade: UNIDADES.includes(registro.duracao_unidade as UnidadeDuracao)
      ? registro.duracao_unidade as UnidadeDuracao
      : "dias",
    imagem: imagem
      ? (imagem.startsWith("http") || imagem.startsWith("/") ? imagem : urlPublicaStorage("anuncios", imagem))
      : null,
    statusPagamento: STATUS_PAGAMENTO.includes(registro.status_pagamento as StatusPagamento)
      ? registro.status_pagamento as StatusPagamento
      : undefined,
  };
}

export type ResultadoEmprestimos = {
  dados: Emprestimo[];
  fonte: "supabase" | "demonstracao";
  requerLogin: boolean;
};

export type SolicitacaoCriada = {
  solicitacaoId: string;
  conversaId: string;
};

type RegistroSolicitacaoCriada = {
  solicitacao_id: string;
  conversa_id: string;
};

export async function buscarMeusEmprestimos(sessao: SessaoUsuario | null): Promise<ResultadoEmprestimos> {
  if (!credenciaisSupabase()) return { dados: DEMONSTRACAO, fonte: "demonstracao", requerLogin: false };
  if (!sessao) return { dados: [], fonte: "supabase", requerLogin: true };

  const registros = await executarRpc<RegistroEmprestimo>(
    "listar_minhas_solicitacoes_emprestimo",
    {},
    sessao.token,
  );
  return { dados: (registros ?? []).map(normalizar), fonte: "supabase", requerLogin: false };
}

export async function criarSolicitacaoEmprestimo(
  sessao: SessaoUsuario,
  anuncioId: string,
  inicioEm: string,
  duracaoQuantidade: number,
  duracaoUnidade: string,
): Promise<SolicitacaoCriada> {
  const registros = await executarRpcSupabase<RegistroSolicitacaoCriada[]>(
    "solicitar_reserva",
    sessao.token,
    { p_anuncio_id: anuncioId, p_inicio_em: inicioEm, p_duracao_quantidade: duracaoQuantidade, p_duracao_unidade: duracaoUnidade },
  );
  const registro = registros[0];
  if (!registro?.solicitacao_id || !registro.conversa_id) {
    throw new Error("A solicitação não retornou uma conversa válida.");
  }
  return { solicitacaoId: registro.solicitacao_id, conversaId: registro.conversa_id };
}

export async function registrarDevolucaoEmprestimo(
  sessao: SessaoUsuario,
  solicitacaoId: string,
): Promise<string> {
  return executarRpcSupabase<string>(
    "registrar_devolucao_emprestimo",
    sessao.token,
    { p_solicitacao_id: solicitacaoId },
  );
}

export async function registrarRecebimentoEmprestimo(
  sessao: SessaoUsuario,
  solicitacaoId: string,
): Promise<string> {
  return executarRpcSupabase<string>(
    "confirmar_recebimento_emprestimo",
    sessao.token,
    { p_solicitacao_id: solicitacaoId },
  );
}
