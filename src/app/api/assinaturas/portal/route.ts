import { NextRequest } from "next/server";
import { sessaoAtual } from "@/lib/supabase/sessao";
import {
  abrirPortalAssinatura,
  ImpulsionamentoError,
} from "@/models/services/impulsionamento.service";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const origem = process.env.NEXT_PUBLIC_SITE_URL ?? request.nextUrl.origin;
    return Response.json(await abrirPortalAssinatura(await sessaoAtual(), origem));
  } catch (erro) {
    const conhecido = erro instanceof ImpulsionamentoError;
    if (!conhecido) console.error("Falha ao abrir portal da assinatura", erro);
    return Response.json(
      { erro: conhecido ? erro.message : "Não foi possível abrir o gerenciamento da assinatura." },
      { status: conhecido ? 400 : 500 },
    );
  }
}
