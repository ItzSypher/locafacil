# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Comandos

```bash
npm run dev      # Vite + middleware que serve api/*.js localmente (ver abaixo)
npm run build    # vite build
npm run lint     # eslint --max-warnings 0 — falha com qualquer warning
npm run preview  # serve o dist/
```

Não há suíte de testes nem test runner no projeto.

`npm run lint` é um portão rígido: warnings contam como erro. Regras desligadas no
`.eslintrc.cjs` por decisão do projeto: `react/prop-types` (não usamos PropTypes) e
`react/jsx-no-target-blank`. Arquivos em `api/**` e `vite.config.js` rodam sob
`env: node` via override.

## Arquitetura

Site institucional da Locafacil (locadora de veículos, RJ) em React 18 + Vite 5 +
Tailwind + framer-motion, **mais** um fluxo de reserva integrado a uma API OTA de
terceiros. Não há backend próprio além das serverless functions de proxy.

### As duas metades do projeto

**Marketing** (`/`, `/para-empresas`, `/contato`): páginas estáticas no padrão
`pages/<Página>/{Index,Header,Content}.jsx`. Toda conversão termina em link do
WhatsApp. Estado compartilhado acontece via `localStorage['locafacil_lead']` +
`window.dispatchEvent(new Event('lead_captured'))` — `WelcomePopup` escreve,
`MicroAgent` e `ExitPopup` escutam. Não existe store nem Context aqui.

**Checkout** (`/reservar/*`): wizard de 5 etapas (busca → veículos → extras →
dados → confirmação) em `src/pages/Reservar/`. Estado entre etapas vive em
`ReservationContext`, espelhado em `sessionStorage['locafacil_reservation']` —
sessionStorage e não localStorage porque guarda PII do condutor e um `quoteId`
que expira. Cada etapa tem guard: sem o estado da etapa anterior, redireciona
para `/reservar`.

`App.jsx` monta o `BrowserRouter` (não `Routes.jsx`) justamente para que
`MarketingPopups` possa usar `useLocation` e sumir dentro de `/reservar/*`, onde
os popups de captação cobriam o checkout.

### Integração com a API OTA (JCompany/SGLOC)

Base: `https://sgloc.apijcompany.com.br`. A spec Swagger completa está em
`/docs/api-docs.json` (a página `/api/documentation` é uma SPA e não serve para
leitura direta).

Cada função em `api/*.js` é um proxy fino para uma operação ReservaOTA, e
`api/_lib/otaClient.js` decide entre API real e fixture:

- **Endpoints públicos** (locais, personalização, antecedência, período mínimo,
  tarifa de acordo) **sempre** batem na API real, sem token.
- **Endpoints autenticados** (disponibilidade, confirmação, consulta,
  cancelamento) exigem token OAuth2 client_credentials. Sem
  `OTA_CLIENT_ID`/`OTA_CLIENT_SECRET` no ambiente, `otaFetch` devolve
  `{ mock: true }` e o handler responde com as fixtures de
  `api/_lib/mockData.js`, que imitam o formato exato da API (`VehAvailRSCore`,
  `ConfID`, etc.). Preencher as credenciais desliga o mock sem tocar em código.

O token é cacheado em variável de módulo e renovado 5 min antes de expirar.
**As credenciais nunca podem chegar ao bundle do cliente** — só existem nas
serverless functions. (`src/components/Global/MicroAgent.jsx:88` tem uma chave
Gemini hardcoded no código do cliente: é o anti-padrão a não repetir, e vale
rotacionar.)

O front nunca chama a API OTA direto; fala só com `/api/*` através de
`src/lib/api/reservation.js`, que normaliza o envelope `{success, data, errors}`
e lança `ReservationApiError` com as mensagens em português vindas da API.

**Estado atual dos dados**: a conta da Locafacil ainda não está provisionada na
API. `get-locais` devolve um único local da JCompany com `iata` vazio, e
`get-personalizacao` devolve a empresa JCOMPANY RENT A CAR. Por isso
`api/locations.js` expõe um campo `code` derivado (`iata || String(id)`) — é ele,
não `iata`, que o front usa como `LocationCode`.

### Rodar as serverless functions localmente

Em produção a Vercel serve `api/*.js` ao lado do build estático (o `vercel.json`
tem só o rewrite de SPA e não precisa mudar). Localmente, `vite dev` sozinho não
executaria essas funções, então `vite.config.js` registra o plugin
`apiDevMiddleware`, que carrega o handler via `ssrLoadModule` e simula
`req.query`/`req.body`/`res.status().json()`. Consequência prática: `npm run dev`
basta para exercitar o fluxo inteiro, sem Vercel CLI. Ao criar um novo
`api/<nome>.js`, ele fica disponível em `/api/<nome>` automaticamente.

Variáveis de ambiente ficam em `.env.local` (coberto por `*.local` no
`.gitignore`) e, em produção, no painel da Vercel: `OTA_BASE_URL`,
`OTA_CLIENT_ID`, `OTA_CLIENT_SECRET`. Nada disso usa prefixo `VITE_`, de
propósito — o prefixo exporia os valores no bundle.

## Convenções visuais

Os tokens estão em `tailwind.config.js` e espelhados como CSS vars em
`src/assets/css/global.css`, que também define as utilities `.glass`,
`.glass-light`, `.glass-dark`, `.text-gradient` e `.bg-hero-gradient`.

Padrões que se repetem e devem ser seguidos em UI nova:

- Botões são sempre `motion.button` com `whileHover={{ scale: 1.05 }}`,
  `whileTap={{ scale: 0.97 }}`, `bg-brand-accent hover:bg-brand-glow`,
  `rounded-full`, `shadow-glow`, `cursor-pointer`.
- Seções entram com `initial="hidden" whileInView="visible"` e variantes locais
  `fadeInUp`/`staggerContainer` — redefinidas por arquivo, não importadas de um
  módulo comum.
- Inputs sobre fundo claro: `bg-slate-50 border border-slate-200 rounded-xl px-4
  py-3 text-sm focus:border-brand-accent focus:ring-1 focus:ring-brand-accent`
  (referência: `WelcomePopup.jsx`). Sobre fundo escuro/glass, a variante em
  `Reservar/SearchWidget.jsx`.
- Ícones são SVG inline (estilo Heroicons); `@iconify-icon/react` só aparece no
  Footer.

`UX_REDESIGN_DOC.md` documenta a intenção por trás do visual atual (gatilhos de
escassez, urgência e autoridade) e traz o checklist de UI/UX usado na entrega:
sem emoji como ícone, `cursor-pointer` em tudo clicável, contraste WCAG AA,
foco visível, `prefers-reduced-motion` respeitado (já implementado em
`global.css`), responsivo em 375/768/1024/1440.

## Skills de design instaladas

`.claude/skills/` traz `impeccable` (comandos de design/UX: `init`, `document`,
`audit`, `adapt`, `critique`, `polish`, entre outros) e `apple-design`
(interações fluidas, springs, gestos). Depois de alterar UI, o impeccable pede
que o detector rode uma vez:

```bash
.claude/skills/impeccable/scripts/impeccable detect --json <arquivos alterados>
```

## Fora do escopo do build

`ui-ux-pro-max-skill/` é um checkout de plugin com `.git` próprio, ignorado pelo
git e não incluído no bundle (o Vite só empacota a partir de `src/` e
`index.html`).

A API OTA não tem nenhum endpoint de pagamento: o checkout termina em "reserva
confirmada" com o `ConfID`, modelo de pagamento no balcão. Não inventar
integração de pagamento.
