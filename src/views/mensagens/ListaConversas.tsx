import Link from "next/link";
import type { ConversaResumo } from "@/models/entities/mensagem";
import { ReputacaoInterlocutor } from "@/views/mensagens/ReputacaoInterlocutor";

type Props = {
  conversas: ConversaResumo[];
  conversaAtivaId?: string;
};

function iniciais(nome: string) {
  return nome
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((parte) => parte[0])
    .join("")
    .toUpperCase();
}

function tempoRelativo(data: string) {
  const diferenca = Date.now() - new Date(data).getTime();
  const dias = Math.max(0, Math.floor(diferenca / 86_400_000));
  if (dias === 0) return "Hoje";
  if (dias === 1) return "Ontem";
  if (dias < 7) return `${dias} dias`;
  if (dias < 14) return "1 semana";
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short" }).format(
    new Date(data),
  );
}

export function ListaConversas({ conversas, conversaAtivaId }: Props) {
  if (conversas.length === 0) {
    return (
      <div className="grid min-h-64 place-items-center px-6 text-center">
        <div>
          <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-primary-50 text-2xl text-primary-500">▱</span>
          <p className="mt-3 text-sm font-semibold text-foreground">Nenhuma conversa ainda</p>
          <p className="mt-1 text-xs leading-5 text-muted">Abra um item e use “Tenho interesse” para começar.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="divide-y divide-border">
      {conversas.map((conversa) => {
        const ativa = conversa.id === conversaAtivaId;
        return (
          <Link
            key={conversa.id}
            href={`/mensagens/${conversa.id}`}
            className={`grid grid-cols-[48px_1fr_auto] gap-3 px-4 py-4 outline-none hover:bg-primary-50/60 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary-500 ${ativa ? "rounded-xl bg-[#fbf6ff] shadow-[0_4px_18px_rgba(109,40,217,.08)]" : ""}`}
          >
            <span className="grid h-12 w-12 place-items-center rounded-full bg-gradient-to-br from-amber-200 to-primary-300 text-sm font-bold text-primary-900" aria-hidden="true">
              {iniciais(conversa.interlocutorNome)}
            </span>
            <span className="min-w-0">
              <strong className="block truncate text-sm text-slate-800">{conversa.interlocutorNome}</strong>
              <ReputacaoInterlocutor
                reputacao={conversa.reputacaoInterlocutor}
                className="mt-0.5 text-[11px]"
              />
              <span className="block truncate text-[11px] text-muted">Sobre: {conversa.tituloItem}</span>
              <span className="mt-1 block truncate text-xs text-slate-500">{conversa.ultimaMensagem}</span>
            </span>
            <span className="flex flex-col items-end gap-2 text-[11px] text-muted">
              {tempoRelativo(conversa.ultimaMensagemEm)}
              {conversa.naoLidas > 0 ? (
                <span className="grid min-h-5 min-w-5 place-items-center rounded-full bg-primary-700 px-1 text-[10px] font-bold text-white">
                  {conversa.naoLidas > 99 ? "99+" : conversa.naoLidas}
                </span>
              ) : null}
            </span>
          </Link>
        );
      })}
    </div>
  );
}
