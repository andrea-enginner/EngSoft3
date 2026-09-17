import { NextRequest } from "next/server";
import { sessaoAtual } from "@/lib/supabase/sessao";
import {
  ImpulsionamentoError,
  iniciarCheckoutCompraCupons,
} from "@/models/services/impulsionamento.service";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const corpo = await request.json() as { anuncioId?: unknown; quantidade?: unknown };
    const anuncioId = typeof corpo.anuncioId === "string" ? corpo.anuncioId : "";
    const quantidade = typeof corpo.quantidade === "number" ? corpo.quantidade : 0;
    const origem = process.env.NEXT_PUBLIC_SITE_URL ?? request.nextUrl.origin;
    return Response.json(await iniciarCheckoutCompraCupons(
      await sessaoAtual(),
      anuncioId,
      quantidade,
      origem,
    ));
  } catch (erro) {
    const conhecido = erro instanceof ImpulsionamentoError;
    if (!conhecido) console.error("Falha ao iniciar compra de cupons", erro);
    return Response.json(
      {
        erro: conhecido
          ? erro.message
          : erro instanceof Error && /não foi configurad|chave de teste/.test(erro.message)
            ? erro.message
            : "Não foi possível iniciar a compra dos cupons.",
      },
      { status: conhecido ? 400 : 500 },
    );
  }
}
