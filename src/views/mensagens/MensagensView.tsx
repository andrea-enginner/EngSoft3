"use client";

import Image from "next/image";
import Link from "next/link";
import { FormEvent, useEffect, useMemo, useRef, useState, useTransition } from "react";
import {
  enviarMensagemAction,
  marcarConversaComoLidaAction,
  responderSolicitacaoAction,
} from "@/controllers/mensagem.actions";
import { createClient } from "@/lib/supabase/client";
import type { Mensagem, PainelMensagens, StatusSolicitacao, TipoMensagem } from "@/models/entities/mensagem";
import { CartaoSolicitacao } from "@/views/mensagens/CartaoSolicitacao";
import { ListaConversas } from "@/views/mensagens/ListaConversas";
import { IconeAnexo, IconeBusca, IconeEmoji, IconeMensagem, IconeOrdenacao } from "@/views/comuns/Icones";

type Props = {
  painel: PainelMensagens;
  mostrarConversaNoMobile?: boolean;
};

type RegistroRealtimeMensagem = {
  id: string;
  conversa_id: string;
  remetente_id: string | null;
  conteudo: string;
  tipo: string;
  criada_em: string;
  lida_em: string | null;
};

function iniciais(nome: string) {
  return nome.split(/\s+/).slice(0, 2).map((parte) => parte[0]).join("").toUpperCase();
}

function hora(data: string) {
  return new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit" }).format(new Date(data));
}

function dia(data: string) {
  const valor = new Date(data);
  const hoje = new Date();
  if (valor.toDateString() === hoje.toDateString()) return "Hoje";
  const ontem = new Date(hoje);
  ontem.setDate(hoje.getDate() - 1);
  if (valor.toDateString() === ontem.toDateString()) return "Ontem";
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "long" }).format(valor);
}

function doMesmoDia(a: string, b: string) {
  return new Date(a).toDateString() === new Date(b).toDateString();
}

function normalizarRealtime(registro: RegistroRealtimeMensagem): Mensagem {
  const tipos: TipoMensagem[] = ["texto", "solicitacao", "sistema"];
  return {
    id: registro.id,
    conversaId: registro.conversa_id,
    remetenteId: registro.remetente_id,
    conteudo: registro.conteudo,
    tipo: tipos.includes(registro.tipo as TipoMensagem) ? (registro.tipo as TipoMensagem) : "texto",
    criadaEm: registro.criada_em,
    lidaEm: registro.lida_em,
  };
}

function adicionarSemDuplicar(lista: Mensagem[], nova: Mensagem) {
  return lista.some((mensagem) => mensagem.id === nova.id)
    ? lista
    : [...lista, nova].sort((a, b) => a.criadaEm.localeCompare(b.criadaEm));
}

export function MensagensView({ painel, mostrarConversaNoMobile = false }: Props) {
  const [busca, setBusca] = useState("");
  const [filtro, setFiltro] = useState("todas");
  const [ordemRecente, setOrdemRecente] = useState(true);
  const [texto, setTexto] = useState("");
  const [mensagens, setMensagens] = useState(painel.mensagens);
  const [conversas, setConversas] = useState(() =>
    painel.conversas.map((item) =>
      item.id === painel.conversaAtiva?.id ? { ...item, naoLidas: 0 } : item,
    ),
  );
  const [status, setStatus] = useState<StatusSolicitacao>(painel.conversaAtiva?.status ?? "aguardando");
  const [erro, setErro] = useState("");
  const [mostrarEmojis, setMostrarEmojis] = useState(false);
  const [enviando, iniciarEnvio] = useTransition();
  const [respondendo, iniciarResposta] = useTransition();
  const fimRef = useRef<HTMLDivElement>(null);
  const conversa = painel.conversaAtiva;

  function refletirMensagemNaLista(nova: Mensagem) {
    setConversas((atuais) => atuais.map((item) =>
      item.id === nova.conversaId
        ? { ...item, ultimaMensagem: nova.conteudo, ultimaMensagemEm: nova.criadaEm, naoLidas: 0 }
        : item,
    ));
  }

  useEffect(() => {
    fimRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [mensagens]);

  useEffect(() => {
    if (!conversa || painel.fonte !== "supabase") return;
    void marcarConversaComoLidaAction(conversa.id);
  }, [conversa, painel.fonte]);

  useEffect(() => {
    if (
      !conversa ||
      painel.fonte !== "supabase" ||
      !process.env.NEXT_PUBLIC_SUPABASE_URL ||
      !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
    ) return;

    const supabase = createClient();
    const canal = supabase
      .channel(`conversa:${conversa.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "mensagens",
          filter: `conversa_id=eq.${conversa.id}`,
        },
        (evento) => {
          const nova = normalizarRealtime(evento.new as RegistroRealtimeMensagem);
          setMensagens((atuais) => adicionarSemDuplicar(atuais, nova));
          refletirMensagemNaLista(nova);
          if (nova.remetenteId !== painel.usuarioId) {
            void marcarConversaComoLidaAction(conversa.id);
          }
        },
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "emprestimos",
          filter: `conversa_id=eq.${conversa.id}`,
        },
        (evento) => {
          const novoStatus = String(evento.new.status) as StatusSolicitacao;
          setStatus(novoStatus);
          setConversas((atuais) => atuais.map((item) =>
            item.id === conversa.id ? { ...item, status: novoStatus } : item,
          ));
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(canal);
    };
  }, [conversa, painel.fonte, painel.usuarioId]);

  const conversasFiltradas = useMemo(() => {
    const termo = busca.trim().toLocaleLowerCase("pt-BR");
    return conversas
      .filter((item) => {
        const corresponde = `${item.interlocutorNome} ${item.tituloItem}`.toLocaleLowerCase("pt-BR").includes(termo);
        if (!corresponde) return false;
        if (filtro === "nao-lidas") return item.naoLidas > 0;
        if (filtro === "aguardando") return item.status === "aguardando";
        return true;
      })
      .sort((a, b) => {
        const comparacao = a.ultimaMensagemEm.localeCompare(b.ultimaMensagemEm);
        return ordemRecente ? -comparacao : comparacao;
      });
  }, [busca, filtro, ordemRecente, conversas]);

  function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const conteudo = texto.trim();
    if (!conteudo) return;
    if (!conversa) return;
    setErro("");

    if (painel.fonte === "demonstracao") {
      const nova: Mensagem = {
        id: crypto.randomUUID(),
        conversaId: conversa.id,
        remetenteId: painel.usuarioId,
        conteudo,
        tipo: "texto",
        criadaEm: new Date().toISOString(),
        lidaEm: null,
      };
      setMensagens((atuais) => adicionarSemDuplicar(atuais, nova));
      refletirMensagemNaLista(nova);
      setTexto("");
      return;
    }

    iniciarEnvio(async () => {
      const resultado = await enviarMensagemAction(conversa.id, conteudo);
      if (!resultado.sucesso) {
        setErro(resultado.erro);
        return;
      }
      setMensagens((atuais) => adicionarSemDuplicar(atuais, resultado.mensagem));
      refletirMensagemNaLista(resultado.mensagem);
      setTexto("");
    });
  }

  function inserirEmoji(emoji: string) {
    setTexto((atual) => `${atual}${emoji}`);
    setMostrarEmojis(false);
  }

  function responder(aceitar: boolean) {
    if (!conversa) return;
    setErro("");
    if (painel.fonte === "demonstracao") {
      const novoStatus: StatusSolicitacao = aceitar ? "aceito" : "recusado";
      setStatus(novoStatus);
      setConversas((atuais) => atuais.map((item) =>
        item.id === conversa.id ? { ...item, status: novoStatus } : item,
      ));
      localStorage.setItem(`ciclo:parecer:${conversa.id}`, novoStatus);
      setMensagens((atuais) => adicionarSemDuplicar(atuais, {
        id: crypto.randomUUID(),
        conversaId: conversa.id,
        remetenteId: painel.usuarioId,
        conteudo: aceitar
          ? "Você aceitou a solicitação de empréstimo."
          : "Você recusou a solicitação de empréstimo.",
        tipo: "sistema",
        criadaEm: new Date().toISOString(),
        lidaEm: null,
      }));
      return;
    }

    iniciarResposta(async () => {
      const resultado = await responderSolicitacaoAction(conversa.id, aceitar);
      if (!resultado.sucesso) {
        setErro(resultado.erro);
        return;
      }
      setStatus(resultado.status);
      setConversas((atuais) => atuais.map((item) =>
        item.id === conversa.id ? { ...item, status: resultado.status } : item,
      ));
    });
  }

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-8 sm:py-10">
      <header className="mb-7 flex items-center gap-4">
        <span className="grid h-12 w-12 place-items-center rounded-xl bg-primary-100 text-primary-500" aria-hidden="true"><IconeMensagem className="h-7 w-7" /></span>
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">Mensagens</h1>
          <p className="text-sm text-muted">Converse com outros membros da comunidade Ciclo.</p>
        </div>
      </header>

      {painel.fonte === "demonstracao" ? (
        <p className="mb-4 rounded-lg bg-amber-50 px-4 py-2 text-xs text-amber-800" role="status">
          Modo de demonstração: conecte uma conta do Supabase para sincronizar entre usuários.
        </p>
      ) : null}

      <div className="grid min-h-[620px] overflow-hidden rounded-2xl border border-border bg-white shadow-[0_10px_35px_rgba(76,29,149,.06)] lg:grid-cols-[338px_1fr]">
        <aside className={`${mostrarConversaNoMobile ? "hidden" : "block"} border-r border-border lg:block`} aria-label="Conversas">
          <div className="grid grid-cols-[minmax(0,1fr)_104px_42px] gap-2 border-b border-border p-4">
            <label className="flex items-center gap-2 rounded-lg border border-border bg-white px-3 focus-within:border-primary-500">
              <IconeBusca className="h-5 w-5 shrink-0 text-muted" />
              <span className="sr-only">Buscar conversas</span>
              <input value={busca} onChange={(evento) => setBusca(evento.target.value)} placeholder="Buscar conversas..." className="min-w-0 flex-1 py-2 text-xs outline-none" />
            </label>
            <select value={filtro} onChange={(evento) => setFiltro(evento.target.value)} aria-label="Filtrar conversas" className="rounded-lg border border-border bg-white px-2 text-xs text-muted outline-none focus:border-primary-500">
              <option value="todas">Todas</option>
              <option value="nao-lidas">Não lidas</option>
              <option value="aguardando">Pendentes</option>
            </select>
            <button type="button" onClick={() => setOrdemRecente((atual) => !atual)} aria-label={`Ordenar pelas conversas ${ordemRecente ? "mais antigas" : "mais recentes"}`} title="Inverter ordem" aria-pressed={!ordemRecente} className="grid h-10 w-10 place-items-center self-center justify-self-center rounded-lg border border-border text-muted hover:bg-primary-50 hover:text-primary-700"><IconeOrdenacao className="h-5 w-5" /></button>
          </div>
          <div className="max-h-[548px] overflow-y-auto p-3">
            <ListaConversas conversas={conversasFiltradas} conversaAtivaId={conversa?.id} />
          </div>
        </aside>

        <section className={`${mostrarConversaNoMobile ? "flex" : "hidden"} min-w-0 flex-col lg:flex`} aria-label="Conversa selecionada">
          {conversa ? (
            <>
              <header className="flex min-h-[80px] items-center gap-3 border-b border-border px-4 py-3 sm:px-5">
                <Link href="/mensagens" aria-label="Voltar às conversas" className="grid h-9 w-9 place-items-center rounded-full text-xl text-muted hover:bg-primary-50 lg:hidden">‹</Link>
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-gradient-to-br from-amber-200 to-primary-300 text-sm font-bold text-primary-900">{iniciais(conversa.interlocutorNome)}</span>
                <div className="min-w-0">
                  <h2 className="truncate text-sm font-bold text-slate-900 sm:text-base">{conversa.interlocutorNome}</h2>
                  <p className="flex items-center gap-1.5 text-xs text-emerald-600"><span className="h-2 w-2 rounded-full bg-emerald-500" />Conversa em tempo real</p>
                </div>
                <Link href={`/itens/${conversa.anuncioId}`} className="ml-auto hidden max-w-[270px] items-center gap-3 rounded-lg border border-border p-2 hover:border-primary-300 sm:flex">
                  {conversa.imagemItem?.startsWith("/") ? <Image src={conversa.imagemItem} alt="" width={48} height={40} className="h-10 w-12 rounded-md object-cover" /> : <span className="grid h-10 w-12 place-items-center rounded-md bg-primary-50 text-xl">▤</span>}
                  <span className="min-w-0"><span className="block truncate text-xs font-medium text-slate-700">{conversa.tituloItem}</span><span className="text-[11px] font-semibold text-orange-500">Empréstimo</span></span>
                </Link>
                <button type="button" aria-label="Mais opções" className="grid h-9 w-9 place-items-center rounded-full text-xl text-muted hover:bg-primary-50">⋮</button>
              </header>

              <div className="flex-1 overflow-y-auto bg-[#fffefe] px-4 py-5 sm:px-6">
                {mensagens.map((mensagem, indice) => {
                  const minha = mensagem.remetenteId === painel.usuarioId;
                  const mostrarDia = indice === 0 || !doMesmoDia(mensagens[indice - 1].criadaEm, mensagem.criadaEm);
                  return (
                    <div key={mensagem.id}>
                      {mostrarDia ? <div className="my-4 text-center"><span className="rounded-full bg-primary-50 px-3 py-1 text-[10px] text-muted">{dia(mensagem.criadaEm)}</span></div> : null}
                      {mensagem.tipo === "sistema" ? (
                        <p className="mx-auto my-4 max-w-md rounded-lg bg-slate-100 px-4 py-2 text-center text-xs text-slate-600">{mensagem.conteudo}</p>
                      ) : (
                        <div className={`mb-3 flex ${minha ? "justify-end" : "justify-start"}`}>
                          <article className={`max-w-[82%] rounded-xl px-4 py-3 text-sm shadow-sm sm:max-w-[68%] ${minha ? "rounded-br-sm bg-[#f1eaf5]" : "rounded-bl-sm bg-[#f5f0f7]"}`}>
                            <p className="whitespace-pre-wrap leading-5 text-slate-700">{mensagem.conteudo}</p>
                            <time dateTime={mensagem.criadaEm} className="mt-1 block text-right text-[10px] text-slate-400">{hora(mensagem.criadaEm)}{minha ? <span className="ml-1 font-bold text-primary-600">✓✓</span> : null}</time>
                          </article>
                        </div>
                      )}
                      {mensagem.tipo === "solicitacao" ? <CartaoSolicitacao status={status} usuarioEProprietario={conversa.usuarioEProprietario} respondendo={respondendo} onResponder={responder} /> : null}
                    </div>
                  );
                })}
                <div ref={fimRef} />
              </div>

              <footer className="border-t border-border p-3 sm:p-4">
                {erro ? <p className="mb-2 text-xs text-red-600" role="alert">{erro}</p> : null}
                <form onSubmit={enviar} className="flex items-end gap-2">
                  <button type="button" disabled title="Anexos estarão disponíveis em breve" aria-label="Anexar arquivo — indisponível" className="grid h-11 w-11 shrink-0 place-items-center rounded-lg text-slate-500 disabled:cursor-not-allowed disabled:opacity-70"><IconeAnexo className="h-6 w-6" /></button>
                  <label className="flex min-h-11 flex-1 items-end rounded-lg border border-border pl-3 focus-within:border-primary-500 focus-within:ring-2 focus-within:ring-primary-100">
                    <span className="sr-only">Digite sua mensagem</span>
                    <textarea value={texto} onChange={(evento) => { setTexto(evento.target.value); setErro(""); }} onKeyDown={(evento) => { if (evento.key === "Enter" && !evento.shiftKey) { evento.preventDefault(); evento.currentTarget.form?.requestSubmit(); } }} rows={1} maxLength={500} placeholder="Digite sua mensagem" className="max-h-28 min-h-10 flex-1 resize-none py-2.5 text-sm outline-none" />
                    <span className="relative self-stretch">
                      <button type="button" onClick={() => setMostrarEmojis((atual) => !atual)} aria-label="Escolher emoji" aria-expanded={mostrarEmojis} className="grid h-full w-11 place-items-center rounded-r-lg text-slate-400 hover:bg-primary-50 hover:text-primary-700"><IconeEmoji className="h-6 w-6" /></button>
                      {mostrarEmojis ? <span role="dialog" aria-label="Escolha um emoji" className="absolute bottom-12 right-0 z-10 flex gap-1 rounded-xl border border-border bg-white p-2 shadow-lg">{["😀", "😊", "👍", "❤️", "🎉"].map((emoji) => <button key={emoji} type="button" onClick={() => inserirEmoji(emoji)} className="grid h-9 w-9 place-items-center rounded-lg text-xl hover:bg-primary-50" aria-label={`Inserir ${emoji}`}>{emoji}</button>)}</span> : null}
                    </span>
                  </label>
                  <button type="submit" disabled={enviando || !texto.trim()} aria-label="Enviar mensagem" className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-primary-700 text-xl text-white hover:bg-primary-900 disabled:cursor-not-allowed disabled:opacity-50">➤</button>
                </form>
                <p className="mt-1 text-right text-[10px] text-muted">{texto.length}/500</p>
              </footer>
            </>
          ) : (
            <div className="grid flex-1 place-items-center p-8 text-center">
              <div><span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-primary-50 text-primary-500"><IconeMensagem className="h-8 w-8" /></span><h2 className="mt-4 font-bold text-slate-800">Suas conversas aparecerão aqui</h2><p className="mt-1 text-sm text-muted">Demonstre interesse em um empréstimo para começar.</p></div>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
