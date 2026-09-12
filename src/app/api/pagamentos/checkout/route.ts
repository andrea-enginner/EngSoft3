import { NextRequest } from "next/server";
import { sessaoAtual } from "@/lib/supabase/sessao";
import {
  iniciarCheckoutPagamento,
  PagamentoError,
} from "@/models/services/pagamento.service";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const corpo = await request.json() as { solicitacaoId?: unknown };
    const solicitacaoId = typeof corpo.solicitacaoId === "string" ? corpo.solicitacaoId : "";
    const origem = process.env.NEXT_PUBLIC_SITE_URL ?? request.nextUrl.origin;
    const resultado = await iniciarCheckoutPagamento(
      await sessaoAtual(),
      solicitacaoId,
      origem,
    );
    return Response.json(resultado);
  } catch (erro) {
    const conhecido = erro instanceof PagamentoError;
    if (!conhecido) console.error("Falha ao iniciar checkout do Stripe", erro);
    return Response.json(
      {
        erro: conhecido
          ? erro.message
          : erro instanceof Error && /não foi configurad|chave de teste/.test(erro.message)
            ? erro.message
            : "Não foi possível iniciar a simulação de pagamento.",
      },
      { status: conhecido ? 400 : 500 },
    );
  }
}
