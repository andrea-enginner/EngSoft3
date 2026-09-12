import type { Metadata } from "next";
import { obterPainelMensagens } from "@/controllers/mensagem.controller";
import { sessaoAtual } from "@/lib/supabase/sessao";
import { AcessoRestrito } from "@/views/auth/AcessoRestrito";
import { MensagensView } from "@/views/mensagens/MensagensView";

export const metadata: Metadata = { title: "Mensagens" };
export const dynamic = "force-dynamic";

export default async function MensagensPage() {
  if (!(await sessaoAtual())) {
    return <AcessoRestrito titulo="Entre para ver suas mensagens" descricao="As conversas são privadas e ficam disponíveis somente para participantes autenticados." destino="/mensagens" />;
  }

  const painel = await obterPainelMensagens();
  return <MensagensView key={painel.conversaAtiva?.id ?? "sem-conversa"} painel={painel} />;
}
