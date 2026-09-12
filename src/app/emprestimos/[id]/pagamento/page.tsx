import type { Metadata } from "next";
import { carregarPaginaPagamento } from "@/controllers/pagamento.controller";
import { PagamentoView } from "@/views/emprestimos/PagamentoView";

export const metadata: Metadata = { title: "Simular pagamento" };

export default async function PagamentoEmprestimoPage({
  params,
  searchParams,
}: PageProps<"/emprestimos/[id]/pagamento">) {
  const { id } = await params;
  const consulta = await searchParams;
  const sessionId = typeof consulta.session_id === "string" ? consulta.session_id : undefined;
  const retornoCancelado = consulta.resultado === "cancelado";
  const resultado = await carregarPaginaPagamento(id, sessionId);

  return <PagamentoView resultado={resultado} retornoCancelado={retornoCancelado} />;
}
