import Link from "next/link";

type CampoProps = {
  label: string;
  name: string;
  placeholder: string;
  type?: string;
};

function Campo({
  label,
  name,
  placeholder,
  type = "text",
}: CampoProps) {
  return (
    <div className="flex flex-col gap-2">
      <label
        htmlFor={name}
        className="text-[14px] font-medium text-[#29252f]"
      >
        {label}
      </label>

      <input
        id={name}
        name={name}
        type={type}
        placeholder={placeholder}
        className="
          h-[47px]
          w-full
          rounded-[11px]
          border
          border-[#cec8d5]
          bg-white
          px-4
          text-[14px]
          text-[#29252f]
          outline-none
          placeholder:text-[#7d8494]
          focus:border-primary-500
          focus:ring-1
          focus:ring-primary-300
        "
      />
    </div>
  );
}

export function CadastroForm() {
  return (
    <div className="w-full max-w-[430px]">

      {/* Abas */}
      <div className="mb-7 flex h-[24px] overflow-hidden rounded-full">
        <Link
          href="/login"
          className="
            flex
            flex-1
            items-center
            justify-center
            bg-[#ceb8ff]
            text-[14px]
            text-[#4c2995]
          "
        >
          Login
        </Link>

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
          Criar conta
        </span>
      </div>

      <form className="flex flex-col gap-[15px]">

        <Campo
          label="Nome Completo"
          name="nome"
          placeholder="Meu nome"
        />

        <Campo
          label="E-mail"
          name="email"
          type="email"
          placeholder="seu@email.com"
        />

        <Campo
          label="CPF"
          name="cpf"
          placeholder="000.000.000-00"
        />

        <Campo
          label="Data de Nascimento"
          name="dataNascimento"
          placeholder="00/00/0000"
        />

        <Campo
          label="Telefone"
          name="telefone"
          type="tel"
          placeholder="+55 (87) 99999 - 9999"
        />

        <Campo
          label="CEP"
          name="cep"
          placeholder="00.000-00"
        />

        <Campo
          label="Cidade"
          name="cidade"
          placeholder="Petrolina"
        />

        <Campo
          label="Estado"
          name="estado"
          placeholder="Pernambuco"
        />

        <Campo
          label="Senha"
          name="senha"
          type="password"
          placeholder="••••••••"
        />

        <Campo
          label="Confirmar Senha"
          name="confirmarSenha"
          type="password"
          placeholder="••••••••"
        />

        <Link
          href="/"
          className="
            mt-1
            flex
            h-[45px]
            w-full
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
          Cadastrar
          <span aria-hidden="true">→</span>
        </Link>
      </form>

      {/* Divisor */}
      <div className="my-8 flex items-center gap-4">
        <span className="h-px flex-1 bg-[#e2dee6]" />

        <span className="whitespace-nowrap text-[13px] text-[#85808c]">
          ou Cadastre-se com
        </span>

        <span className="h-px flex-1 bg-[#e2dee6]" />
      </div>

      {/* Redes */}
      <div className="grid grid-cols-2 gap-4">
        <button
          type="button"
          className="
            flex
            h-[44px]
            items-center
            justify-center
            gap-3
            rounded-[10px]
            border
            border-[#cec8d5]
            bg-white
            text-[14px]
            hover:bg-[#fafafa]
          "
        >
          <GoogleIcon />
          Google
        </button>

        <button
          type="button"
          className="
            flex
            h-[44px]
            items-center
            justify-center
            gap-3
            rounded-[10px]
            border
            border-[#cec8d5]
            bg-white
            text-[14px]
            hover:bg-[#fafafa]
          "
        >
          <AppleIcon />
          Apple
        </button>
      </div>
    </div>
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

function AppleIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.04 2.26-.8 3.55-.78 1.4.03 2.53.5 3.36 1.48-2.64 1.54-2.19 4.9.46 5.92-.81 2.3-2.15 4.54-4.45 5.55ZM12.03 7.25C11.9 4.8 13.88 2.65 16.05 2c.28 2.55-2.13 4.86-4.02 5.25Z" />
    </svg>
  );
}