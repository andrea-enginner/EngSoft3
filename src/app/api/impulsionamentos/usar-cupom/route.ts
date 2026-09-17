import { NextRequest } from "next/server";
import { sessaoAtual } from "@/lib/supabase/sessao";
import {
  ImpulsionamentoError,
  utilizarCupomImpulsionamento,
} from "@/models/services/impulsionamento.service";

export async function POST(request: NextRequest) {
  try {
    const corpo = await request.json() as { anuncioId?: unknown };
    const anuncioId = typeof corpo.anuncioId === "string" ? corpo.anuncioId : "";
    return Response.json(await utilizarCupomImpulsionamento(await sessaoAtual(), anuncioId));
  } catch (erro) {
    const conhecido = erro instanceof ImpulsionamentoError;
    if (!conhecido) console.error("Falha ao utilizar cupom de impulsionamento", erro);
    return Response.json(
      { erro: conhecido ? erro.message : "Não foi possível utilizar o cupom." },
      { status: conhecido ? 400 : 500 },
    );
  }
}
