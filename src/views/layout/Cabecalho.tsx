"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState, useSyncExternalStore } from "react";
import { usePathname } from "next/navigation";
import { logoutAction } from "@/controllers/auth.actions";
import { createClient } from "@/lib/supabase/client";
import { IconeMensagem, IconeSino, IconeTicket } from "@/views/comuns/Icones";

const NAVEGACAO = [
  { rotulo: "Início", href: "/feed" },
  { rotulo: "Empréstimos", href: "/emprestimos" },
  { rotulo: "Publicar", href: "/publicar" },
];

type Perfil = {
  nome: string;
  avatar_url: string | null;
};

function rotaEstaAtiva(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

function inscreverHidratacao() {
  return () => undefined;
}

function obterSnapshotCliente() {
  return true;
}

function obterSnapshotServidor() {
  return false;
}

export function Cabecalho({ autenticado }: { autenticado: boolean }) {
  const pathnameRecebido = usePathname();
  const hidratado = useSyncExternalStore(
    inscreverHidratacao,
    obterSnapshotCliente,
    obterSnapshotServidor,
  );
  const pathname = hidratado ? pathnameRecebido : "";
  const [usuarioLogado, setUsuarioLogado] = useState(autenticado);
  const [menuAberto, setMenuAberto] = useState(false);
  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const [cupons, setCupons] = useState<number | null>(null);

  useEffect(() => {
    const supabase = createClient();
    let ativo = true;

    async function carregarUsuario() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!ativo) return;

      setUsuarioLogado(Boolean(user));
      if (!user) {
        setPerfil(null);
        setCupons(null);
        return;
      }

      const [{ data }, { data: saldo }] = await Promise.all([
        supabase.from("perfis").select("nome, avatar_url").eq("id", user.id).single(),
        supabase.rpc("obter_saldo_cupons"),
      ]);

      if (ativo && data) setPerfil(data);
      if (ativo && Array.isArray(saldo) && saldo[0]) {
        setCupons(Math.max(0, Number(saldo[0].cupons_disponiveis ?? 0)));
      }
    }

    function atualizarSaldo(evento: Event) {
      const valor = (evento as CustomEvent<number>).detail;
      if (Number.isFinite(valor)) setCupons(Math.max(0, valor));
    }

    void carregarUsuario();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (!ativo) return;
        setUsuarioLogado(Boolean(session?.user));
        if (!session?.user) {
          setPerfil(null);
          setCupons(null);
          setMenuAberto(false);
        }
      },
    );
    window.addEventListener("ciclo:saldo-cupons", atualizarSaldo);

    return () => {
      ativo = false;
      subscription.unsubscribe();
      window.removeEventListener("ciclo:saldo-cupons", atualizarSaldo);
    };
  }, [pathname]);

  if (pathname === "/login" || pathname === "/cadastro") return null;

  const mensagensAtivas = rotaEstaAtiva(pathname, "/mensagens");
  const navegacao = usuarioLogado
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
          {usuarioLogado ? (
            <>
              {cupons !== null ? (
                <Link href="/perfil" aria-label={`${cupons} cupons disponíveis`} title="Cupons de impulsionamento" className="inline-flex h-10 items-center gap-1.5 rounded-full border border-primary-200 bg-primary-50 px-2.5 text-xs font-bold text-primary-700 shadow-sm hover:-translate-y-0.5 hover:border-primary-300 hover:bg-primary-100 sm:px-3">
                  <IconeTicket className="h-4 w-4" />
                  <span>{cupons}</span>
                  <span className="hidden xl:inline">cupons</span>
                </Link>
              ) : null}
              <span role="img" aria-label="Notificações" title="Notificações" className="relative hidden h-10 w-10 items-center justify-center rounded-full border border-border bg-surface text-muted shadow-sm sm:flex">
                <IconeSino className="h-[21px] w-[21px]" />
                <span className="absolute right-[9px] top-[8px] h-2 w-2 rounded-full bg-accent ring-2 ring-surface" />
              </span>
              <Link href="/mensagens" aria-label="Mensagens" aria-current={mensagensAtivas ? "page" : undefined} className={`relative hidden h-10 w-10 items-center justify-center rounded-full border shadow-sm outline-none hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 sm:flex ${mensagensAtivas ? "border-primary-300 bg-primary-100 text-primary-700" : "border-border bg-surface text-muted hover:border-primary-300 hover:bg-primary-50 hover:text-primary-700"}`}>
                <IconeMensagem className="h-[21px] w-[21px]" />
              </Link>
              <span className="mx-1 hidden h-6 w-px bg-border xl:block" />
              <div className="relative ml-1 flex items-center gap-1">
                <Link href="/perfil" aria-label="Ir para meu perfil" className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-primary-100 text-sm font-bold text-primary-700 outline-none ring-2 ring-transparent transition hover:ring-primary-300 focus-visible:ring-primary-500">
                  {perfil?.avatar_url ? (
                    <Image src={perfil.avatar_url} alt={`Foto de ${perfil.nome}`} width={40} height={40} unoptimized className="h-full w-full object-cover" />
                  ) : (
                    <span>{perfil?.nome ? perfil.nome.trim().charAt(0).toUpperCase() : "U"}</span>
                  )}
                </Link>
                <button type="button" aria-label="Abrir menu do perfil" aria-expanded={menuAberto} onClick={() => setMenuAberto((aberto) => !aberto)} className="flex h-9 w-7 items-center justify-center rounded-lg text-muted transition hover:bg-primary-50 hover:text-primary-700">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`h-4 w-4 transition-transform ${menuAberto ? "rotate-180" : ""}`} aria-hidden="true">
                    <path d="m6 9 6 6 6-6" />
                  </svg>
                </button>
                {menuAberto ? (
                  <div className="absolute right-0 top-12 z-50 w-44 overflow-hidden rounded-xl border border-border bg-white py-1.5 shadow-lg">
                    <Link href="/perfil" onClick={() => setMenuAberto(false)} className="flex w-full items-center px-4 py-2.5 text-sm font-medium text-foreground hover:bg-primary-50 hover:text-primary-700">Meu perfil</Link>
                    <div className="mx-3 h-px bg-border" />
                    <form action={logoutAction}>
                      <button type="submit" className="flex w-full items-center px-4 py-2.5 text-left text-sm font-medium text-red-600 hover:bg-red-50">Sair</button>
                    </form>
                  </div>
                ) : null}
              </div>
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
