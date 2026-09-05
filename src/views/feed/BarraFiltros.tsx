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
    <div className="flex flex-wrap items-center gap-4">
      <div className="flex flex-wrap items-center gap-2">
        {CHIPS.map(({ rotulo, Icone, ativo }) => (
          <span
            key={rotulo}
            className={`flex items-center gap-1.5 rounded-full border px-5 py-2 text-sm font-medium ${
              ativo
                ? "border-primary-500 bg-primary-100 text-primary-700"
                : "border-border bg-white text-muted hover:bg-soft"
            }`}
          >
            {Icone ? <Icone className="h-4 w-4" /> : null}
            {rotulo}
          </span>
        ))}
      </div>

      <div className="ml-auto flex flex-wrap items-center gap-3">
        <span className="flex min-w-[185px] items-center justify-between gap-3 rounded-[10px] border border-border bg-white px-4 py-2 text-sm text-muted">
          Todas as Categorias
          <IconeSeta className="h-4 w-4" />
        </span>

        <span className="flex items-center gap-2 rounded-[10px] border border-border bg-white px-4 py-2 text-sm font-medium text-muted">
          <IconeFiltro className="h-4 w-4" />
          Filtrar
        </span>
      </div>
    </div>
  );
}