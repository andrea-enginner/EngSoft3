/**
 * Camada VIEW — cabeçalho do Ciclo.
 *
 * ATENÇÃO: nada aqui é funcional ainda. Os itens de navegação são <span> de
 * propósito. Quando as rotas existirem, troque cada um por:
 *
 *   <Link href="/emprestimos"> ... </Link>   // import Link from "next/link"
 *
 * E os ícones da direita por <button type="button" onClick={...}>.
 */

import {
  IconeCasa,
  IconeCiclo,
  IconeMensagem,
  IconePerfil,
  IconePublicar,
  IconeSeta,
  IconeSino,
  IconeTrocas,
} from "@/views/comuns/Icones";

const NAVEGACAO = [
  { rotulo: "Início", Icone: IconeCasa, ativo: true },
  { rotulo: "Empréstimos", Icone: IconeTrocas, ativo: false },
  { rotulo: "Publicar", Icone: IconePublicar, ativo: false },
  { rotulo: "Mensagens", Icone: IconeMensagem, ativo: false },
  { rotulo: "Perfil", Icone: IconePerfil, ativo: false },
];

export function Cabecalho() {
  return (
    <header className="border-b border-border bg-surface">
      <div className="mx-auto flex max-w-6xl items-center gap-8 px-6 py-3">
        {/* Marca */}
        <div className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-500 text-white">
            <IconeCiclo className="h-5 w-5" />
          </span>
          <span className="text-xl font-bold tracking-tight text-primary-700">
            Ciclo
          </span>
        </div>

        {/* Navegação principal */}
        <nav className="hidden flex-1 justify-center md:flex">
          <ul className="flex items-center gap-7 text-sm">
            {NAVEGACAO.map(({ rotulo, Icone, ativo }) => (
              <li key={rotulo}>
                <span
                  className={`flex items-center gap-1.5 border-b-2 pb-1 ${
                    ativo
                      ? "border-primary-500 font-semibold text-primary-700"
                      : "border-transparent text-muted"
                  }`}
                >
                  <Icone className="h-4 w-4" />
                  {rotulo}
                </span>
              </li>
            ))}
          </ul>
        </nav>

        {/* Ações do usuário */}
        <div className="ml-auto flex items-center gap-4 text-muted md:ml-0">
          <IconeSino className="h-5 w-5" />
          <IconeMensagem className="h-5 w-5" />
          <span className="flex items-center gap-1">
            <span className="h-8 w-8 rounded-full bg-gradient-to-br from-primary-300 to-primary-500" />
            <IconeSeta className="h-4 w-4" />
          </span>
        </div>
      </div>
    </header>
  );
}
