import { NextResponse } from "next/server";
import { obterDownloadMensagem } from "@/controllers/mensagem.controller";

export async function GET(
  _request: Request,
  contexto: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await contexto.params;
    const anexo = await obterDownloadMensagem(id);
    return NextResponse.redirect(anexo.url);
  } catch {
    return NextResponse.json(
      { erro: "Anexo não encontrado ou acesso não autorizado." },
      { status: 404 },
    );
  }
}
