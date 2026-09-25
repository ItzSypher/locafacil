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
WhatsApp, com a frase já escrita. Não existe store nem Context aqui.

Há **um** popup, e só um: `DescontoPopup` oferece o desconto de primeira
locação e manda para o WhatsApp. O de saída (disparado quando o ponteiro
deixava a janela pelo topo) foi removido — dois convites na mesma visita é um a
mais do que a página aguenta. O formulário de captação de nome e e-mail também
saiu: pedia dois campos para mandar a pessoa ao WhatsApp de qualquer jeito.

**Checkout** (`/reservar/*`): busca → veículos → opcionais → dados → **revisão**
→ confirmação, em `src/pages/Reservar/`. O `StepProgress` conta quatro etapas
(veículos, opcionais, dados, revisão); busca e confirmação ficam fora dele.

**A reserva nasce em `/reservar/revisao`**, não antes. As etapas de opcionais e
de dados só guardam estado; `POST /api/reservation-confirm` sai de um único
lugar, atrás do aceite dos termos e de um `useRef` que barra o envio duplo. É o
único efeito irreversível do fluxo.

Não há tela de consulta de reserva. Ela existiu e saiu: a reserva não é
consultada no site — quem precisa alterar ou cancelar fala com a loja, e a
tela de confirmação já manda o localizador junto na mensagem do WhatsApp. Os
proxies `api/reservation-lookup.js` e `api/reservation-cancel.js` seguem no
lugar, sem chamador no front.

Estado entre etapas vive em `ReservationContext`, espelhado em
`sessionStorage['locafacil_reservation']` — sessionStorage e não localStorage
porque guarda PII do condutor e um `quoteId` que expira. Cada etapa tem guard:
sem o estado da etapa anterior, redireciona para `/reservar`. O
`ReservationProvider` envolve só `/reservar/*`; como o `SearchWidget` também
vive no hero da Home, ele usa `useOptionalReservation()`, que degrada para
no-op fora do provider.

`App.jsx` monta o `BrowserRouter` (não `Routes.jsx`) justamente para que
`MarketingPopups` possa usar `useLocation` e sumir dentro de `/reservar/*`, onde
os popups de captação cobriam o checkout.

### Documentação interna (`/doc/cliente`, `/doc/marketing`)

Duas páginas fora do menu e fora do índice das buscas, feitas para mandar por
link: a do cliente (estado, homologação, fluxo de reserva, pendências) e a do
marketing (telas, marca, frases do atendimento, textos prontos).

**O conteúdo das duas é um arquivo só**: `src/content/documentacao.js`. Editar
ali muda as páginas, os dois PDFs e os textos de envio de uma vez. Os assuntos
do WhatsApp moram em `src/config/atendimento.js` e são lidos tanto pelo botão
flutuante quanto pela página do marketing — a mesma frase, nunca uma cópia.

O roteiro de homologação é marcável e aceita observação por passo, com o nome
de quem responde. **Tudo é salvo sozinho no servidor**: `POST /api/retornos`,
com espera de 1,2 s depois da última alteração, grava um arquivo por pessoa e
por página no Vercel Blob privado `locafacil-retornos`
(`retornos/<publico>/<id>.json`, sobrescrito a cada salvamento). O `id` é um
UUID guardado no navegador, então quem volta no dia seguinte continua o mesmo
retorno. `localStorage` guarda uma cópia local, para a pessoa retomar e para
nada se perder se um salvamento falhar.

O botão "Enviar retorno pelo WhatsApp" abre a conversa **sem número fixo** — o
WhatsApp mostra a lista de contatos e a pessoa escolhe a equipe do projeto.

Os retornos aparecem em **`/doc/retornos`**, que pede a senha de
`DOC_RETORNOS_SENHA` (variável *sensitive* na Vercel; troca-se lá, vale no
próximo deploy). `GET /api/retornos` compara a senha em tempo constante e lê
com `useCache: false`, porque o arquivo é sobrescrito. O endpoint é aberto para
escrita — a página é pública para quem tiver o link — e por isso valida forma e
tamanho de tudo o que recebe. Sem `BLOB_READ_WRITE_TOKEN` (rodando local), o
`POST` responde `salvo: false` e a página diz "Salvo neste navegador".

Cada página põe e tira o próprio `<meta name="robots" content="noindex">` — o
projeto não usa biblioteca de `<head>`, e um `noindex` esquecido derrubaria a
home do Google. `public/robots.txt` é a segunda tranca.

**Os PDFs são impressos dessas rotas**, não de um HTML paralelo (já foi assim,
e as duas cópias divergiram). `?impressao=1` abre o que estaria recolhido e
troca a galeria por um bloco de papel; o resto do enfeite some pelas variantes
`print:` do Tailwind. `scripts/gerar-pdf.mjs` grava em `public/doc/`, junto com
as telas reduzidas de `scripts/telas-doc.mjs` — **saída versionada de
propósito**, porque a Vercel publica o repositório e `prints/` está ignorado.

`?print=1` é outra bandeira, de `src/lib/modoPrint.js`: cala preloader, popups
e **o andaime de desenvolvimento**. Sem ela as capturas saíam com a tarja de
dados falsos e o seletor de cenário — e essas imagens vão para o cliente.

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

### Atendimento pelo WhatsApp

`src/components/Global/FaleConosco.jsx` é o botão flutuante: seis assuntos
escritos, cada um abrindo o WhatsApp com a frase já na caixa de texto.

Isto já foi um chat por IA (`MicroAgent` + `api/agent-chat.js`, proxy do
Gemini). Saiu: a conversa terminava sempre em "me chama no WhatsApp", e no
caminho custava uma chave de API para manter e rotacionar. **O projeto não tem
mais nenhuma chave de IA, e não deve ganhar uma de volta sem pedido explícito.**

Assunto novo entra no array `ASSUNTOS`, com `rotulo` (curto, cabe no botão),
`detalhe` (uma linha) e `frase` (o texto que vai para o WhatsApp, completo o
bastante para a pessoa do outro lado entender de primeira).

O front nunca chama a API OTA direto; fala só com `/api/*` através de
`src/lib/api/reservation.js`, que normaliza o envelope `{success, data, errors}`
e lança `ReservationApiError` com as mensagens em português vindas da API.

**Estado atual dos dados**: a conta da Locafacil ainda não está provisionada na
API. Os endpoints públicos respondem, mas **pelo tenant de demonstração da
JCompany** — `get-locais` devolve uma loja que não é nossa e
`get-personalizacao` devolve JCOMPANY RENT A CAR. Por isso `locations`,
`minimum-notice` e `minimum-period` só consultam a API real **quando há
credenciais**; sem elas usam as fixtures da Locafacil e marcam `demo: true`.
`api/locations.js` expõe um campo `code` derivado (`iata || String(id)`) — é ele,
não `iata`, que o front usa como `LocationCode`.

### Normalização da resposta OTA

`api/_lib/otaNormalize.js` é o único lugar que conhece o formato OTA. Todo
handler devolve `{ success, data: <normalizado>, errors, demo }` e nenhum
componente toca em `VehVendorAvails`/`VehAvailCore`/`PricedCoverage`.

A API mistura tipos e às vezes erra o encoding, então o normalizador existe para
apagar três problemas de uma vez: `toNumber` aceita `"1.234,56"`, `"0.00"` e
number; `toBool` traduz `"true"`; e `fixText` repara mojibake e acento perdido
(o próprio portal da JCompany faz o mesmo remendo em
`js/verificar-disponibilidade.js`). **Todo campo textual vindo da API passa por
`fixText`.**

`normalizeAvailability` achata os três níveis de aninhamento numa lista de
`offers[]` com `id` estável, e guarda o `raw` de cada oferta — é dele que
`buildConfirmPayload` remonta o envelope de confirmação.

### Imagem do veículo

A API não devolve mídia. `src/config/vehiclePhotos.js` mapeia código do grupo →
foto, e `VehicleImage` decide: grupo com foto mostra a foto, grupo sem foto cai
na ilustração de `VehicleArt`. As telas falam só com o `VehicleImage`.

As fotos são normalizadas por `node scripts/converter-veiculos.mjs`, que lê os
PNG de `public/__tmp-veiculos/<CODIGO>.png`, recorta a moldura vazia e grava
800×600 em webp. Sem isso cada foto chegava numa proporção (623×401, 667×374,
1100×628) e a grade dançava de linha em linha.

**O recorte respeita o alfa que o arquivo já traz.** Limiar de branco só entra
quando as quatro quinas são opacas: num carro branco sobre fundo branco, o
limiar entra pela lataria e fura o teto e o capô.

A legenda diz o porte e "imagem ilustrativa" — a reserva é por grupo, e nem
foto da frota garante o modelo que estará no pátio.

### Horário de funcionamento

**A API não expõe horário de loja em endpoint nenhum** (o spec inteiro foi
varrido). A validação só existe no servidor da JCompany, que recusa a busca
depois do submit. `api/_lib/storeHours.js` é a fonte única da grade no nosso
lado, servida por `GET /api/store-hours?LocationCode=` para que mudar o horário
seja editar um objeto, sem rebuild.

Grade confirmada para a loja 26015 sondando o SGLOC em 2026-09-23: segunda a
sexta 08:00–17:30, sábado 08:00–12:00, domingo fechado, **48h de antecedência
mínima**. A validação vale para retirada **e** devolução. Loja fora do mapa
devolve `known: false`, e aí o front libera a grade inteira e deixa a API
validar — nunca barrar uma loja nova por desconhecimento nosso.

### Cenários de teste

Fora de produção, `/api/availability?cenario=` troca a fixture: `ok`,
`um-carro`, `com-opcionais`, `vazio`, `erro-422`, `lento`, `mojibake`,
`expirado`. O seletor aparece no `SearchWidget` sob `import.meta.env.DEV`. As
fixtures imitam o descuido de tipos da API real de propósito — um mock mais
limpo que o real esconde bug de conversão.

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
- **Camada em `position: fixed` não mora dentro de um `motion.*`.** O
  framer-motion deixa `will-change: transform` no elemento animado, e
  `.glass-dark` traz `backdrop-filter` — qualquer um dos dois transforma o
  ancestral em bloco de contenção, e aí `inset-0` do filho mede a caixa dele em
  vez da janela. Foi assim que o menu de toque abriu com 2px de altura dentro do
  `<header>`. Camada que cobre a página vai por `createPortal` no `body`
  (referência: `components/Topbar/Index.jsx`).
- **O corte da navegação é `lg` (1024px), não `md`.** A 768px os cinco rótulos
  e o botão não cabem na linha e quebram em duas e três linhas.
- **Camada sobre a página é diálogo**, e passa pelo `src/hooks/useDialog.js`:
  `role="dialog"`, `aria-modal`, `aria-labelledby`, Escape, foco preso e
  devolvido, rolagem travada por contador. **O `open` passado ao hook tem de
  ser a mesma condição que renderiza o painel** — quando não era, um diálogo
  que não estava na tela travou a rolagem do site inteiro.
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

### Andaime temporário

`src/components/DevSeed/Index.jsx` preenche o checkout inteiro com dados falsos
num clique (busca válida pela grade da loja, primeiro grupo devolvido, primeira
proteção, condutor fictício com CPF de dígito válido) e cai direto em
`/reservar/revisao`. Existe só para exercitar a infraestrutura sem redigitar
quatro telas a cada recarga.

Devolve `null` fora de `import.meta.env.DEV` e some do `dist/` no build. **Para
remover: apagar a pasta e a linha `<DevSeed />` em `src/Routes.jsx`** — as duas
estão marcadas com o mesmo aviso.

## Fora do escopo do build

`ui-ux-pro-max-skill/` é um checkout de plugin com `.git` próprio, ignorado pelo
git e não incluído no bundle (o Vite só empacota a partir de `src/` e
`index.html`).

A aba ReservaOTA não tem nenhum endpoint de pagamento: o checkout termina em
"reserva confirmada" com o `ConfID`, modelo de pagamento no balcão. **Não
inventar integração de pagamento.**

Existe um caminho de boleto na API, mas fora da ReservaOTA: `POST
/reservas/criar` com `gerar_boleto=true` (contas PJBANK, ASAAS ou Banco do
Brasil) na tag `Reserva`. É outra autenticação, outro contrato comercial e
trabalha com `local_retirada` como id interno, não com `LocationCode`. Fica
registrado como a costura existente — implementar só depois de fechado com a
JCompany, nunca por iniciativa própria.
