import type { Metadata } from "next";

import { sessaoAtual } from "@/lib/supabase/sessao";
import { AcessoRestrito } from "@/views/auth/AcessoRestrito";
import { PublicarEmprestimoView } from "@/views/publicar/PublicarEmprestimoView";

export const metadata: Metadata = {
  title: "Publicar empréstimo",
};

export default async function PublicarPage() {
  if (!(await sessaoAtual())) {
    return <AcessoRestrito titulo="Entre para publicar um item" descricao="Crie uma conta ou entre para disponibilizar seus itens à comunidade." destino="/publicar" />;
  }

  return <PublicarEmprestimoView />;
}
