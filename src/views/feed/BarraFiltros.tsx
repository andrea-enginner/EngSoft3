import Link from "next/link";
import { IconeFiltro, IconeSeta } from "@/views/comuns/Icones";

type Props = {
  categorias: string[];
  filtroSelecionado?: string;
};

export function BarraFiltros({ categorias, filtroSelecionado }: Props) {
  const opcoes = [...categorias];
  const indiceOutros = opcoes.indexOf("Outros");
  opcoes.splice(indiceOutros < 0 ? opcoes.length : indiceOutros, 0, "Lista de desejos");

  return (
    <form action="/feed" method="get" className="flex flex-wrap items-end justify-end gap-3">
      <label className="min-w-[220px] text-sm font-medium text-foreground">
        <span className="mb-1.5 block">Categoria</span>
        <span className="relative block">
          <select
            name="categoria"
            defaultValue={filtroSelecionado ?? ""}
            className="h-11 w-full appearance-none rounded-[10px] border border-border bg-white px-4 pr-10 text-sm text-foreground outline-none hover:border-primary-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
          >
            <option value="">Todas as categorias</option>
            {opcoes.map((opcao) => (
              <option
                key={opcao}
                value={opcao === "Lista de desejos" ? "lista-de-desejos" : opcao}
              >
                {opcao}
              </option>
            ))}
          </select>
          <IconeSeta className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
        </span>
      </label>

      <button type="submit" className="flex h-11 items-center gap-2 rounded-[10px] bg-primary-700 px-5 text-sm font-semibold text-white shadow-sm hover:bg-primary-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-700">
        <IconeFiltro className="h-4 w-4" />
        Filtrar
      </button>

      {filtroSelecionado ? (
        <Link href="/feed" className="flex h-11 items-center rounded-[10px] px-3 text-sm font-semibold text-primary-700 hover:bg-primary-50">
          Limpar
        </Link>
      ) : null}
    </form>
  );
}
