import type { Metadata } from "next";
import { PlanosView } from "@/views/institucional/PlanosView";

export const metadata: Metadata = {
  title: "Planos",
  description: "Conheça os planos Ciclo Membro e destaque seus anúncios na comunidade.",
};

export default function PlanosPage() {
  return <PlanosView />;
}
