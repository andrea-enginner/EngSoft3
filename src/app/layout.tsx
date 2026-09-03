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

export const metadata: Metadata = {
  title: {
    default: "Ciclo",
    template: "%s | Ciclo",
  },
  description: "Plataforma de doação e empréstimo de itens entre vizinhos",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR" className="h-full antialiased">
      <body className="flex min-h-full flex-col bg-background text-foreground">
        <Cabecalho />
        <div className="flex-1">{children}</div>
      </body>
    </html>
  );
}
