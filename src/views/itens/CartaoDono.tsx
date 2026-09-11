import Image from "next/image";
import type { DonoItem } from "@/models/entities/item-detalhe";
import { IconeEstrela } from "@/views/comuns/Icones";

function iniciais(nome: string) {
  return nome
    .split(" ")
    .slice(0, 2)
    .map((parte) => parte[0])
    .join("")
    .toUpperCase();
}

export function CartaoDono({ dono }: { dono: DonoItem }) {
  return (
    <section aria-labelledby="titulo-dono" className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
      <h2 id="titulo-dono" className="mb-4 text-xs font-bold uppercase tracking-wide text-muted">Sobre o dono</h2>
      <div className="flex items-center gap-3">
        {dono.avatar ? (
          <Image src={dono.avatar} alt={`Foto de ${dono.nome}`} width={48} height={48} className="h-12 w-12 rounded-full object-cover" />
        ) : (
          <span aria-hidden="true" className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-primary-100 font-bold text-primary-700">
            {iniciais(dono.nome)}
          </span>
        )}
        <div>
          <p className="font-bold text-foreground">{dono.nome}</p>
          <p className="mt-1 flex items-center gap-1 text-sm text-muted">
            <IconeEstrela className="h-4 w-4 text-estrela" />
            <strong className="font-semibold text-foreground">{dono.avaliacao.toFixed(1)}</strong>
            <span>({dono.quantidadeEmprestimos} empréstimos)</span>
          </p>
        </div>
      </div>
      {dono.confiavel ? <p className="mt-4 flex items-center gap-2 text-sm font-medium text-primary-700"><span aria-hidden="true">♦</span>Membro confiável da comunidade</p> : null}
    </section>
  );
}
