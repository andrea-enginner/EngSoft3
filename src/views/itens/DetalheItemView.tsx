import type { ItemDetalhe } from "@/models/entities/item-detalhe";
import { formatarPublicacao } from "@/lib/formatar-publicacao";
import { IconeCondicao, IconeDoacao, IconeEmprestimo, IconeLocal } from "@/views/comuns/Icones";
import { CartaoDono } from "@/views/itens/CartaoDono";
import { GaleriaItem } from "@/views/itens/GaleriaItem";
import { ModalInteresse } from "@/views/itens/ModalInteresse";

const APRESENTACAO_TIPO = {
  doacao: { rotulo: "Doação", classe: "bg-doacao", Icone: IconeDoacao },
  emprestimo: { rotulo: "Empréstimo", classe: "bg-emprestimo", Icone: IconeEmprestimo },
} as const;

export function DetalheItemView({ item }: { item: ItemDetalhe }) {
  const tipo = APRESENTACAO_TIPO[item.tipo];

  return (
    <main className="mx-auto max-w-6xl px-5 py-8 sm:px-8 sm:py-12">
      <div className="grid items-start gap-8 lg:grid-cols-[1.15fr_.85fr] lg:gap-12">
        <div className="relative">
          <GaleriaItem imagens={item.imagens} titulo={item.titulo} />
          <span className={`absolute left-4 top-4 flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-white ${tipo.classe}`}>
            <tipo.Icone className="h-3.5 w-3.5" />
            {tipo.rotulo}
          </span>
        </div>

        <div className="space-y-6">
          <section>
            <h1 className="text-2xl font-bold tracking-tight text-primary-900 sm:text-3xl">{item.titulo}</h1>
            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-sm text-muted">
              <span className="flex items-center gap-1.5"><IconeLocal className="h-4 w-4" />{item.localizacao}</span>
              <time dateTime={item.publicadoEm}>{formatarPublicacao(item.publicadoEm)}</time>
            </div>
            <p className="mt-6 leading-relaxed text-foreground">{item.descricao}</p>
            {item.aceitaPropostas ? <p className="mt-4 font-semibold text-primary-700">Aceito propostas!</p> : null}
            <p className="mt-5 flex items-center gap-2 border-t border-border pt-4 text-sm text-muted">
              <IconeCondicao className="h-4 w-4" />
              Condição: <strong className="font-semibold text-foreground">{item.condicao}</strong>
            </p>
          </section>

          <CartaoDono dono={item.dono} />
          <section aria-label="Demonstrar interesse">
            <ModalInteresse nomeDono={item.dono.nome} tituloItem={item.titulo} />
          </section>
        </div>
      </div>
    </main>
  );
}
