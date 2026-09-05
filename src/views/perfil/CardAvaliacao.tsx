/**
 * Camada VIEW — cartão de uma avaliação recebida.
 *
 * Ainda não há tela que grave avaliações; o componente existe para que a aba
 * passe a listar o histórico assim que o repositório retornar registros.
 */

import type { Avaliacao } from "@/models/entities/avaliacao";
import { formatarDataCurta } from "@/lib/datas";
import { IconeEstrela } from "@/views/comuns/Icones";
import { Avatar } from "@/views/perfil/Avatar";

const NOTAS = [1, 2, 3, 4, 5];

export function Estrelas({ nota, className = "h-3.5 w-3.5" }: { nota: number; className?: string }) {
  return (
    <span className="flex items-center gap-0.5" aria-label={`Nota ${nota.toFixed(1)} de 5`}>
      {NOTAS.map((valor) => (
        <IconeEstrela
          key={valor}
          className={`${className} ${valor <= Math.round(nota) ? "text-estrela" : "text-border"}`}
        />
      ))}
    </span>
  );
}

export function CardAvaliacao({ avaliacao }: { avaliacao: Avaliacao }) {
  return (
    <article className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
      <div className="flex items-center gap-3">
        <Avatar
          nome={avaliacao.autor}
          avatar={avaliacao.avatarAutor}
          className="h-10 w-10 text-xs"
          sizes="40px"
        />
        <div className="min-w-0 flex-1">
          <strong className="block truncate text-[14px] font-semibold text-primary-900">
            {avaliacao.autor}
          </strong>
          <span className="text-[12px] text-muted">{formatarDataCurta(avaliacao.criadaEm)}</span>
        </div>
        <Estrelas nota={avaliacao.nota} />
      </div>

      <p className="mt-3 text-[13px] leading-relaxed text-muted">{avaliacao.comentario}</p>
    </article>
  );
}
