"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS_AUTENTICADOS = [
  { rotulo: "Início", href: "/feed" },
  { rotulo: "Empréstimos", href: "/emprestimos" },
  { rotulo: "Publicar um item", href: "/publicar" },
  { rotulo: "Mensagens", href: "/mensagens" },
  { rotulo: "Meu perfil", href: "/perfil" },
];

const LINKS_PUBLICOS = [
  { rotulo: "Explorar itens", href: "/feed" },
  { rotulo: "Como funciona", href: "/como-funciona" },
  { rotulo: "Planos", href: "/planos" },
];

export function Rodape({ autenticado }: { autenticado: boolean }) {
  const pathname = usePathname();
  if (pathname === "/login" || pathname === "/cadastro") return null;
  const links = autenticado ? LINKS_AUTENTICADOS : LINKS_PUBLICOS;

  return (
    <footer className="relative mt-16 overflow-hidden border-t border-primary-300/25 bg-[#7054b2] text-white">
      <div aria-hidden="true" className="absolute inset-0 bg-cover bg-[position:68%_54%] opacity-25" style={{ backgroundImage: "url('/auth-background.jpg')" }} />
      <div aria-hidden="true" className="absolute inset-0 bg-[#6545a8]/85" />
      <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-r from-[#5b4786]/85 via-[#654f91]/55 to-[#504a70]/70" />
      <div className="relative mx-auto max-w-7xl px-5 py-12 sm:px-8 lg:py-14">
        <div className="grid gap-10 lg:grid-cols-[1.15fr_0.7fr_1fr] lg:gap-16">
          <div>
            <Link href="/feed" aria-label="Ciclo — início" className="inline-flex items-center gap-3 rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-primary-100 focus-visible:ring-offset-4 focus-visible:ring-offset-[#6545a8]">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/15"><Image src="/ciclo-logo.png" alt="" width={42} height={42} className="h-10 w-10 object-contain" /></span>
              <span className="text-2xl font-bold tracking-[-0.03em]">Ciclo</span>
            </Link>
            <p className="mt-5 max-w-md text-sm leading-6 text-white/70 sm:text-base">Itens ganham novos usos, pessoas se aproximam e o consumo fica mais consciente. Tudo começa perto de casa.</p>
            <div className="mt-6 flex flex-wrap gap-2 text-xs font-semibold"><span className="rounded-full border border-white/15 bg-white/[0.07] px-3 py-1.5 text-white/70">Doe o que não usa</span><span className="rounded-full border border-white/15 bg-white/[0.07] px-3 py-1.5 text-white/70">Empreste com confiança</span></div>
          </div>
          <nav aria-label="Navegação do rodapé">
            <h2 className="text-xs font-bold uppercase tracking-[0.18em] text-primary-100/75">Explore</h2>
            <ul className="mt-5 space-y-3">{links.map(({ rotulo, href }) => <li key={href}><Link href={href} className="text-sm text-white/70 outline-none hover:text-white focus-visible:rounded focus-visible:ring-2 focus-visible:ring-primary-100">{rotulo}</Link></li>)}</ul>
          </nav>
          <section className="rounded-3xl border border-white/15 bg-white/[0.09] p-6 shadow-xl shadow-[#392567]/10 backdrop-blur-md sm:p-7">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary-100/80">Faça parte do movimento</p>
            <h2 className="mt-3 text-xl font-bold leading-snug sm:text-2xl">O que está parado pode voltar a circular.</h2>
            <p className="mt-3 text-sm leading-6 text-white/65">{autenticado ? "Publique em poucos passos e encontre alguém perto de você." : "Entre para publicar, reservar itens e conversar com seus vizinhos."}</p>
            <Link href={autenticado ? "/publicar" : "/cadastro"} className="mt-6 inline-flex items-center rounded-xl bg-[#f8f7fc] px-5 py-3 text-sm font-bold text-[#4d2898] shadow-md shadow-[#392567]/10 outline-none hover:-translate-y-0.5 hover:bg-white focus-visible:ring-2 focus-visible:ring-primary-100 focus-visible:ring-offset-2 focus-visible:ring-offset-[#6545a8]">{autenticado ? "Publicar um item" : "Criar minha conta"}<span aria-hidden="true" className="ml-2 text-[#8c75bd]">→</span></Link>
          </section>
        </div>
        <div className="mt-10 flex flex-col gap-3 border-t border-white/10 pt-6 text-xs text-white/50 sm:flex-row sm:items-center sm:justify-between"><p>© {new Date().getFullYear()} Ciclo. Feito para circular.</p><p>Compartilhe mais. Desperdice menos.</p></div>
      </div>
    </footer>
  );
}
