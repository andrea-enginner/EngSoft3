/**
 * Camada VIEW — cartões da aba "Meus Anúncios".
 *
 * Recebe o dado pronto por props: nenhuma busca e nenhuma regra aqui.
 */

import Image from "next/image";
import Link from "next/link";
import type { Anuncio } from "@/models/entities/anuncio";
import { formatarTempoRelativo } from "@/lib/datas";
import { formatarTarifa } from "@/lib/formatar-emprestimo";
import { IconeEstrela, IconeImagem, IconeLapis, IconePublicar } from "@/views/comuns/Icones";

const ESTILO_TIPO = {
  doacao: { rotulo: "DOAÇÃO", classes: "bg-gradient-to-r from-doacao-claro to-doacao" },
  emprestimo: { rotulo: "EMPRÉSTIMO", classes: "bg-gradient-to-r from-emprestimo-claro to-emprestimo" },
} as const;

export function CardAnuncio({ anuncio }: { anuncio: Anuncio }) {
  const tipo = ESTILO_TIPO[anuncio.tipo];

  return (
    <article className="flex h-full min-h-[280px] flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <Link href={`/itens/${anuncio.id}`} aria-label={`Ver anúncio ${anuncio.titulo}`} className="relative block h-40 shrink-0 overflow-hidden bg-gradient-to-br from-primary-50 via-soft to-primary-100/70 outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary-500">
        {anuncio.imagem ? (
          <Image
            src={anuncio.imagem}
            alt={anuncio.titulo}
            fill
            sizes="(min-width: 1024px) 320px, (min-width: 640px) 50vw, 100vw"
            className="object-contain p-2 mix-blend-multiply transition-transform duration-300 hover:scale-[1.02]"
            unoptimized={anuncio.imagem.startsWith("http")}
          />
        ) : (
          <span className="grid h-full place-items-center text-primary-300">
            <IconeImagem className="h-10 w-10" />
          </span>
        )}

        <span
          className={`absolute left-3 top-3 rounded-md px-2.5 py-1 text-[10px] font-bold tracking-wide text-white ${tipo.classes}`}
        >
          {tipo.rotulo}
        </span>

        {anuncio.ativo ? null : (
          <span className="absolute right-3 top-3 rounded-md bg-surface/95 px-2.5 py-1 text-[10px] font-bold tracking-wide text-muted">
            INATIVO
          </span>
        )}
        {anuncio.impulsionado ? (
          <span className="absolute bottom-3 left-3 inline-flex items-center gap-1.5 rounded-full bg-primary-900 px-2.5 py-1.5 text-[10px] font-extrabold uppercase tracking-wide text-white shadow-md">
            <IconeEstrela className="h-3 w-3 text-[#ffb347]" /> Destaque
          </span>
        ) : null}
      </Link>

      <div className="flex flex-1 flex-col p-4">
        <h3 className="text-[15px] font-semibold leading-snug text-primary-900"><Link href={`/itens/${anuncio.id}`} className="rounded outline-none hover:text-primary-700 hover:underline focus-visible:ring-2 focus-visible:ring-primary-500">{anuncio.titulo}</Link></h3>

        <p className="mt-1.5 line-clamp-2 text-[13px] leading-relaxed text-muted">
          {anuncio.descricao}
        </p>
        {anuncio.valorUnitarioCentavos && anuncio.duracaoUnidade ? <p className="mt-2 text-sm font-semibold text-primary-700">{formatarTarifa(anuncio.valorUnitarioCentavos, anuncio.duracaoUnidade)}</p> : null}

        <div className="mt-auto flex items-center justify-between gap-2 border-t border-border pt-3 text-[12px] text-muted">
          <span>{formatarTempoRelativo(anuncio.publicadoEm)}</span>
          <span className="flex items-center gap-1.5">
            {anuncio.ativo && anuncio.tipo === "emprestimo" && !anuncio.impulsionado ? (
              <Link href={`/emprestimos/impulsionar?anuncio=${anuncio.id}`} className="inline-flex items-center gap-1 rounded-full bg-primary-100 px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wide text-primary-700 hover:bg-primary-700 hover:text-white" aria-label={`Impulsionar anúncio ${anuncio.titulo}`}>
                ↗ Impulsionar
              </Link>
            ) : null}
            <Link
              href={`/publicar?editar=${anuncio.id}`}
              aria-label={`Editar anúncio ${anuncio.titulo}`}
              className="rounded-lg p-1.5 text-primary-500 hover:bg-primary-50 hover:text-primary-700"
            >
              <IconeLapis className="h-4 w-4" />
            </Link>
          </span>
        </div>
      </div>
    </article>
  );
}

export function CardNovoAnuncio() {
  return (
    <Link
      href="/publicar"
      className="flex h-full min-h-[280px] flex-col items-center justify-center gap-2.5 rounded-2xl border-2 border-dashed border-primary-300 bg-primary-50/60 p-6 text-center transition hover:border-primary-500 hover:bg-primary-50"
    >
      <span className="grid h-12 w-12 place-items-center rounded-full bg-primary-100 text-primary-700">
        <IconePublicar className="h-6 w-6" />
      </span>
      <strong className="text-[15px] font-semibold text-primary-900">Novo Anúncio</strong>
      <span className="max-w-[220px] text-[13px] leading-relaxed text-muted">
        Compartilhe algo novo com a comunidade.
      </span>
    </Link>
  );
}
