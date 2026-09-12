/**
 * Rota `/perfil` — perfil do usuário logado.
 *
 * Página fina: chama o Controller e monta a View.
 */

import type { Metadata } from "next";
import { obterPerfil } from "@/controllers/perfil.controller";
import { sessaoAtual } from "@/lib/supabase/sessao";
import { AcessoRestrito } from "@/views/auth/AcessoRestrito";
import { PerfilView } from "@/views/perfil/PerfilView";

export const metadata: Metadata = {
  title: "Meu Perfil",
  description: "Veja e edite seus dados, sua reputação e seus anúncios no Ciclo.",
};

export const dynamic = "force-dynamic";

export default async function PerfilPage() {
  if (!(await sessaoAtual())) {
    return <AcessoRestrito titulo="Entre para acessar seu perfil" descricao="Seus dados, anúncios e avaliações ficam disponíveis depois que você entra na sua conta." destino="/perfil" />;
  }

  const perfil = await obterPerfil();
  return <PerfilView perfil={perfil} />;
}
