import Image from "next/image";
import Link from "next/link";
import { formatarValor } from "@/lib/formatar-emprestimo";
import type { ResultadoPaginaPagamento } from "@/controllers/pagamento.controller";
import type { StatusPagamento } from "@/models/entities/pagamento";
import { BotaoPagamento } from "@/views/emprestimos/BotaoPagamento";
import { IconeCartao, IconeEscudo, IconeTrocas } from "@/views/comuns/Icones";

const DATA_HORA = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeStyle: "short",
});

const STATUS_PAGAMENTO: Record<StatusPagamento, [string, string]> = {
  pendente: ["Pagamento pendente", "bg-amber-50 text-amber-700"],
  processando: ["Pagamento em processamento", "bg-sky-50 text-sky-700"],
  aprovado: ["Pagamento aprovado", "bg-emerald-50 text-emerald-700"],
  recusado: ["Pagamento recusado", "bg-red-50 text-red-600"],
  cancelado: ["Pagamento cancelado", "bg-slate-100 text-slate-600"],
};

export function PagamentoView({
  resultado,
  retornoCancelado,
}: {
  resultado: ResultadoPaginaPagamento;
  retornoCancelado: boolean;
}) {
  if (resultado.requerLogin) {
    return (
      <main className="mx-auto max-w-3xl px-5 py-12 sm:px-8">
        <section className="rounded-3xl border border-border bg-surface p-8 text-center shadow-sm">
          <h1 className="text-xl font-bold text-primary-900">Entre para acessar o pagamento</h1>
          <p className="mt-2 text-sm text-muted">Os dados desta solicitação são privados.</p>
          <Link href="/login?next=/emprestimos" className="mt-6 inline-flex rounded-xl bg-primary-700 px-5 py-3 font-semibold text-white hover:bg-primary-900">Entrar</Link>
        </section>
      </main>
    );
  }

  const detalhes = resultado.detalhes;
  if (!detalhes) {
    return (
      <main className="mx-auto max-w-3xl px-5 py-12 sm:px-8">
        <section className="rounded-3xl border border-border bg-surface p-8 text-center shadow-sm">
          <h1 className="text-xl font-bold text-primary-900">Pagamento não encontrado</h1>
          <p role="alert" className="mt-2 text-sm text-red-600">{resultado.erro ?? "Você não tem acesso a esta solicitação."}</p>
          <Link href="/emprestimos" className="mt-6 inline-flex rounded-xl bg-primary-50 px-5 py-3 font-semibold text-primary-700 hover:bg-primary-100">Voltar aos empréstimos</Link>
        </section>
      </main>
    );
  }

  const status = detalhes.statusPagamento;
  const podePagar = detalhes.papel === "interessado"
    && detalhes.statusSolicitacao === "aceito"
    && status !== "aprovado"
    && status !== "processando";

  return (
    <main className="mx-auto max-w-5xl px-5 py-8 sm:px-8 sm:py-12">
      <Link href="/emprestimos" className="text-sm font-semibold text-primary-700 hover:underline">← Voltar aos empréstimos</Link>

      <div className="mt-5 grid items-start gap-6 lg:grid-cols-[1fr_.8fr]">
        <section className="overflow-hidden rounded-3xl border border-border bg-surface shadow-sm">
          <header className="border-b border-primary-100 bg-primary-50/70 p-6 sm:p-8">
            <div className="flex items-center gap-4">
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-primary-100 text-primary-700"><IconeCartao className="h-7 w-7" /></span>
              <div>
                <p className="text-xs font-bold uppercase tracking-[.16em] text-primary-500">Ambiente de teste</p>
                <h1 className="mt-1 text-2xl font-extrabold text-primary-900">Simulação de pagamento</h1>
              </div>
            </div>
            <p className="mt-4 text-sm leading-6 text-muted">Nenhum valor real será cobrado. O checkout utiliza exclusivamente as chaves de teste do Stripe.</p>
          </header>

          <div className="p-6 sm:p-8">
            <div className="flex gap-4">
              <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-2xl bg-soft">
                {detalhes.imagem
                  ? <Image src={detalhes.imagem} alt="" fill sizes="96px" className="object-cover" unoptimized={detalhes.imagem.startsWith("http")} />
                  : <span className="grid h-full place-items-center text-primary-400"><IconeTrocas className="h-8 w-8" /></span>}
              </div>
              <div className="min-w-0">
                <h2 className="font-bold text-primary-900">{detalhes.titulo}</h2>
                <p className="mt-1 text-sm text-muted">Disponibilizado por <strong className="font-semibold text-foreground">{detalhes.proprietario}</strong></p>
                <p className="mt-2 text-xs leading-5 text-muted">{DATA_HORA.format(new Date(detalhes.inicioEm))}<br />até {DATA_HORA.format(new Date(detalhes.fimEm))}</p>
              </div>
            </div>

            <dl className="mt-7 rounded-2xl border border-border bg-background p-5">
              <div className="flex items-center justify-between gap-4">
                <dt className="text-sm text-muted">Total da reserva</dt>
                <dd className="text-2xl font-extrabold text-primary-900">{formatarValor(detalhes.valorCentavos)}</dd>
              </div>
            </dl>

            {status ? <p className={`mt-5 inline-flex rounded-full px-3 py-1.5 text-xs font-bold ${STATUS_PAGAMENTO[status][1]}`}>{STATUS_PAGAMENTO[status][0]}</p> : null}
            {retornoCancelado ? <p className="mt-5 rounded-xl bg-amber-50 p-4 text-sm text-amber-800">Você voltou sem concluir o checkout. Se quiser, pode iniciar uma nova simulação.</p> : null}
            {resultado.erro ? <p role="alert" className="mt-5 rounded-xl bg-red-50 p-4 text-sm text-red-700">{resultado.erro}</p> : null}

            {status === "aprovado" ? (
              <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-emerald-800">
                <p className="font-bold">Simulação aprovada</p>
                <p className="mt-1 text-sm">O resultado foi sincronizado com a solicitação do empréstimo.</p>
              </div>
            ) : status === "processando" ? (
              <p className="mt-6 rounded-2xl bg-sky-50 p-5 text-sm text-sky-800">O Stripe ainda está processando a simulação. O webhook atualizará o resultado automaticamente.</p>
            ) : podePagar ? (
              <div className="mt-6"><BotaoPagamento solicitacaoId={detalhes.solicitacaoId} /></div>
            ) : detalhes.papel === "dono" ? (
              <p className="mt-6 rounded-2xl bg-primary-50 p-5 text-sm text-primary-800">Somente quem solicitou o empréstimo pode iniciar o pagamento.</p>
            ) : (
              <p className="mt-6 rounded-2xl bg-amber-50 p-5 text-sm text-amber-800">O pagamento será liberado quando o proprietário aceitar a solicitação.</p>
            )}
          </div>
        </section>

        <aside className="rounded-3xl border border-border bg-surface p-6 shadow-sm sm:p-7">
          <div className="flex items-start gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-emerald-50 text-emerald-700"><IconeEscudo className="h-5 w-5" /></span>
            <div><h2 className="font-bold text-primary-900">Checkout seguro</h2><p className="mt-1 text-sm leading-6 text-muted">Os dados do cartão são preenchidos diretamente no Stripe e não passam pelo Ciclo.</p></div>
          </div>
          <div className="my-6 border-t border-border" />
          <h2 className="font-bold text-primary-900">Cartões para testar</h2>
          <div className="mt-4 space-y-3 text-sm">
            <div className="rounded-xl bg-emerald-50 p-4"><p className="text-xs font-bold uppercase tracking-wide text-emerald-700">Aprovar</p><code className="mt-1 block font-bold text-emerald-900">4242 4242 4242 4242</code></div>
            <div className="rounded-xl bg-red-50 p-4"><p className="text-xs font-bold uppercase tracking-wide text-red-600">Recusar — saldo insuficiente</p><code className="mt-1 block font-bold text-red-800">4000 0000 0000 9995</code></div>
            <div className="rounded-xl bg-sky-50 p-4"><p className="text-xs font-bold uppercase tracking-wide text-sky-700">Autenticação 3D Secure</p><code className="mt-1 block font-bold text-sky-900">4000 0000 0000 3220</code></div>
          </div>
          <p className="mt-4 text-xs leading-5 text-muted">Use qualquer data futura e qualquer CVC de três dígitos. Nunca informe um cartão real.</p>
        </aside>
      </div>
    </main>
  );
}
