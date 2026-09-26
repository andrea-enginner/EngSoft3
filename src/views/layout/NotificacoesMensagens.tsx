"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { IconeSino } from "@/views/comuns/Icones";

type RegistroNotificacao = {
  id: string;
  interlocutor_nome: string;
  interlocutor_avatar: string | null;
  titulo_item: string;
  ultima_mensagem: string;
  ultima_mensagem_em: string;
  nao_lidas: number | string;
};

type Notificacao = {
  conversaId: string;
  interlocutorNome: string;
  interlocutorAvatar: string | null;
  tituloItem: string;
  mensagem: string;
  enviadaEm: string;
  naoLidas: number;
};

function normalizarNotificacao(registro: RegistroNotificacao): Notificacao {
  const naoLidas = Number(registro.nao_lidas);

  return {
    conversaId: registro.id,
    interlocutorNome: registro.interlocutor_nome,
    interlocutorAvatar: registro.interlocutor_avatar,
    tituloItem: registro.titulo_item,
    mensagem: registro.ultima_mensagem,
    enviadaEm: registro.ultima_mensagem_em,
    naoLidas: Number.isFinite(naoLidas) ? Math.max(0, naoLidas) : 0,
  };
}

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
  const valor = new Date(data);
  if (Number.isNaN(valor.getTime())) return "";

  const diferenca = Math.max(0, Date.now() - valor.getTime());
  const minutos = Math.floor(diferenca / 60_000);
  if (minutos < 1) return "Agora";
  if (minutos < 60) return `Há ${minutos} min`;

  const horas = Math.floor(minutos / 60);
  if (horas < 24) return `Há ${horas} h`;
  if (horas < 48) return "Ontem";

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
  }).format(valor);
}

export function NotificacoesMensagens({
  onAbrir,
}: {
  onAbrir?: () => void;
}) {
  const [aberto, setAberto] = useState(false);
  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  async function carregarNotificacoes() {
    const supabase = createClient();
    const { data, error } = await supabase.rpc("listar_conversas");

    if (error) {
      setErro(true);
      setCarregando(false);
      return;
    }

    setNotificacoes(
      ((data ?? []) as RegistroNotificacao[]).map(normalizarNotificacao),
    );
    setErro(false);
    setCarregando(false);
  }

  useEffect(() => {
    const supabase = createClient();
    let ativo = true;

    function refletirLeitura(evento: Event) {
      const conversaId = (evento as CustomEvent<{ conversaId?: string }>).detail
        ?.conversaId;
      if (!conversaId) return;

      setNotificacoes((atuais) =>
        atuais.map((notificacao) =>
          notificacao.conversaId === conversaId
            ? { ...notificacao, naoLidas: 0 }
            : notificacao,
        ),
      );
    }

    async function atualizar() {
      const { data, error } = await supabase.rpc("listar_conversas");
      if (!ativo) return;

      if (error) {
        setErro(true);
        setCarregando(false);
        return;
      }

      setNotificacoes(
        ((data ?? []) as RegistroNotificacao[]).map(normalizarNotificacao),
      );
      setErro(false);
      setCarregando(false);
    }

    void atualizar();

    const canal = supabase
      .channel("notificacoes-mensagens")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "mensagens" },
        () => void atualizar(),
      )
      .subscribe();
    window.addEventListener("ciclo:mensagens-lidas", refletirLeitura);

    return () => {
      ativo = false;
      void supabase.removeChannel(canal);
      window.removeEventListener("ciclo:mensagens-lidas", refletirLeitura);
    };
  }, []);

  useEffect(() => {
    if (!aberto) return;

    function fecharAoClicarFora(evento: PointerEvent) {
      if (!containerRef.current?.contains(evento.target as Node)) {
        setAberto(false);
      }
    }

    function fecharComEscape(evento: KeyboardEvent) {
      if (evento.key === "Escape") setAberto(false);
    }

    document.addEventListener("pointerdown", fecharAoClicarFora);
    document.addEventListener("keydown", fecharComEscape);

    return () => {
      document.removeEventListener("pointerdown", fecharAoClicarFora);
      document.removeEventListener("keydown", fecharComEscape);
    };
  }, [aberto]);

  const totalNaoLidas = notificacoes.reduce(
    (total, notificacao) => total + notificacao.naoLidas,
    0,
  );
  const rotuloContador = totalNaoLidas > 9 ? "9+" : String(totalNaoLidas);
  const rotuloSino = totalNaoLidas === 0
    ? "Notificações"
    : `${totalNaoLidas} ${totalNaoLidas === 1 ? "mensagem não lida" : "mensagens não lidas"}`;

  function alternarPainel() {
    setAberto((atual) => {
      if (!atual) onAbrir?.();
      return !atual;
    });
  }

  return (
    <div ref={containerRef} className="relative hidden sm:block">
      <button
        type="button"
        aria-label={rotuloSino}
        aria-expanded={aberto}
        aria-controls="painel-notificacoes-mensagens"
        title="Notificações"
        onClick={alternarPainel}
        className={`relative flex h-10 w-10 items-center justify-center rounded-full border shadow-sm outline-none transition hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 ${aberto ? "border-primary-300 bg-primary-100 text-primary-700" : "border-border bg-white/80 text-muted hover:border-primary-300 hover:bg-primary-50 hover:text-primary-700"}`}
      >
        <IconeSino className="h-[21px] w-[21px]" />
        {totalNaoLidas > 0 ? (
          <span className="absolute -right-1.5 -top-1.5 grid min-h-[19px] min-w-[19px] place-items-center rounded-full bg-red-600 px-1 text-[10px] font-extrabold leading-none text-white ring-2 ring-surface">
            {rotuloContador}
          </span>
        ) : null}
      </button>

      {aberto ? (
        <section
          id="painel-notificacoes-mensagens"
          aria-label="Notificações de mensagens"
          className="absolute right-0 top-12 z-50 w-[min(92vw,24rem)] overflow-hidden rounded-2xl border border-border bg-white shadow-[0_18px_50px_rgba(30,20,55,.2)]"
        >
          <header className="flex items-center justify-between border-b border-border px-4 py-3.5">
            <div>
              <h2 className="font-bold text-slate-900">Notificações</h2>
              <p className="mt-0.5 text-xs text-muted">
                {totalNaoLidas > 0
                  ? `${totalNaoLidas} ${totalNaoLidas === 1 ? "mensagem não lida" : "mensagens não lidas"}`
                  : "Você está em dia"}
              </p>
            </div>
            <Link
              href="/mensagens"
              onClick={() => setAberto(false)}
              className="rounded-lg px-2 py-1.5 text-xs font-semibold text-primary-700 hover:bg-primary-50"
            >
              Ver todas
            </Link>
          </header>

          <div className="max-h-[28rem] overflow-y-auto">
            {carregando ? (
              <p className="px-5 py-10 text-center text-sm text-muted" role="status">
                Carregando notificações...
              </p>
            ) : erro ? (
              <div className="px-5 py-8 text-center">
                <p className="text-sm font-semibold text-slate-700">
                  Não foi possível carregar as notificações.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setCarregando(true);
                    void carregarNotificacoes();
                  }}
                  className="mt-3 rounded-lg bg-primary-50 px-3 py-2 text-xs font-semibold text-primary-700 hover:bg-primary-100"
                >
                  Tentar novamente
                </button>
              </div>
            ) : notificacoes.length === 0 ? (
              <div className="px-6 py-10 text-center">
                <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-primary-50 text-primary-500">
                  <IconeSino className="h-6 w-6" />
                </span>
                <p className="mt-3 text-sm font-semibold text-slate-800">
                  Nenhuma notificação
                </p>
                <p className="mt-1 text-xs leading-5 text-muted">
                  Novas mensagens aparecerão aqui.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {notificacoes.slice(0, 8).map((notificacao) => (
                  <Link
                    key={notificacao.conversaId}
                    href={`/mensagens/${notificacao.conversaId}`}
                    onClick={() => setAberto(false)}
                    className={`grid grid-cols-[44px_minmax(0,1fr)_auto] gap-3 px-4 py-3.5 outline-none hover:bg-primary-50/70 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary-500 ${notificacao.naoLidas > 0 ? "bg-primary-50/40" : "bg-white"}`}
                  >
                    <span className="grid h-11 w-11 place-items-center overflow-hidden rounded-full bg-gradient-to-br from-amber-200 to-primary-300 text-xs font-bold text-primary-900">
                      {notificacao.interlocutorAvatar ? (
                        <Image
                          src={notificacao.interlocutorAvatar}
                          alt=""
                          width={44}
                          height={44}
                          unoptimized
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        iniciais(notificacao.interlocutorNome)
                      )}
                    </span>
                    <span className="min-w-0">
                      <span className="block text-sm leading-5 text-slate-700">
                        <strong>{notificacao.interlocutorNome}</strong>
                        {notificacao.naoLidas > 0 ? " enviou uma mensagem" : ""}
                      </span>
                      <span className="block truncate text-xs text-muted">
                        {notificacao.mensagem}
                      </span>
                      <span className="mt-1 block truncate text-[11px] text-slate-400">
                        {notificacao.tituloItem} · {tempoRelativo(notificacao.enviadaEm)}
                      </span>
                    </span>
                    {notificacao.naoLidas > 0 ? (
                      <span className="mt-1 flex flex-col items-end gap-1.5">
                        <span className="h-2.5 w-2.5 rounded-full bg-primary-600" aria-hidden="true" />
                        <span className="min-w-5 rounded-full bg-primary-700 px-1.5 py-0.5 text-center text-[10px] font-bold text-white">
                          {notificacao.naoLidas > 9 ? "9+" : notificacao.naoLidas}
                        </span>
                      </span>
                    ) : null}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </section>
      ) : null}
    </div>
  );
}
