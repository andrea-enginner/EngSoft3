import Link from "next/link";
import { DIAS_POR_CUPOM, PLANOS_MEMBRO } from "@/models/entities/impulsionamento";
import { formatarValor } from "@/lib/formatar-emprestimo";
import { IconeCheckCirculo, IconeEstrela, IconeTicket } from "@/views/comuns/Icones";

export function PlanosView() {
  return (
    <main>
      <section className="relative overflow-hidden border-b border-primary-100 bg-gradient-to-b from-primary-50 to-background">
        <div aria-hidden="true" className="absolute left-1/2 top-0 h-64 w-64 -translate-x-1/2 rounded-full bg-primary-300/25 blur-3xl" />
        <div className="relative mx-auto max-w-4xl px-6 py-20 text-center sm:py-24">
          <span className="inline-flex items-center gap-2 rounded-full border border-primary-200 bg-white px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] text-primary-700"><IconeEstrela className="h-4 w-4 text-estrela" /> Ciclo Membro</span>
          <h1 className="mt-6 text-4xl font-extrabold tracking-tight text-primary-900 sm:text-5xl">Dê mais visibilidade aos seus itens</h1>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-muted sm:text-lg">Receba cupons mensalmente e use cada um para manter um anúncio em destaque por {DIAS_POR_CUPOM} dias.</p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-16 sm:py-20">
        <div className="grid items-stretch gap-6 lg:grid-cols-3">
          {PLANOS_MEMBRO.map((plano) => (
            <article key={plano.id} className={`relative flex flex-col rounded-[2rem] border bg-white p-7 shadow-sm ${plano.recomendado ? "border-primary-500 ring-4 ring-primary-100" : "border-border"}`}>
              {plano.recomendado ? <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary-700 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-white">Mais escolhido</span> : null}
              <p className="text-sm font-bold text-primary-500">Ciclo Membro</p>
              <h2 className="mt-1 text-2xl font-extrabold text-primary-900">{plano.nome}</h2>
              <p className="mt-3 min-h-12 text-sm leading-6 text-muted">{plano.descricao}</p>
              <p className="mt-6"><strong className="text-4xl font-extrabold text-primary-900">{formatarValor(plano.valorCentavos)}</strong><span className="text-sm text-muted">/mês</span></p>
              <div className="my-6 h-px bg-border" />
              <ul className="space-y-3 text-sm text-foreground">
                <li className="flex gap-3"><IconeCheckCirculo className="h-5 w-5 shrink-0 text-primary-500" /><span><strong>{plano.cuponsMensais} cupons</strong> a cada ciclo mensal</span></li>
                <li className="flex gap-3"><IconeCheckCirculo className="h-5 w-5 shrink-0 text-primary-500" /><span>{DIAS_POR_CUPOM} dias de destaque por cupom</span></li>
                <li className="flex gap-3"><IconeCheckCirculo className="h-5 w-5 shrink-0 text-primary-500" /><span>Prioridade no feed da comunidade</span></li>
              </ul>
              <Link href="/login?next=/perfil" className={`mt-8 inline-flex justify-center rounded-xl px-5 py-3 text-sm font-bold ${plano.recomendado ? "bg-primary-700 text-white shadow-lg shadow-primary-700/20 hover:bg-primary-900" : "bg-primary-100 text-primary-800 hover:bg-primary-200"}`}>Escolher {plano.nome}</Link>
            </article>
          ))}
        </div>

        <div className="mt-14 grid gap-6 rounded-[2rem] border border-primary-100 bg-primary-50 p-7 sm:grid-cols-[auto_1fr] sm:items-center sm:p-9">
          <span className="grid h-14 w-14 place-items-center rounded-2xl bg-white text-primary-700 shadow-sm"><IconeTicket className="h-7 w-7" /></span>
          <div>
            <h2 className="text-xl font-extrabold text-primary-900">Como funcionam os cupons?</h2>
            <p className="mt-2 text-sm leading-6 text-muted">Os cupons mensais são renovados a cada ciclo da assinatura e não acumulam. Depois que os mensais terminarem, membros ativos também podem adquirir cupons extras, que não expiram.</p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-6 pb-8 text-center">
        <h2 className="text-2xl font-extrabold text-primary-900">Primeiro publique, depois impulsione</h2>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-muted">Crie sua conta, publique um item e escolha o plano ideal quando quiser aumentar a visibilidade do anúncio.</p>
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <Link href="/cadastro" className="rounded-xl bg-primary-700 px-6 py-3 text-sm font-bold text-white hover:-translate-y-0.5 hover:bg-primary-900">Criar uma conta</Link>
          <Link href="/feed" className="rounded-xl border border-primary-200 bg-white px-6 py-3 text-sm font-bold text-primary-700 hover:-translate-y-0.5 hover:bg-primary-50">Explorar itens</Link>
        </div>
      </section>
    </main>
  );
}
