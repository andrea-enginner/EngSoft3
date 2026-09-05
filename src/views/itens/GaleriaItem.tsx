"use client";

import Image from "next/image";
import { useState } from "react";
import { IconeImagem } from "@/views/comuns/Icones";

export function GaleriaItem({ imagens, titulo }: { imagens?: string[]; titulo: string }) {
  const [indiceSelecionado, setIndiceSelecionado] = useState(0);
  const imagemPrincipal = imagens?.[indiceSelecionado];

  return (
    <section aria-label={`Imagens de ${titulo}`} className="space-y-4">
      <div className="relative flex aspect-[4/3] items-center justify-center overflow-hidden rounded-2xl bg-soft">
        {imagemPrincipal ? (
          <Image src={imagemPrincipal} alt={titulo} fill sizes="(min-width: 1024px) 50vw, 100vw" className="object-cover" priority />
        ) : (
          <div className="flex flex-col items-center gap-3 text-primary-300">
            <IconeImagem className="h-20 w-20" />
            <span className="text-sm text-muted">Imagem do item</span>
          </div>
        )}
      </div>

      {imagens && imagens.length > 0 ? (
        <div className="flex gap-3" aria-label="Miniaturas">
          {imagens.map((imagem, indice) => (
            <button
              key={`${imagem}-${indice}`}
              type="button"
              onClick={() => setIndiceSelecionado(indice)}
              aria-label={`Exibir imagem ${indice + 1} de ${titulo}`}
              aria-pressed={indiceSelecionado === indice}
              className={`relative h-20 w-20 overflow-hidden rounded-xl border-2 bg-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-700 ${indiceSelecionado === indice ? "border-primary-500" : "border-transparent"}`}
            >
              <Image src={imagem} alt={`${titulo}, imagem ${indice + 1}`} fill sizes="80px" className="object-cover" />
            </button>
          ))}
        </div>
      ) : null}
    </section>
  );
}
