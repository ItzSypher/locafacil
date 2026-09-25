# Operação — o que falta de marketing e de infraestrutura

Lista do que o site precisa de fora do código para ir ao ar completo. Cada item
diz quem resolve, por que importa e o que acontece enquanto não for resolvido.

---

## Infraestrutura

### 1. Rotacionar a chave do Google AI Studio — **urgente**

**Quem:** quem administra a conta Google.

A chave que alimentava o assistente Locagora esteve publicada no bundle de
produção, visível para qualquer visitante que abrisse o inspetor. Ela também
estava no histórico do Git — o histórico foi reescrito e hoje o repositório está
limpo, mas **isso não desfaz a exposição anterior**.

Revogue a chave atual no Google AI Studio e gere outra. A nova vai em
`.env.local` e no painel da Vercel como `GEMINI_API_KEY`, nunca no código.

> Se a Locafacil não quiser manter o assistente por IA, a saída mais simples é
> não cadastrar chave nenhuma: o endpoint responde `unavailable: true` e a
> conversa é encaminhada para o WhatsApp. O site não quebra.

### 2. Credenciais da API de reservas

**Quem:** time de desenvolvimento da JCompany.

É o único item que separa o site de dados reais. Detalhes e mensagem pronta em
[`API-JCOMPANY.md`](API-JCOMPANY.md).

Enquanto não chegarem, o fluxo inteiro funciona com dados de exemplo e as
respostas vêm marcadas com `demo: true`. Dá para demonstrar o site ponta a
ponta; não dá para receber reserva de verdade.

### 3. Variáveis de ambiente na Vercel

**Quem:** quem administra o projeto na Vercel.

Cadastrar as chaves de [`.env.example`](../.env.example):
`OTA_BASE_URL`, `OTA_CLIENT_ID`, `OTA_CLIENT_SECRET`, `GEMINI_API_KEY`.

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

### 6. Fotos da frota

**Quem:** marketing.

A API não devolve imagem de veículo, e a reserva é por **grupo**, não por
modelo. A tela de veículos precisa de uma foto por grupo:

| Grupo | Perfil |
|---|---|
| B | Econômico compacto — hatch de entrada |
| C | Econômico |
| D | Intermediário |
| D PLUS | Intermediário automático |
| E | Sedan |
| G | SUV compacto automático |
| G PLUS | SUV automático |

O ideal são fotos da frota real, em três quartos, fundo claro e neutro,
recortadas em PNG. Enquanto não chegarem, a tela usa uma silhueta desenhada por
porte — honesta, já que a reserva é por grupo, mas sem a força de uma foto.

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

### 10. Imagem de compartilhamento (og:image)

**Quem:** marketing.

Quando alguém compartilha o link no WhatsApp ou no Instagram, o preview usa a
`og:image`. Ainda não existe uma. Precisamos de uma arte 1200×630 com a marca.

### 11. Revisar os textos da Locagora

**Quem:** marketing.

O prompt do assistente vive em `api/agent-chat.js`, no servidor. Vale uma
leitura de quem cuida da voz da marca antes de ir ao ar.

---

## Prints para material de campanha

```bash
npm run dev                      # num terminal
node scripts/print-telas.mjs     # noutro
```

Gera 20 imagens em `prints/`: dobra em 2× e página inteira, em desktop (1440) e
celular (390), das cinco telas públicas. A pasta é ignorada pelo Git — é
artefato, não fonte. Rode de novo sempre que o visual mudar.

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
