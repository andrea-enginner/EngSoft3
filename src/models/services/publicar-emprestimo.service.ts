import type { CondicaoItem, NovoEmprestimo, UnidadeDuracao } from "@/models/entities/item";
import type { SessaoUsuario } from "@/models/entities/usuario";
import { buscarEmprestimoDoUsuario } from "@/models/repositories/anuncio.repository";
import { atualizarEmprestimoSalvo, FalhaRollbackStorageError, salvarEmprestimo } from "@/models/repositories/publicar-emprestimo.repository";

const CATEGORIAS = new Set(["ferramentas", "livros", "eletronicos", "esporte", "casa", "outros"]);
const CONDICOES = new Set<CondicaoItem>(["novo_quase_novo", "marcas_de_uso"]);
const UNIDADES_DURACAO = new Set<UnidadeDuracao>(["dias", "semanas"]);
const FORMATOS = new Set(["image/jpeg", "image/png", "image/webp"]);
const CINCO_MIB = 5 * 1024 * 1024;

export class PublicacaoInvalidaError extends Error {}

export type EntradaEmprestimo = {
  titulo: string;
  categoria: string;
  condicao: string;
  descricao: string;
  valorUnitarioCentavos: number;
  duracaoQuantidade: number;
  duracaoUnidade: string;
};

function validarEntrada(entrada: EntradaEmprestimo): Omit<NovoEmprestimo, "id" | "tipo"> {
  const titulo = entrada.titulo.trim();
  const descricao = entrada.descricao.trim();
  if (!titulo || titulo.length > 100) throw new PublicacaoInvalidaError("Informe um título com até 100 caracteres.");
  if (!CATEGORIAS.has(entrada.categoria)) throw new PublicacaoInvalidaError("Selecione uma categoria válida.");
  if (!CONDICOES.has(entrada.condicao as CondicaoItem)) throw new PublicacaoInvalidaError("Selecione uma condição válida.");
  if (!descricao || descricao.length > 500) throw new PublicacaoInvalidaError("Informe uma descrição com até 500 caracteres.");
  if (!Number.isSafeInteger(entrada.duracaoQuantidade) || entrada.duracaoQuantidade < 1 || entrada.duracaoQuantidade > 9999) {
    throw new PublicacaoInvalidaError("Informe uma duração entre 1 e 9999.");
  }
  if (!UNIDADES_DURACAO.has(entrada.duracaoUnidade as UnidadeDuracao)) throw new PublicacaoInvalidaError("Selecione dias ou semanas como unidade de duração.");
  if (!Number.isSafeInteger(entrada.valorUnitarioCentavos) || entrada.valorUnitarioCentavos < 1 || entrada.valorUnitarioCentavos > 2_147_483_647) {
    throw new PublicacaoInvalidaError("Informe um valor por unidade entre R$ 0,01 e R$ 21.474.836,47.");
  }
  return { titulo, categoria: entrada.categoria, condicao: entrada.condicao as CondicaoItem, descricao, valorUnitarioCentavos: entrada.valorUnitarioCentavos, duracaoQuantidade: entrada.duracaoQuantidade, duracaoUnidade: entrada.duracaoUnidade as UnidadeDuracao };
}

export async function publicarEmprestimo(
  sessao: SessaoUsuario | null,
  entrada: EntradaEmprestimo,
  fotos: File[],
): Promise<string> {
  if (!sessao) throw new PublicacaoInvalidaError("Entre na sua conta para publicar um empréstimo.");

  const dados = validarEntrada(entrada);
  if (fotos.length < 1 || fotos.length > 4) throw new PublicacaoInvalidaError("Adicione de uma a quatro fotos.");
  if (fotos.some((foto) => !FORMATOS.has(foto.type) || foto.size > CINCO_MIB || foto.size === 0)) {
    throw new PublicacaoInvalidaError("Cada foto deve ser JPEG, PNG ou WebP e ter no máximo 5 MiB.");
  }

  const emprestimo: NovoEmprestimo = {
    id: crypto.randomUUID(),
    tipo: "emprestimo",
    ...dados,
  };
  try {
    return await salvarEmprestimo(sessao, emprestimo, fotos);
  } catch (erro) {
    if (erro instanceof FalhaRollbackStorageError) {
      throw new PublicacaoInvalidaError("A publicação falhou e algumas imagens podem precisar de remoção. Tente novamente mais tarde.", { cause: erro });
    }
    throw erro;
  }
}

export async function carregarEmprestimoParaEdicao(sessao: SessaoUsuario, id: string) {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) return null;
  return buscarEmprestimoDoUsuario(sessao, id);
}

export async function atualizarEmprestimo(
  sessao: SessaoUsuario | null,
  id: string,
  entrada: EntradaEmprestimo,
): Promise<string> {
  if (!sessao) throw new PublicacaoInvalidaError("Entre na sua conta para editar um empréstimo.");
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) throw new PublicacaoInvalidaError("Anúncio inválido.");
  await atualizarEmprestimoSalvo(sessao, { id, tipo: "emprestimo", ...validarEntrada(entrada) });
  return id;
}
