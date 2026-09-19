/**
 * Camada VIEW — seletor de nota (1 a 5 estrelas) clicável.
 *
 * Fica puramente controlado (recebe `valor`/`aoEscolher` via props) — quem
 * guarda o estado é o formulário que o usa, não este componente.
 */

import { IconeEstrela } from "@/views/comuns/Icones";

const NOTAS = [1, 2, 3, 4, 5];

export function SeletorEstrelas({
  valor,
  aoEscolher,
}: {
  valor: number;
  aoEscolher: (nota: number) => void;
}) {
  return (
    <div role="radiogroup" aria-label="Nota de 1 a 5 estrelas" className="flex items-center gap-1">
      {NOTAS.map((nota) => (
        <button
          key={nota}
          type="button"
          role="radio"
          aria-checked={nota === valor}
          aria-label={`${nota} estrela${nota > 1 ? "s" : ""}`}
          onClick={() => aoEscolher(nota)}
          className="p-0.5"
        >
          <IconeEstrela className={`h-7 w-7 ${nota <= valor ? "text-estrela" : "text-border"}`} />
        </button>
      ))}
    </div>
  );
}
