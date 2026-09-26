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
            <div className="flex items-center gap-3">
              <span className="relative grid h-14 w-14 place-items-center">
                <Image
                  src="/ciclo-sacola-sem-seta.png"
                  alt=""
                  width={54}
                  height={54}
                  className="h-[54px] w-[54px] object-contain drop-shadow-[0_5px_7px_rgba(39,22,72,.24)]"
                  priority
                />
                <svg aria-hidden="true" viewBox="0 0 42 24" className="pointer-events-none absolute bottom-[8px] left-[calc(50%-1px)] h-[19px] w-[34px] -translate-x-1/2 text-[#ff6659]">
                  <path d="M3.5 5.5c4.8 8.6 12 12.8 20.2 12.1 5.8-.5 10.6-3.2 14.2-8.1" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" />
                  <path d="m31.7 8.2 6.5 1.1-1.1 6.4" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>

              <span className="text-[27px] font-extrabold tracking-[-0.025em]">
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
