# Segurança

## Encontrou uma vulnerabilidade?

Escreva para **gerencia@locafacilaluguel.com** antes de abrir uma issue
pública. Respondemos e combinamos a divulgação junto.

---

## Como este projeto trata segredo

**Nenhuma credencial chega ao navegador.** As chaves da API de reservas existem
só dentro das funções serverless em `api/`, e nenhuma variável usa o prefixo
`VITE_` — o prefixo publicaria o valor no bundle do cliente. O front conversa
apenas com `/api/*`; a API de terceiros é falada do servidor.

O formato das variáveis está documentado em
[`.env.example`](.env.example), sem valores. Os valores reais vivem em
`.env.local` (coberto pelo `.gitignore`) e no painel da Vercel.

**O projeto não usa chave de IA.** O chat por IA foi removido; o atendimento é
um atalho de WhatsApp com frases prontas, sem servidor e sem credencial.

**Retornos da homologação.** O que as pessoas marcam e escrevem em
`/doc/cliente` e `/doc/marketing` vai para um Vercel Blob **privado**
(`locafacil-retornos`): os arquivos não têm URL pública, e só a função
`api/retornos.js` lê e escreve, com `BLOB_READ_WRITE_TOKEN`. A leitura exige
`DOC_RETORNOS_SENHA`, comparada em tempo constante. A escrita é aberta — a
página é pública para quem tiver o link —, então o endpoint aceita só o
formato que a página manda, com limite de tamanho em cada campo.

## O que barra segredo antes do commit

`.githooks/pre-commit` inspeciona **as linhas adicionadas** de tudo que está em
staging e recusa o commit quando encontra:

- chave de API do Google, da OpenAI, token do GitHub ou do Slack
- chave privada em PEM
- `client_secret`, `api_key`, `password` ou `senha` com valor literal no código
- `OTA_CLIENT_ID` ou `OTA_CLIENT_SECRET` preenchidos
- qualquer arquivo `.env` que não seja o `.env.example`

O hook se instala sozinho: `npm install` roda `prepare`, que aponta
`core.hooksPath` para `.githooks`. Para conferir à mão:

```bash
git config core.hooksPath .githooks
```

Num falso positivo legítimo — uma fixture, um exemplo em documentação —
`git commit --no-verify` passa por cima. Use com parcimônia: uma regra que
todo mundo pula não protege nada.

## Commits assinados

Os commits são assinados com chave SSH (`gpg.format ssh`), e o GitHub os exibe
como **Verified**. A assinatura diz que o commit saiu de quem diz ter saído —
sem ela, qualquer pessoa pode forjar autoria com um `git config user.email`.

Para configurar numa máquina nova:

```bash
ssh-keygen -t ed25519 -C "seu@email" -f ~/.ssh/id_ed25519_signing
git config user.signingkey ~/.ssh/id_ed25519_signing.pub
git config gpg.format ssh
git config commit.gpgsign true
```

Depois cadastre a chave pública no GitHub em **Settings → SSH and GPG keys**,
escolhendo o tipo **Signing Key** (não Authentication Key — são listas
diferentes, e a errada não valida nada).

## Histórico

Uma chave da API do Google já esteve publicada no bundle de produção e no
histórico do Git deste repositório. **O histórico foi reescrito e nenhum objeto
do repositório contém a chave** — mas reescrever o Git não desfaz uma exposição
que já aconteceu, e por isso a chave precisa ser revogada na origem.

É essa história que explica o hook acima: a hora de barrar um segredo é antes
de ele virar commit, porque depois o preço é reescrever o histórico inteiro.
