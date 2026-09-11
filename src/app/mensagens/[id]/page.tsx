import type { Metadata } from "next";
import { obterPainelMensagens } from "@/controllers/mensagem.controller";
import { MensagensView } from "@/views/mensagens/MensagensView";

export const metadata: Metadata = { title: "Conversa" };
export const dynamic = "force-dynamic";

export default async function ConversaPage({ params }: PageProps<"/mensagens/[id]">) {
  const { id } = await params;
  const painel = await obterPainelMensagens(id);
  return <MensagensView key={painel.conversaAtiva?.id ?? "sem-conversa"} painel={painel} mostrarConversaNoMobile />;
}
