/**
 * Camada VIEW — espaço reservado para as listas que ainda não têm dado.
 */

import type { ReactNode } from "react";

type PropsEstadoVazio = {
  icone: ReactNode;
  titulo: string;
  descricao: string;
};

export function EstadoVazio({ icone, titulo, descricao }: PropsEstadoVazio) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border bg-surface px-6 py-16 text-center">
      <span className="grid h-12 w-12 place-items-center rounded-full bg-primary-50 text-primary-500">
        {icone}
      </span>
      <strong className="text-[15px] font-semibold text-primary-900">{titulo}</strong>
      <p className="max-w-sm text-[13px] leading-relaxed text-muted">{descricao}</p>
    </div>
  );
}
