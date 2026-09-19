"use client";

import { MouseEvent, useActionState, useEffect, useId, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { avaliarUsuarioAction } from "@/controllers/avaliacao.actions";
import { SeletorEstrelas } from "@/views/avaliacoes/SeletorEstrelas";

type Props = {
  solicitacaoId: string;
  nomeAvaliado: string;
  aberto: boolean;
  aoFechar: (avaliado: boolean) => void;
};

function BotaoEnviar({ notaEscolhida }: { notaEscolhida: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending || !notaEscolhida}
      className="mt-5 w-full rounded-xl bg-primary-700 px-5 py-3 font-semibold text-white transition hover:bg-primary-900 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? "Enviando..." : "Enviar avaliação"}
    </button>
  );
}

export function ModalAvaliacao({ solicitacaoId, nomeAvaliado, aberto, aoFechar }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const idTitulo = `${useId()}-titulo`;
  const [estado, acao] = useActionState(avaliarUsuarioAction, { erro: "", sucesso: false });
  const [nota, setNota] = useState(0);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (aberto && !dialog.open) dialog.showModal();
    if (!aberto && dialog.open) dialog.close();
  }, [aberto]);

  function fechar() {
    dialogRef.current?.close();
  }
  function clicarFundo(evento: MouseEvent<HTMLDialogElement>) {
    if (evento.target === evento.currentTarget) fechar();
  }

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={idTitulo}
      onClick={clicarFundo}
      onClose={() => aoFechar(estado.sucesso)}
      className="m-auto w-[min(92vw,420px)] rounded-2xl border border-border bg-surface p-0 text-foreground shadow-2xl backdrop:bg-slate-950/40"
    >
      <form action={acao} className="p-6">
        <input type="hidden" name="solicitacaoId" value={solicitacaoId} />
        <input type="hidden" name="nota" value={nota || ""} />

        <h2 id={idTitulo} className="text-lg font-bold text-primary-900">Avaliar {nomeAvaliado}</h2>

        {estado.sucesso ? (
          <div role="status" className="mt-4 rounded-xl bg-emerald-50 p-4 text-sm text-emerald-800">
            <p className="font-semibold">Avaliação enviada.</p>
            <p className="mt-1">Obrigado por avaliar {nomeAvaliado}.</p>
          </div>
        ) : <>
          <p className="mt-2 text-sm text-muted">Empréstimo concluído! Como foi sua experiência com {nomeAvaliado}?</p>
          <div className="mt-4"><SeletorEstrelas valor={nota} aoEscolher={setNota} /></div>
          <label htmlFor={`${idTitulo}-comentario`} className="mt-4 block text-sm font-semibold">
            Comentário (opcional)
          </label>
          <textarea
            id={`${idTitulo}-comentario`}
            name="comentario"
            maxLength={500}
            rows={3}
            className="mt-2 w-full rounded-xl border border-border bg-white px-4 py-3 outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
          />
          {estado.erro ? <p role="alert" className="mt-3 text-sm font-medium text-red-700">{estado.erro}</p> : null}
          <BotaoEnviar notaEscolhida={nota > 0} />
        </>}

        <button type="button" onClick={fechar} className="mt-2 w-full rounded-lg px-5 py-2 text-sm font-semibold text-primary-700 hover:bg-primary-50">
          {estado.sucesso ? "Fechar" : "Agora não"}
        </button>
      </form>
    </dialog>
  );
}
