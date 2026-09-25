# Operação — o que falta de marketing e de infraestrutura

Lista do que o site precisa de fora do código para ir ao ar completo. Cada item
diz quem resolve, por que importa e o que acontece enquanto não for resolvido.

---

## Infraestrutura

### 1. Revogar a chave antiga do Google AI Studio — **urgente**

**Quem:** quem administra a conta Google.

O site **não usa mais nenhuma chave de IA**. O chat da Locagora foi substituído
por um atalho de WhatsApp com frases prontas, e `api/agent-chat.js` foi
removido do projeto. Não há o que cadastrar.

Mas a chave antiga precisa ser **revogada assim mesmo**. Ela esteve publicada
no bundle de produção, visível para qualquer visitante que abrisse o inspetor,
e também aparecia no histórico do Git — o histórico foi reescrito e o
repositório está limpo, mas **isso não desfaz a exposição anterior**. Enquanto
a chave existir no Google AI Studio, ela é cobrável por quem a copiou.

Entre no Google AI Studio e apague a chave. Não precisa gerar outra.

### 2. Credenciais da API de reservas

**Quem:** time de desenvolvimento da JCompany.

É o único item que separa o site de dados reais. Detalhes e mensagem pronta em
[`API-JCOMPANY.md`](API-JCOMPANY.md).

Enquanto não chegarem, o fluxo inteiro funciona com dados de exemplo e as
respostas vêm marcadas com `demo: true`. Dá para demonstrar o site ponta a
ponta; não dá para receber reserva de verdade.

### 3. Variáveis de ambiente na Vercel

**Quem:** quem administra o projeto na Vercel.

Cadastrar as chaves de [`.env.example`](../.env.example): `OTA_BASE_URL`,
`OTA_CLIENT_ID` e `OTA_CLIENT_SECRET`. São as três únicas do projeto.

Nenhuma usa prefixo `VITE_`, de propósito: o prefixo publicaria o valor no
bundle do cliente.

### 4. Domínio e e-mail

**Quem:** quem administra o domínio.

- Apontar o domínio da Locafacil para a Vercel
- Conferir se `gerencia@locafacilaluguel.com` (usado no rodapé) está ativo

### 5. Remover o andaime de desenvolvimento antes da entrega final

**Quem:** desenvolvimento.

`src/components/DevSeed/` preenche o checkout com dados falsos num clique, para
testar sem redigitar quatro telas. Já está travado por `import.meta.env.DEV` e
**não entra no bundle de produção** — mas some da base quando não for mais
necessário: apagar a pasta e a linha `<DevSeed />` em `src/Routes.jsx`.

---

## Conteúdo e marketing

### 6. Fotos da frota — **opcional, já resolvido**

**Quem:** marketing, se quiser melhorar.

A API não devolve imagem de veículo, e a reserva é por **grupo**, não por
modelo. Cada grupo já tem foto do modelo que a própria descrição da API cita:

| Grupo | Foto | O que a API diz |
|---|---|---|
| B | Kwid | "Econômico 1.0 com Ar e Direção - Kwid ou similar" |
| C | Mobi | "…Mobi ou similar" |
| D | Argo | "Hatch 1.0 completo - Argo ou similar" |
| D PLUS | Pulse | "Hatch 1.0 turbo automático - Pulse ou similar" |
| E | Cronos | "Sedan 1.3 completo - Cronos ou similar" |
| G | Pulse | "SUV compacto 1.0 turbo - Pulse ou similar" |
| G PLUS | Fastback | "…Fastback ou similar" |

D PLUS e G repetem o Pulse de propósito: as duas descrições dizem Pulse.

Fotos da frota real vendem mais que foto de catálogo. Se vierem, mande em PNG,
três quartos, fundo claro — o caminho de troca está em
[`src/config/vehiclePhotos.js`](../src/config/vehiclePhotos.js) e leva um
comando.

### 7. Termos de uso e cláusulas contratuais

**Quem:** marketing/jurídico, junto com a JCompany.

O checkout exibe "Li e aceito os termos e as cláusulas contratuais" e precisa
apontar para os documentos. A API devolve esses campos vazios. Duas saídas:
pedir que a JCompany preencha, ou hospedar os textos no próprio site.

Enquanto não houver URL, o texto aparece legível mas sem link — melhor do que um
link morto, e ainda assim precisa ser resolvido antes de entrar no ar.

### 8. Confirmar o horário de funcionamento

**Quem:** operação da loja.

A grade em `api/_lib/storeHours.js` é **seg–sex 08:00–17:30, sábado
08:00–12:00, domingo fechado, 48h de antecedência mínima**. Ela não foi
inventada: é a grade que o sistema da JCompany aceita hoje, levantada sondando
as duas pontas (retirada e devolução).

Se a operação mudou, quem precisa ser atualizado primeiro é **o cadastro no
SGLOC**. Enquanto o cadastro lá disser outra coisa, a API recusa a busca por
mais que o site prometa.

### 9. Números de prova social

**Quem:** marketing.

O site exibia "Nota 4,9" e "+5.000 clientes" sem fonte. Foram removidos: número
sem origem custa mais confiança do que compra.

Se a Locafacil quiser usá-los, precisamos da origem — avaliações do Google,
número interno de locações — para citar junto. Com fonte, voltam.

### 10. Revisar as frases do atendimento

**Quem:** marketing.

O botão flutuante oferece seis assuntos, e cada um abre o WhatsApp com a
mensagem já escrita. As frases vivem no array `ASSUNTOS`, em
`src/components/Global/FaleConosco.jsx`. Valem uma leitura de quem cuida da voz
da marca — é literalmente o texto que o cliente vai mandar.

Os seis assuntos de hoje: alugar um carro, assinatura mensal, frota para
empresa, documentos necessários, dúvida sobre reserva existente, outro assunto.

---

## Prints para material de campanha

```bash
npm run dev                      # num terminal
node scripts/print-telas.mjs     # noutro
```

Gera 16 imagens em `prints/`: dobra e página inteira, em 2×, em desktop (1440) e
celular (390), das quatro telas públicas. A pasta é ignorada pelo Git — é
artefato, não fonte. Rode de novo sempre que o visual mudar.

---

## Páginas de documentação e PDF

Duas páginas internas, fora do menu e fora das buscas:

| Endereço | Para quem |
|---|---|
| `/doc/cliente` | Cliente e operação: estado, roteiro de homologação, fluxo de reserva, o que falta |
| `/doc/marketing` | Marketing: telas em alta, cores, frases do atendimento, textos prontos |
| `/doc/retornos` | Quem conduz o projeto: os retornos salvos de todo mundo. Pede senha |

Nas duas, o roteiro de homologação é marcável e aceita observação por passo —
tudo salvo sozinho no Vercel Blob `locafacil-retornos`, e um botão manda o
retorno também pelo WhatsApp. Os retornos de todo mundo ficam em
**`/doc/retornos`**, com a senha da variável `DOC_RETORNOS_SENHA` na Vercel.

O conteúdo das duas vive em
[`src/content/documentacao.js`](../src/content/documentacao.js). Editar ali
muda a página, o PDF e os textos de envio de uma vez.

Para refazer os arquivos que elas servem:

```bash
npm run dev                      # num terminal
node scripts/print-telas.mjs     # se o visual mudou
node scripts/telas-doc.mjs       # telas reduzidas + arquivos de marca
node scripts/gerar-pdf.mjs       # os dois PDFs
```

`telas-doc.mjs` grava em `public/doc/telas/` e `public/doc/marca/`;
`gerar-pdf.mjs` imprime as próprias rotas `/doc/*` e grava
`public/doc/Locafacil-Apresentacao-Cliente.pdf` e `-Marketing.pdf`, cerca de
1,3 MB cada. **Essa saída é versionada de propósito** — a Vercel publica o que
está no repositório, e `prints/` não está.

Os textos de e-mail e de WhatsApp aparecem na página do marketing com botão de
copiar. Detalhes em [`COMUNICACAO.md`](COMUNICACAO.md).

---

## Cores da marca, para quem produz arte

Do Manual de Identidade Visual (fev/2025):

| Cor | Hex | Onde usar |
|---|---|---|
| Azul da marca | `#0628DA` | Logotipo e superfícies de marca |
| Verde | `#2AE82A` | Só dentro da marca. **Nunca carrega texto** — dá ~1,6:1 sobre branco |
| Cinza | `#939598` | Apoio |
| Grafite | `#424245` | Apoio |

O site usa um segundo azul, `#2563EB`, para tudo que é clicável. Os dois não se
misturam: o azul do manual identifica a marca, o azul de interface sinaliza
ação. Detalhes em [`DESIGN.md`](../DESIGN.md).

Tipografia: **Archivo** (variável, pesos 400–800).
