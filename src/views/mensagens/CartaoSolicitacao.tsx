import type { StatusSolicitacao } from "@/models/entities/mensagem";
import { IconeTrocas } from "@/views/comuns/Icones";

type Props = {
  status: StatusSolicitacao;
  usuarioEProprietario: boolean;
  respondendo: boolean;
  onResponder: (aceitar: boolean) => void;
};

const APRESENTACAO: Record<StatusSolicitacao, { texto: string; classe: string }> = {
  aguardando: { texto: "Aguardando decisão do proprietário", classe: "bg-amber-50 text-amber-800" },
  aceito: { texto: "Solicitação aceita", classe: "bg-emerald-50 text-emerald-700" },
  recusado: { texto: "Solicitação recusada", classe: "bg-red-50 text-red-700" },
  negociacao: { texto: "Em negociação", classe: "bg-sky-50 text-sky-700" },
  andamento: { texto: "Empréstimo em andamento", classe: "bg-indigo-50 text-indigo-700" },
  devolucao: { texto: "Aguardando devolução", classe: "bg-orange-50 text-orange-700" },
  concluido: { texto: "Empréstimo concluído", classe: "bg-slate-100 text-slate-700" },
};

export function CartaoSolicitacao({ status, usuarioEProprietario, respondendo, onResponder }: Props) {
  const apresentacao = APRESENTACAO[status];
  return (
    <aside className="mx-auto my-5 w-full max-w-md rounded-2xl border border-primary-100 bg-white p-4 text-center shadow-sm" aria-live="polite">
      <span className="mx-auto grid h-10 w-10 place-items-center rounded-full bg-primary-50 text-primary-700" aria-hidden="true">
        <IconeTrocas className="h-5 w-5" />
      </span>
      <strong className="mt-2 block text-sm text-primary-900">Solicitação de empréstimo</strong>
      <span className={`mt-2 inline-flex rounded-full px-3 py-1 text-xs font-semibold ${apresentacao.classe}`}>{apresentacao.texto}</span>
      {status === "aguardando" && usuarioEProprietario ? (
        <div className="mt-4 grid grid-cols-2 gap-2">
          <button type="button" disabled={respondendo} onClick={() => onResponder(true)} className="rounded-lg bg-primary-700 px-3 py-2 text-xs font-bold text-white hover:bg-primary-900 disabled:cursor-wait disabled:opacity-60">
            Aceitar empréstimo
          </button>
          <button type="button" disabled={respondendo} onClick={() => onResponder(false)} className="rounded-lg border border-red-200 px-3 py-2 text-xs font-bold text-red-700 hover:bg-red-50 disabled:cursor-wait disabled:opacity-60">
            Recusar
          </button>
        </div>
      ) : null}
    </aside>
  );
}
