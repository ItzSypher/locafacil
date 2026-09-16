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
serverless functions.

### Assistente Locagora

`api/agent-chat.js` é o proxy do Gemini: prompt de sistema, chave e recorte do
histórico ficam no servidor, e o `MicroAgent` só chama `/api/agent-chat`. Sem
`GEMINI_API_KEY` no ambiente o endpoint responde 200 com `unavailable: true` e o
texto de saída para o WhatsApp — o assistente degrada, não quebra.

**A chave anterior estava hardcoded no cliente e foi publicada no bundle. Ela
precisa ser rotacionada no Google AI Studio**; a chave nova vai em `.env.local`
e no painel da Vercel, nunca no código.

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
`.glass-light`, `.glass-dark` e `.bg-hero-gradient`. `DESIGN.md` é a referência
completa do sistema; o sidecar legível por máquina fica em
`.impeccable/design.json`.

**Tipografia.** A família é a Archivo variável (eixos `wght` 400–800 e `wdth`
100–112), carregada num único `<link>` no `index.html`, com um `@font-face`
`Archivo Fallback` (`size-adjust: 104%`) que evita o pulo de layout durante o
carregamento. Não montar tamanho + peso + tracking à mão: usar os papéis
definidos em `global.css` — `.type-display`, `.type-headline`, `.type-title`,
`.type-subtitle`, `.type-body`, `.type-meta`, `.type-label`. Dois modificadores
acumulam com eles:

- `.type-numeric` — obrigatório em preço, total, número de reserva, data, hora,
  telefone, CPF e número de etapa. Sem ele, o total muda de largura a cada
  recálculo.
- `.on-light` — em qualquer superfície clara (card branco, seção `bg-white` ou
  `bg-surface-light`). Zera a compensação óptica que o fundo escuro exige.

Valor em reais nunca é string solta: sempre `src/pages/Reservar/Price.jsx`, que
separa símbolo, inteiro, centavos e unidade.

Padrões que se repetem e devem ser seguidos em UI nova:

- Botões são `motion.button` com `whileHover` entre 1.01 e 1.03,
  `whileTap={{ scale: 0.97 }}`, `bg-brand-accent hover:bg-brand-glow`,
  `rounded-xl`, `cursor-pointer`. Não existe token de glow no projeto —
  profundidade vem de vidro e borda.
- Rótulo de botão em caixa de frase ("Garantir meu carro agora"), nomeando a
  ação inteira.
- Seções entram com `initial="hidden" whileInView="visible"` e variantes locais
  `fadeInUp`/`staggerContainer` — redefinidas por arquivo, não importadas de um
  módulo comum. O container de stagger nunca usa `opacity: 0`, só orquestra os
  filhos.
- Inputs sobre fundo claro: `bg-surface-light border border-line rounded-xl px-4
  py-3 text-sm focus:border-brand-accent focus:ring-1 focus:ring-brand-accent`
  (referência: `WelcomePopup.jsx`). Sobre fundo escuro/glass, a variante em
  `Reservar/SearchWidget.jsx`.
- **Cor crua do Tailwind não entra.** As superfícies e estados do lado claro têm
  token: `surface-light`, `surface-muted`, `surface-sunken`, `line`, `line-soft`,
  `state-error`, `state-error-soft`, `state-error-line`, `state-error-dark`,
  `state-success-soft`, `brand-whatsapp`. Nada de `slate-*`, `red-*`, `green-*`
  nem hex solto no JSX.
- **Alvo de toque de 44px** em todo controle, crescendo o padding e não o
  desenho (`py-3 -my-1` num link de lista dá o alvo sem abrir o espaçamento).
- **Camada sobre a página é diálogo**, e passa pelo `src/hooks/useDialog.js`:
  `role="dialog"`, `aria-modal`, `aria-labelledby`, Escape, foco preso e
  devolvido, rolagem travada por contador. Os três popups usam o mesmo hook.
- **Movimento infinito** (flutuação de hero, autoplay de carrossel) é desligado
  por `useReducedMotion` do framer-motion — a regra `@media
  (prefers-reduced-motion)` do `global.css` só alcança CSS, e ela encurta
  transições para 120ms em vez de matá-las.
- **Lista de argumentos** usa `components/Global/ReasonList.jsx` (fio de 1px,
  sem cartão, sem número). Cartão só para o que se arrasta ou se compara.
- Imagem abaixo da dobra: `loading="lazy"`, `decoding="async"` e `width`/`height`
  reais do arquivo.
- Ícones são SVG inline (estilo Heroicons); `@iconify-icon/react` só aparece no
  Footer.

### Carregamento

`src/Routes.jsx` divide por rota: só a Home vem no pacote inicial, o resto é
`React.lazy`. Dentro da Home, o `Content` (que carrega o Swiper inteiro) também
é adiado, então o hero pinta sem esperar por ele. `vite.config.js` separa
`react`, `framer-motion` e `swiper` em chunks próprios para sobreviverem no
cache entre deploys. Primeiro carregamento da Home: 349 kB (116 kB gzip).

`UX_REDESIGN_DOC.md` documenta a intenção por trás do visual atual (gatilhos de
escassez, urgência e autoridade). O checklist de UI/UX daquele documento está
desatualizado em alguns pontos; `DESIGN.md` é a referência corrente.

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
