# Locafacil — site institucional e fluxo de reserva

Site da Locafacil Aluguel de Veículos (Nova Iguaçu, RJ): as páginas
institucionais **mais** um fluxo de reserva completo, integrado à API OTA da
JCompany/SGLOC. Sem backend próprio — só funções serverless de proxy, para que
credencial nenhuma chegue ao navegador.

React 18 · Vite 5 · Tailwind · framer-motion · funções serverless na Vercel

---

## Rodando

```bash
npm install
cp .env.example .env.local   # opcional: sem credenciais o site roda com fixtures
npm run dev
```

`npm run dev` basta para exercitar **o fluxo inteiro**, inclusive as funções de
`api/`. Não é preciso a CLI da Vercel: o `vite.config.js` registra um plugin
que carrega cada handler via `ssrLoadModule` e simula `req.query`, `req.body` e
`res.status().json()`. Criar um `api/<nome>.js` novo o publica em `/api/<nome>`
automaticamente.

| Comando | O que faz |
|---|---|
| `npm run dev` | Vite + as funções de `api/` |
| `npm run build` | Build de produção |
| `npm run lint` | ESLint com `--max-warnings 0` (warning reprova) |
| `npm run preview` | Serve o `dist/` |
| `node scripts/print-telas.mjs` | Gera os prints das telas em `prints/` |

Não há suíte de testes: a verificação é feita no navegador, tela a tela.

---

## Como o projeto se divide

**Marketing** — `/`, `/para-empresas`, `/contato`. Páginas estáticas, toda
conversão terminando em WhatsApp. O estado compartilhado é um `localStorage`
com evento de janela; não há store nem Context aqui.

**Checkout** — `/reservar/*`, em seis telas:

```
busca → veículos → opcionais → dados → revisão → confirmação
```

A reserva **nasce em `/reservar/revisao`**, não antes. As etapas de opcionais e
de dados só guardam estado; `POST /api/reservation-confirm` sai de um único
lugar, atrás do aceite dos termos e de um `useRef` que barra o envio duplo. É o
único efeito irreversível do fluxo, e por isso tem um dono só.

`/reservar/consultar` fica fora do funil: consulta por localizador e sobrenome,
com cancelamento atrás de um diálogo de confirmação.

O estado entre etapas vive num Context espelhado em `sessionStorage` — e não
`localStorage`, porque guarda dados pessoais do condutor e um orçamento que
expira. Cada etapa tem guarda: sem o estado da etapa anterior, volta para a
busca.

---

## Decisões que valem explicar

**Toda a resposta da API passa por um normalizador.** `api/_lib/otaNormalize.js`
é o único arquivo que conhece o formato OpenTravel. A API mistura tipos e às
vezes erra o encoding, então o normalizador apaga três problemas de uma vez:
`toNumber` aceita `"1.234,56"`, `"0.00"` e number; `toBool` traduz `"true"`; e
`fixText` repara mojibake e acento perdido. Nenhum componente toca em
`VehVendorAvails` ou `VehAvailCore`.

**O horário de funcionamento não existe na API.** O spec inteiro foi varrido: a
validação só mora no servidor da JCompany, que recusa a busca depois do submit.
`api/_lib/storeHours.js` é a fonte única da grade do nosso lado, servida por
`GET /api/store-hours` para que mudar horário seja editar um objeto, sem
rebuild. A grade atual foi levantada sondando o próprio sistema, que devolve o
horário dentro da mensagem de erro. Loja fora do mapa devolve `known: false`, e
aí o front libera a grade inteira e deixa a API validar — nunca barrar uma loja
nova por desconhecimento nosso.

**As fixtures imitam o descuido da API de propósito.** Onde a API manda string,
o mock manda string. Um mock mais limpo que o real esconde bug de conversão.
Fora de produção, `/api/availability?cenario=` troca o cenário: `vazio`,
`erro-422`, `lento`, `mojibake`, `expirado`, entre outros.

**As credenciais nunca chegam ao bundle.** Nenhuma variável usa prefixo
`VITE_`. Os endpoints autenticados passam por token OAuth2 guardado em variável
de módulo na função serverless, renovado cinco minutos antes de expirar. Sem
credenciais, o proxy cai nas fixtures e marca `demo: true`: o site funciona
inteiro, com dados de exemplo.

**Camada que cobre a página é diálogo.** Um popup que só aparece não é diálogo:
quem navega por teclado continua tabulando atrás dele. Os quatro — boas-vindas,
saída, assistente e menu de toque — passam pelo mesmo `useDialog`, com foco
preso, Escape, rolagem travada por contador e foco devolvido ao fechar.

**Tipografia por papel, não por valor.** A família é a Archivo variável, e os
tamanhos moram em sete classes (`.type-display` a `.type-label`). Ninguém monta
tamanho + peso + tracking à mão. `DESIGN.md` é a referência completa.

---

## Documentação

| Arquivo | Para quem |
|---|---|
| [`DESIGN.md`](DESIGN.md) | Sistema visual: tokens, papéis tipográficos, regras nomeadas |
| [`CLAUDE.md`](CLAUDE.md) | Convenções e arquitetura, para quem for mexer no código |
| [`docs/API-JCOMPANY.md`](docs/API-JCOMPANY.md) | O que a API entrega, o que falta e o que pedir ao time deles |
| [`docs/OPERACAO.md`](docs/OPERACAO.md) | O que marketing e infraestrutura precisam resolver |
| `/doc/cliente` e `/doc/marketing` | Páginas internas de apresentação e homologação, fora do menu e do índice das buscas |
| [`src/content/documentacao.js`](src/content/documentacao.js) | O conteúdo dessas páginas, dos PDFs e dos textos de envio — uma fonte só |
| [`docs/COMUNICACAO.md`](docs/COMUNICACAO.md) | Onde ficam os e-mails e as mensagens de WhatsApp prontos |

---

## Deploy

A Vercel serve `api/*.js` ao lado do build estático; o `vercel.json` tem só o
rewrite de SPA. Cadastre no painel as variáveis de `.env.example`.

```
Framework Preset:  Vite
Build Command:     npm run build
Output Directory:  dist
```

---

## Estrutura

```
api/                  Funções serverless (proxy da API OTA + assistente)
  _lib/               Cliente OAuth, normalizador, fixtures, horários
src/
  components/         Topbar, Footer, popups, assistente
  pages/
    Home/ Empresas/ Contato/     Marketing
    Reservar/                    Checkout, uma pasta por etapa
  context/            Estado do checkout
  hooks/              useDialog
  lib/api/            Cliente HTTP das funções de api/
  assets/brand/       Logotipos do manual de identidade
scripts/              Gerador de prints das telas
```
