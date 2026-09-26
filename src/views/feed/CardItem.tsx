/**
 * Camada VIEW — cartão de um item do feed.
 *
 * O cartão direciona para o detalhe pelo ID do item e permite incluir o
 * anúncio na lista de desejos.
 *
 * O tipo `ItemFeed` abaixo é provisório: quando você criar a camada Model,
 * mova-o para `src/models/entities/item.ts` e importe daqui. Esta View não
 * deve definir o formato do dado do domínio — só desenhá-lo.
 */

import Image from "next/image";
import Link from "next/link";
import type { AnuncioResumo } from "@/models/entities/item";
import { formatarTarifa } from "@/lib/formatar-emprestimo";
import {
  IconeCondicao,
  IconeDoacao,
  IconeEmprestimo,
  IconeEstrela,
  IconeLocal,
} from "@/views/comuns/Icones";
import { BotaoListaDesejos } from "@/views/itens/BotaoListaDesejos";

export type ItemFeed = AnuncioResumo;

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

export function CardItem({
  item,
  autenticado,
  destino,
}: {
  item: ItemFeed;
  autenticado: boolean;
  destino: string;
}) {
  const tipo = ESTILO_TIPO[item.tipo];

  return (
    <article className="relative rounded-[18px]">
    <Link href={`/itens/${item.id}`} className="flex min-h-[410px] flex-col overflow-hidden rounded-[18px] border border-border bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2">
      {/* Área da imagem */}
      <div className="relative aspect-[4/3] overflow-hidden bg-white shadow-[inset_0_0_28px_rgba(76,29,149,0.06)]">
        <Image
          src={item.imagem ?? "/file.svg"}
          alt={item.titulo}
          fill
          unoptimized={item.imagem?.startsWith("http")}
          sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
          className="object-contain p-2"
        />
        <span
          className={`absolute left-3 top-3 flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-bold text-white ${tipo.classes}`}
        >
          <tipo.Icone className="h-3.5 w-3.5" />
          {tipo.rotulo}
        </span>

        {item.impulsionado ? (
          <span className="absolute bottom-3 left-3 rounded-full bg-primary-900 px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-wider text-white shadow-md">
            ✦ Destaque
          </span>
        ) : null}

      </div>

      <div className="flex flex-1 flex-col p-4">
        <h3 className="text-[16px] font-semibold leading-snug text-primary-900">
          {item.titulo}
        </h3>

        <p className="mt-2 line-clamp-2 text-[13px] leading-relaxed text-muted">
          {item.descricao}
        </p>

        {item.valorUnitarioCentavos && item.duracaoUnidade ? <p className="mt-3 font-semibold text-primary-700">{formatarTarifa(item.valorUnitarioCentavos, item.duracaoUnidade)}</p> : null}

        {item.condicao !== "Não informada" ? <div className="mt-4 flex items-center gap-2 text-[12px] text-muted">
          <IconeCondicao className="h-4 w-4" />
          <span>
            Condição: <strong>{item.condicao}</strong>
          </span>
        </div> : null}

        <div className="mt-auto flex items-center justify-between border-t border-border pt-3 text-[12px]">
          {item.localizacao !== "Local não informado" ? <span className="flex items-center gap-1.5 text-primary-700">
            <IconeLocal className="h-4 w-4" />
            {item.localizacao}
          </span> : <span />}

          {item.avaliacao ? (
            <span className="flex items-center gap-1 font-medium text-muted">
              <IconeEstrela className="h-4 w-4 text-estrela" />
              {item.avaliacao.toFixed(1)}
            </span>
          ) : null}
        </div>
      </div>
    </Link>
    <BotaoListaDesejos
      anuncioId={item.id}
      autenticado={autenticado}
      naListaDesejos={item.naListaDesejos}
      destino={destino}
    />
    </article>
  );
}
