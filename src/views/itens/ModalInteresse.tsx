"use client";

import { FormEvent, MouseEvent, useId, useRef, useState } from "react";
import { IconeCoracao } from "@/views/comuns/Icones";

const LIMITE_MENSAGEM = 500;

type Props = {
  nomeDono: string;
  tituloItem: string;
};

export function ModalInteresse({ nomeDono, tituloItem }: Props) {
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

  function abrir() {
    setErro("");
    setAviso("");
    dialogRef.current?.showModal();
  }

  function fechar() {
    dialogRef.current?.close();
  }

  function clicarFundo(evento: MouseEvent<HTMLDialogElement>) {
    if (evento.target === evento.currentTarget) fechar();
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
    setAviso("Mensagem pronta. O envio ficará disponível após a integração com o Supabase.");
  }

  return (
    <>
      <button ref={botaoAbrirRef} type="button" onClick={abrir} className="w-full rounded-lg bg-primary-700 px-5 py-3 font-semibold text-white shadow-sm hover:bg-primary-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-700">
        <IconeCoracao className="mr-2 inline h-4 w-4" /> Tenho interesse
      </button>
      <p className="mt-3 text-center text-xs text-muted">Envie uma mensagem para combinar os detalhes.</p>

      <dialog ref={dialogRef} aria-labelledby={idTitulo} onClick={clicarFundo} onClose={() => botaoAbrirRef.current?.focus()} className="m-auto w-[min(92vw,440px)] rounded-2xl border border-border bg-surface p-0 text-foreground shadow-2xl backdrop:bg-slate-950/40">
        <form onSubmit={enviar} className="p-6" noValidate>
          <div className="flex items-start justify-between gap-4">
            <h2 id={idTitulo} className="font-bold text-primary-900">Enviar mensagem para {nomeDono}</h2>
            <button type="button" onClick={fechar} aria-label="Fechar" className="-mr-2 -mt-2 grid h-9 w-9 place-items-center rounded-full text-xl text-muted hover:bg-soft hover:text-primary-700">×</button>
          </div>

          <label htmlFor={idMensagem} className="mt-5 block text-sm font-semibold">Sua mensagem</label>
          <textarea
            id={idMensagem}
            name="mensagem"
            value={mensagem}
            onChange={(evento) => { setMensagem(evento.target.value); setErro(""); setAviso(""); }}
            required
            maxLength={LIMITE_MENSAGEM}
            autoFocus
            aria-describedby={[idContador, erro ? idErro : "", aviso ? idAviso : ""].filter(Boolean).join(" ")}
            aria-invalid={Boolean(erro)}
            className="mt-2 min-h-32 w-full resize-y rounded-lg border border-border bg-white p-3 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
          />
          <p id={idContador} className="mt-1 text-right text-xs text-muted">{mensagem.length}/{LIMITE_MENSAGEM}</p>
          {erro ? <p id={idErro} role="alert" className="mt-2 text-sm text-red-600">{erro}</p> : null}
          {aviso ? <p id={idAviso} role="status" className="mt-2 rounded-lg bg-primary-50 p-3 text-sm text-primary-900">{aviso}</p> : null}

          <button type="submit" className="mt-5 w-full rounded-lg bg-primary-700 px-5 py-3 font-semibold text-white hover:bg-primary-900">Enviar mensagem</button>
          <button type="button" onClick={fechar} className="mt-2 w-full rounded-lg px-5 py-2 text-sm font-semibold text-primary-700 hover:bg-primary-50">Cancelar</button>
        </form>
      </dialog>
    </>
  );
}
