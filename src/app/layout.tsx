/**
 * Camada de ROTEAMENTO.
 *
 * `src/app` é só o mapa de URLs do projeto. Layouts e páginas aqui devem
 * ficar finos: chamar um Controller e montar as Views. Nenhuma regra de
 * negócio neste diretório.
 */

import type { Metadata } from "next";
import "./globals.css";

import { Cabecalho } from "@/views/layout/Cabecalho";
import { Rodape } from "@/views/layout/Rodape";
import { sessaoAtual } from "@/lib/supabase/sessao";

export const metadata: Metadata = {
  title: {
    default: "Ciclo",
    template: "%s | Ciclo",
  },
  description: "Plataforma de doação e empréstimo de itens entre vizinhos",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const autenticado = Boolean(await sessaoAtual());

  return (
    <html lang="pt-BR" className="h-full antialiased">
      <body className="flex min-h-full flex-col bg-background text-foreground">
        <Cabecalho key={autenticado ? "logado" : "visitante"} autenticado={autenticado} />
        <div className="flex-1">{children}</div>
        <Rodape autenticado={autenticado} />
      </body>
    </html>
  );
}
