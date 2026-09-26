"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

const INTERVALO_TROCA_MS = 1_800;

export function GaleriaCardFeed({
  imagens,
  titulo,
  ativa,
}: {
  imagens: string[];
  titulo: string;
  ativa: boolean;
}) {
  const imagensUnicas = Array.from(new Set(imagens));
  const [indice, setIndice] = useState(0);

  useEffect(() => {
    if (!ativa || imagensUnicas.length < 2) return;

    const intervalo = window.setInterval(() => {
      setIndice((atual) => (atual + 1) % imagensUnicas.length);
    }, INTERVALO_TROCA_MS);

    return () => window.clearInterval(intervalo);
  }, [ativa, imagensUnicas.length]);

  const indiceVisivel = ativa ? indice : 0;

  return (
    <div className="relative h-full w-full">
      {imagensUnicas.map((imagem, indiceImagem) => {
        const visivel = indiceImagem === indiceVisivel;
        return (
          <Image
            key={imagem}
            src={imagem}
            alt={visivel ? titulo : ""}
            aria-hidden={!visivel}
            fill
            unoptimized={imagem.startsWith("http")}
            sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
            className={`object-contain p-2 transition-[opacity,transform] duration-700 ease-in-out ${visivel ? "scale-100 opacity-100" : "scale-[1.015] opacity-0"}`}
          />
        );
      })}

      {imagensUnicas.length > 1 ? (
        <span className="absolute bottom-3 right-3 z-10 flex gap-1 rounded-full bg-white/80 px-2 py-1 shadow-sm backdrop-blur-sm" aria-hidden="true">
          {imagensUnicas.map((imagem, indiceImagem) => (
            <span key={imagem} className={`h-1.5 rounded-full transition-[width,background-color] duration-500 ${indiceImagem === indiceVisivel ? "w-4 bg-primary-700" : "w-1.5 bg-primary-300"}`} />
          ))}
        </span>
      ) : null}
    </div>
  );
}
