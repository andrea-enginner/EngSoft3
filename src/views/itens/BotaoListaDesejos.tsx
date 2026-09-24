"use client";

import Link from "next/link";
import { useId, useOptimistic, useRef, useState, useTransition } from "react";
import { alternarListaDesejosAction } from "@/controllers/lista-desejos.actions";
import { IconeCoracao } from "@/views/comuns/Icones";

type Props = {
  anuncioId: string;
  autenticado: boolean;
  naListaDesejos: boolean;
  destino: string;
  variante?: "card" | "detalhe";
};

export function BotaoListaDesejos({
  anuncioId,
  autenticado,
  naListaDesejos: estadoInicial,
  destino,
  variante = "card",
}: Props) {
  const [naListaDesejos, definirEstadoOtimista] = useOptimistic(estadoInicial);
  const [mensagem, setMensagem] = useState("");
  const [erro, setErro] = useState("");
  const [pendente, iniciarTransicao] = useTransition();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const botaoRef = useRef<HTMLButtonElement>(null);
  const tituloId = useId();

  function acionar() {
    setMensagem("");
    setErro("");
    if (!autenticado) {
      dialogRef.current?.showModal();
      return;
    }

    iniciarTransicao(async () => {
      definirEstadoOtimista(!naListaDesejos);
      const resultado = await alternarListaDesejosAction(anuncioId);
      if (resultado.sucesso) {
        setMensagem(
          resultado.naListaDesejos
            ? "Adicionado à lista de desejos."
            : "Removido da lista de desejos.",
        );
      } else {
        setErro(resultado.erro);
        setMensagem(resultado.erro);
      }
    });
  }

  const classes = variante === "detalhe"
    ? "absolute right-4 top-4 z-10 flex h-11 w-11 items-center justify-center rounded-full border border-border bg-white text-primary-700 shadow-md transition hover:bg-primary-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-700"
    : "absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white text-primary-700 shadow-sm transition hover:bg-primary-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-700";

  return (
    <>
      <button
        ref={botaoRef}
        type="button"
        className={classes}
        aria-label={naListaDesejos ? "Remover da lista de desejos" : "Adicionar à lista de desejos"}
        aria-pressed={naListaDesejos}
        aria-busy={pendente}
        disabled={pendente}
        onClick={acionar}
      >
        <IconeCoracao
          className={variante === "detalhe" ? "h-5 w-5" : "h-4 w-4"}
          preenchido={naListaDesejos}
        />
      </button>

      {erro ? (
        <span
          role="alert"
          className={`absolute right-0 z-20 w-64 rounded-xl border border-red-200 bg-white p-3 text-left text-xs font-medium text-red-700 shadow-lg ${variante === "detalhe" ? "top-16" : "top-12"}`}
        >
          {erro}
        </span>
      ) : (
        <span className="sr-only" aria-live="polite">{mensagem}</span>
      )}

      <dialog
        ref={dialogRef}
        aria-labelledby={tituloId}
        className="m-auto w-[calc(100%-2rem)] max-w-sm rounded-2xl border border-border bg-white p-0 text-foreground shadow-2xl backdrop:bg-black/45"
        onClose={() => botaoRef.current?.focus()}
        onClick={(evento) => {
          if (evento.target === evento.currentTarget) evento.currentTarget.close();
        }}
      >
        <div className="p-6 text-center">
          <span aria-hidden="true" className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-primary-100 text-primary-700">
            <IconeCoracao className="h-6 w-6" />
          </span>
          <h2 id={tituloId} className="mt-4 text-xl font-bold text-primary-900">
            Entre para criar sua lista
          </h2>
          <p className="mt-2 text-sm leading-6 text-muted">
            Salve os itens que deseja consultar novamente em um só lugar.
          </p>
          <div className="mt-6 grid gap-3">
            <Link
              href={`/login?next=${encodeURIComponent(destino)}`}
              className="rounded-xl bg-primary-700 px-5 py-3 text-sm font-semibold text-white hover:bg-primary-900"
            >
              Entrar
            </Link>
            <Link
              href="/cadastro"
              className="rounded-xl border border-primary-300 px-5 py-3 text-sm font-semibold text-primary-700 hover:bg-primary-50"
            >
              Criar conta
            </Link>
            <button
              type="button"
              className="rounded-xl px-5 py-2 text-sm font-semibold text-muted hover:bg-soft"
              onClick={() => dialogRef.current?.close()}
            >
              Agora não
            </button>
          </div>
        </div>
      </dialog>
    </>
  );
}
