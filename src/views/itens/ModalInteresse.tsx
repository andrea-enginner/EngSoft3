"use client";

import Link from "next/link";
import { MouseEvent, useActionState, useId, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { solicitarEmprestimoAction } from "@/controllers/solicitar-emprestimo.actions";
import { calcularTotalProporcional, formatarDuracao, formatarTarifa, formatarValor } from "@/lib/formatar-emprestimo";
import type { UnidadeDuracao } from "@/models/entities/item";
import { IconeCoracao } from "@/views/comuns/Icones";

type Props = { anuncioId: string; nomeDono: string; tituloItem: string; valorUnitarioCentavos: number; duracaoQuantidade: number; duracaoUnidade: UnidadeDuracao; condicao?: string };

function BotaoConfirmar() {
  const { pending } = useFormStatus();
  return <button type="submit" disabled={pending} className="mt-5 w-full rounded-xl bg-primary-700 px-5 py-3 font-semibold text-white transition hover:bg-primary-900 disabled:cursor-wait disabled:opacity-60">{pending ? "Enviando..." : "Enviar solicitação"}</button>;
}

const SEGUNDOS_POR_UNIDADE: Record<UnidadeDuracao, number> = { minutos: 60, horas: 3_600, dias: 86_400, semanas: 604_800 };
function adicionarDuracao(inicio: Date, quantidade: number, unidade: UnidadeDuracao) { return new Date(inicio.getTime() + quantidade * SEGUNDOS_POR_UNIDADE[unidade] * 1_000); }
function formatarData(data: Date) { return new Intl.DateTimeFormat("pt-BR", { dateStyle: "long" }).format(data); }
function dataLocal(data: Date) { const local = new Date(data.getTime() - data.getTimezoneOffset() * 60_000); return local.toISOString().slice(0, 10); }

export function ModalInteresse({ anuncioId, nomeDono, tituloItem, valorUnitarioCentavos, duracaoQuantidade, duracaoUnidade, condicao }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const botaoAbrirRef = useRef<HTMLButtonElement>(null);
  const idTitulo = `${useId()}-titulo`;
  const [estado, acao] = useActionState(solicitarEmprestimoAction, { erro: "", sucesso: false, conversaId: null });
  const [inicioLocal, setInicioLocal] = useState("");
  const [inicioMinimo, setInicioMinimo] = useState("");
  const [quantidadeTexto, setQuantidadeTexto] = useState(String(duracaoQuantidade));
  const [unidadeReserva, setUnidadeReserva] = useState<"dias" | "semanas">(duracaoUnidade === "semanas" ? "semanas" : "dias");
  const inicio = inicioLocal ? new Date(`${inicioLocal}T00:00:00`) : null;
  const inicioValido = inicio && Number.isFinite(inicio.getTime());
  const quantidade = Number(quantidadeTexto);
  const limiteQuantidade = unidadeReserva === "dias" && duracaoUnidade === "semanas" ? duracaoQuantidade * 7 : duracaoQuantidade;
  const quantidadeValida = Number.isSafeInteger(quantidade) && quantidade >= 1 && quantidade <= limiteQuantidade;
  const fim = inicioValido && quantidadeValida ? adicionarDuracao(inicio, quantidade, unidadeReserva) : null;
  const inicioIso = inicioValido ? inicio.toISOString() : "";
  const total = quantidadeValida
    ? calcularTotalProporcional(valorUnitarioCentavos, duracaoUnidade, quantidade, unidadeReserva)
    : null;

  function abrir() { const amanha = new Date(); amanha.setDate(amanha.getDate() + 1); setInicioMinimo(dataLocal(amanha)); dialogRef.current?.showModal(); }
  function fechar() { dialogRef.current?.close(); }
  function clicarFundo(evento: MouseEvent<HTMLDialogElement>) { if (evento.target === evento.currentTarget) fechar(); }
  function trocarUnidade(novaUnidade: "dias" | "semanas") {
    if (novaUnidade === unidadeReserva) return;
    const quantidadeAtual = quantidadeValida ? quantidade : 1;
    const novaQuantidade = novaUnidade === "dias" ? quantidadeAtual * 7 : Math.max(1, Math.ceil(quantidadeAtual / 7));
    setUnidadeReserva(novaUnidade);
    setQuantidadeTexto(String(Math.min(novaUnidade === "dias" ? duracaoQuantidade * 7 : duracaoQuantidade, novaQuantidade)));
  }
  function diminuirDuracao() {
    if (unidadeReserva === "semanas" && quantidade <= 1) {
      setUnidadeReserva("dias");
      setQuantidadeTexto("6");
      return;
    }
    setQuantidadeTexto(String(Math.max(1, (quantidadeValida ? quantidade : 1) - 1)));
  }
  function aumentarDuracao() {
    if (duracaoUnidade === "semanas" && unidadeReserva === "dias" && quantidade === 6) {
      setUnidadeReserva("semanas");
      setQuantidadeTexto("1");
      return;
    }
    setQuantidadeTexto(String(Math.min(limiteQuantidade, (quantidadeValida ? quantidade : 0) + 1)));
  }
  return <>
    <button ref={botaoAbrirRef} type="button" onClick={abrir} className="w-full rounded-xl bg-primary-700 px-5 py-3 font-semibold text-white shadow-sm transition hover:bg-primary-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-700"><IconeCoracao className="mr-2 inline h-4 w-4" /> Solicitar reserva</button>
    <p className="mt-3 text-center text-xs text-muted">Escolha o início e revise as condições da reserva.</p>
    <dialog ref={dialogRef} aria-labelledby={idTitulo} onClick={clicarFundo} onClose={() => botaoAbrirRef.current?.focus()} className="m-auto w-[min(92vw,460px)] rounded-2xl border border-border bg-surface p-0 text-foreground shadow-2xl backdrop:bg-slate-950/40">
      <form action={acao} className="p-6">
        <input type="hidden" name="anuncioId" value={anuncioId} /><input type="hidden" name="inicioEm" value={inicioIso} /><input type="hidden" name="duracaoQuantidade" value={quantidadeValida ? quantidade : ""} /><input type="hidden" name="duracaoUnidade" value={unidadeReserva} />
        <div className="relative px-10 text-center"><p className="text-xs font-bold uppercase tracking-wide text-primary-600">Solicitação de reserva</p><h2 id={idTitulo} className="mt-1 text-xl font-bold text-primary-900">Revise antes de enviar</h2><button type="button" onClick={fechar} aria-label="Fechar" className="absolute -right-2 -top-2 grid h-9 w-9 place-items-center rounded-full text-xl text-muted hover:bg-soft hover:text-primary-700">×</button></div>
        <section aria-label="Resumo do empréstimo" className="mt-5 rounded-xl border border-border bg-primary-50/50 p-4 text-center">
          <h3 className="font-bold text-primary-900">{tituloItem}</h3><p className="mt-1 text-sm text-muted">Disponibilizado por {nomeDono}</p>
          <dl className="mt-4 grid grid-cols-2 gap-3 text-sm"><div><dt className="text-xs text-muted">Tarifa</dt><dd className="mt-1 font-bold text-primary-700">{formatarTarifa(valorUnitarioCentavos, duracaoUnidade)}</dd></div><div><dt className="text-xs text-muted">Período escolhido</dt><dd className="mt-1 font-semibold">{quantidadeValida ? formatarDuracao(quantidade, unidadeReserva) : "—"}</dd></div><div className="col-span-2 border-t border-primary-100 pt-3"><dt className="text-xs text-muted">Valor proporcional</dt><dd className="mt-1 text-lg font-bold text-primary-900">{total !== null ? formatarValor(total) : "—"}</dd></div>{condicao ? <div className="col-span-2"><dt className="text-xs text-muted">Condição do item</dt><dd className="mt-1 font-semibold">{condicao}</dd></div> : null}</dl>
        </section>
        {estado.sucesso ? <div role="status" className="mt-5 rounded-xl bg-emerald-50 p-4 text-sm text-emerald-800"><p className="font-semibold">Solicitação e mensagem enviadas ao proprietário.</p><p className="mt-1">Você pode acompanhar a reserva ou abrir a conversa já criada.</p><div className="mt-4 flex flex-wrap gap-2"><Link href="/emprestimos" className="rounded-lg border border-emerald-200 px-3 py-2 font-semibold hover:bg-emerald-100">Ver solicitações</Link>{estado.conversaId ? <Link href={`/mensagens/${estado.conversaId}`} className="rounded-lg bg-primary-700 px-3 py-2 font-semibold text-white hover:bg-primary-900">Abrir conversa</Link> : null}</div></div> : <>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div><label htmlFor={`${idTitulo}-inicio`} className="block text-sm font-semibold">Data de início</label><input id={`${idTitulo}-inicio`} type="date" required min={inicioMinimo} value={inicioLocal} onChange={(evento) => setInicioLocal(evento.target.value)} autoFocus className="mt-2 w-full rounded-xl border border-border bg-white px-4 py-3 outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100" /></div>
            <div><div className="flex items-center justify-between gap-2"><label htmlFor={`${idTitulo}-quantidade`} className="block text-sm font-semibold">Duração</label>{duracaoUnidade === "semanas" ? <div className="inline-flex rounded-lg bg-primary-50 p-1" aria-label="Unidade da reserva"><button type="button" onClick={() => trocarUnidade("dias")} aria-pressed={unidadeReserva === "dias"} className={`rounded-md px-2.5 py-1 text-xs font-semibold ${unidadeReserva === "dias" ? "bg-white text-primary-700 shadow-sm" : "text-muted"}`}>Dias</button><button type="button" onClick={() => trocarUnidade("semanas")} aria-pressed={unidadeReserva === "semanas"} className={`rounded-md px-2.5 py-1 text-xs font-semibold ${unidadeReserva === "semanas" ? "bg-white text-primary-700 shadow-sm" : "text-muted"}`}>Semanas</button></div> : null}</div><div className="mt-2 flex rounded-xl border border-border bg-white focus-within:border-primary-500 focus-within:ring-2 focus-within:ring-primary-100"><button type="button" aria-label="Diminuir duração" onClick={diminuirDuracao} className="w-12 text-xl font-semibold text-primary-700 hover:bg-primary-50">−</button><input id={`${idTitulo}-quantidade`} type="number" required min="1" max={limiteQuantidade} step="1" value={quantidadeTexto} onChange={(evento) => setQuantidadeTexto(evento.target.value)} aria-describedby={`${idTitulo}-limite`} className="min-w-0 flex-1 border-x border-border px-2 py-3 text-center outline-none" /><button type="button" aria-label="Aumentar duração" onClick={aumentarDuracao} className="w-12 text-xl font-semibold text-primary-700 hover:bg-primary-50">+</button></div><p id={`${idTitulo}-limite`} className="mt-2 text-center text-xs text-muted">{quantidadeValida ? `${formatarDuracao(quantidade, unidadeReserva)} de no máximo ${formatarDuracao(duracaoQuantidade, duracaoUnidade)}.` : `Informe um valor entre 1 e ${limiteQuantidade}.`}</p></div>
          </div>
          {fim ? <p className="mt-3 rounded-lg bg-soft px-3 py-2 text-center text-sm text-muted">Término previsto: <strong className="text-foreground">{formatarData(fim)}</strong></p> : <p className="mt-2 text-center text-xs text-muted">Escolha a data e a duração para calcular o término.</p>}
          <label className="mt-5 flex cursor-pointer items-start gap-3 rounded-xl border border-border p-4 text-sm"><input type="checkbox" name="confirmacao" required className="mt-0.5 h-4 w-4 accent-primary-700" /><span>Confirmo que revisei o início, o período, o valor e as condições da reserva.</span></label>
          {estado.erro ? <p role="alert" className="mt-3 text-sm font-medium text-red-700">{estado.erro}</p> : null}<BotaoConfirmar />
        </>}
        <button type="button" onClick={fechar} className="mt-2 w-full rounded-lg px-5 py-2 text-sm font-semibold text-primary-700 hover:bg-primary-50">{estado.sucesso ? "Fechar" : "Cancelar"}</button>
      </form>
    </dialog>
  </>;
}
