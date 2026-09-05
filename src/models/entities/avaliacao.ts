/**
 * Camada MODEL — entidade Avaliação e o cálculo de reputação.
 *
 * A reputação nasce do histórico de avaliações recebidas. Enquanto não houver
 * avaliações registradas, `nota` fica `null` — a tela trata esse caso como
 * "ainda sem nota" em vez de exibir zero.
 */

export type Avaliacao = {
  id: string;
  autor: string;
  avatarAutor: string | null;
  nota: number;
  comentario: string;
  criadaEm: string;
};

export type Reputacao = {
  nota: number | null;
  total: number;
};

export function calcularReputacao(avaliacoes: Avaliacao[]): Reputacao {
  if (avaliacoes.length === 0) return { nota: null, total: 0 };
  const soma = avaliacoes.reduce((total, avaliacao) => total + avaliacao.nota, 0);
  return { nota: soma / avaliacoes.length, total: avaliacoes.length };
}
