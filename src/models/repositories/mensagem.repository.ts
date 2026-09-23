import type { SessaoUsuario } from "@/models/entities/usuario";
import type {
  ConversaResumo,
  Mensagem,
  PainelMensagens,
  StatusSolicitacao,
  TipoMensagem,
} from "@/models/entities/mensagem";
import { executarRpcSupabase } from "@/lib/supabase/rest";

export const USUARIO_DEMONSTRACAO_ID = "demo-joao";

type RegistroConversa = {
  id: string;
  anuncio_id: string;
  interlocutor_id: string;
  interlocutor_nome: string;
  interlocutor_avatar: string | null;
  titulo_item: string;
  imagem_item: string | null;
  ultima_mensagem: string;
  ultima_mensagem_em: string;
  nao_lidas: number | string;
  status: string;
  usuario_e_proprietario: boolean;
  interlocutor_nota: number | string | null;
  interlocutor_total_avaliacoes: number | string;
};

type RegistroMensagem = {
  id: string;
  conversa_id: string;
  remetente_id: string | null;
  conteudo: string;
  tipo: string;
  criada_em: string;
  lida_em: string | null;
};

const STATUS_VALIDOS: StatusSolicitacao[] = [
  "aguardando",
  "aceito",
  "recusado",
  "negociacao",
  "andamento",
  "devolucao",
  "concluido",
];

function statusValido(status: string): StatusSolicitacao {
  return STATUS_VALIDOS.includes(status as StatusSolicitacao)
    ? (status as StatusSolicitacao)
    : "aguardando";
}

export function normalizarMensagem(registro: RegistroMensagem): Mensagem {
  const tipos: TipoMensagem[] = ["texto", "solicitacao", "sistema"];
  return {
    id: registro.id,
    conversaId: registro.conversa_id,
    remetenteId: registro.remetente_id,
    conteudo: registro.conteudo,
    tipo: tipos.includes(registro.tipo as TipoMensagem)
      ? (registro.tipo as TipoMensagem)
      : "texto",
    criadaEm: registro.criada_em,
    lidaEm: registro.lida_em,
  };
}

function normalizarConversa(registro: RegistroConversa): ConversaResumo {
  const nota = registro.interlocutor_nota === null
    ? null
    : Number(registro.interlocutor_nota);
  const totalAvaliacoes = Number(registro.interlocutor_total_avaliacoes);

  return {
    id: registro.id,
    anuncioId: registro.anuncio_id,
    interlocutorId: registro.interlocutor_id,
    interlocutorNome: registro.interlocutor_nome,
    interlocutorAvatar: registro.interlocutor_avatar,
    tituloItem: registro.titulo_item,
    imagemItem: registro.imagem_item,
    ultimaMensagem: registro.ultima_mensagem,
    ultimaMensagemEm: registro.ultima_mensagem_em,
    naoLidas: Number(registro.nao_lidas),
    status: statusValido(registro.status),
    usuarioEProprietario: registro.usuario_e_proprietario,
    reputacaoInterlocutor: {
      nota: nota !== null && Number.isFinite(nota) ? nota : null,
      total: Number.isFinite(totalAvaliacoes) ? Math.max(0, totalAvaliacoes) : 0,
    },
  };
}

const CONVERSAS_DEMONSTRACAO: ConversaResumo[] = [
  {
    id: "demo-solicitado",
    anuncioId: "2",
    interlocutorId: "demo-lucas",
    interlocutorNome: "Lucas Martins",
    interlocutorAvatar: null,
    tituloItem: "Livro: O Design do Dia a Dia",
    imagemItem: "/itens/livro_legal.jpg",
    ultimaMensagem: "Olá Lucas, tenho interesse no livro. Como podemos combinar?",
    ultimaMensagemEm: "2026-09-10T12:00:00-03:00",
    naoLidas: 0,
    status: "aguardando",
    usuarioEProprietario: false,
    reputacaoInterlocutor: { nota: 4.8, total: 18 },
  },
  {
    id: "demo-livros",
    anuncioId: "2",
    interlocutorId: "demo-mariana",
    interlocutorNome: "Mariana Oliveira",
    interlocutorAvatar: null,
    tituloItem: "Coleção de Livros de Design",
    imagemItem: "/itens/livro_legal.jpg",
    ultimaMensagem: "Perfeito! Quando podemos combinar a retirada?",
    ultimaMensagemEm: "2026-09-09T10:28:00-03:00",
    naoLidas: 2,
    status: "aguardando",
    usuarioEProprietario: true,
    reputacaoInterlocutor: { nota: 4.9, total: 27 },
  },
  {
    id: "demo-carrinhos",
    anuncioId: "4",
    interlocutorId: "demo-carlos",
    interlocutorNome: "Carlos Silva",
    interlocutorAvatar: null,
    tituloItem: "Coleção de Carrinhos Hot Wheels",
    imagemItem: "/itens/acampar_lindo.jpg",
    ultimaMensagem: "Perfeito! Muito obrigado.",
    ultimaMensagemEm: "2026-09-08T16:10:00-03:00",
    naoLidas: 1,
    status: "aceito",
    usuarioEProprietario: true,
    reputacaoInterlocutor: { nota: 4.6, total: 9 },
  },
  {
    id: "demo-violao",
    anuncioId: "3",
    interlocutorId: "demo-ana",
    interlocutorNome: "Ana Clara",
    interlocutorAvatar: null,
    tituloItem: "Violão Acústico Giannini",
    imagemItem: "/itens/violao_guitarra.jpg",
    ultimaMensagem: "Oi! Ainda tenho interesse, quando posso buscar?",
    ultimaMensagemEm: "2026-09-05T09:40:00-03:00",
    naoLidas: 0,
    status: "recusado",
    usuarioEProprietario: false,
    reputacaoInterlocutor: { nota: null, total: 0 },
  },
];

const MENSAGENS_DEMONSTRACAO: Record<string, Mensagem[]> = {
  "demo-solicitado": [
    {
      id: "demo-msg-solicitado",
      conversaId: "demo-solicitado",
      remetenteId: USUARIO_DEMONSTRACAO_ID,
      conteudo: "Olá Lucas, tenho interesse no livro. Como podemos combinar?",
      tipo: "solicitacao",
      criadaEm: "2026-09-10T12:00:00-03:00",
      lidaEm: null,
    },
  ],
  "demo-livros": [
    {
      id: "demo-msg-1",
      conversaId: "demo-livros",
      remetenteId: "demo-mariana",
      conteudo: "Oi! Vi seu anúncio da coleção de livros de design e tenho muito interesse.",
      tipo: "solicitacao",
      criadaEm: "2026-09-09T10:28:00-03:00",
      lidaEm: null,
    },
    {
      id: "demo-msg-2",
      conversaId: "demo-livros",
      remetenteId: USUARIO_DEMONSTRACAO_ID,
      conteudo: "Olá Mariana, que bom que se interessou!",
      tipo: "texto",
      criadaEm: "2026-09-09T10:29:00-03:00",
      lidaEm: "2026-09-09T10:29:30-03:00",
    },
    {
      id: "demo-msg-3",
      conversaId: "demo-livros",
      remetenteId: USUARIO_DEMONSTRACAO_ID,
      conteudo: "Os livros estão em ótimo estado e posso emprestar por até 30 dias.",
      tipo: "texto",
      criadaEm: "2026-09-09T10:30:00-03:00",
      lidaEm: "2026-09-09T10:30:30-03:00",
    },
    {
      id: "demo-msg-4",
      conversaId: "demo-livros",
      remetenteId: "demo-mariana",
      conteudo: "Perfeito! Quando podemos combinar a retirada?",
      tipo: "texto",
      criadaEm: "2026-09-09T10:32:00-03:00",
      lidaEm: null,
    },
  ],
  "demo-carrinhos": [
    {
      id: "demo-msg-5",
      conversaId: "demo-carrinhos",
      remetenteId: "demo-carlos",
      conteudo: "Olá! Tenho interesse na coleção. Ela está completa?",
      tipo: "solicitacao",
      criadaEm: "2026-09-08T15:55:00-03:00",
      lidaEm: null,
    },
    {
      id: "demo-msg-6",
      conversaId: "demo-carrinhos",
      remetenteId: USUARIO_DEMONSTRACAO_ID,
      conteudo: "Está sim, Carlos. Posso separar para você.",
      tipo: "texto",
      criadaEm: "2026-09-08T16:05:00-03:00",
      lidaEm: "2026-09-08T16:06:00-03:00",
    },
    {
      id: "demo-msg-7",
      conversaId: "demo-carrinhos",
      remetenteId: "demo-carlos",
      conteudo: "Perfeito! Muito obrigado.",
      tipo: "texto",
      criadaEm: "2026-09-08T16:10:00-03:00",
      lidaEm: null,
    },
  ],
  "demo-violao": [
    {
      id: "demo-msg-8",
      conversaId: "demo-violao",
      remetenteId: USUARIO_DEMONSTRACAO_ID,
      conteudo: "Oi! Ainda tenho interesse, quando posso buscar?",
      tipo: "solicitacao",
      criadaEm: "2026-09-05T09:40:00-03:00",
      lidaEm: null,
    },
  ],
};

export function painelDeDemonstracao(conversaId?: string): PainelMensagens {
  const ativa =
    CONVERSAS_DEMONSTRACAO.find((conversa) => conversa.id === conversaId) ??
    CONVERSAS_DEMONSTRACAO.find((conversa) => conversa.id === "demo-livros") ??
    CONVERSAS_DEMONSTRACAO[0];
  return {
    usuarioId: USUARIO_DEMONSTRACAO_ID,
    conversas: CONVERSAS_DEMONSTRACAO,
    conversaAtiva: ativa,
    mensagens: ativa ? MENSAGENS_DEMONSTRACAO[ativa.id] ?? [] : [],
    fonte: "demonstracao",
  };
}

export async function buscarPainelMensagens(
  sessao: SessaoUsuario | null,
  conversaId?: string,
): Promise<PainelMensagens> {
  if (!sessao) return painelDeDemonstracao(conversaId);

  const registros = await executarRpcSupabase<RegistroConversa[]>(
    "listar_conversas",
    sessao.token,
  );
  const conversas = registros.map(normalizarConversa);
  const conversaAtiva =
    conversas.find((conversa) => conversa.id === conversaId) ?? conversas[0] ?? null;
  const mensagens = conversaAtiva
    ? (
        await executarRpcSupabase<RegistroMensagem[]>(
          "listar_mensagens",
          sessao.token,
          { p_conversa_id: conversaAtiva.id },
        )
      ).map(normalizarMensagem)
    : [];

  return {
    usuarioId: sessao.usuarioId,
    conversas,
    conversaAtiva,
    mensagens,
    fonte: "supabase",
  };
}

export async function criarConversa(
  sessao: SessaoUsuario,
  anuncioId: string,
  conteudo: string,
): Promise<string> {
  return executarRpcSupabase<string>("iniciar_conversa", sessao.token, {
    p_anuncio_id: anuncioId,
    p_conteudo: conteudo,
  });
}

export async function salvarMensagem(
  sessao: SessaoUsuario,
  conversaId: string,
  conteudo: string,
): Promise<Mensagem> {
  const registros = await executarRpcSupabase<RegistroMensagem[]>(
    "enviar_mensagem",
    sessao.token,
    { p_conversa_id: conversaId, p_conteudo: conteudo },
  );
  return normalizarMensagem(registros[0]);
}

export async function salvarRespostaSolicitacao(
  sessao: SessaoUsuario,
  conversaId: string,
  aceitar: boolean,
): Promise<StatusSolicitacao> {
  const status = await executarRpcSupabase<string>(
    "responder_solicitacao",
    sessao.token,
    { p_conversa_id: conversaId, p_aceitar: aceitar },
  );
  return statusValido(status);
}

export async function salvarLeitura(
  sessao: SessaoUsuario,
  conversaId: string,
): Promise<void> {
  await executarRpcSupabase<void>("marcar_mensagens_lidas", sessao.token, {
    p_conversa_id: conversaId,
  });
}
