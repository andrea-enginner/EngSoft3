import type { Metadata } from "next";
import { ComoFuncionaView } from "@/views/institucional/ComoFuncionaView";

export const metadata: Metadata = {
  title: "Como funciona",
  description: "Entenda como solicitar, combinar e concluir empréstimos de itens pelo Ciclo.",
};

export default function ComoFuncionaPage() {
  return <ComoFuncionaView />;
}
