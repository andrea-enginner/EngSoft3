/**
 * Camada VIEW — cartão de um item do feed.
 *
 * ATENÇÃO: visual apenas. O cartão inteiro deve virar um <Link> para
 * /itens/[slug] e o coração um <button> quando houver Controller.
 *
 * O tipo `ItemFeed` abaixo é provisório: quando você criar a camada Model,
 * mova-o para `src/models/entities/item.ts` e importe daqui. Esta View não
 * deve definir o formato do dado do domínio — só desenhá-lo.
 */

import {
  IconeCondicao,
  IconeCoracao,
  IconeDoacao,
  IconeEmprestimo,
  IconeEstrela,
  IconeImagem,
  IconeLocal,
} from "@/views/comuns/Icones";

export type TipoAnuncio = "doacao" | "emprestimo";

export type ItemFeed = {
  id: string;
  tipo: TipoAnuncio;
  titulo: string;
  descricao: string;
  condicao: string;
  local: string;
  avaliacao?: number;
  favorito?: boolean;
};

const ESTILO_TIPO = {
  doacao: {
    rotulo: "Doação",
    classes: "bg-gradient-to-r from-doacao-claro to-doacao",
    Icone: IconeDoacao,
  },
  emprestimo: {
    rotulo: "Empréstimo",
    classes: "bg-gradient-to-r from-emprestimo-claro to-emprestimo",
    Icone: IconeEmprestimo,
  },
} as const;

export function CardItem({ item }: { item: ItemFeed }) {
  const tipo = ESTILO_TIPO[item.tipo];

  return (
    <article className="flex flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-sm">
      {/* Área da foto — troque por <Image> quando houver upload de imagem */}
      <div className="relative flex h-36 items-center justify-center bg-soft">
        <IconeImagem className="h-10 w-10 text-primary-300" />

        <span
          className={`absolute left-3 top-3 flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white ${tipo.classes}`}
        >
          <tipo.Icone className="h-3 w-3" />
          {tipo.rotulo}
        </span>

        <span
          className={`absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full ${
            item.favorito ? "bg-red-500 text-white" : "bg-surface text-muted"
          }`}
        >
          <IconeCoracao className="h-4 w-4" preenchido={item.favorito} />
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <h3 className="font-semibold leading-snug text-primary-900">
          {item.titulo}
        </h3>

        <p className="line-clamp-2 text-sm leading-relaxed text-muted">
          {item.descricao}
        </p>

        <p className="mt-auto flex items-center gap-1.5 border-t border-border pt-3 text-xs text-muted">
          <IconeCondicao className="h-3.5 w-3.5" />
          Condição: {item.condicao}
        </p>

        <div className="flex items-center justify-between text-xs text-muted">
          <span className="flex items-center gap-1.5 text-primary-700">
            <IconeLocal className="h-3.5 w-3.5" />
            {item.local}
          </span>

          {item.avaliacao ? (
            <span className="flex items-center gap-1">
              <IconeEstrela className="h-3.5 w-3.5 text-estrela" />
              {item.avaliacao.toFixed(1)}
            </span>
          ) : null}
        </div>
      </div>
    </article>
  );
}
