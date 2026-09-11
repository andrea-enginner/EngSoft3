import type { Metadata } from "next";

import { PublicarEmprestimoView } from "@/views/publicar/PublicarEmprestimoView";

export const metadata: Metadata = {
  title: "Publicar empréstimo",
};

export default function PublicarPage() {
  return <PublicarEmprestimoView />;
}
