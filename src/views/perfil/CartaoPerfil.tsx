/**
 * Camada VIEW — área de destaque do perfil.
 *
 * Avatar, identificação e os três indicadores. A nota de reputação já lê
 * `estatisticas.reputacao`: enquanto o histórico de avaliações estiver vazio a
 * entidade devolve `nota: null` e o cartão mostra um traço no lugar do número.
 */

import type { EstatisticasPerfil } from "@/models/entities/perfil";
import type { Usuario } from "@/models/entities/usuario";
import { formatarAno } from "@/lib/datas";
import { IconeCiclo, IconeEngrenagem, IconeEstrela, IconeLocal, IconeTrocas } from "@/views/comuns/Icones";
import { Avatar } from "@/views/perfil/Avatar";
import { EditarPerfilModal } from "@/views/perfil/EditarPerfilModal";

type PropsCartaoPerfil = {
  usuario: Usuario;
  estatisticas: EstatisticasPerfil;
  demonstracao: boolean;
};

function Estatistica({
  rotulo,
  valor,
  detalhe,
  children,
}: {
  rotulo: string;
  valor: string;
  detalhe?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl bg-soft px-4 py-5 text-center">
      <div className="flex items-center justify-center gap-1.5 text-xl font-bold text-primary-900">
        {children}
        {valor}
      </div>
      <p className="mt-1.5 text-[11px] font-bold uppercase tracking-widest text-muted">{rotulo}</p>
      {detalhe ? <p className="mt-0.5 text-[11px] text-muted">{detalhe}</p> : null}
    </div>
  );
}

export function CartaoPerfil({ usuario, estatisticas, demonstracao }: PropsCartaoPerfil) {
  const { reputacao } = estatisticas;
  const ano = formatarAno(usuario.membroDesde);

  return (
    <section className="rounded-3xl border border-border bg-surface p-6 shadow-sm sm:p-8">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-col items-center gap-5 text-center sm:flex-row sm:text-left">
          <Avatar nome={usuario.nome} avatar={usuario.avatar} className="h-28 w-28 text-3xl" sizes="112px" />

          <div>
            <h1 className="text-2xl font-bold tracking-tight text-primary-900">{usuario.nome}</h1>

            <p className="mt-1.5 flex flex-wrap items-center justify-center gap-1.5 text-sm text-muted sm:justify-start">
              <IconeLocal className="h-4 w-4" />
              <span>{usuario.local}</span>
              {ano ? <span>· Membro desde {ano}</span> : null}
            </p>

            <p className="mt-1 text-[13px] text-muted">{usuario.email}</p>

            {demonstracao ? (
              <p className="mt-3 inline-block rounded-full bg-primary-50 px-3 py-1 text-[11px] font-semibold text-primary-700">
                Dados de demonstração — entre na sua conta para ver seu perfil
              </p>
            ) : null}
          </div>
        </div>

        <div className="flex flex-col gap-2.5 sm:items-end">
          <EditarPerfilModal usuario={usuario} />

          <button
            type="button"
            className="flex items-center justify-center gap-2 rounded-xl bg-primary-50 px-5 py-2.5 text-sm font-semibold text-primary-700 hover:bg-primary-100"
          >
            <IconeEngrenagem className="h-4 w-4" />
            Configurações
          </button>
        </div>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <Estatistica
          rotulo="Reputação"
          valor={reputacao.nota === null ? "—" : reputacao.nota.toFixed(1)}
          detalhe={
            reputacao.total === 0
              ? "Ainda sem avaliações"
              : `${reputacao.total} ${reputacao.total === 1 ? "avaliação" : "avaliações"}`
          }
        >
          <IconeEstrela className={`h-5 w-5 ${reputacao.nota === null ? "text-border" : "text-estrela"}`} />
        </Estatistica>

        <Estatistica rotulo="Empréstimos" valor={String(estatisticas.emprestimos)}>
          <IconeTrocas className="h-5 w-5 text-primary-500" />
        </Estatistica>

        <Estatistica rotulo="Ativos" valor={String(estatisticas.ativos)}>
          <IconeCiclo className="h-5 w-5 text-primary-500" />
        </Estatistica>
      </div>
    </section>
  );
}
