"use client";

import { useState } from "react";
import type { AnuncioResumo } from "@/models/entities/item";
import { CardItem } from "@/views/feed/CardItem";

const ITENS_POR_ETAPA = 8;

export function ListaItensFeed({
  itens,
  autenticado,
  destino,
}: {
  itens: AnuncioResumo[];
  autenticado: boolean;
  destino: string;
}) {
  const [limite, setLimite] = useState(ITENS_POR_ETAPA);
  const itensVisiveis = itens.slice(0, limite);
  const temMaisItens = limite < itens.length;

  return (
    <section className="mt-6" aria-label="Ofertas disponíveis">
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {itensVisiveis.map((item) => (
          <CardItem
            key={item.id}
            item={item}
            autenticado={autenticado}
            destino={destino}
          />
        ))}
      </div>

      {temMaisItens ? (
        <button
          type="button"
          onClick={() => setLimite((atual) => atual + ITENS_POR_ETAPA)}
          className="mt-8 w-full rounded-sm border border-border bg-soft px-6 py-5 text-sm font-semibold text-primary-700 transition hover:border-primary-300 hover:bg-primary-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
          aria-label={`Ver mais ofertas. Exibindo ${itensVisiveis.length} de ${itens.length} itens`}
        >
          Ver mais ofertas
        </button>
      ) : null}
    </section>
  );
}
