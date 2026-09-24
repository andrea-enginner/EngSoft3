/**
 * Camada VIEW — campo de busca de itens por nome, ao lado do filtro de
 * categoria em `BarraFiltros`.
 *
 * Client Component porque precisa de estado local (digitação) e navegação
 * client-side (`router.replace`) para atualizar a URL sem recarregar a
 * página inteira nem perder a posição de rolagem. O debounce evita disparar
 * uma navegação a cada tecla.
 */

"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { IconeBusca } from "@/views/comuns/Icones";

const ATRASO_DEBOUNCE_MS = 400;

export function CampoBusca({ termoInicial = "" }: { termoInicial?: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [valor, setValor] = useState(termoInicial);
  const primeiraRenderizacao = useRef(true);

  useEffect(() => {
    if (primeiraRenderizacao.current) {
      primeiraRenderizacao.current = false;
      return;
    }
    const identificador = setTimeout(() => {
      const parametros = new URLSearchParams(searchParams.toString());
      const termo = valor.trim();
      if (termo) parametros.set("busca", termo); else parametros.delete("busca");
      const query = parametros.toString();
      router.replace(query ? `/feed?${query}` : "/feed", { scroll: false });
    }, ATRASO_DEBOUNCE_MS);
    return () => clearTimeout(identificador);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [valor]);

  return (
    <label className="flex h-11 min-w-[280px] flex-1 items-center gap-2 rounded-[10px] border border-border bg-white px-4 text-sm text-foreground focus-within:border-primary-500 focus-within:ring-2 focus-within:ring-primary-100 hover:border-primary-300 sm:max-w-md">
      <IconeBusca className="h-4 w-4 shrink-0 text-muted" />
      <span className="sr-only">Buscar itens pelo nome</span>
      <input
        value={valor}
        onChange={(evento) => setValor(evento.target.value)}
        placeholder="Buscar por nome..."
        className="min-w-0 flex-1 bg-transparent outline-none placeholder:text-muted"
      />
    </label>
  );
}
