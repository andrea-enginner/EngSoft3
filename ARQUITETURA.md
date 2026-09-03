# Arquitetura — MVC

## As pastas

```text
src/
├── app/              # ROTEAMENTO — URLs, layouts e páginas
├── controllers/      # CONTROLLER — recebe a entrada e chama o Model
├── models/           # MODEL — o domínio e as regras de negócio
│   ├── entities/     #   tipos do domínio (Item, Usuario, Emprestimo...)
│   ├── repositories/ #   de onde o dado vem (mock, banco, API)
│   └── services/     #   as regras (validação, cálculo, permissão)
├── views/            # VIEW — componentes React de apresentação
└── lib/              # utilitários sem regra de negócio (formatar data etc.)
```

## Regra de dependência

```text
app/  →  controllers/  →  services/  →  repositories/
  ↓           ↓               ↓
views/     views/         entities/
```

A seta só aponta para a direita. **Nunca** para trás — um `service` não
importa uma `view`, um `model` não importa nada de `next/*`.

Em uma frase: **página chama controller, controller chama service, service
chama repository.**

## O que vai em cada camada

| Pasta               | Vai aqui                                              | Não vai aqui                    |
| ------------------- | ----------------------------------------------------- | -------------------------------- |
| `models/entities`   | Tipos e funções puras do domínio                      | React, banco, formatação de tela |
| `models/repositories` | O acesso ao dado. Trocar de banco mexe só aqui       | Regra de negócio                 |
| `models/services`   | Regras: validação, cálculo, quem pode o quê           | `FormData`, `Response`, JSX      |
| `controllers`       | Traduz entrada crua ↔ domínio, e erro ↔ mensagem      | Cálculo, regra                   |
| `views`             | Componentes que recebem dado pronto por props         | Busca de dado, regra             |
| `app`               | Só a rota: chama o controller e monta as views        | Qualquer lógica                  |

## Como o Next encaixa no MVC

O MVC clássico tem um Controller que recebe a requisição HTTP e escolhe a
View. No Next.js App Router isso não existe: o roteamento por arquivos
(`src/app`) já faz esse papel. Então o Controller aqui aparece de três formas:

- **`*.controller.ts`** — leitura. Funções que as páginas chamam para montar a
  tela. Não leva diretiva nenhuma.
- **`*.actions.ts`** — escrita. Leva `"use server"` no topo. Cada função vira
  um endpoint POST público, então a validação obrigatoriamente acontece no
  servidor.
- **`app/api/*/route.ts`** — endpoint HTTP de verdade, para quando algo fora
  do site precisar dos dados.

## Ordem para criar uma funcionalidade

De dentro para fora: **entidade → repositório → service → controller → view →
rota**.

Fazer nessa ordem evita o erro mais comum, que é escrever a tela primeiro e
acabar espalhando regra de negócio dentro dela.

## Estado atual

Só o esqueleto de pastas e a tela inicial (`src/app/page.tsx` +
`src/views/`), **sem nenhuma funcionalidade** — os botões e filtros são
`<span>` estáticos, e a lista de itens está fixa no próprio arquivo.

Os comentários no topo de cada arquivo indicam o que trocar quando as camadas
forem implementadas.

## Antes de escrever código

O projeto usa **Next.js 16**, cujas APIs mudaram em relação a versões
anteriores. A documentação vem junto com o pacote, em
`node_modules/next/dist/docs/`. Dois pontos que costumam pegar:

- `params` e `searchParams` são `Promise` — precisam de `await`;
- `PageProps<'/rota'>` e `LayoutProps<'/rota'>` são tipos globais gerados, não
  precisam de `import`.
