"use client";

/**
 * Camada VIEW — abas do perfil.
 *
 * Só o estado de qual aba está aberta mora no cliente. Os painéis chegam
 * prontos do servidor como `ReactNode`, então as datas relativas são
 * calculadas uma única vez e não divergem na hidratação.
 */

import { useId, useState, type ReactNode } from "react";

export type AbaPerfil = {
  id: string;
  rotulo: string;
  painel: ReactNode;
};

export function AbasPerfil({ abas }: { abas: AbaPerfil[] }) {
  const [ativa, setAtiva] = useState(abas[0]?.id);
  const prefixo = useId();

  return (
    <div>
      <div role="tablist" aria-label="Conteúdo do perfil" className="flex gap-7 overflow-x-auto border-b border-border text-sm">
        {abas.map((aba) => {
          const selecionada = aba.id === ativa;
          return (
            <button
              key={aba.id}
              type="button"
              role="tab"
              id={`${prefixo}-aba-${aba.id}`}
              aria-selected={selecionada}
              aria-controls={`${prefixo}-painel-${aba.id}`}
              onClick={() => setAtiva(aba.id)}
              className={`shrink-0 border-b-2 px-1 pb-3 ${
                selecionada
                  ? "border-primary-500 font-semibold text-primary-700"
                  : "border-transparent text-muted hover:text-primary-700"
              }`}
            >
              {aba.rotulo}
            </button>
          );
        })}
      </div>

      {abas.map((aba) => (
        <div
          key={aba.id}
          role="tabpanel"
          id={`${prefixo}-painel-${aba.id}`}
          aria-labelledby={`${prefixo}-aba-${aba.id}`}
          hidden={aba.id !== ativa}
          className="pt-6"
        >
          {aba.painel}
        </div>
      ))}
    </div>
  );
}
