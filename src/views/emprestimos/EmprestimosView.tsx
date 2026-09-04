"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { Emprestimo, StatusEmprestimo } from "@/models/entities/emprestimo";

const SOLICITACOES: Emprestimo[] = [
  { id: "sol-1", nome: "Violão Acústico Vintage", pessoa: "João M.", data: "Solicitado em 10 Nov 2026", status: "aguardando", emoji: "🎸", cor: "from-orange-100 to-amber-200" },
  { id: "sol-2", nome: "Projetor Portátil", pessoa: "Maria C.", data: "Solicitado em 08 Nov 2026", status: "negociacao", emoji: "📽️", cor: "from-blue-100 to-slate-200" },
  { id: "sol-3", nome: "Câmera Fotográfica", pessoa: "Pedro S.", data: "Solicitado em 01 Nov 2026", status: "recusado", emoji: "📷", cor: "from-zinc-200 to-stone-300" },
];

const STATUS: Record<StatusEmprestimo, [string, string]> = {
  andamento: ["Em andamento", "bg-emerald-50 text-emerald-700"],
  devolucao: ["Aguardando devolução", "bg-orange-50 text-orange-700"],
  concluido: ["Concluído", "bg-green-50 text-green-700"],
  aguardando: ["Aguardando resposta", "bg-sky-50 text-sky-700"],
  negociacao: ["Em negociação", "bg-amber-50 text-amber-700"],
  recusado: ["Recusado", "bg-red-50 text-red-600"],
};

type ListaProps = { titulo: string; subtitulo: string; itens: Emprestimo[]; impulsionar?: boolean; carregando?: boolean; erro?: string };

function Lista({ titulo, subtitulo, itens, impulsionar = false, carregando = false, erro }: ListaProps) {
  return <section className="overflow-hidden rounded-2xl border border-border bg-white shadow-[0_8px_30px_rgba(76,29,149,.04)]">
    <div className="flex items-center justify-between border-b border-border px-5 py-4">
      <div className="flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-xl bg-primary-50 text-primary-600">▥</span><div><h2 className="text-sm font-bold text-slate-800">{titulo}</h2><p className="text-xs text-muted">{subtitulo}</p></div></div>
      <button className="text-xs font-semibold text-primary-700">Ver todos ›</button>
    </div>
    <div className="divide-y divide-border px-5">
      {carregando ? <p className="py-8 text-center text-sm text-muted">Carregando empréstimos...</p> : erro ? <p className="py-8 text-center text-sm text-red-600">{erro}</p> : itens.length === 0 ? <p className="py-8 text-center text-sm text-muted">Nenhum empréstimo encontrado.</p> : itens.map(item => <article key={item.id} className="flex items-center gap-3 py-4">
        <div className={`grid h-14 w-14 shrink-0 place-items-center rounded-xl bg-gradient-to-br ${item.cor} text-2xl shadow-inner`}>{item.emoji}</div>
        <div className="min-w-0 flex-1"><h3 className="truncate text-sm font-bold text-slate-800">{item.nome}</h3><p className="text-xs text-muted">Para: {item.pessoa}</p><p className="mt-0.5 text-[11px] text-slate-400">▣ {item.data}</p></div>
        {impulsionar && item.status !== "concluido" ? <Link href="/emprestimos/impulsionar" className="hidden rounded-full bg-primary-50 px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-wide text-primary-700 hover:bg-primary-100 sm:block">✦ Impulsionar</Link> : null}
        <span className={`hidden rounded-full px-3 py-1.5 text-[10px] font-semibold md:block ${STATUS[item.status][1]}`}>{STATUS[item.status][0]}</span><span className="text-lg text-slate-300">›</span>
      </article>)}
    </div>
    <button className="m-4 mt-1 w-[calc(100%-2rem)] rounded-lg bg-primary-50 py-3 text-xs font-semibold text-primary-700">Ver todos {impulsionar ? "os meus empréstimos" : "as solicitações"} →</button>
  </section>;
}

export function EmprestimosView() {
  const [meus, setMeus] = useState<Emprestimo[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string>();

  useEffect(() => {
    const carregar = async () => {
      try {
        const resposta = await fetch("/api/emprestimos", { cache: "no-store" });
        if (!resposta.ok) throw new Error("Não foi possível carregar seus empréstimos.");
        const resultado = (await resposta.json()) as { dados: Emprestimo[] };
        setMeus(resultado.dados);
      } catch (falha) {
        setErro(falha instanceof Error ? falha.message : "Erro ao carregar empréstimos.");
      } finally { setCarregando(false); }
    };
    void carregar();
  }, []);

  const ativos = meus.filter(item => item.status === "andamento" || item.status === "devolucao").length;
  const metricas = [["▣", "Empréstimos ativos", String(ativos), "Em andamento", "text-indigo-600 bg-indigo-50"], ["✓", "Concluídos", String(meus.filter(item => item.status === "concluido").length), "Histórico completo", "text-emerald-600 bg-emerald-50"], ["◷", "Pendentes", "2", "Aguardando retorno", "text-orange-600 bg-orange-50"], ["♡", "Avaliações", "4.8", "Média geral", "text-blue-600 bg-blue-50"]];

  return <main className="mx-auto max-w-7xl px-5 py-8 sm:px-8 sm:py-10"><div className="flex items-center gap-4"><span className="grid h-12 w-12 place-items-center rounded-2xl bg-primary-100 text-2xl text-primary-600">♢</span><div><h1 className="text-2xl font-extrabold tracking-tight text-slate-900">Empréstimos</h1><p className="text-sm text-muted">Gerencie seus empréstimos e veja as solicitações recebidas.</p></div></div><div className="mt-7 flex gap-8 overflow-x-auto border-b border-border text-sm"><button className="shrink-0 border-b-2 border-primary-500 px-1 pb-3 font-bold text-primary-700">Visão Geral</button><button className="shrink-0 px-1 pb-3 text-muted">Meus Empréstimos</button><button className="shrink-0 px-1 pb-3 text-muted">Solicitações Recebidas</button></div><section className="my-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{metricas.map(([icone, titulo, valor, detalhe, classe]) => <article key={titulo} className="flex items-center gap-3 rounded-2xl border border-border bg-white p-4 shadow-sm"><span className={`grid h-10 w-10 place-items-center rounded-full text-lg ${classe}`}>{icone}</span><div><p className="text-xs text-muted">{titulo}</p><strong className="text-xl text-slate-900">{valor}</strong><p className="text-[10px] text-muted">{detalhe}</p></div></article>)}</section><div className="grid gap-5 lg:grid-cols-2"><Lista titulo="Meus Empréstimos (que fiz)" subtitulo="Itens carregados do banco de dados." itens={meus} impulsionar carregando={carregando} erro={erro} /><Lista titulo="Empréstimos que quero (solicitações feitas)" subtitulo="Itens que você solicitou emprestado." itens={SOLICITACOES} /></div></main>;
}
