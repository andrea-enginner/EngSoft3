/**
 * Utilitário sem regra de negócio: formatação de datas em pt-BR.
 *
 * Chamado apenas pelas Views, e sempre durante a renderização no servidor,
 * para que o texto relativo não divirja entre servidor e cliente.
 */

const RELATIVO = new Intl.RelativeTimeFormat("pt-BR", { numeric: "always" });

const UNIDADES: [Intl.RelativeTimeFormatUnit, number][] = [
  ["year", 365 * 24 * 60 * 60 * 1000],
  ["month", 30 * 24 * 60 * 60 * 1000],
  ["week", 7 * 24 * 60 * 60 * 1000],
  ["day", 24 * 60 * 60 * 1000],
  ["hour", 60 * 60 * 1000],
  ["minute", 60 * 1000],
];

export function formatarTempoRelativo(iso: string, referencia: number = Date.now()): string {
  const data = new Date(iso).getTime();
  if (Number.isNaN(data)) return "";

  const diferenca = data - referencia;
  const unidade = UNIDADES.find(([, ms]) => Math.abs(diferenca) >= ms);
  const texto = unidade
    ? RELATIVO.format(Math.round(diferenca / unidade[1]), unidade[0])
    : RELATIVO.format(Math.round(diferenca / 1000), "second");

  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

export function formatarAno(iso: string): string {
  const data = new Date(iso);
  return Number.isNaN(data.getTime()) ? "" : String(data.getFullYear());
}

export function formatarDataCurta(iso: string): string {
  const data = new Date(iso);
  if (Number.isNaN(data.getTime())) return "";
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short", year: "numeric" }).format(data);
}
