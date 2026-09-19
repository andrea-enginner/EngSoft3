import { credenciaisSupabase, executarRpc, urlPublicaStorage } from "@/lib/supabase/rest";
import type { AnuncioDetalhe, AnuncioResumo, TipoAnuncio } from "@/models/entities/item";

const DEMONSTRACAO: AnuncioDetalhe[] = [
  ["1", "doacao", "Furadeira Makita 12V com Maleta", "Ainda funciona, mas tem que trocar a bateria por uma nova. Acompanha maleta e brocas.", "Quase Novo", "Petrolina, PE", "/itens/furadeira_2000.jpg", "Damião Silva"],
  ["2", "emprestimo", "Livro: O Design do Dia a Dia", "Empresto por até 15 dias. Ótima leitura para designers e quem gosta de usabilidade.", "Bem Cuidado", "Pinheiros, SP", "/itens/livro_legal.jpg", "Lucas Martins"],
  ["3", "doacao", "Violão Acústico Giannini", "Doando pra quem estiver precisando. Precisa afinar e trocar as cordas.", "Usado com marcas", "Centro, SP", "/itens/violao_guitarra.jpg", "Ana Clara"],
  ["4", "emprestimo", "Barraca de Camping 4 Pessoas", "Disponível para empréstimo aos finais de semana. Ideal para trilhas e acampamentos.", "Excelente", "Butantã, SP", "/itens/acampar_lindo.jpg", "Marina Souza"],
].map(([id, tipo, titulo, descricao, condicao, localizacao, imagem, nome], indice) => ({
  id, tipo: tipo as TipoAnuncio, titulo, descricao, condicao, localizacao,
  imagem, imagens: [imagem], categoria: tipo === "emprestimo" ? "Livros e lazer" : null,
  valorUnitarioCentavos: tipo === "emprestimo" ? 2500 : null,
  duracaoQuantidade: tipo === "emprestimo" ? 1 : null,
  duracaoUnidade: tipo === "emprestimo" ? "semanas" : null,
  publicadoEm: new Date(Date.now() - (indice + 2) * 86_400_000).toISOString(), ativo: true,
  aceitaPropostas: true,
  dono: { id: `demo-${id}`, nome, avaliacao: 4.8, quantidadeEmprestimos: 0, confiavel: true },
}));

type RegistroPublico = {
  id: string; tipo: string; titulo: string; descricao: string; categoria: string | null; condicao: string | null;
  valor_unitario_centavos: number | null; duracao_quantidade: number | null; duracao_unidade: string | null;
  criado_em: string; usuario_id: string; dono_nome: string;
  dono_avatar: string | null; cidade: string | null; estado: string | null;
  avaliacao: number | string; imagens: string[] | null;
  impulsionado?: boolean | null; impulsionado_ate?: string | null;
};

function urlImagem(caminho: string): string {
  if (caminho.startsWith("http") || caminho.startsWith("/")) return caminho;
  return urlPublicaStorage("anuncios", caminho) ?? caminho;
}

function normalizar(registro: RegistroPublico): AnuncioDetalhe {
  const imagens = (registro.imagens ?? []).map(urlImagem);
  const avaliacao = Number(registro.avaliacao) || 0;
  const categorias: Record<string, string> = { ferramentas: "Ferramentas", livros: "Livros", eletronicos: "Eletrônicos", esporte: "Esporte", casa: "Casa", outros: "Outros" };
  return {
    id: registro.id, tipo: registro.tipo === "doacao" ? "doacao" : "emprestimo",
    titulo: registro.titulo, descricao: registro.descricao,
    categoria: registro.categoria ? categorias[registro.categoria] ?? registro.categoria : null,
    condicao: registro.condicao === "novo_quase_novo" ? "Novo/Quase novo" : registro.condicao === "marcas_de_uso" ? "Com marcas de uso" : "Não informada",
    localizacao: [registro.cidade, registro.estado].filter(Boolean).join(", ") || "Local não informado",
    imagem: imagens[0] ?? null, imagens, valorUnitarioCentavos: registro.valor_unitario_centavos,
    duracaoQuantidade: registro.duracao_quantidade,
    duracaoUnidade: ["minutos", "horas", "dias", "semanas"].includes(registro.duracao_unidade ?? "")
      ? registro.duracao_unidade as AnuncioDetalhe["duracaoUnidade"] : null,
    publicadoEm: registro.criado_em, ativo: true, avaliacao,
    impulsionado: registro.impulsionado ?? false,
    impulsionadoAte: registro.impulsionado_ate ?? null,
    aceitaPropostas: false,
    dono: { id: registro.usuario_id, nome: registro.dono_nome, avatar: registro.dono_avatar ?? undefined, avaliacao, quantidadeEmprestimos: 0, confiavel: avaliacao >= 4.5 },
  };
}

async function carregar(id?: string): Promise<AnuncioDetalhe[]> {
  if (id && credenciaisSupabase() && !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) return [];
  const registros = await executarRpc<RegistroPublico>("listar_anuncios_publicos", id ? { p_id: id } : {}, null);
  return registros ? registros.map(normalizar) : DEMONSTRACAO;
}

export async function listarItensAtivos(): Promise<AnuncioResumo[]> { return carregar(); }
export async function buscarItemAtivoPorId(id: string): Promise<AnuncioDetalhe | null> {
  return (await carregar(id)).find((item) => item.id === id) ?? null;
}
