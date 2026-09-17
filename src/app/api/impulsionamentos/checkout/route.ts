import { NextRequest } from "next/server";
import { sessaoAtual } from "@/lib/supabase/sessao";
import {
  ImpulsionamentoError,
  iniciarCheckoutAssinatura,
} from "@/models/services/impulsionamento.service";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const corpo = await request.json() as { anuncioId?: unknown; plano?: unknown };
    const anuncioId = typeof corpo.anuncioId === "string" ? corpo.anuncioId : "";
    const plano = typeof corpo.plano === "string" ? corpo.plano : "";
    const origem = process.env.NEXT_PUBLIC_SITE_URL ?? request.nextUrl.origin;
    const resultado = await iniciarCheckoutAssinatura(
      await sessaoAtual(),
      anuncioId,
      plano,
      origem,
    );
    return Response.json(resultado);
  } catch (erro) {
    const conhecido = erro instanceof ImpulsionamentoError;
    if (!conhecido) console.error("Falha ao iniciar checkout da assinatura", erro);
    return Response.json(
      {
        erro: conhecido
          ? erro.message
          : erro instanceof Error && /não foi configurad|chave de teste/.test(erro.message)
            ? erro.message
            : "Não foi possível iniciar a assinatura.",
      },
      { status: conhecido ? 400 : 500 },
    );
  }
}
