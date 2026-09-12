import type { Metadata } from "next";
import { obterPainelMensagens } from "@/controllers/mensagem.controller";
import { sessaoAtual } from "@/lib/supabase/sessao";
import { AcessoRestrito } from "@/views/auth/AcessoRestrito";
import { MensagensView } from "@/views/mensagens/MensagensView";

export const metadata: Metadata = { title: "Conversa" };
export const dynamic = "force-dynamic";

export default async function ConversaPage({ params }: PageProps<"/mensagens/[id]">) {
  const { id } = await params;
  if (!(await sessaoAtual())) {
    return <AcessoRestrito titulo="Entre para abrir esta conversa" descricao="Somente os participantes autenticados podem visualizar e enviar mensagens." destino={`/mensagens/${id}`} />;
  }

  const painel = await obterPainelMensagens(id);
  return <MensagensView key={painel.conversaAtiva?.id ?? "sem-conversa"} painel={painel} mostrarConversaNoMobile />;
}
