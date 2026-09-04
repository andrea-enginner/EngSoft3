"use client";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { IconeCasa, IconeMensagem, IconePerfil, IconePublicar, IconeSeta, IconeSino, IconeTrocas } from "@/views/comuns/Icones";

const NAVEGACAO = [
  { rotulo: "Início", Icone: IconeCasa, href: "/" },
  { rotulo: "Empréstimos", Icone: IconeTrocas, href: "/emprestimos" },
  { rotulo: "Publicar", Icone: IconePublicar, href: "/publicar" },
  { rotulo: "Mensagens", Icone: IconeMensagem, href: "/mensagens" },
  { rotulo: "Perfil", Icone: IconePerfil, href: "/perfil" },
];

export function Cabecalho() {
  const pathname = usePathname();
  return <header className="sticky top-0 z-50 border-b border-border bg-surface/95 backdrop-blur">
    <div className="mx-auto flex h-[72px] max-w-7xl items-center gap-8 px-5 sm:px-8">
      <Link href="/" className="flex shrink-0 items-center gap-2.5" aria-label="Ciclo — início"><Image src="/ciclo-logo.png" alt="" width={38} height={38} className="h-9 w-9 object-contain" priority /><span className="text-xl font-bold tracking-tight text-primary-700">Ciclo</span></Link>
      <nav className="hidden flex-1 justify-center md:flex"><ul className="flex items-center gap-7 text-sm">{NAVEGACAO.map(({ rotulo, Icone, href }) => { const ativo = href === "/" ? pathname === href : pathname.startsWith(href); return <li key={rotulo}><Link href={href} className={`flex items-center gap-1.5 border-b-2 pb-1 ${ativo ? "border-primary-500 font-semibold text-primary-700" : "border-transparent text-muted hover:text-primary-700"}`}><Icone className="h-4 w-4" />{rotulo}</Link></li>; })}</ul></nav>
      <div className="ml-auto flex items-center gap-4 text-muted md:ml-0"><IconeSino className="h-5 w-5" /><IconeMensagem className="h-5 w-5" /><span className="flex items-center gap-1"><span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-[#f6c37a] to-primary-500 text-xs font-bold text-white">JP</span><IconeSeta className="h-4 w-4" /></span></div>
    </div>
  </header>;
}
