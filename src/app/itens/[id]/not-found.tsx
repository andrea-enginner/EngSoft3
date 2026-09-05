import Link from "next/link";
import { IconeImagem } from "@/views/comuns/Icones";

export default function ItemNaoEncontrado() {
  return (
    <main className="mx-auto grid min-h-[60vh] max-w-2xl place-items-center px-5 py-12 text-center">
      <div>
        <span className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-primary-50 text-primary-300"><IconeImagem className="h-10 w-10" /></span>
        <h1 className="mt-6 text-2xl font-bold text-primary-900">Item não encontrado</h1>
        <p className="mt-2 text-muted">Este item não existe ou não está mais disponível.</p>
        <Link href="/" className="mt-6 inline-block rounded-lg bg-primary-700 px-5 py-3 font-semibold text-white hover:bg-primary-900">Voltar ao início</Link>
      </div>
    </main>
  );
}
