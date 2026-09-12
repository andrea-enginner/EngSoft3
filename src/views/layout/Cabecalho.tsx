"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { logoutAction } from "@/controllers/auth.actions";
import { IconeMensagem, IconePerfil, IconeSino } from "@/views/comuns/Icones";

const NAVEGACAO = [
  { rotulo: "Início", href: "/feed" },
  { rotulo: "Empréstimos", href: "/emprestimos" },
  { rotulo: "Publicar", href: "/publicar" },
];

function rotaEstaAtiva(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function Cabecalho({ autenticado }: { autenticado: boolean }) {
  const pathname = usePathname();
  if (pathname === "/login" || pathname === "/cadastro") return null;

  const mensagensAtivas = rotaEstaAtiva(pathname, "/mensagens");
  const navegacao = autenticado
    ? NAVEGACAO
    : NAVEGACAO.filter(({ href }) => href === "/feed");

  return (
    <header className="sticky top-0 z-50 border-b border-primary-100/80 bg-surface/90 shadow-[0_10px_30px_-26px_rgba(76,29,149,0.65)] backdrop-blur-xl">
      <div className="mx-auto flex h-[72px] max-w-7xl items-center gap-5 px-5 sm:px-8">
        <Link href="/feed" aria-label="Ciclo — início" className="group flex shrink-0 items-center gap-2.5 rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2">
          <Image src="/ciclo-logo.png" alt="" width={40} height={40} className="h-10 w-10 object-contain transition-transform group-hover:-rotate-3 group-hover:scale-105" priority />
          <span className="hidden text-xl font-bold tracking-[-0.03em] text-primary-900 sm:block">Ciclo</span>
        </Link>

        <nav className="hidden flex-1 justify-center lg:flex" aria-label="Navegação principal">
          <ul className="flex items-center gap-7 text-sm">
            {navegacao.map(({ rotulo, href }) => {
              const ativo = rotaEstaAtiva(pathname, href);
              return (
                <li key={href}>
                  <Link href={href} aria-current={ativo ? "page" : undefined} className={`relative block rounded-md px-0.5 py-2 font-medium outline-none after:absolute after:inset-x-0 after:-bottom-0.5 after:h-0.5 after:origin-center after:rounded-full after:bg-primary-500 after:transition-transform focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-4 ${ativo ? "text-primary-700 after:scale-x-100" : "text-muted after:scale-x-0 hover:text-primary-700 hover:after:scale-x-100"}`}>
                    {rotulo}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="ml-auto flex items-center gap-2 lg:ml-0">
          {autenticado ? (
            <>
              <span role="img" aria-label="Notificações" title="Notificações" className="relative hidden h-10 w-10 items-center justify-center rounded-full border border-border bg-surface text-muted shadow-sm sm:flex">
                <IconeSino className="h-[21px] w-[21px]" />
                <span className="absolute right-[9px] top-[8px] h-2 w-2 rounded-full bg-accent ring-2 ring-surface" />
              </span>
              <Link href="/mensagens" aria-label="Mensagens" aria-current={mensagensAtivas ? "page" : undefined} className={`relative hidden h-10 w-10 items-center justify-center rounded-full border shadow-sm outline-none hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 sm:flex ${mensagensAtivas ? "border-primary-300 bg-primary-100 text-primary-700" : "border-border bg-surface text-muted hover:border-primary-300 hover:bg-primary-50 hover:text-primary-700"}`}>
                <IconeMensagem className="h-[21px] w-[21px]" />
              </Link>
              <Link href="/perfil" aria-label="Meu perfil" className="relative hidden h-10 w-10 items-center justify-center rounded-full border border-border bg-surface text-muted shadow-sm outline-none hover:border-primary-300 hover:bg-primary-50 hover:text-primary-700 focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 sm:flex">
                <IconePerfil className="h-[21px] w-[21px]" />
              </Link>
              <span className="mx-1 hidden h-6 w-px bg-border xl:block" />
              <form action={logoutAction}>
                <button type="submit" className="rounded-xl px-3.5 py-2 text-sm font-semibold text-primary-700 outline-none hover:bg-primary-50 focus-visible:ring-2 focus-visible:ring-primary-500">
                  Sair
                </button>
              </form>
            </>
          ) : (
            <>
              <Link href="/login" className="rounded-xl px-2.5 py-2 text-sm font-semibold text-primary-700 outline-none hover:bg-primary-50 focus-visible:ring-2 focus-visible:ring-primary-500 sm:px-3.5">Entrar</Link>
              <Link href="/cadastro" className="rounded-xl bg-primary-700 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm outline-none hover:-translate-y-0.5 hover:bg-primary-900 hover:shadow-md focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 sm:px-4">Criar conta</Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
