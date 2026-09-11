"use client";

import Link from "next/link";
import { MouseEvent, useActionState, useId, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { solicitarEmprestimoAction } from "@/controllers/solicitar-emprestimo.actions";
import { calcularTotal, formatarDuracao, formatarTarifa, formatarValor } from "@/lib/formatar-emprestimo";
import type { UnidadeDuracao } from "@/models/entities/item";
import { IconeCoracao } from "@/views/comuns/Icones";

type Props = {
  anuncioId: string;
  nomeDono: string;
  tituloItem: string;
  valorUnitarioCentavos: number;
  duracaoQuantidade: number;
  duracaoUnidade: UnidadeDuracao;
  condicao?: string;
};

function BotaoConfirmar() {
  const { pending } = useFormStatus();
  return <button type="submit" disabled={pending} className="mt-5 w-full rounded-xl bg-primary-700 px-5 py-3 font-semibold text-white transition hover:bg-primary-900 disabled:cursor-wait disabled:opacity-60">{pending ? "Enviando..." : "Enviar solicitação"}</button>;
}

const SEGUNDOS_POR_UNIDADE: Record<UnidadeDuracao, number> = {
  minutos: 60,
  horas: 3_600,
  dias: 86_400,
  semanas: 604_800,
};

function adicionarDuracao(inicio: Date, quantidade: number, unidade: UnidadeDuracao): Date {
  return new Date(inicio.getTime() + quantidade * SEGUNDOS_POR_UNIDADE[unidade] * 1_000);
}

function formatarDataHora(data: Date): string {
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(data);
}

function dataHoraLocal(data: Date): string {
  const local = new Date(data.getTime() - data.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 16);
}

export function ModalInteresse({ anuncioId, nomeDono, tituloItem, valorUnitarioCentavos, duracaoQuantidade, duracaoUnidade, condicao }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const botaoAbrirRef = useRef<HTMLButtonElement>(null);
  const idTitulo = `${useId()}-titulo`;
  const [estado, acao] = useActionState(solicitarEmprestimoAction, { erro: "", sucesso: false });
  const [inicioLocal, setInicioLocal] = useState("");
  const [inicioMinimo, setInicioMinimo] = useState("");
  const inicio = inicioLocal ? new Date(inicioLocal) : null;
  const inicioValido = inicio && Number.isFinite(inicio.getTime());
  const fim = inicioValido ? adicionarDuracao(inicio, duracaoQuantidade, duracaoUnidade) : null;
  const inicioIso = inicioValido ? inicio.toISOString() : "";

  function clicarFundo(evento: MouseEvent<HTMLDialogElement>) {
    if (evento.target === evento.currentTarget) dialogRef.current?.close();
  }

  function abrir() {
    setInicioMinimo(dataHoraLocal(new Date(Date.now() + 60_000)));
    dialogRef.current?.showModal();
  }

  return <>
    <button ref={botaoAbrirRef} type="button" onClick={abrir} className="w-full rounded-xl bg-primary-700 px-5 py-3 font-semibold text-white shadow-sm transition hover:bg-primary-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-700">
      <IconeCoracao className="mr-2 inline h-4 w-4" /> Solicitar reserva
    </button>
    <p className="mt-3 text-center text-xs text-muted">Escolha o início e revise as condições da reserva.</p>

    <dialog ref={dialogRef} aria-labelledby={idTitulo} onClick={clicarFundo} onClose={() => botaoAbrirRef.current?.focus()} className="m-auto w-[min(92vw,460px)] rounded-2xl border border-border bg-surface p-0 text-foreground shadow-2xl backdrop:bg-slate-950/40">
      <form action={acao} className="p-6">
        <input type="hidden" name="anuncioId" value={anuncioId} />
        <input type="hidden" name="inicioEm" value={inicioIso} />
        <div className="flex items-start justify-between gap-4">
          <div><p className="text-xs font-bold uppercase tracking-wide text-primary-600">Solicitação de reserva</p><h2 id={idTitulo} className="mt-1 text-xl font-bold text-primary-900">Revise antes de enviar</h2></div>
          <button type="button" onClick={() => dialogRef.current?.close()} aria-label="Fechar" className="-mr-2 -mt-2 grid h-9 w-9 place-items-center rounded-full text-xl text-muted hover:bg-soft hover:text-primary-700">×</button>
        </div>

        <section aria-label="Resumo do empréstimo" className="mt-5 rounded-xl border border-border bg-primary-50/50 p-4">
          <h3 className="font-bold text-primary-900">{tituloItem}</h3>
          <p className="mt-1 text-sm text-muted">Disponibilizado por {nomeDono}</p>
          <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
            <div><dt className="text-xs text-muted">Tarifa</dt><dd className="mt-1 font-bold text-primary-700">{formatarTarifa(valorUnitarioCentavos, duracaoUnidade)}</dd></div>
            <div><dt className="text-xs text-muted">Período</dt><dd className="mt-1 font-semibold">{formatarDuracao(duracaoQuantidade, duracaoUnidade)}</dd></div>
            <div className="col-span-2"><dt className="text-xs text-muted">Valor total</dt><dd className="mt-1 font-bold text-primary-900">{formatarValor(calcularTotal(valorUnitarioCentavos, duracaoQuantidade))}</dd></div>
            {condicao ? <div className="col-span-2"><dt className="text-xs text-muted">Condição do item</dt><dd className="mt-1 font-semibold">{condicao}</dd></div> : null}
          </dl>
        </section>

        {estado.sucesso ? <div role="status" className="mt-5 rounded-xl bg-emerald-50 p-4 text-sm text-emerald-800"><p className="font-semibold">Solicitação enviada.</p><p className="mt-1">Acompanhe o andamento na tela de empréstimos.</p><Link href="/emprestimos" className="mt-3 inline-block font-semibold underline">Ver minhas solicitações</Link></div> : <>
          <div className="mt-5">
            <label htmlFor={`${idTitulo}-inicio`} className="block text-sm font-semibold">Data e hora de início</label>
            <input id={`${idTitulo}-inicio`} type="datetime-local" required min={inicioMinimo} value={inicioLocal} onChange={(evento) => setInicioLocal(evento.target.value)} autoFocus className="mt-2 w-full rounded-xl border border-border bg-white px-4 py-3 outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100" />
            {fim ? <p className="mt-2 rounded-lg bg-soft px-3 py-2 text-sm text-muted">Término previsto: <strong className="text-foreground">{formatarDataHora(fim)}</strong></p> : <p className="mt-2 text-xs text-muted">O término será calculado automaticamente.</p>}
          </div>
          <label className="mt-5 flex cursor-pointer items-start gap-3 rounded-xl border border-border p-4 text-sm">
            <input type="checkbox" name="confirmacao" required className="mt-0.5 h-4 w-4 accent-primary-700" />
            <span>Confirmo que revisei o início, o período, o valor e as condições da reserva.</span>
          </label>
          {estado.erro ? <p role="alert" className="mt-3 text-sm font-medium text-red-700">{estado.erro}</p> : null}
          <BotaoConfirmar />
        </>}
        <button type="button" onClick={() => dialogRef.current?.close()} className="mt-2 w-full rounded-lg px-5 py-2 text-sm font-semibold text-primary-700 hover:bg-primary-50">{estado.sucesso ? "Fechar" : "Cancelar"}</button>
      </form>
    </dialog>
  </>;
}
