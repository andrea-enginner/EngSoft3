import Image from "next/image";
import type { ReactNode } from "react";

type AuthLayoutProps = {
  children: ReactNode;
  titulo: string;
};

export function AuthLayout({
  children,
  titulo,
}: AuthLayoutProps) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f8f7fc] px-4 py-8">
      <section className="flex w-full max-w-[1200px] overflow-hidden rounded-[18px] bg-[#fff8ff] shadow-sm">
        
        {/* LADO ESQUERDO */}
        <aside className="relative hidden min-h-[620px] w-[42%] overflow-hidden bg-[#7054b2] text-white lg:flex">
          
          {/* Imagem de fundo */}
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage: "url('/auth-background.jpg')",
            }}
          />

          {/* Camada roxa sobre a imagem */}
          <div className="absolute inset-0 bg-[#6545a8]/85" />

          {/* Conteúdo */}
          <div className="relative z-10 flex w-full flex-col px-12 py-12">
            
            {/* Logo */}
            <div className="flex items-center gap-4">
              <Image
                src="/ciclo-logo.png"
                alt="Ciclo"
                width={54}
                height={54}
                className="rounded-xl"
                priority
              />

              <span className="text-[27px] font-normal">
                Ciclo
              </span>
            </div>

            {/* Textos */}
            <div className="mt-24">
              <h1 className="text-[20px] font-bold leading-tight">
                {titulo}
              </h1>

              <p className="mt-9 max-w-[350px] text-[18px] leading-[1.05] text-white/75">
                Conecte-se com pessoas próximas, troque itens que não usa mais e
                descubra novas possibilidades. O que é útil para você, pode ser
                essencial para o seu vizinho.
              </p>
            </div>
          </div>
        </aside>

        {/* LADO DIREITO */}
        <div className="flex min-h-[620px] w-full items-center justify-center px-6 py-10 sm:px-12 lg:w-[58%]">
          {children}
        </div>
      </section>
    </main>
  );
}