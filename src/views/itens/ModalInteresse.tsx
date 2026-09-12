"use client";

import { FormEvent, MouseEvent, useId, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { iniciarConversaAction } from "@/controllers/mensagem.actions";
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

export function ModalInteresse({ anuncioId, nomeDono, tituloItem }: Props) {
  const router = useRouter();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const botaoAbrirRef = useRef<HTMLButtonElement>(null);
  const idBase = useId();
  const idTitulo = `${idBase}-titulo`;
  const idMensagem = `${idBase}-mensagem`;
  const idContador = `${idBase}-contador`;
  const idErro = `${idBase}-erro`;
  const idAviso = `${idBase}-aviso`;
  const [mensagem, setMensagem] = useState(`Olá ${nomeDono}, tenho interesse em ${tituloItem}. Como podemos combinar?`);
  const [erro, setErro] = useState("");
  const [aviso, setAviso] = useState("");
  const [enviando, iniciarEnvio] = useTransition();

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

  function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const mensagemNormalizada = mensagem.trim();
    if (!mensagemNormalizada) {
      setErro("Escreva uma mensagem antes de continuar.");
      setAviso("");
      return;
    }
    if (mensagemNormalizada.length > LIMITE_MENSAGEM) {
      setErro(`A mensagem deve ter no máximo ${LIMITE_MENSAGEM} caracteres.`);
      setAviso("");
      return;
    }

    setErro("");
    setAviso("");
    iniciarEnvio(async () => {
      const resultado = await iniciarConversaAction(anuncioId, mensagemNormalizada);
      if (!resultado.sucesso) {
        setErro(resultado.erro);
        return;
      }
      setAviso("Conversa iniciada. Abrindo mensagens...");
      router.push(`/mensagens/${resultado.conversaId}`);
    });
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

          <button type="submit" disabled={enviando} className="mt-5 w-full rounded-lg bg-primary-700 px-5 py-3 font-semibold text-white hover:bg-primary-900 disabled:cursor-wait disabled:opacity-60">{enviando ? "Enviando..." : "Enviar mensagem"}</button>
          <button type="button" disabled={enviando} onClick={fechar} className="mt-2 w-full rounded-lg px-5 py-2 text-sm font-semibold text-primary-700 hover:bg-primary-50 disabled:opacity-50">Cancelar</button>
        </form>
      </dialog>
    </>
  );
}
