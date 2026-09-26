/**
 * Camada MODEL — de onde vêm os anúncios publicados pelo usuário.
 */

import type { Anuncio, TipoAnuncio } from "@/models/entities/anuncio";
import type { EmprestimoEdicao } from "@/models/entities/item";
import type { SessaoUsuario } from "@/models/entities/usuario";
import { consultarSupabase, urlPublicaStorage } from "@/lib/supabase/rest";

const DIA = 24 * 60 * 60 * 1000;

const ANUNCIOS_DEMONSTRACAO: Anuncio[] = [
  {
    id: "demo-1",
    tipo: "doacao",
    titulo: "Violão Acústico Giannini",
    descricao: "Doando pra quem estiver precisando. Precisa afinar e trocar as cordas.",
    categoria: null,
    condicao: "Usado com marcas",
    localizacao: "Petrolina, PE",
    imagem: "/itens/violao_guitarra.jpg",
    valorUnitarioCentavos: null,
    duracaoQuantidade: null,
    duracaoUnidade: null,
    publicadoEm: new Date(Date.now() - 2 * DIA).toISOString(),
    ativo: true,
    naListaDesejos: false,
  },
  {
    id: "demo-2",
    tipo: "emprestimo",
    titulo: "Livro: O Design do Dia a Dia",
    descricao: "Empresto por até 15 dias. Ótima leitura para quem gosta de usabilidade.",
    categoria: "Livros",
    condicao: "Bem Cuidado",
    localizacao: "Petrolina, PE",
    imagem: "/itens/livro_legal.jpg",
    valorUnitarioCentavos: 2500,
    duracaoQuantidade: 15,
    duracaoUnidade: "dias",
    publicadoEm: new Date(Date.now() - 8 * DIA).toISOString(),
    ativo: true,
    naListaDesejos: false,
  },
  {
    id: "demo-3",
    tipo: "emprestimo",
    titulo: "Barraca de Camping 4 Pessoas",
    descricao: "Disponível aos finais de semana. Ideal para trilhas e acampamentos.",
    categoria: "Esporte",
    condicao: "Excelente",
    localizacao: "Petrolina, PE",
    imagem: "/itens/acampar_lindo.jpg",
    valorUnitarioCentavos: 5000,
    duracaoQuantidade: 1,
    duracaoUnidade: "semanas",
    publicadoEm: new Date(Date.now() - 40 * DIA).toISOString(),
    ativo: false,
    naListaDesejos: false,
  },
];

type RegistroAnuncio = {
  id: string | number;
  tipo?: string | null;
  titulo?: string | null;
  descricao?: string | null;
  categoria?: string | null;
  imagem_url?: string | null;
  ativo?: boolean | null;
  criado_em?: string | null;
  condicao?: string | null;
  valor_unitario_centavos?: number | null;
  duracao_quantidade?: number | null;
  duracao_unidade?: string | null;
  anuncio_imagens?: { caminho: string; ordem: number }[] | null;
  impulsionamentos_anuncio?: { fim_em: string }[] | null;
};

function normalizar(registro: RegistroAnuncio): Anuncio {
  const tipo: TipoAnuncio = registro.tipo === "doacao" ? "doacao" : "emprestimo";

  const primeiraImagem = registro.anuncio_imagens?.sort((a, b) => a.ordem - b.ordem)[0]?.caminho;
  const caminho = primeiraImagem ?? registro.imagem_url?.trim();
  const imagem = caminho
    ? caminho.startsWith("http") || caminho.startsWith("/") ? caminho : urlPublicaStorage("anuncios", caminho)
    : null;
  const impulsionadoAte = (registro.impulsionamentos_anuncio ?? [])
    .map(({ fim_em }) => fim_em)
    .filter((fim) => new Date(fim).getTime() > Date.now())
    .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())[0] ?? null;
  return {
    id: String(registro.id),
    tipo,
    titulo: registro.titulo?.trim() || "Anúncio sem título",
    descricao: registro.descricao?.trim() || "",
    categoria: registro.categoria?.trim() || null,
    condicao: registro.condicao === "novo_quase_novo" ? "Novo/Quase novo" : registro.condicao === "marcas_de_uso" ? "Com marcas de uso" : "Não informada",
    localizacao: "Local não informado",
    imagem,
    valorUnitarioCentavos: registro.valor_unitario_centavos ?? null,
    duracaoQuantidade: registro.duracao_quantidade ?? null,
    duracaoUnidade: ["minutos", "horas", "dias", "semanas"].includes(registro.duracao_unidade ?? "")
      ? registro.duracao_unidade as Anuncio["duracaoUnidade"] : null,
    publicadoEm: registro.criado_em ?? new Date().toISOString(),
    ativo: registro.ativo ?? true,
    naListaDesejos: false,
    impulsionado: Boolean(impulsionadoAte),
    impulsionadoAte,
  };
}

export async function buscarAnunciosDoUsuario(sessao: SessaoUsuario | null): Promise<Anuncio[] | null> {
  if (!sessao) return null;

  const registros = await consultarSupabase<RegistroAnuncio>(
    `anuncios?select=*,anuncio_imagens(caminho,ordem),impulsionamentos_anuncio(fim_em)&usuario_id=eq.${sessao.usuarioId}&order=criado_em.desc`,
    sessao.token,
  );
  return registros ? registros.map(normalizar) : null;
}

export async function buscarEmprestimoDoUsuario(
  sessao: SessaoUsuario,
  id: string,
): Promise<EmprestimoEdicao | null> {
  const registros = await consultarSupabase<RegistroAnuncio>(
    `anuncios?select=*,anuncio_imagens(caminho,ordem)&id=eq.${encodeURIComponent(id)}&usuario_id=eq.${sessao.usuarioId}&tipo=eq.emprestimo&limit=1`,
    sessao.token,
  );
  const registro = registros?.[0];
  if (!registro || !registro.titulo || !registro.categoria || !registro.condicao
    || !registro.descricao || !registro.valor_unitario_centavos
    || !registro.duracao_quantidade || !["minutos", "horas", "dias", "semanas"].includes(registro.duracao_unidade ?? "")) return null;

  const imagens = (registro.anuncio_imagens ?? [])
    .sort((a, b) => a.ordem - b.ordem)
    .map(({ caminho }) => caminho.startsWith("http") || caminho.startsWith("/") ? caminho : urlPublicaStorage("anuncios", caminho))
    .filter((caminho): caminho is string => Boolean(caminho));
  if (!imagens.length && registro.imagem_url) {
    const imagem = registro.imagem_url.startsWith("http") || registro.imagem_url.startsWith("/")
      ? registro.imagem_url
      : urlPublicaStorage("anuncios", registro.imagem_url);
    if (imagem) imagens.push(imagem);
  }

  return {
    id: String(registro.id),
    tipo: "emprestimo",
    titulo: registro.titulo,
    categoria: registro.categoria,
    condicao: registro.condicao as EmprestimoEdicao["condicao"],
    descricao: registro.descricao,
    valorUnitarioCentavos: registro.valor_unitario_centavos,
    duracaoQuantidade: registro.duracao_quantidade,
    duracaoUnidade: registro.duracao_unidade as EmprestimoEdicao["duracaoUnidade"],
    imagens,
  };
}

export function anunciosDeDemonstracao(): Anuncio[] {
  return ANUNCIOS_DEMONSTRACAO;
}
