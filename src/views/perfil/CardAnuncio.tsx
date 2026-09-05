/**
 * Camada VIEW — cartões da aba "Meus Anúncios".
 *
 * Recebe o dado pronto por props: nenhuma busca e nenhuma regra aqui.
 */

import Image from "next/image";
import Link from "next/link";
import type { Anuncio } from "@/models/entities/anuncio";
import { formatarTempoRelativo } from "@/lib/datas";
import { IconeImagem, IconeLapis, IconePublicar } from "@/views/comuns/Icones";

const ESTILO_TIPO = {
  doacao: { rotulo: "DOAÇÃO", classes: "bg-gradient-to-r from-doacao-claro to-doacao" },
  emprestimo: { rotulo: "EMPRÉSTIMO", classes: "bg-gradient-to-r from-emprestimo-claro to-emprestimo" },
} as const;

export function CardAnuncio({ anuncio }: { anuncio: Anuncio }) {
  const tipo = ESTILO_TIPO[anuncio.tipo];

  return (
    <article className="flex h-full min-h-[280px] flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="relative h-40 shrink-0 overflow-hidden bg-soft">
        {anuncio.imagem ? (
          <Image
            src={anuncio.imagem}
            alt={anuncio.titulo}
            fill
            sizes="(min-width: 1024px) 320px, (min-width: 640px) 50vw, 100vw"
            className="object-cover"
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
      </div>

      <div className="flex flex-1 flex-col p-4">
        <h3 className="text-[15px] font-semibold leading-snug text-primary-900">
          {anuncio.titulo}
        </h3>

        <p className="mt-1.5 line-clamp-2 text-[13px] leading-relaxed text-muted">
          {anuncio.descricao}
        </p>

        <div className="mt-auto flex items-center justify-between border-t border-border pt-3 text-[12px] text-muted">
          <span>{formatarTempoRelativo(anuncio.publicadoEm)}</span>

          <Link
            href={`/publicar?editar=${anuncio.id}`}
            aria-label={`Editar anúncio ${anuncio.titulo}`}
            className="rounded-lg p-1.5 text-primary-500 hover:bg-primary-50 hover:text-primary-700"
          >
            <IconeLapis className="h-4 w-4" />
          </Link>
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
