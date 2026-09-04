import type { Emprestimo, StatusEmprestimo } from "@/models/entities/emprestimo";

const FURADEIRA: Emprestimo = {
  id: "furadeira-impacto",
  nome: "Furadeira de Impacto",
  pessoa: "Ana L.",
  data: "Até 05 Nov 2026",
  status: "devolucao",
  emoji: "🛠️",
  cor: "from-amber-100 to-orange-200",
};

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
};

function normalizar(registro: RegistroSupabase): Emprestimo {
  const statusValidos: StatusEmprestimo[] = ["andamento", "devolucao", "concluido", "aguardando", "negociacao", "recusado"];
  const status = statusValidos.includes(registro.status as StatusEmprestimo) ? registro.status as StatusEmprestimo : "andamento";
  return {
    id: String(registro.id),
    nome: registro.nome ?? registro.titulo ?? "Item sem nome",
    pessoa: registro.pessoa ?? registro.locatario_nome ?? "Não informado",
    data: registro.data ?? (registro.data_devolucao ? `Até ${registro.data_devolucao}` : "Data não informada"),
    status,
    emoji: registro.emoji ?? "🛠️",
    cor: registro.cor ?? "from-amber-100 to-orange-200",
  };
}

export async function buscarMeusEmprestimos(): Promise<{ dados: Emprestimo[]; fonte: "supabase" | "demonstracao" }> {
  const url = process.env.SUPABASE_URL;
  const chave = process.env.SUPABASE_ANON_KEY;
  if (!url || !chave) return { dados: [FURADEIRA], fonte: "demonstracao" };

  const resposta = await fetch(`${url}/rest/v1/emprestimos?select=*&order=id.desc`, {
    headers: { apikey: chave, Authorization: `Bearer ${chave}` },
    cache: "no-store",
  });
  if (!resposta.ok) throw new Error(`Supabase respondeu com status ${resposta.status}.`);
  const registros = (await resposta.json()) as RegistroSupabase[];
  return { dados: registros.map(normalizar), fonte: "supabase" };
}
