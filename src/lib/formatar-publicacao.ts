export function formatarPublicacao(publicadoEm: string) {
  const data = new Date(publicadoEm);
  if (Number.isNaN(data.getTime())) return "Data de publicação indisponível";

  const dias = Math.round((data.getTime() - Date.now()) / 86_400_000);
  return `Publicado ${new Intl.RelativeTimeFormat("pt-BR", { numeric: "always" }).format(dias, "day")}`;
}
