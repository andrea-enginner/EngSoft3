"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import {
  confirmarRecebimentoAction,
  informarDevolucaoAction,
} from "@/controllers/emprestimo.actions";
import { formatarDuracao, formatarTarifa, formatarValor } from "@/lib/formatar-emprestimo";
import type { Emprestimo, StatusEmprestimo } from "@/models/entities/emprestimo";
import type { ResultadoEmprestimos } from "@/models/repositories/emprestimo.repository";
import {
  IconeCheckCirculo,
  IconeRelogio,
  IconeTrocas,
} from "@/views/comuns/Icones";

const STATUS: Record<StatusEmprestimo, [string, string]> = {
  andamento: ["Em andamento", "bg-emerald-50 text-emerald-700"],
  devolucao: ["Aguardando confirmação", "bg-orange-50 text-orange-700"],
  concluido: ["Concluído", "bg-green-50 text-green-700"],
  aguardando: ["Aguardando resposta", "bg-sky-50 text-sky-700"],
  aceito: ["Solicitação aceita", "bg-emerald-50 text-emerald-700"],
  negociacao: ["Em negociação", "bg-amber-50 text-amber-700"],
  recusado: ["Solicitação recusada", "bg-red-50 text-red-600"],
};

const DATA_HORA = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeStyle: "short",
});

type Prazo = {
  titulo: string;
  contagem: string;
  descricao: string;
  progresso: number;
  atrasado: boolean;
};

function formatarContagem(milissegundos: number): string {
  const totalSegundos = Math.max(0, Math.floor(milissegundos / 1_000));
  const dias = Math.floor(totalSegundos / 86_400);
  const horas = Math.floor((totalSegundos % 86_400) / 3_600);
  const minutos = Math.floor((totalSegundos % 3_600) / 60);
  const segundos = totalSegundos % 60;

  if (dias > 0) return `${dias}d ${horas}h ${minutos}min`;
  if (horas > 0) return `${horas}h ${minutos}min ${segundos}s`;
  return `${minutos}min ${segundos}s`;
}

function calcularPrazo(item: Emprestimo, agora: number): Prazo {
  const inicio = new Date(item.inicioEm).getTime();
  const fim = new Date(item.fimEm).getTime();

  if (agora < inicio) {
    return {
      titulo: "O empréstimo começa em",
      contagem: formatarContagem(inicio - agora),
      descricao: `Início previsto para ${DATA_HORA.format(new Date(item.inicioEm))}`,
      progresso: 0,
      atrasado: false,
    };
  }

  if (agora <= fim) {
    const duracao = Math.max(1, fim - inicio);
    return {
      titulo: "Tempo restante para devolução",
      contagem: formatarContagem(fim - agora),
      descricao: `Devolução prevista para ${DATA_HORA.format(new Date(item.fimEm))}`,
      progresso: Math.min(100, Math.max(0, ((agora - inicio) / duracao) * 100)),
      atrasado: false,
    };
  }

  return {
    titulo: "Prazo de devolução vencido",
    contagem: `Atrasado há ${formatarContagem(agora - fim)}`,
    descricao: `A devolução estava prevista para ${DATA_HORA.format(new Date(item.fimEm))}`,
    progresso: 100,
    atrasado: true,
  };
}

function Temporizador({ item, agora }: { item: Emprestimo; agora: number | null }) {
  if (agora === null) {
    return <div className="mt-4 h-[108px] animate-pulse rounded-xl bg-slate-100" aria-label="Calculando prazo" />;
  }

  const prazo = calcularPrazo(item, agora);
  return (
    <section className={`mt-4 rounded-xl border p-4 ${prazo.atrasado ? "border-red-200 bg-red-50" : "border-primary-100 bg-primary-50/70"}`} aria-label="Prazo do empréstimo">
      <div className="flex items-start gap-3">
        <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${prazo.atrasado ? "bg-red-100 text-red-700" : "bg-white text-primary-700"}`}>
          <IconeRelogio className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className={`text-xs font-semibold ${prazo.atrasado ? "text-red-700" : "text-primary-700"}`}>{prazo.titulo}</p>
          <strong className={`mt-0.5 block text-xl ${prazo.atrasado ? "text-red-800" : "text-primary-900"}`} role="timer">{prazo.contagem}</strong>
          <p className={`mt-1 text-[11px] ${prazo.atrasado ? "text-red-600" : "text-muted"}`}>{prazo.descricao}</p>
        </div>
      </div>
      <div className={`mt-3 h-1.5 overflow-hidden rounded-full ${prazo.atrasado ? "bg-red-100" : "bg-primary-100"}`}>
        <span className={`block h-full rounded-full transition-[width] duration-1000 ${prazo.atrasado ? "bg-red-500" : "bg-primary-500"}`} style={{ width: `${prazo.progresso}%` }} />
      </div>
    </section>
  );
}

function CartaoSolicitacao({ item, agora }: { item: Emprestimo; agora: number | null }) {
  const [status, setStatus] = useState(item.status);
  const [devolucaoSolicitadaEm, setDevolucaoSolicitadaEm] = useState(item.devolucaoSolicitadaEm);
  const [recebidoEm, setRecebidoEm] = useState(item.recebidoEm);
  const [erro, setErro] = useState("");
  const [processando, iniciarTransicao] = useTransition();

  const pagamentoAprovado = item.statusPagamento === "aprovado";
  const iniciou = agora !== null && agora >= new Date(item.inicioEm).getTime();
  const emAcompanhamento = pagamentoAprovado && (status === "aceito" || status === "andamento");
  const podeInformarDevolucao = item.papel === "interessado" && emAcompanhamento && iniciou;
  const podeConfirmarRecebimento = item.papel === "dono" && status === "devolucao";
  const statusVisual = status === "aceito" && pagamentoAprovado ? "andamento" : status;
  const itemAtual = { ...item, status, devolucaoSolicitadaEm, recebidoEm };

  function informarDevolucao() {
    if (!window.confirm("Confirma que o item já foi devolvido ao proprietário?")) return;
    setErro("");
    iniciarTransicao(async () => {
      const resultado = await informarDevolucaoAction(item.id);
      if (!resultado.sucesso) {
        setErro(resultado.erro);
        return;
      }
      setStatus("devolucao");
      setDevolucaoSolicitadaEm(resultado.momento);
    });
  }

  function confirmarRecebimento() {
    if (!window.confirm("Confirma que recebeu o item de volta? Esta ação concluirá o empréstimo.")) return;
    setErro("");
    iniciarTransicao(async () => {
      const resultado = await confirmarRecebimentoAction(item.id);
      if (!resultado.sucesso) {
        setErro(resultado.erro);
        return;
      }
      setStatus("concluido");
      setRecebidoEm(resultado.momento);
    });
  }

  return (
    <article className="flex gap-4 py-5">
      <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-soft">
        {item.imagem
          ? <Image src={item.imagem} alt="" fill sizes="80px" className="object-cover" unoptimized={item.imagem.startsWith("http")} />
          : <span className="grid h-full place-items-center text-primary-400"><IconeTrocas className="h-7 w-7" /></span>}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <Link href={`/itens/${item.anuncioId}`} className="font-bold text-primary-900 hover:underline">{item.nome}</Link>
          <span className={`rounded-full px-3 py-1 text-[11px] font-semibold ${STATUS[statusVisual][1]}`}>{STATUS[statusVisual][0]}</span>
        </div>
        <p className="mt-1 text-sm text-muted">{item.papel === "dono" ? "Solicitado por" : "Disponibilizado por"}: <strong className="font-semibold text-foreground">{item.pessoa}</strong></p>
        <p className="mt-2 text-xs text-muted">{DATA_HORA.format(new Date(item.inicioEm))} — {DATA_HORA.format(new Date(item.fimEm))}</p>
        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs">
          <span>{formatarDuracao(item.duracaoQuantidade, item.duracaoUnidade)}</span>
          <span>{formatarTarifa(item.valorUnitarioCentavos, item.duracaoUnidade)}</span>
          <strong className="text-primary-700">Total: {formatarValor(item.valorTotalCentavos)}</strong>
        </div>

        {emAcompanhamento ? <Temporizador item={itemAtual} agora={agora} /> : null}

        {status === "devolucao" ? (
          <section className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4">
            <div className="flex items-start gap-3">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white text-amber-700"><IconeTrocas className="h-5 w-5" /></span>
              <div>
                <p className="text-sm font-bold text-amber-900">Devolução informada</p>
                <p className="mt-1 text-xs text-amber-800">{item.papel === "dono" ? "Confirme quando o item estiver novamente com você." : "Aguardando o proprietário confirmar o recebimento."}</p>
                {devolucaoSolicitadaEm ? <p className="mt-1 text-[11px] text-amber-700">Informada em {DATA_HORA.format(new Date(devolucaoSolicitadaEm))}</p> : null}
              </div>
            </div>
          </section>
        ) : null}

        {status === "concluido" ? (
          <section className="mt-4 flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white text-emerald-700"><IconeCheckCirculo className="h-5 w-5" /></span>
            <div><p className="text-sm font-bold text-emerald-900">Item recebido e empréstimo concluído</p>{recebidoEm ? <p className="mt-1 text-[11px] text-emerald-700">Confirmado em {DATA_HORA.format(new Date(recebidoEm))}</p> : null}</div>
          </section>
        ) : null}

        <div className="mt-3 flex flex-wrap gap-2">
          {item.conversaId ? <Link href={`/mensagens/${item.conversaId}`} className="inline-flex rounded-lg bg-primary-50 px-3 py-2 text-xs font-semibold text-primary-700 hover:bg-primary-100">Abrir conversa</Link> : null}
          {status === "aceito" && (item.papel === "interessado" || pagamentoAprovado) ? (
            <Link href={`/emprestimos/${item.id}/pagamento`} className={`inline-flex rounded-lg px-3 py-2 text-xs font-semibold ${pagamentoAprovado ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100" : "bg-primary-700 text-white hover:bg-primary-900"}`}>
              {pagamentoAprovado ? "Pagamento aprovado" : item.statusPagamento === "processando" ? "Ver pagamento" : "Simular pagamento"}
            </Link>
          ) : null}
          {podeInformarDevolucao ? <button type="button" onClick={informarDevolucao} disabled={processando} className="inline-flex items-center gap-1.5 rounded-lg bg-primary-700 px-3 py-2 text-xs font-semibold text-white hover:bg-primary-900 disabled:cursor-wait disabled:opacity-60"><IconeTrocas className="h-4 w-4" />{processando ? "Registrando..." : "Marcar item como devolvido"}</button> : null}
          {podeConfirmarRecebimento ? <button type="button" onClick={confirmarRecebimento} disabled={processando} className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-700 disabled:cursor-wait disabled:opacity-60"><IconeCheckCirculo className="h-4 w-4" />{processando ? "Confirmando..." : "Confirmar recebimento"}</button> : null}
        </div>
        {emAcompanhamento && item.papel === "interessado" && !iniciou ? <p className="mt-2 text-[11px] text-muted">O botão de devolução ficará disponível quando o empréstimo começar.</p> : null}
        {emAcompanhamento && item.papel === "dono" ? <p className="mt-2 text-[11px] text-muted">Quando o item for devolvido, a confirmação de recebimento aparecerá aqui.</p> : null}
        {erro ? <p role="alert" className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-700">{erro}</p> : null}
      </div>
    </article>
  );
}

function Lista({ titulo, subtitulo, itens, vazio, agora }: { titulo: string; subtitulo: string; itens: Emprestimo[]; vazio: string; agora: number | null }) {
  return (
    <section className="overflow-hidden rounded-2xl border border-border bg-surface shadow-sm">
      <header className="border-b border-border px-5 py-4"><h2 className="font-bold text-primary-900">{titulo}</h2><p className="mt-1 text-xs text-muted">{subtitulo}</p></header>
      <div className="divide-y divide-border px-5">{itens.length ? itens.map((item) => <CartaoSolicitacao key={item.id} item={item} agora={agora} />) : <p className="py-10 text-center text-sm text-muted">{vazio}</p>}</div>
    </section>
  );
}

export function EmprestimosView({ resultado, erro }: { resultado: ResultadoEmprestimos; erro?: string }) {
  const [agora, setAgora] = useState<number | null>(null);

  useEffect(() => {
    const inicio = window.setTimeout(() => setAgora(Date.now()), 0);
    const intervalo = window.setInterval(() => setAgora(Date.now()), 1_000);
    return () => {
      window.clearTimeout(inicio);
      window.clearInterval(intervalo);
    };
  }, []);

  const recebidas = resultado.dados.filter((item) => item.papel === "dono");
  const enviadas = resultado.dados.filter((item) => item.papel === "interessado");
  const emAndamento = resultado.dados.filter((item) => item.status === "andamento" || (item.status === "aceito" && item.statusPagamento === "aprovado")).length;
  const aguardandoRecebimento = resultado.dados.filter((item) => item.papel === "dono" && item.status === "devolucao").length;

  return <main className="mx-auto max-w-7xl px-5 py-8 sm:px-8 sm:py-10">
    <div className="flex items-center gap-4"><span className="grid h-12 w-12 place-items-center rounded-2xl bg-primary-100 text-primary-600"><IconeTrocas className="h-7 w-7" /></span><div><h1 className="text-2xl font-extrabold tracking-tight text-primary-900">Empréstimos</h1><p className="text-sm text-muted">Acompanhe prazos, devoluções e recebimentos.</p></div></div>
    {resultado.requerLogin ? <section className="mt-8 rounded-2xl border border-border bg-surface p-8 text-center shadow-sm"><h2 className="font-bold text-primary-900">Entre para ver suas solicitações</h2><p className="mt-2 text-sm text-muted">As reservas são privadas e visíveis somente para as pessoas envolvidas.</p><Link href="/login?next=/emprestimos" className="mt-5 inline-flex rounded-xl bg-primary-700 px-5 py-3 font-semibold text-white hover:bg-primary-900">Entrar</Link></section> : erro ? <p role="alert" className="mt-8 rounded-xl bg-red-50 p-4 text-sm text-red-700">{erro}</p> : <>
      <section className="my-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[["Solicitações recebidas", recebidas.length], ["Solicitações enviadas", enviadas.length], ["Em andamento", emAndamento], ["Aguardando recebimento", aguardandoRecebimento]].map(([rotulo, valor]) => <article key={String(rotulo)} className="rounded-2xl border border-border bg-surface p-5 shadow-sm"><p className="text-xs text-muted">{rotulo}</p><strong className="mt-1 block text-2xl text-primary-900">{valor}</strong></article>)}
      </section>
      <div className="grid items-start gap-5 lg:grid-cols-2">
        <Lista titulo="Solicitações recebidas" subtitulo="Reservas e devoluções dos seus itens." itens={recebidas} vazio="Nenhuma solicitação recebida." agora={agora} />
        <Lista titulo="Solicitações enviadas" subtitulo="Itens que você solicitou e precisa devolver." itens={enviadas} vazio="Nenhuma solicitação enviada." agora={agora} />
      </div>
    </>}
  </main>;
}
