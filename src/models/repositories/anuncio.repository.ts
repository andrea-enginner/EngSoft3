/**
 * Camada MODEL — de onde vêm os anúncios publicados pelo usuário.
 */

import type { Anuncio, TipoAnuncio } from "@/models/entities/anuncio";
import type { SessaoUsuario } from "@/models/entities/usuario";
import { consultarSupabase } from "@/lib/supabase/rest";

const DIA = 24 * 60 * 60 * 1000;

const ANUNCIOS_DEMONSTRACAO: Anuncio[] = [
  {
    id: "demo-1",
    tipo: "doacao",
    titulo: "Violão Acústico Giannini",
    descricao: "Doando pra quem estiver precisando. Precisa afinar e trocar as cordas.",
    imagem: "/itens/violao_guitarra.jpg",
    publicadoEm: new Date(Date.now() - 2 * DIA).toISOString(),
    ativo: true,
  },
  {
    id: "demo-2",
    tipo: "emprestimo",
    titulo: "Livro: O Design do Dia a Dia",
    descricao: "Empresto por até 15 dias. Ótima leitura para quem gosta de usabilidade.",
    imagem: "/itens/livro_legal.jpg",
    publicadoEm: new Date(Date.now() - 8 * DIA).toISOString(),
    ativo: true,
  },
  {
    id: "demo-3",
    tipo: "emprestimo",
    titulo: "Barraca de Camping 4 Pessoas",
    descricao: "Disponível aos finais de semana. Ideal para trilhas e acampamentos.",
    imagem: "/itens/acampar_lindo.jpg",
    publicadoEm: new Date(Date.now() - 40 * DIA).toISOString(),
    ativo: false,
  },
];

type RegistroAnuncio = {
  id: string | number;
  tipo?: string | null;
  titulo?: string | null;
  descricao?: string | null;
  imagem_url?: string | null;
  ativo?: boolean | null;
  criado_em?: string | null;
};

function normalizar(registro: RegistroAnuncio): Anuncio {
  const tipo: TipoAnuncio = registro.tipo === "doacao" ? "doacao" : "emprestimo";

  return {
    id: String(registro.id),
    tipo,
    titulo: registro.titulo?.trim() || "Anúncio sem título",
    descricao: registro.descricao?.trim() || "",
    imagem: registro.imagem_url?.trim() || null,
    publicadoEm: registro.criado_em ?? new Date().toISOString(),
    ativo: registro.ativo ?? true,
  };
}

export async function buscarAnunciosDoUsuario(sessao: SessaoUsuario | null): Promise<Anuncio[] | null> {
  if (!sessao) return null;

  const registros = await consultarSupabase<RegistroAnuncio>(
    `anuncios?select=*&usuario_id=eq.${sessao.usuarioId}&order=criado_em.desc`,
    sessao.token,
  );
  return registros ? registros.map(normalizar) : null;
}

export function anunciosDeDemonstracao(): Anuncio[] {
  return ANUNCIOS_DEMONSTRACAO;
}
