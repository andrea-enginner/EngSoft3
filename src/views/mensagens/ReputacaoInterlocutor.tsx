import type { Reputacao } from "@/models/entities/avaliacao";
import { IconeEstrela } from "@/views/comuns/Icones";

const FORMATADOR_NOTA = new Intl.NumberFormat("pt-BR", {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

export function ReputacaoInterlocutor({
  reputacao,
  rotulo = "Reputação do interlocutor",
  mostrarTotal = false,
  className = "",
}: {
  reputacao: Reputacao;
  rotulo?: string;
  mostrarTotal?: boolean;
  className?: string;
}) {
  if (reputacao.nota === null || reputacao.total === 0) {
    return (
      <span
        className={`inline-flex items-center gap-1 text-muted ${className}`}
        aria-label={`${rotulo}: sem avaliações`}
        title={`${rotulo}: sem avaliações`}
      >
        <IconeEstrela className="h-3.5 w-3.5 text-border" />
        <span>Sem avaliações</span>
      </span>
    );
  }

  const quantidade = `${reputacao.total} ${reputacao.total === 1 ? "avaliação" : "avaliações"}`;

  return (
    <span
      className={`inline-flex items-center gap-1 text-muted ${className}`}
      aria-label={`${rotulo}: ${FORMATADOR_NOTA.format(reputacao.nota)} de 5, ${quantidade}`}
      title={`${rotulo}: ${FORMATADOR_NOTA.format(reputacao.nota)} de 5 — ${quantidade}`}
    >
      <IconeEstrela className="h-3.5 w-3.5 text-estrela" />
      <strong className="font-semibold text-slate-700">
        {FORMATADOR_NOTA.format(reputacao.nota)}
      </strong>
      {mostrarTotal ? <span>({quantidade})</span> : null}
    </span>
  );
}
