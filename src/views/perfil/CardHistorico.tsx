/**
 * Camada VIEW — cartão de um item concluído no histórico.
 */

import Image from "next/image";
import type { Emprestimo } from "@/models/entities/emprestimo";

const DATA = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short" });

export function CardHistorico({ emprestimo }: { emprestimo: Emprestimo }) {
  return (
    <article className="flex items-center gap-3 rounded-2xl border border-border bg-surface p-4 shadow-sm">
      <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-soft">
        {emprestimo.imagem ? <Image src={emprestimo.imagem} alt="" fill sizes="56px" className="object-cover" unoptimized={emprestimo.imagem.startsWith("http")} /> : <span aria-hidden className="grid h-full place-items-center text-2xl text-primary-300">◇</span>}
      </div>

      <div className="min-w-0 flex-1">
        <h3 className="truncate text-[14px] font-semibold text-primary-900">{emprestimo.nome}</h3>
        <p className="text-[12px] text-muted">{emprestimo.papel === "dono" ? "Solicitado por" : "Disponibilizado por"}: {emprestimo.pessoa}</p>
        <p className="mt-0.5 text-[12px] text-muted">{DATA.format(new Date(emprestimo.inicioEm))} — {DATA.format(new Date(emprestimo.fimEm))}</p>
      </div>

      <span className="hidden shrink-0 rounded-full bg-green-50 px-3 py-1.5 text-[10px] font-semibold text-green-700 sm:block">
        Concluído
      </span>
    </article>
  );
}
