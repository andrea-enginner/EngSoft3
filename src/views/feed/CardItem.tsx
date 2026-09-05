/**
 * Camada VIEW — cartão de um item do feed.
 *
 * O cartão direciona para o detalhe pelo ID do item. O coração permanece
 * apenas visual até existir um Controller para favoritos.
 *
 * O tipo `ItemFeed` abaixo é provisório: quando você criar a camada Model,
 * mova-o para `src/models/entities/item.ts` e importe daqui. Esta View não
 * deve definir o formato do dado do domínio — só desenhá-lo.
 */

import Image from "next/image";
import Link from "next/link";
import {
  IconeCondicao,
  IconeCoracao,
  IconeDoacao,
  IconeEmprestimo,
  IconeEstrela,
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
  imagem: string;
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
    <Link href={`/itens/${item.id}`} className="block rounded-[18px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2">
    <article className="flex min-h-[410px] flex-col overflow-hidden rounded-[18px] border border-border bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      {/* Área da imagem */}
      <div className="relative h-36 overflow-hidden bg-soft">
        <Image
          src={item.imagem}
          alt={item.titulo}
          fill
          className="object-cover"
        />
        <span
          className={`absolute left-3 top-3 flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-bold text-white ${tipo.classes}`}
        >
          <tipo.Icone className="h-3.5 w-3.5" />
          {tipo.rotulo}
        </span>

        <span
          className={`absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full shadow-sm ${
            item.favorito
              ? "bg-red-500 text-white"
              : "bg-white text-muted"
          }`}
        >
          <IconeCoracao
            className="h-4 w-4"
            preenchido={item.favorito}
          />
        </span>
      </div>

      <div className="flex flex-1 flex-col p-4">
        <h3 className="text-[16px] font-semibold leading-snug text-primary-900">
          {item.titulo}
        </h3>

        <p className="mt-2 line-clamp-2 text-[13px] leading-relaxed text-muted">
          {item.descricao}
        </p>

        <div className="mt-4 flex items-center gap-2 text-[12px] text-muted">
          <IconeCondicao className="h-4 w-4" />
          <span>
            Condição: <strong>{item.condicao}</strong>
          </span>
        </div>

        <div className="mt-auto flex items-center justify-between border-t border-border pt-3 text-[12px]">
          <span className="flex items-center gap-1.5 text-primary-700">
            <IconeLocal className="h-4 w-4" />
            {item.local}
          </span>

          {item.avaliacao ? (
            <span className="flex items-center gap-1 font-medium text-muted">
              <IconeEstrela className="h-4 w-4 text-estrela" />
              {item.avaliacao.toFixed(1)}
            </span>
          ) : null}
        </div>
      </div>
    </article>
    </Link>
  );
}
