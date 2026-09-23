"use client";

import { useState } from "react";
import Link from "next/link";

import { loginAction } from "@/controllers/auth.actions";
import { loginComGoogle } from "@/controllers/auth.oauth";

export function LoginForm({
  proximaRota = "/feed",
}: {
  proximaRota?: string;
}) {
  const [carregandoGoogle, setCarregandoGoogle] =
    useState(false);

  const [erroGoogle, setErroGoogle] =
    useState<string | null>(null);

  async function entrarComGoogle() {
    try {
      setErroGoogle(null);
      setCarregandoGoogle(true);

      await loginComGoogle();
    } catch {
      setErroGoogle(
        "Não foi possível entrar com o Google.",
      );

      setCarregandoGoogle(false);
    }
  }

  return (
    <div className="w-full max-w-[448px]">
      {/* Abas */}
      <div className="mb-9 flex h-[25px] overflow-hidden rounded-full">
        <span
          className="
            flex
            flex-1
            items-center
            justify-center
            bg-[#4d2898]
            text-[14px]
            text-white
          "
        >
          Login
        </span>

        <Link
          href="/cadastro"
          className="
            flex
            flex-1
            items-center
            justify-center
            bg-[#ceb8ff]
            text-[14px]
            text-[#4d2898]
          "
        >
          Criar conta
        </Link>
      </div>

      <form
        action={loginAction}
        className="flex flex-col"
      >
        <input
          type="hidden"
          name="next"
          value={proximaRota}
        />

        {/* E-mail */}
        <div className="flex flex-col gap-2">
          <label
            htmlFor="email"
            className="text-[15px] font-medium text-[#29252f]"
          >
            E-mail
          </label>

          <div className="flex h-[51px] items-center rounded-[11px] border border-[#cec8d5] bg-white px-3 focus-within:border-primary-500">
            <EmailIcon />

            <input
              id="email"
              name="email"
              type="email"
              required
              placeholder="seu@email.com"
              className="
                h-full
                flex-1
                bg-transparent
                px-3
                text-[14px]
                outline-none
                placeholder:text-[#7d8494]
              "
            />
          </div>
        </div>

        {/* Senha */}
        <div className="mt-5 flex flex-col gap-2">
          <label
            htmlFor="senha"
            className="text-[15px] font-medium text-[#29252f]"
          >
            Senha
          </label>

          <div className="flex h-[51px] items-center rounded-[11px] border border-[#cec8d5] bg-white px-3 focus-within:border-primary-500">
            <LockIcon />

            <input
              id="senha"
              name="senha"
              type="password"
              required
              placeholder="••••••••"
              className="
                h-full
                flex-1
                bg-transparent
                px-3
                text-[14px]
                outline-none
                placeholder:text-[#7d8494]
              "
            />
          </div>
        </div>

        <div className="mt-2 flex justify-end">
          <span className="text-[14px] text-[#4d2898]">
            Esqueci minha senha
          </span>
        </div>

        <button
          type="submit"
          className="
            mt-7
            flex
            h-[47px]
            items-center
            justify-center
            gap-2
            rounded-[10px]
            bg-[#4d2898]
            text-[14px]
            font-medium
            text-white
            hover:bg-[#3f2081]
          "
        >
          Entrar
          <span aria-hidden="true">→</span>
        </button>
      </form>

      {/* Divisor */}
      <div className="my-12 flex items-center gap-4">
        <span className="h-px flex-1 bg-[#e2dee6]" />

        <span className="whitespace-nowrap text-[13px] text-[#85808c]">
          ou continue com
        </span>

        <span className="h-px flex-1 bg-[#e2dee6]" />
      </div>

      {/* Erro Google */}
      {erroGoogle && (
        <p className="mb-4 text-center text-[13px] text-red-600">
          {erroGoogle}
        </p>
      )}

      {/* Google */}
      <button
        type="button"
        disabled={carregandoGoogle}
        onClick={entrarComGoogle}
        className="
          flex
          h-[47px]
          w-full
          items-center
          justify-center
          gap-3
          rounded-[10px]
          border
          border-[#cec8d5]
          bg-white
          text-[14px]
          hover:bg-[#fafafa]
          disabled:cursor-not-allowed
          disabled:opacity-60
        "
      >
        <GoogleIcon />

        {carregandoGoogle
          ? "Entrando..."
          : "Continuar com Google"}
      </button>
    </div>
  );
}

function EmailIcon() {
  return (
    <svg
      width="21"
      height="21"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className="text-[#85808c]"
      aria-hidden="true"
    >
      <rect
        x="3"
        y="5"
        width="18"
        height="14"
        rx="2"
      />
      <path d="m3 7 9 6 9-6" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg
      width="21"
      height="21"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className="text-[#85808c]"
      aria-hidden="true"
    >
      <rect
        x="5"
        y="10"
        width="14"
        height="11"
        rx="2"
      />
      <path d="M8 10V7a4 4 0 0 1 8 0v3" />
    </svg>
  );
}

function GoogleIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        fill="#4285F4"
        d="M21.35 12.2c0-.64-.06-1.28-.18-1.9H12v3.6h5.25a4.5 4.5 0 0 1-1.95 2.95v2.4h3.16c1.85-1.7 2.89-4.2 2.89-7.05Z"
      />

      <path
        fill="#34A853"
        d="M12 21.7c2.63 0 4.84-.87 6.46-2.45l-3.16-2.4c-.88.59-2 .94-3.3.94-2.54 0-4.69-1.71-5.46-4.01H3.27v2.47A9.76 9.76 0 0 0 12 21.7Z"
      />

      <path
        fill="#FBBC05"
        d="M6.54 13.78a5.87 5.87 0 0 1 0-3.56V7.75H3.27a9.7 9.7 0 0 0 0 8.5l3.27-2.47Z"
      />

      <path
        fill="#EA4335"
        d="M12 6.21c1.43 0 2.72.49 3.73 1.46l2.8-2.8A9.42 9.42 0 0 0 12 2.3a9.76 9.76 0 0 0-8.73 5.45l3.27 2.47C7.31 7.92 9.46 6.21 12 6.21Z"
      />
    </svg>
  );
}