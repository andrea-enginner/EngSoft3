"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { ResultadoPaginaImpulsionamento } from "@/controllers/impulsionamento.controller";
import {
  DIAS_POR_CUPOM,
  PACOTES_CUPONS,
  PLANOS_MEMBRO,
  type AssinaturaMembro,
  type PlanoMembroId,
} from "@/models/entities/impulsionamento";
import { formatarTarifa, formatarValor } from "@/lib/formatar-emprestimo";
import { createClient } from "@/lib/supabase/client";
import { IconeCartao, IconeEscudo, IconeImagem, IconeTicket } from "@/views/comuns/Icones";

const DATA = new Intl.DateTimeFormat("pt-BR", { dateStyle: "long" });

function IconeFoguete({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M14 5c3.5-3.5 6.5-2.5 6.5-2.5S21.5 5.5 18 9l-5 5-3-3 4-6Z" />
      <path d="m9.5 7.5-4.7.8-2.3 2.3 5.2 1.1M16.5 10.5l-.8 4.7-2.3 2.3-1.1-5.2" />
      <path d="M7.5 15.5c-1.8.3-3 1.5-3.5 3.5 2-.5 3.2-1.7 3.5-3.5Z" />
    </svg>
  );
}

function ItemSelecionado({ detalhes }: { detalhes: NonNullable<ResultadoPaginaImpulsionamento["detalhes"]> }) {
  const { anuncio } = detalhes;
  return (
    <section className="rounded-2xl border border-border bg-white p-5 shadow-sm">
      <p className="mb-4 text-xs font-bold uppercase tracking-wide text-slate-600">Item selecionado</p>
      <div className="flex gap-4">
        <div className="relative h-28 w-32 shrink-0 overflow-hidden rounded-xl bg-soft">
          {anuncio.imagem ? <Image src={anuncio.imagem} alt={anuncio.titulo} fill sizes="128px" className="object-cover" unoptimized={anuncio.imagem.startsWith("http")} /> : <span className="grid h-full place-items-center text-primary-300"><IconeImagem className="h-9 w-9" /></span>}
        </div>
        <div className="min-w-0">
          {anuncio.categoria ? <span className="rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-bold uppercase text-emerald-700">{anuncio.categoria}</span> : null}
          <h2 className="mt-2 text-lg font-extrabold text-slate-900">{anuncio.titulo}</h2>
          <p className="mt-1 text-sm text-muted">{anuncio.localizacao}{anuncio.valorUnitarioCentavos && anuncio.duracaoUnidade ? ` • ${formatarTarifa(anuncio.valorUnitarioCentavos, anuncio.duracaoUnidade)}` : ""}</p>
          {detalhes.impulsionadoAte ? <span className="mt-3 inline-flex rounded-full bg-primary-100 px-3 py-1 text-xs font-bold text-primary-700">Em destaque até {DATA.format(new Date(detalhes.impulsionadoAte))}</span> : null}
        </div>
      </div>
    </section>
  );
}

export function ImpulsionarView({ resultado, retorno }: {
  resultado: ResultadoPaginaImpulsionamento;
  retorno?: string;
}) {
  const [plano, setPlano] = useState<PlanoMembroId>("plus");
  const [pacote, setPacote] = useState<1 | 2 | 5>(2);
  const router = useRouter();
  const [carregando, setCarregando] = useState<"checkout" | "cupom" | "compra" | "portal" | null>(null);
  const [erroAcao, setErroAcao] = useState("");
  const detalhes = resultado.detalhes;
  const [saldoAtual, setSaldoAtual] = useState<Pick<AssinaturaMembro, "cuponsDisponiveis" | "cuponsMensais" | "cuponsExtras"> | null>(null);
  const planoSelecionado = PLANOS_MEMBRO.find((item) => item.id === plano)!;

  useEffect(() => {
    if (!detalhes?.assinatura) return;

    const supabase = createClient();
    const saldoInicial = detalhes.assinatura.cuponsDisponiveis;
    const maximoTentativas = retorno === "cupons" ? 10 : 1;
    let ativo = true;
    let tentativa = 0;
    let temporizador: ReturnType<typeof setTimeout> | undefined;

    async function atualizarSaldo() {
      tentativa += 1;
      const { data, error } = await supabase.rpc("obter_saldo_cupons");
      if (!ativo) return;

      const registro = Array.isArray(data) ? data[0] : null;
      if (!error && registro) {
        const cuponsDisponiveis = Math.max(0, Number(registro.cupons_disponiveis ?? 0));
        const cuponsMensais = Math.max(0, Number(registro.cupons_mensais ?? 0));
        const cuponsExtras = Math.max(0, Number(registro.cupons_extras ?? 0));
        setSaldoAtual({
          cuponsDisponiveis,
          cuponsMensais,
          cuponsExtras,
        });
        window.dispatchEvent(new CustomEvent("ciclo:saldo-cupons", { detail: cuponsDisponiveis }));

        if (cuponsDisponiveis > saldoInicial) return;
      }

      if (tentativa < maximoTentativas) {
        temporizador = setTimeout(() => void atualizarSaldo(), 2_000);
      }
    }

    void atualizarSaldo();
    return () => {
      ativo = false;
      if (temporizador) clearTimeout(temporizador);
    };
  }, [detalhes, retorno]);

  async function chamarEndpoint(caminho: string, corpo?: Record<string, string | number>) {
    const resposta = await fetch(caminho, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: corpo ? JSON.stringify(corpo) : undefined,
    });
    const dados = await resposta.json() as {
      url?: string;
      erro?: string;
      cuponsDisponiveis?: number;
      cuponsMensais?: number;
      cuponsExtras?: number;
    };
    if (!resposta.ok) throw new Error(dados.erro ?? "Não foi possível concluir a operação.");
    return dados;
  }

  async function assinar() {
    if (!detalhes) return;
    setCarregando("checkout");
    setErroAcao("");
    try {
      const dados = await chamarEndpoint("/api/impulsionamentos/checkout", { anuncioId: detalhes.anuncio.id, plano });
      if (!dados.url) throw new Error("Não foi possível abrir o checkout.");
      window.location.assign(dados.url);
    } catch (falha) {
      setErroAcao(falha instanceof Error ? falha.message : "Não foi possível abrir o checkout.");
      setCarregando(null);
    }
  }

  async function usarCupom() {
    if (!detalhes) return;
    setCarregando("cupom");
    setErroAcao("");
    try {
      const dados = await chamarEndpoint("/api/impulsionamentos/usar-cupom", { anuncioId: detalhes.anuncio.id });
      if (typeof dados.cuponsDisponiveis === "number") {
        if (typeof dados.cuponsMensais === "number" && typeof dados.cuponsExtras === "number") {
          setSaldoAtual({
            cuponsDisponiveis: dados.cuponsDisponiveis,
            cuponsMensais: dados.cuponsMensais,
            cuponsExtras: dados.cuponsExtras,
          });
        }
        window.dispatchEvent(new CustomEvent("ciclo:saldo-cupons", { detail: dados.cuponsDisponiveis }));
      }
      router.push(`/emprestimos/impulsionar?anuncio=${encodeURIComponent(detalhes.anuncio.id)}&resultado=impulsionado`);
      router.refresh();
    } catch (falha) {
      setErroAcao(falha instanceof Error ? falha.message : "Não foi possível utilizar o cupom.");
      setCarregando(null);
    }
  }

  async function comprarCupons() {
    if (!detalhes) return;
    setCarregando("compra");
    setErroAcao("");
    try {
      const dados = await chamarEndpoint("/api/impulsionamentos/comprar-cupons", {
        anuncioId: detalhes.anuncio.id,
        quantidade: pacote,
      });
      if (!dados.url) throw new Error("Não foi possível abrir o checkout.");
      window.location.assign(dados.url);
    } catch (falha) {
      setErroAcao(falha instanceof Error ? falha.message : "Não foi possível comprar os cupons.");
      setCarregando(null);
    }
  }

  async function gerenciarAssinatura() {
    setCarregando("portal");
    setErroAcao("");
    try {
      const dados = await chamarEndpoint("/api/assinaturas/portal");
      if (!dados.url) throw new Error("Não foi possível abrir o gerenciamento da assinatura.");
      window.location.assign(dados.url);
    } catch (falha) {
      setErroAcao(falha instanceof Error ? falha.message : "Não foi possível gerenciar a assinatura.");
      setCarregando(null);
    }
  }

  if (!detalhes) {
    return (
      <main className="mx-auto max-w-3xl px-5 py-12 sm:px-8">
        <section className="rounded-3xl border border-border bg-surface p-8 text-center shadow-sm">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-primary-100 text-primary-700"><IconeFoguete className="h-7 w-7" /></span>
          <h1 className="mt-4 text-xl font-bold text-primary-900">Selecione um anúncio</h1>
          <p role={resultado.erro ? "alert" : undefined} className={`mt-2 text-sm ${resultado.erro ? "text-red-600" : "text-muted"}`}>{resultado.erro ?? "Abra seu perfil e escolha qual anúncio deseja impulsionar."}</p>
          <Link href="/perfil" className="mt-6 inline-flex rounded-xl bg-primary-700 px-5 py-3 font-semibold text-white hover:bg-primary-900">Ver meus anúncios</Link>
        </section>
      </main>
    );
  }

  const assinatura = detalhes.assinatura && saldoAtual
    ? { ...detalhes.assinatura, ...saldoAtual }
    : detalhes.assinatura;
  const assinaturaAtiva = assinatura?.status === "ativa";
  const podeUsarCupom = assinaturaAtiva && assinatura.cuponsDisponiveis > 0 && !detalhes.impulsionadoAte;
  const nomePlanoAtual = PLANOS_MEMBRO.find((item) => item.id === assinatura?.plano)?.nome;

  return (
    <main className="min-h-[calc(100vh-72px)] bg-[#f7f7ff] px-5 py-9 sm:px-8">
      <div className="mx-auto max-w-6xl">
        <Link href="/perfil" className="text-sm font-semibold text-primary-700 hover:underline">← Voltar aos meus anúncios</Link>
        <div className="mt-5 flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-2xl bg-primary-100 text-primary-700"><IconeFoguete className="h-6 w-6" /></span>
          <div><h1 className="text-2xl font-extrabold text-slate-900">Ciclo Membro</h1><p className="mt-1 text-sm text-muted">Receba cupons todo mês e use quando quiser destacar um anúncio.</p></div>
        </div>

        {retorno === "assinatura" && assinaturaAtiva ? <p className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-medium text-emerald-800">Assinatura ativada! Seus {assinatura.cuponsPorCiclo} cupons já estão disponíveis.</p> : null}
        {retorno === "cupons" && assinaturaAtiva ? <p className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-medium text-emerald-800">Compra confirmada! Seus cupons extras já foram adicionados ao saldo.</p> : null}
        {retorno === "impulsionado" && detalhes.impulsionadoAte ? <p className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-medium text-emerald-800">Cupom utilizado! O anúncio ficará em destaque até {DATA.format(new Date(detalhes.impulsionadoAte))}.</p> : null}
        {retorno === "cancelado" ? <p className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">Você voltou sem concluir a assinatura. Nenhuma cobrança foi realizada.</p> : null}
        {retorno === "cancelado_compra" ? <p className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">Você voltou sem concluir a compra dos cupons.</p> : null}
        {resultado.erro ? <p role="alert" className="mt-6 rounded-2xl bg-red-50 p-4 text-sm text-red-700">{resultado.erro}</p> : null}

        <div className="mt-7 grid items-start gap-6 lg:grid-cols-[1.25fr_1fr]">
          <div className="space-y-5">
            <ItemSelecionado detalhes={detalhes} />
            <section className="rounded-2xl border border-border bg-white p-5 shadow-sm">
              <h2 className="font-bold text-slate-900">Como funcionam os cupons?</h2>
              <ul className="mt-4 space-y-4 text-sm text-slate-600">
                <li className="flex gap-3"><span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-primary-100 font-bold text-primary-700">1</span><span><strong className="block text-slate-800">Receba cupons todo mês</strong>O saldo é renovado a cada mensalidade paga e não acumula entre ciclos.</span></li>
                <li className="flex gap-3"><span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-primary-100 font-bold text-primary-700">2</span><span><strong className="block text-slate-800">Escolha quando utilizar</strong>Cada cupom mantém um anúncio em destaque por {DIAS_POR_CUPOM} dias.</span></li>
                <li className="flex gap-3"><span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-primary-100 text-primary-700"><IconeEscudo className="h-4 w-4" /></span><span><strong className="block text-slate-800">Ganhe mais visibilidade</strong>O anúncio aparece antes dos itens comuns e recebe o selo Destaque.</span></li>
              </ul>
            </section>
          </div>

          {assinatura ? (
            <aside className="rounded-2xl border border-border bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-wider text-primary-500">Seu plano</p><h2 className="mt-1 text-xl font-extrabold text-primary-900">Ciclo Membro {nomePlanoAtual}</h2></div><span className={`rounded-full px-3 py-1 text-xs font-bold ${assinaturaAtiva ? "bg-emerald-50 text-emerald-700" : assinatura.status === "inadimplente" ? "bg-red-50 text-red-700" : "bg-amber-50 text-amber-700"}`}>{assinaturaAtiva ? "Ativo" : assinatura.status === "inadimplente" ? "Pagamento pendente" : assinatura.status}</span></div>

              <div className="mt-5 rounded-2xl bg-primary-50 p-6 text-center">
                <strong className="text-4xl font-extrabold text-primary-900">{assinatura.cuponsMensais > 0 ? assinatura.cuponsMensais : assinatura.cuponsExtras}</strong>
                <p className="mt-1 text-sm font-semibold text-primary-700">{assinatura.cuponsMensais > 0 ? `de ${assinatura.cuponsPorCiclo} cupons disponíveis` : assinatura.cuponsExtras > 0 ? "cupons extras disponíveis" : `de ${assinatura.cuponsPorCiclo} cupons disponíveis`}</p>
                <div className="mt-4 h-2 overflow-hidden rounded-full bg-primary-100"><span className="block h-full rounded-full bg-primary-500 transition-[width]" style={{ width: `${assinatura.cuponsMensais > 0 ? Math.min(100, assinatura.cuponsMensais / assinatura.cuponsPorCiclo * 100) : assinatura.cuponsExtras > 0 ? 100 : 0}%` }} /></div>
              </div>

              {assinatura.periodoFim ? <p className="mt-4 text-center text-xs text-muted">{assinatura.cancelarAoFim ? "Acesso disponível até" : "Próxima renovação em"} <strong className="text-foreground">{DATA.format(new Date(assinatura.periodoFim))}</strong></p> : null}
              {detalhes.impulsionadoAte ? <p className="mt-5 rounded-xl bg-primary-50 p-4 text-sm text-primary-800">Este anúncio já está impulsionado. Você poderá usar outro cupom nele após o destaque atual terminar.</p> : null}
              {!assinaturaAtiva ? <p className="mt-5 rounded-xl bg-amber-50 p-4 text-sm text-amber-800">Regularize sua assinatura no Stripe para voltar a utilizar os cupons.</p> : null}

              <button type="button" onClick={usarCupom} disabled={!podeUsarCupom || carregando !== null} className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-primary-900 py-3.5 text-sm font-bold text-white shadow-lg shadow-primary-900/20 hover:-translate-y-0.5 hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50"><IconeFoguete className="h-4 w-4" />{carregando === "cupom" ? "Utilizando cupom..." : detalhes.impulsionadoAte ? "Anúncio já impulsionado" : assinatura.cuponsDisponiveis === 0 ? "Sem cupons disponíveis" : "Usar 1 cupom neste anúncio"}</button>
              {assinaturaAtiva && assinatura.cuponsMensais === 0 ? (
                <div className="mt-5 border-t border-border pt-5">
                  <div className="flex items-center justify-between gap-3"><div className="flex items-center gap-2.5"><span className="grid h-9 w-9 place-items-center rounded-xl bg-primary-100 text-primary-700"><IconeTicket className="h-5 w-5" /></span><div><h3 className="text-sm font-bold text-slate-900">Seus cupons mensais acabaram</h3><p className="mt-0.5 text-xs text-muted">Compre extras que não expiram.</p></div></div><span className="rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-bold uppercase text-amber-700">Avulso</span></div>
                  <div className="mt-3 grid grid-cols-3 gap-2">
                    {PACOTES_CUPONS.map((item) => <button key={item.quantidade} type="button" onClick={() => setPacote(item.quantidade)} aria-pressed={pacote === item.quantidade} className={`rounded-xl border px-2 py-3 text-center ${pacote === item.quantidade ? "border-primary-700 bg-primary-50 ring-1 ring-primary-700" : "border-border hover:border-primary-300"}`}><strong className="block text-sm text-primary-900">{item.quantidade} {item.quantidade === 1 ? "cupom" : "cupons"}</strong><small className="text-muted">{formatarValor(item.valorCentavos)}</small></button>)}
                  </div>
                  <button type="button" onClick={comprarCupons} disabled={carregando !== null} className="mt-3 w-full rounded-xl bg-primary-100 py-3 text-sm font-bold text-primary-800 hover:bg-primary-200 disabled:opacity-50">{carregando === "compra" ? "Abrindo checkout..." : `Comprar ${pacote} ${pacote === 1 ? "cupom" : "cupons"}`}</button>
                </div>
              ) : null}
              <button type="button" onClick={gerenciarAssinatura} disabled={carregando !== null} className="mt-3 w-full rounded-xl border border-primary-200 py-3 text-sm font-semibold text-primary-700 hover:bg-primary-50 disabled:opacity-50">{carregando === "portal" ? "Abrindo Stripe..." : "Gerenciar assinatura"}</button>
              {erroAcao ? <p role="alert" className="mt-3 text-sm font-medium text-red-600">{erroAcao}</p> : null}
            </aside>
          ) : (
            <aside className="rounded-2xl border border-border bg-white p-5 shadow-sm">
              <h2 className="font-bold text-slate-900">Escolha seu plano mensal</h2>
              <div className="mt-3 space-y-2">
                {PLANOS_MEMBRO.map((item) => (
                  <button key={item.id} type="button" onClick={() => setPlano(item.id)} aria-pressed={plano === item.id} className={`relative flex w-full items-center justify-between rounded-xl border p-3 text-left outline-none focus-visible:ring-2 focus-visible:ring-primary-500 ${plano === item.id ? "border-primary-700 bg-primary-50 ring-1 ring-primary-700" : "border-border hover:border-primary-300"}`}>
                    {item.recomendado ? <span className="absolute -top-2 left-3 rounded-full bg-primary-700 px-2 py-0.5 text-[9px] font-bold uppercase text-white">Recomendado</span> : null}
                    <span className="pr-3"><strong className="block text-sm text-slate-900">{item.nome}</strong><small className="text-muted">{item.cuponsMensais} cupons/mês<br />{item.descricao}</small></span>
                    <span className="text-right"><strong className="whitespace-nowrap text-sm text-primary-900">{formatarValor(item.valorCentavos)}</strong><small className="block text-muted">/mês</small></span>
                  </button>
                ))}
              </div>
              <div className="my-5 border-t border-border" />
              <div className="flex items-start gap-3 rounded-xl bg-primary-50 p-4 text-sm text-slate-600"><IconeCartao className="mt-0.5 h-5 w-5 shrink-0 text-primary-700" /><p><strong className="block text-slate-800">Mensalidade pelo Stripe</strong>Cobrança recorrente por cartão. Cancele quando quiser pelo portal seguro.</p></div>
              <div className="mt-5 flex items-center justify-between"><span className="text-sm text-muted">Mensalidade</span><span><strong className="text-xl text-slate-900">{formatarValor(planoSelecionado.valorCentavos)}</strong><small className="text-muted">/mês</small></span></div>
              <button type="button" onClick={assinar} disabled={carregando !== null} className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-primary-900 py-3.5 text-sm font-bold text-white shadow-lg shadow-primary-900/20 hover:-translate-y-0.5 hover:bg-primary-700 disabled:cursor-wait disabled:opacity-65"><IconeFoguete className="h-4 w-4" />{carregando === "checkout" ? "Abrindo checkout seguro..." : `Assinar plano ${planoSelecionado.nome}`}</button>
              {erroAcao ? <p role="alert" className="mt-3 text-sm font-medium text-red-600">{erroAcao}</p> : null}
              <p className="mt-3 text-center text-[10px] text-muted">Pagamento e cancelamento processados com segurança pelo Stripe.</p>
            </aside>
          )}
        </div>
      </div>
    </main>
  );
}
