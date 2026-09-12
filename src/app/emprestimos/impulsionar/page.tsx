import type { Metadata } from "next";
import { sessaoAtual } from "@/lib/supabase/sessao";
import { AcessoRestrito } from "@/views/auth/AcessoRestrito";
import { ImpulsionarView } from "@/views/emprestimos/ImpulsionarView";
export const metadata: Metadata = { title: "Impulsionar empréstimo" };
export default async function ImpulsionarPage() {
  if (!(await sessaoAtual())) {
    return <AcessoRestrito titulo="Entre para impulsionar um anúncio" descricao="Essa funcionalidade está disponível somente para usuários autenticados." destino="/emprestimos/impulsionar" />;
  }

  return <ImpulsionarView />;
}
