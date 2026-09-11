/**
 * Camada VIEW — cartão de um item concluído no histórico.
 */

import type { Emprestimo } from "@/models/entities/emprestimo";

export function CardHistorico({ emprestimo }: { emprestimo: Emprestimo }) {
  return (
    <article className="flex items-center gap-3 rounded-2xl border border-border bg-surface p-4 shadow-sm">
      <div
        aria-hidden
        className={`grid h-14 w-14 shrink-0 place-items-center rounded-xl bg-gradient-to-br ${emprestimo.cor} text-2xl shadow-inner`}
      >
        {emprestimo.emoji}
      </div>

      <div className="min-w-0 flex-1">
        <h3 className="truncate text-[14px] font-semibold text-primary-900">{emprestimo.nome}</h3>
        <p className="text-[12px] text-muted">Para: {emprestimo.pessoa}</p>
        <p className="mt-0.5 text-[12px] text-muted">{emprestimo.data}</p>
      </div>

      <span className="hidden shrink-0 rounded-full bg-green-50 px-3 py-1.5 text-[10px] font-semibold text-green-700 sm:block">
        Concluído
      </span>
    </article>
  );
}
