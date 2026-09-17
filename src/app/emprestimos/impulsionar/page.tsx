import type { Metadata } from "next";
import { carregarPaginaImpulsionamento } from "@/controllers/impulsionamento.controller";
import { AcessoRestrito } from "@/views/auth/AcessoRestrito";
import { ImpulsionarView } from "@/views/emprestimos/ImpulsionarView";

export const metadata: Metadata = {
  title: "Impulsionar anúncio",
  description: "Destaque seu anúncio no feed da comunidade Ciclo.",
};

export const dynamic = "force-dynamic";

export default async function ImpulsionarPage({ searchParams }: PageProps<"/emprestimos/impulsionar">) {
  const parametros = await searchParams;
  const anuncioId = typeof parametros.anuncio === "string" ? parametros.anuncio : "";
  const sessionId = typeof parametros.session_id === "string" ? parametros.session_id : undefined;
  const resultado = await carregarPaginaImpulsionamento(anuncioId, sessionId);

  if (resultado.requerLogin) {
    const destino = anuncioId ? `/emprestimos/impulsionar?anuncio=${encodeURIComponent(anuncioId)}` : "/emprestimos/impulsionar";
    return <AcessoRestrito titulo="Entre para impulsionar um anúncio" descricao="Essa funcionalidade está disponível somente para usuários autenticados." destino={destino} />;
  }

  return <ImpulsionarView resultado={resultado} retorno={typeof parametros.resultado === "string" ? parametros.resultado : undefined} />;
}
