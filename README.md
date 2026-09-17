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

## Simulação de pagamento

O pagamento de empréstimos e a assinatura mensal **Ciclo Membro** usam o
Stripe Checkout exclusivamente em modo de teste. A assinatura libera 3, 8 ou
20 cupons por ciclo, conforme o plano; cada cupom impulsiona um anúncio por 7
dias. Assinantes também podem comprar pacotes extras de 1, 2 ou 5 cupons; esses
cupons avulsos não expiram. Depois de aplicar as migrations do Supabase,
configure no `.env.local`:

```env
SUPABASE_SERVICE_ROLE_KEY=sua_chave_service_role
STRIPE_SECRET_KEY=sk_test_sua_chave
STRIPE_WEBHOOK_SECRET=whsec_seu_segredo
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

A `SUPABASE_SERVICE_ROLE_KEY` é usada somente no servidor para receber eventos
do Stripe. Nunca exponha essa chave no navegador ou faça commit do `.env.local`.

Para testar webhooks localmente com o Stripe CLI:

```bash
stripe listen --forward-to localhost:3000/api/pagamentos/webhook
```

Copie o segredo `whsec_...` exibido pelo comando para o `.env.local`. O mesmo
webhook confirma pagamentos de empréstimos, sincroniza assinaturas e credita os
cupons após cada fatura mensal paga. Na tela de um empréstimo aceito ou na opção
**Impulsionar** de um anúncio, use somente os dados de teste disponibilizados
pelo Stripe. Nenhum cartão real deve ser usado.

No Dashboard do Stripe, o endpoint `/api/pagamentos/webhook` deve receber pelo
menos os eventos `checkout.session.completed`, `invoice.paid`,
`invoice.payment_failed`, `customer.subscription.updated` e
`customer.subscription.deleted`, além de
`checkout.session.async_payment_succeeded` e
`checkout.session.async_payment_failed` para compras avulsas via Pix.

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
