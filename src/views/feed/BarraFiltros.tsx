/**
 * Camada VIEW — barra de filtros do feed.
 *
 * ATENÇÃO: visual apenas. Os "chips" e o seletor de categoria são <span>.
 * Quando for ligar de verdade, a sugestão é manter o filtro na URL
 * (ex.: /?tipo=doacao) usando <Link> — assim a página continua Server
 * Component e o filtro vira um link compartilhável.
 */

import {
  IconeDoacao,
  IconeEmprestimo,
  IconeFiltro,
  IconeSeta,
} from "@/views/comuns/Icones";

const CHIPS = [
  { rotulo: "Todos", Icone: null, ativo: true },
  { rotulo: "Doação", Icone: IconeDoacao, ativo: false },
  { rotulo: "Empréstimos", Icone: IconeEmprestimo, ativo: false },
];

export function BarraFiltros() {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex flex-wrap items-center gap-2">
        {CHIPS.map(({ rotulo, Icone, ativo }) => (
          <span
            key={rotulo}
            className={`flex items-center gap-1.5 rounded-full border px-4 py-1.5 text-sm font-semibold ${
              ativo
                ? "border-primary-300 bg-primary-100 text-primary-700"
                : "border-border bg-surface text-muted"
            }`}
          >
            {Icone ? <Icone className="h-4 w-4" /> : null}
            {rotulo}
          </span>
        ))}
      </div>

      <div className="ml-auto flex items-center gap-2">
        <span className="flex items-center gap-2 rounded-lg border border-border bg-surface px-4 py-1.5 text-sm text-muted">
          Todas as Categorias
          <IconeSeta className="h-4 w-4" />
        </span>

        <span className="flex items-center gap-2 rounded-lg border border-border bg-surface px-4 py-1.5 text-sm font-semibold text-muted">
          <IconeFiltro className="h-4 w-4" />
          Filtrar
        </span>
      </div>
    </div>
  );
}
