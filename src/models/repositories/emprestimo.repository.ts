import type { Emprestimo, StatusEmprestimo } from "@/models/entities/emprestimo";
import type { SessaoUsuario } from "@/models/entities/usuario";
import { executarRpcSupabase } from "@/lib/supabase/rest";

const FURADEIRA: Emprestimo = {
  id: "furadeira-impacto",
  nome: "Furadeira de Impacto",
  pessoa: "Ana L.",
  data: "Até 05 Nov 2026",
  status: "devolucao",
  emoji: "🛠️",
  cor: "from-amber-100 to-orange-200",
  papel: "proprietario",
};

const SOLICITACOES_DEMONSTRACAO: Emprestimo[] = [
  {
    id: "demo-emprestimo-livros",
    conversaId: "demo-livros",
    nome: "Coleção de Livros de Design",
    pessoa: "Mariana Oliveira",
    data: "Solicitado ontem",
    status: "aguardando",
    emoji: "📚",
    cor: "from-violet-100 to-purple-200",
    papel: "proprietario",
  },
  {
    id: "demo-emprestimo-violao",
    conversaId: "demo-violao",
    nome: "Violão Acústico Giannini",
    pessoa: "Ana Clara",
    data: "Solicitado há 5 dias",
    status: "recusado",
    emoji: "🎸",
    cor: "from-orange-100 to-amber-200",
    papel: "solicitante",
  },
];

type RegistroSupabase = {
  id: string | number;
  nome?: string;
  titulo?: string;
  pessoa?: string;
  locatario_nome?: string;
  data?: string;
  data_devolucao?: string;
  status?: string;
  emoji?: string;
  cor?: string;
  conversa_id?: string;
  papel?: "proprietario" | "solicitante";
};

function normalizar(registro: RegistroSupabase): Emprestimo {
  const statusValidos: StatusEmprestimo[] = ["andamento", "devolucao", "concluido", "aguardando", "aceito", "negociacao", "recusado"];
  const status = statusValidos.includes(registro.status as StatusEmprestimo) ? registro.status as StatusEmprestimo : "andamento";
  return {
    id: String(registro.id),
    conversaId: registro.conversa_id,
    nome: registro.nome ?? registro.titulo ?? "Item sem nome",
    pessoa: registro.pessoa ?? registro.locatario_nome ?? "Não informado",
    data: registro.data ?? (registro.data_devolucao ? `Até ${registro.data_devolucao}` : "Data não informada"),
    status,
    emoji: registro.emoji ?? "🛠️",
    cor: registro.cor ?? "from-amber-100 to-orange-200",
    papel: registro.papel,
  };
}

export async function buscarMeusEmprestimos(sessao: SessaoUsuario | null = null): Promise<{ dados: Emprestimo[]; fonte: "supabase" | "demonstracao" }> {
  if (!sessao) return { dados: [FURADEIRA, ...SOLICITACOES_DEMONSTRACAO], fonte: "demonstracao" };

  const registros = await executarRpcSupabase<RegistroSupabase[]>(
    "listar_emprestimos",
    sessao.token,
  );
  return { dados: registros.map(normalizar), fonte: "supabase" };
}
