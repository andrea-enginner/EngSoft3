import type { Metadata } from "next";
import { CadastroView } from "@/views/cadastro/CadastroView";

export const metadata: Metadata = {
  title: "Criar conta",
  description: "Crie sua conta no Ciclo.",
};

export default function CadastroPage() {
  return <CadastroView />;
}