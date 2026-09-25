# Textos prontos para enviar

Os textos não moram aqui. Eles moram em
[`src/content/documentacao.js`](../src/content/documentacao.js), no array
`TEXTOS`, e aparecem na página interna do marketing com um botão de copiar ao
lado de cada um:

**`/doc/marketing` → seção “Textos prontos para enviar”**

O motivo é prático: texto que se copia da tela não pode ter uma segunda cópia
num arquivo de documentação. Uma das duas envelhece, e é sempre a antiga que
alguém manda.

## O que existe hoje

| Canal | Para quem | Quando |
|---|---|---|
| E-mail | Cliente e time de marketing | Abre a homologação. É o principal. |
| E-mail | Time de desenvolvimento da JCompany | Destrava os dados reais. Mande primeiro: é a resposta mais demorada. |
| WhatsApp | Cliente — apresentação | Primeiro contato, junto com o link. |
| WhatsApp | Cliente — os três itens que dependem dele | Depois da apresentação, para destravar a publicação. |
| WhatsApp | Time de marketing | Junto com o link da página de marketing. |
| WhatsApp | Contato na JCompany | Empurrão depois do e-mail. |

## Para editar

Abra `src/content/documentacao.js` e mexa no `TEXTOS`. Cada item tem `canal`,
`titulo`, `quando`, `corpo` e — nos e-mails — `assunto`. A página acompanha
sozinha, e o PDF também, porque ele é impresso da própria página.

## Antes de mandar

- Gere os PDFs com o visual de agora: `node scripts/print-telas.mjs`,
  `node scripts/telas-doc.mjs`, `node scripts/gerar-pdf.mjs`.
- Confira o endereço. Se o domínio próprio já estiver apontado, troque
  `locafacil-nine.vercel.app` por ele nos textos e em `SITE.url`.
- **Nunca mande credencial por e-mail ou WhatsApp.** Quando a JCompany
  responder com `client_id` e `client_secret`, peça por um canal que permita
  apagar depois, e cadastre direto no painel da Vercel — nada de colar em
  conversa, em issue ou em arquivo do projeto.
