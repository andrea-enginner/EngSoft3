"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { Emprestimo, StatusEmprestimo } from "@/models/entities/emprestimo";
import { createClient } from "@/lib/supabase/client";

const STATUS: Record<StatusEmprestimo, [string, string]> = {
  andamento: ["Em andamento", "bg-emerald-50 text-emerald-700"],
  devolucao: ["Aguardando devolução", "bg-orange-50 text-orange-700"],
  concluido: ["Concluído", "bg-green-50 text-green-700"],
  aguardando: ["Aguardando resposta", "bg-sky-50 text-sky-700"],
  aceito: ["Solicitação aceita", "bg-emerald-50 text-emerald-700"],
  negociacao: ["Em negociação", "bg-amber-50 text-amber-700"],
  recusado: ["Solicitação recusada", "bg-red-50 text-red-600"],
};

type ListaProps = {
  titulo: string;
  subtitulo: string;
  itens: Emprestimo[];
  carregando?: boolean;
  erro?: string;
};

function Lista({ titulo, subtitulo, itens, carregando = false, erro }: ListaProps) {
  return (
    <section className="overflow-hidden rounded-2xl border border-border bg-white shadow-[0_8px_30px_rgba(76,29,149,.04)]">
      <div className="flex items-center gap-3 border-b border-border px-5 py-4">
        <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary-50 text-primary-600">▥</span>
        <div><h2 className="text-sm font-bold text-slate-800">{titulo}</h2><p className="text-xs text-muted">{subtitulo}</p></div>
      </div>
      <div className="divide-y divide-border px-5">
        {carregando ? (
          <p className="py-8 text-center text-sm text-muted">Carregando empréstimos...</p>
        ) : erro ? (
          <p className="py-8 text-center text-sm text-red-600">{erro}</p>
        ) : itens.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted">Nenhuma solicitação encontrada.</p>
        ) : itens.map((item) => (
          <article key={item.id} className="flex items-center gap-3 py-4">
            <div className={`grid h-14 w-14 shrink-0 place-items-center rounded-xl bg-gradient-to-br ${item.cor} text-2xl shadow-inner`}>{item.emoji}</div>
            <div className="min-w-0 flex-1">
              <h3 className="truncate text-sm font-bold text-slate-800">{item.nome}</h3>
              <p className="text-xs text-muted">Com: {item.pessoa}</p>
              <p className="mt-0.5 text-[11px] text-slate-400">▣ {item.data}</p>
            </div>
            <span className={`hidden rounded-full px-3 py-1.5 text-[10px] font-semibold md:block ${STATUS[item.status][1]}`}>{STATUS[item.status][0]}</span>
            {item.conversaId ? <Link href={`/mensagens/${item.conversaId}`} aria-label={`Abrir conversa sobre ${item.nome}`} className="text-lg text-primary-500 hover:text-primary-900">›</Link> : <span className="text-lg text-slate-300">›</span>}
          </article>
        ))}
      </div>
    </section>
  );
}

export function EmprestimosView() {
  const [itens, setItens] = useState<Emprestimo[]>([]);
  const [fonte, setFonte] = useState<"supabase" | "demonstracao">("demonstracao");
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string>();

  useEffect(() => {
    const carregar = async () => {
      try {
        const resposta = await fetch("/api/emprestimos", { cache: "no-store" });
        if (!resposta.ok) throw new Error("Não foi possível carregar seus empréstimos.");
        const resultado = (await resposta.json()) as { dados: Emprestimo[]; fonte: "supabase" | "demonstracao" };
        setFonte(resultado.fonte);
        const dados = resultado.fonte === "demonstracao"
          ? resultado.dados.map((item) => {
              if (!item.conversaId) return item;
              const salvo = localStorage.getItem(`ciclo:parecer:${item.conversaId}`);
              if (salvo === "aceito") return { ...item, status: "aceito" as const };
              if (salvo === "recusado") return { ...item, status: "recusado" as const };
              return item;
            })
          : resultado.dados;
        setItens(dados);
      } catch (falha) {
        setErro(falha instanceof Error ? falha.message : "Erro ao carregar empréstimos.");
      } finally {
        setCarregando(false);
      }
    };
    void carregar();
  }, []);

  useEffect(() => {
    if (
      fonte !== "supabase" ||
      !process.env.NEXT_PUBLIC_SUPABASE_URL ||
      !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
    ) return;

    const supabase = createClient();
    const canal = supabase
      .channel("pareceres-de-emprestimos")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "emprestimos" },
        (evento) => {
          const id = String(evento.new.id);
          const status = String(evento.new.status);
          if (!(status in STATUS)) return;
          setItens((atuais) => atuais.map((item) =>
            item.id === id ? { ...item, status: status as StatusEmprestimo } : item,
          ));
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(canal);
    };
  }, [fonte]);

  const recebidos = itens.filter((item) => item.papel === "proprietario");
  const solicitados = itens.filter((item) => item.papel === "solicitante");
  const ativos = itens.filter((item) => item.status === "andamento" || item.status === "devolucao" || item.status === "aceito").length;
  const pendentes = itens.filter((item) => item.status === "aguardando").length;
  const concluidos = itens.filter((item) => item.status === "concluido").length;
  const metricas = [
    ["▣", "Empréstimos ativos", String(ativos), "Aceitos ou em andamento", "text-indigo-600 bg-indigo-50"],
    ["✓", "Concluídos", String(concluidos), "Histórico completo", "text-emerald-600 bg-emerald-50"],
    ["◷", "Pendentes", String(pendentes), "Aguardando retorno", "text-orange-600 bg-orange-50"],
    ["♡", "Avaliações", "4.8", "Média geral", "text-blue-600 bg-blue-50"],
  ];

  return (
    <main className="mx-auto max-w-7xl px-5 py-8 sm:px-8 sm:py-10">
      <div className="flex items-center gap-4">
        <span className="grid h-12 w-12 place-items-center rounded-2xl bg-primary-100 text-2xl text-primary-600">♢</span>
        <div><h1 className="text-2xl font-extrabold tracking-tight text-slate-900">Empréstimos</h1><p className="text-sm text-muted">Gerencie seus empréstimos e acompanhe cada parecer.</p></div>
      </div>
      <section className="my-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {metricas.map(([icone, titulo, valor, detalhe, classe]) => (
          <article key={titulo} className="flex items-center gap-3 rounded-2xl border border-border bg-white p-4 shadow-sm">
            <span className={`grid h-10 w-10 place-items-center rounded-full text-lg ${classe}`}>{icone}</span>
            <div><p className="text-xs text-muted">{titulo}</p><strong className="text-xl text-slate-900">{valor}</strong><p className="text-[10px] text-muted">{detalhe}</p></div>
          </article>
        ))}
      </section>
      <div className="grid gap-5 lg:grid-cols-2">
        <Lista titulo="Solicitações recebidas" subtitulo="Pedidos feitos para os seus itens." itens={recebidos} carregando={carregando} erro={erro} />
        <Lista titulo="Empréstimos que solicitei" subtitulo="Acompanhe a resposta do proprietário." itens={solicitados} carregando={carregando} erro={erro} />
      </div>
    </main>
  );
}
