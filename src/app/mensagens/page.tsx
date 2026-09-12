import type { Metadata } from "next";
import { obterPainelMensagens } from "@/controllers/mensagem.controller";
import { MensagensView } from "@/views/mensagens/MensagensView";

export const metadata: Metadata = { title: "Mensagens" };
export const dynamic = "force-dynamic";

export default async function MensagensPage() {
  const painel = await obterPainelMensagens();
  return <MensagensView key={painel.conversaAtiva?.id ?? "sem-conversa"} painel={painel} />;
}
