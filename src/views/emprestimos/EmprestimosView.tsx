import Image from "next/image";
import Link from "next/link";
import { formatarDuracao, formatarTarifa, formatarValor } from "@/lib/formatar-emprestimo";
import type { Emprestimo, StatusEmprestimo } from "@/models/entities/emprestimo";
import type { ResultadoEmprestimos } from "@/models/repositories/emprestimo.repository";

const STATUS: Record<StatusEmprestimo, [string, string]> = {
  andamento: ["Em andamento", "bg-emerald-50 text-emerald-700"],
  devolucao: ["Aguardando devolução", "bg-orange-50 text-orange-700"],
  concluido: ["Concluído", "bg-green-50 text-green-700"],
  aguardando: ["Aguardando resposta", "bg-sky-50 text-sky-700"],
  negociacao: ["Em negociação", "bg-amber-50 text-amber-700"],
  recusado: ["Recusado", "bg-red-50 text-red-600"],
};

const DATA_HORA = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" });

function CartaoSolicitacao({ item }: { item: Emprestimo }) {
  return <article className="flex gap-4 py-5">
    <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-soft">
      {item.imagem ? <Image src={item.imagem} alt="" fill sizes="80px" className="object-cover" unoptimized={item.imagem.startsWith("http")} /> : <span className="grid h-full place-items-center text-2xl text-primary-300">◇</span>}
    </div>
    <div className="min-w-0 flex-1">
      <div className="flex flex-wrap items-start justify-between gap-2"><Link href={`/itens/${item.anuncioId}`} className="font-bold text-primary-900 hover:underline">{item.nome}</Link><span className={`rounded-full px-3 py-1 text-[11px] font-semibold ${STATUS[item.status][1]}`}>{STATUS[item.status][0]}</span></div>
      <p className="mt-1 text-sm text-muted">{item.papel === "dono" ? "Solicitado por" : "Disponibilizado por"}: <strong className="font-semibold text-foreground">{item.pessoa}</strong></p>
      <p className="mt-2 text-xs text-muted">{DATA_HORA.format(new Date(item.inicioEm))} — {DATA_HORA.format(new Date(item.fimEm))}</p>
      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs"><span>{formatarDuracao(item.duracaoQuantidade, item.duracaoUnidade)}</span><span>{formatarTarifa(item.valorUnitarioCentavos, item.duracaoUnidade)}</span><strong className="text-primary-700">Total: {formatarValor(item.valorTotalCentavos)}</strong></div>
    </div>
  </article>;
}

function Lista({ titulo, subtitulo, itens, vazio }: { titulo: string; subtitulo: string; itens: Emprestimo[]; vazio: string }) {
  return <section className="overflow-hidden rounded-2xl border border-border bg-surface shadow-sm">
    <header className="border-b border-border px-5 py-4"><h2 className="font-bold text-primary-900">{titulo}</h2><p className="mt-1 text-xs text-muted">{subtitulo}</p></header>
    <div className="divide-y divide-border px-5">{itens.length ? itens.map((item) => <CartaoSolicitacao key={item.id} item={item} />) : <p className="py-10 text-center text-sm text-muted">{vazio}</p>}</div>
  </section>;
}

export function EmprestimosView({ resultado, erro }: { resultado: ResultadoEmprestimos; erro?: string }) {
  const recebidas = resultado.dados.filter((item) => item.papel === "dono");
  const enviadas = resultado.dados.filter((item) => item.papel === "interessado");

  return <main className="mx-auto max-w-7xl px-5 py-8 sm:px-8 sm:py-10">
    <div className="flex items-center gap-4"><span className="grid h-12 w-12 place-items-center rounded-2xl bg-primary-100 text-2xl text-primary-600">◇</span><div><h1 className="text-2xl font-extrabold tracking-tight text-primary-900">Empréstimos</h1><p className="text-sm text-muted">Acompanhe reservas enviadas e recebidas.</p></div></div>

    {resultado.requerLogin ? <section className="mt-8 rounded-2xl border border-border bg-surface p-8 text-center shadow-sm"><h2 className="font-bold text-primary-900">Entre para ver suas solicitações</h2><p className="mt-2 text-sm text-muted">As reservas são privadas e visíveis somente para as pessoas envolvidas.</p><Link href="/login?next=/emprestimos" className="mt-5 inline-flex rounded-xl bg-primary-700 px-5 py-3 font-semibold text-white hover:bg-primary-900">Entrar</Link></section> : erro ? <p role="alert" className="mt-8 rounded-xl bg-red-50 p-4 text-sm text-red-700">{erro}</p> : <>
      <section className="my-7 grid gap-3 sm:grid-cols-3">
        {[["Solicitações recebidas", recebidas.length], ["Solicitações enviadas", enviadas.length], ["Aguardando resposta", resultado.dados.filter((item) => item.status === "aguardando").length]].map(([rotulo, valor]) => <article key={String(rotulo)} className="rounded-2xl border border-border bg-surface p-5 shadow-sm"><p className="text-xs text-muted">{rotulo}</p><strong className="mt-1 block text-2xl text-primary-900">{valor}</strong></article>)}
      </section>
      <div className="grid items-start gap-5 lg:grid-cols-2">
        <Lista titulo="Solicitações recebidas" subtitulo="Reservas solicitadas para os seus itens." itens={recebidas} vazio="Nenhuma solicitação recebida." />
        <Lista titulo="Solicitações enviadas" subtitulo="Reservas que você solicitou." itens={enviadas} vazio="Nenhuma solicitação enviada." />
      </div>
    </>}
  </main>;
}
