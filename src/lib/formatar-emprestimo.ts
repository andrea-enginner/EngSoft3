import type { UnidadeDuracao } from "@/models/entities/item";

const UNIDADES: Record<UnidadeDuracao, [string, string]> = {
  minutos: ["minuto", "minutos"],
  horas: ["hora", "horas"],
  dias: ["dia", "dias"],
  semanas: ["semana", "semanas"],
};

export function formatarValor(valorCentavos: number): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(valorCentavos / 100);
}

export function formatarDuracao(quantidade: number, unidade: UnidadeDuracao): string {
  return `${quantidade} ${UNIDADES[unidade][quantidade === 1 ? 0 : 1]}`;
}

export function formatarTarifa(valorCentavos: number, unidade: UnidadeDuracao): string {
  return `${formatarValor(valorCentavos)} por ${UNIDADES[unidade][0]}`;
}

export function calcularTotal(valorUnitarioCentavos: number, quantidade: number): number {
  return valorUnitarioCentavos * quantidade;
}
