import Link from "next/link";

type Props = {
  titulo: string;
  descricao: string;
  destino?: string;
  compacto?: boolean;
};

export function AcessoRestrito({
  titulo,
  descricao,
  destino = "/feed",
  compacto = false,
}: Props) {
  const login = `/login?next=${encodeURIComponent(destino)}`;

  return (
    <section
      className={
        compacto
          ? "rounded-2xl border border-primary-100 bg-primary-50/60 p-5 text-center"
          : "mx-auto my-16 max-w-xl rounded-3xl border border-primary-100 bg-surface p-8 text-center shadow-lg shadow-primary-900/5 sm:p-10"
      }
    >
      <span
        aria-hidden="true"
        className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-primary-100 text-xl text-primary-700"
      >
        🔒
      </span>
      <h1 className="mt-4 text-xl font-bold text-primary-900">{titulo}</h1>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted">
        {descricao}
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Link
          href={login}
          className="rounded-xl bg-primary-700 px-5 py-3 text-sm font-semibold text-white hover:bg-primary-900"
        >
          Entrar
        </Link>
        <Link
          href="/cadastro"
          className="rounded-xl border border-primary-300 bg-surface px-5 py-3 text-sm font-semibold text-primary-700 hover:bg-primary-50"
        >
          Criar conta
        </Link>
      </div>
    </section>
  );
}
