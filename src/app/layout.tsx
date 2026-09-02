import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "EngSoft3",
  description: "Projeto da disciplina de Engenharia de Software III",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
