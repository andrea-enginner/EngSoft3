import { processarEventoPagamento } from "@/models/services/pagamento.service";
import { processarEventoAssinatura } from "@/models/services/impulsionamento.service";
import { validarEventoStripe } from "@/models/repositories/stripe.repository";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const corpo = await request.text();
  let evento: ReturnType<typeof validarEventoStripe>;
  try {
    evento = validarEventoStripe(corpo, request.headers.get("stripe-signature"));
  } catch (erro) {
    console.error("Assinatura inválida no webhook do Stripe", erro);
    return Response.json({ erro: "Webhook inválido." }, { status: 400 });
  }

  try {
    const processadoComoAssinatura = await processarEventoAssinatura(evento);
    if (!processadoComoAssinatura) {
      await processarEventoPagamento(evento);
    }
    return Response.json({ recebido: true });
  } catch (erro) {
    console.error("Falha ao processar webhook do Stripe", erro);
    return Response.json({ erro: "Webhook não processado." }, { status: 500 });
  }
}
