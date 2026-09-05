/**
 * Camada VIEW — a tela de perfil do usuário logado.
 *
 * Recebe o perfil já montado pelo Controller e monta os painéis das abas no
 * servidor, entregando-os prontos para a parte cliente que troca de aba.
 */

import type { Perfil } from "@/models/entities/perfil";
import { IconeEmprestimo, IconeEstrela } from "@/views/comuns/Icones";
import { AbasPerfil } from "@/views/perfil/AbasPerfil";
import { CardAnuncio, CardNovoAnuncio } from "@/views/perfil/CardAnuncio";
import { CardAvaliacao } from "@/views/perfil/CardAvaliacao";
import { CartaoPerfil } from "@/views/perfil/CartaoPerfil";
import { EstadoVazio } from "@/views/perfil/EstadoVazio";

export function PerfilView({ perfil }: { perfil: Perfil }) {
  const { usuario, estatisticas, anuncios, avaliacoes } = perfil;

  const painelAnuncios = (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {anuncios.map((anuncio) => (
        <CardAnuncio key={anuncio.id} anuncio={anuncio} />
      ))}
      <CardNovoAnuncio />
    </div>
  );

  const painelHistorico = (
    <EstadoVazio
      icone={<IconeEmprestimo className="h-6 w-6" />}
      titulo="Nenhum item no histórico"
      descricao="Doações e empréstimos concluídos aparecerão aqui, com a data e a pessoa envolvida em cada troca."
    />
  );

  const painelAvaliacoes =
    avaliacoes.length > 0 ? (
      <div className="grid gap-4 sm:grid-cols-2">
        {avaliacoes.map((avaliacao) => (
          <CardAvaliacao key={avaliacao.id} avaliacao={avaliacao} />
        ))}
      </div>
    ) : (
      <EstadoVazio
        icone={<IconeEstrela className="h-6 w-6" />}
        titulo="Ainda sem avaliações"
        descricao="Depois de cada troca, quem recebeu ou emprestou pode deixar uma nota. É dela que sai a sua reputação."
      />
    );

  return (
    <main className="mx-auto w-full max-w-[1120px] px-5 py-8 sm:px-8">
      <CartaoPerfil
        usuario={usuario}
        estatisticas={estatisticas}
        demonstracao={perfil.fonte === "demonstracao"}
      />

      <div className="mt-8">
        <AbasPerfil
          abas={[
            { id: "anuncios", rotulo: "Meus Anúncios", painel: painelAnuncios },
            { id: "historico", rotulo: "Histórico", painel: painelHistorico },
            { id: "avaliacoes", rotulo: "Avaliações", painel: painelAvaliacoes },
          ]}
        />
      </div>
    </main>
  );
}
