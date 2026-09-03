# EngSoft3

Base do projeto da disciplina de Engenharia de Software III, preparada para desenvolvimento colaborativo.

## Tecnologias

- TypeScript
- Next.js com React (App Router)
- Tailwind CSS
- ESLint

## Requisitos

- Node.js 20.9 ou superior
- npm

## Executando localmente

```bash
git clone <url-do-repositorio>
cd EngSoft3
npm install
npm run dev
```

A aplicação ficará disponível em [http://localhost:3000](http://localhost:3000).

## Scripts

```bash
npm run dev    # inicia o ambiente de desenvolvimento
npm run lint   # verifica a qualidade do código
npm run build  # gera a versão de produção
npm run start  # executa a versão de produção
```

## Fluxo de trabalho em equipe

Antes de começar uma tarefa, atualize a branch principal e crie uma branch própria:

```bash
git switch main
git pull
git switch -c feature/nome-da-tarefa
```

Use nomes descritivos, como `feature/tela-login`, `fix/validacao-email` ou `docs/requisitos`. Ao terminar:

```bash
npm run lint
npm run build
git add .
git commit -m "feat: adiciona tela de login"
git push -u origin feature/nome-da-tarefa
```

Depois, abra um pull request para a `main` e solicite a revisão de outro integrante. Evite commits diretamente na `main` e mantenha cada pull request focado em uma única tarefa.

### Evitando conflitos entre telas

Separe as páginas em arquivos próprios, por exemplo:

```text
src/app/login/page.tsx
src/app/cadastro/page.tsx
src/app/dashboard/page.tsx
```

Componentes que serão usados por mais de uma tela devem ficar em `src/views`. Antes de alterar um componente compartilhado — ou qualquer arquivo de `src/models` —, avise a equipe para evitar que duas pessoas editem o mesmo arquivo ao mesmo tempo.

Para reduzir conflitos:

- atualize a `main` antes de criar sua branch;
- use uma branch diferente para cada tela ou tarefa;
- evite misturar alterações de várias telas no mesmo pull request;
- faça commits pequenos e descritivos;
- sincronize sua branch com a `main` antes de abrir o pull request;
- resolva conflitos na sua própria branch, nunca diretamente na `main`.

```bash
git switch feature/nome-da-tela
git fetch origin
git merge origin/main
```

## Estrutura do projeto

O projeto segue **MVC em camadas**. A explicação completa, com as regras de
dependência e o passo a passo para criar uma funcionalidade nova, está em
[ARQUITETURA.md](ARQUITETURA.md) — leia antes do primeiro commit.

```text
src/
├── app/              # ROTEAMENTO — URLs, layouts e páginas finas
├── controllers/      # CONTROLLER — Server Actions e leitura para as páginas
├── models/           # MODEL — entidades, repositórios e regras de negócio
│   ├── entities/
│   ├── repositories/
│   └── services/
├── views/            # VIEW — componentes React de apresentação
└── lib/              # utilitários sem regra de negócio
public/               # arquivos estáticos
```

Resumo da regra: **página chama controller, controller chama service, service
chama repository.** Nunca pule etapas e nunca volte (um service não importa uma
view).

## Identidade visual

Os tokens da paleta estão definidos em `src/app/globals.css`. Prefira os nomes semânticos (`background`, `surface`, `soft`, `border`, `muted`, `foreground` e `accent`) e a escala `primary-50` a `primary-900` nas classes do Tailwind. Há ainda `doacao`, `emprestimo` (com as variantes `-claro`, usadas nos badges dos cartões) e `estrela`. Isso mantém a identidade visual consistente e facilita futuras alterações de tema.
