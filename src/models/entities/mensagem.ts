export type TipoMensagem = "texto" | "solicitacao" | "sistema";

export type StatusSolicitacao =
  | "aguardando"
  | "aceito"
  | "recusado"
  | "negociacao"
  | "andamento"
  | "devolucao"
  | "concluido";

export type Mensagem = {
  id: string;
  conversaId: string;
  remetenteId: string | null;
  conteudo: string;
  tipo: TipoMensagem;
  criadaEm: string;
  lidaEm: string | null;
};

export type ConversaResumo = {
  id: string;
  anuncioId: string;
  interlocutorId: string;
  interlocutorNome: string;
  interlocutorAvatar: string | null;
  tituloItem: string;
  imagemItem: string | null;
  ultimaMensagem: string;
  ultimaMensagemEm: string;
  naoLidas: number;
  status: StatusSolicitacao;
  usuarioEProprietario: boolean;
};

export type PainelMensagens = {
  usuarioId: string;
  conversas: ConversaResumo[];
  conversaAtiva: ConversaResumo | null;
  mensagens: Mensagem[];
  fonte: "supabase" | "demonstracao";
};

export type ResultadoMensagem =
  | { sucesso: true; mensagem: Mensagem }
  | { sucesso: false; erro: string };

export type ResultadoConversa =
  | { sucesso: true; conversaId: string; fonte: "supabase" | "demonstracao" }
  | { sucesso: false; erro: string };

export type ResultadoSolicitacao =
  | { sucesso: true; status: StatusSolicitacao }
  | { sucesso: false; erro: string };
