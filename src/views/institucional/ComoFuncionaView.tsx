import Link from "next/link";
import {
  IconeBusca,
  IconeCartao,
  IconeCheckCirculo,
  IconeMensagem,
  IconeRelogio,
  IconeTrocas,
} from "@/views/comuns/Icones";

const ETAPAS = [
  {
    titulo: "Encontre o item ideal",
    descricao: "Explore os anúncios disponíveis e use as categorias para encontrar o que precisa perto de você.",
    Icone: IconeBusca,
  },
  {
    titulo: "Envie uma solicitação",
    descricao: "Escolha o período, confira o valor e envie o pedido ao proprietário do item.",
    Icone: IconeRelogio,
  },
  {
    titulo: "Combine pelo chat",
    descricao: "Depois da solicitação, converse com o proprietário para alinhar retirada, uso e devolução.",
    Icone: IconeMensagem,
  },
  {
    titulo: "Finalize com segurança",
    descricao: "Com o empréstimo aceito, conclua o pagamento no checkout protegido do Stripe.",
    Icone: IconeCartao,
  },
  {
    titulo: "Use e devolva",
    descricao: "Aproveite o item durante o período combinado e devolva-o nas mesmas condições.",
    Icone: IconeTrocas,
  },
  {
    titulo: "Avalie a experiência",
    descricao: "Ao final, compartilhe sua avaliação para fortalecer a confiança entre os membros da comunidade.",
    Icone: IconeCheckCirculo,
  },
] as const;

export function ComoFuncionaView() {
  return (
    <main>
      <section className="relative overflow-hidden border-b border-primary-100 bg-gradient-to-br from-primary-50 via-white to-[#fff4ec]">
        <div aria-hidden="true" className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-primary-300/25 blur-3xl" />
        <div className="relative mx-auto max-w-5xl px-6 py-20 text-center sm:py-24">
          <span className="inline-flex rounded-full border border-primary-200 bg-white/80 px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] text-primary-700">Simples do começo ao fim</span>
          <h1 className="mx-auto mt-6 max-w-3xl text-4xl font-extrabold tracking-tight text-primary-900 sm:text-5xl">Compartilhe mais. Compre menos.</h1>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-muted sm:text-lg">O Ciclo conecta pessoas que possuem itens parados a quem precisa utilizá-los por um período.</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href="/feed" className="rounded-xl bg-primary-700 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-primary-700/20 hover:-translate-y-0.5 hover:bg-primary-900">Explorar itens</Link>
            <Link href="/cadastro" className="rounded-xl border border-primary-200 bg-white px-6 py-3 text-sm font-bold text-primary-700 hover:-translate-y-0.5 hover:border-primary-300 hover:bg-primary-50">Criar uma conta</Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-16 sm:py-20">
        <div className="text-center">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary-500">Passo a passo</p>
          <h2 className="mt-3 text-3xl font-extrabold text-primary-900">Como acontece um empréstimo</h2>
        </div>
        <ol className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {ETAPAS.map(({ titulo, descricao, Icone }, indice) => (
            <li key={titulo} className="relative rounded-3xl border border-border bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-primary-300 hover:shadow-lg">
              <span className="absolute right-5 top-5 text-4xl font-black text-primary-100">{String(indice + 1).padStart(2, "0")}</span>
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-primary-100 text-primary-700"><Icone className="h-6 w-6" /></span>
              <h3 className="mt-5 text-lg font-bold text-primary-900">{titulo}</h3>
              <p className="mt-2 text-sm leading-6 text-muted">{descricao}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="mx-auto max-w-5xl px-6 pb-8">
        <div className="rounded-[2rem] bg-primary-900 px-7 py-10 text-center text-white shadow-xl shadow-primary-900/20 sm:px-12">
          <h2 className="text-2xl font-extrabold sm:text-3xl">Pronto para fazer parte do Ciclo?</h2>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-primary-100">Crie sua conta para solicitar empréstimos, publicar seus itens e conversar com outros membros.</p>
          <Link href="/cadastro" className="mt-7 inline-flex rounded-xl bg-white px-6 py-3 text-sm font-bold text-primary-900 hover:-translate-y-0.5 hover:bg-primary-50">Começar agora</Link>
        </div>
      </section>
    </main>
  );
}
