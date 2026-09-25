# API JCompany / SGLOC — o que temos, o que falta, o que pedir

Levantamento feito contra a API de produção (`https://sgloc.apijcompany.com.br`,
aba **ReservaOTA** do Swagger em `/docs/api-docs.json`) e contra o portal de
reservas da própria JCompany, sondado tela a tela.

Este documento existe para duas coisas: saber o que o site consegue entregar
hoje, e ter em mãos exatamente o que pedir ao time de desenvolvimento deles.

---

## Resumo em uma linha

O contrato da API está completo o bastante para o fluxo inteiro de reserva
funcionar. **O que falta não é endpoint: é a conta da Locafacil ser
provisionada.** Sem as credenciais OAuth, os endpoints autenticados não
respondem, e os públicos respondem pelo tenant de demonstração da JCompany — ou
seja, dados de outra empresa.

---

## Autenticação

OAuth2 `client_credentials`:

```
POST https://sgloc.apijcompany.com.br/oauth/token
→ access_token, válido por 1 hora
```

No site, o token é guardado em variável de módulo dentro da função serverless e
renovado cinco minutos antes de expirar. As credenciais nunca chegam ao
navegador.

---

## O que a API entrega hoje

### Endpoints públicos — respondem sem token

| Endpoint | Entrega | Situação |
|---|---|---|
| `GET api/get-locais` | Lista de lojas com `id`, `descricao`, `iata` | ⚠️ Responde pelo tenant de demonstração |
| `GET api/get-personalizacao` | Nome fantasia, cores, URLs de termos e cláusulas | ⚠️ Devolve "JCOMPANY RENT A CAR"; `termos_url` e `clausulas_url` vêm vazios |
| `POST api/aluguel/pesquisa-antecedencia` | Antecedência mínima da loja, em horas | ⚠️ Mesmo problema de tenant |
| `POST api/aluguel/pesquisa-periodo-minimo` | Período mínimo de locação | ⚠️ Mesmo problema de tenant |
| `POST api/aluguel/pesquisa-tarifa-acordo` | Tarifa de contrato corporativo | Não exercitado ainda |

> Como esses endpoints respondem por outra empresa, o site só consulta a API
> real **quando há credenciais**. Sem elas usa as fixtures da Locafacil e marca
> `demo: true` — para nunca mostrar a loja de um terceiro como se fosse nossa.

### Endpoints autenticados — exigem as credenciais que ainda não temos

| Endpoint | Entrega |
|---|---|
| `POST api/aluguel/pesquisa-disponibilidade` | Grupos disponíveis no período, com diária, taxas, coberturas, opcionais e política de quilometragem |
| `POST api/aluguel/confirmacao-reserva` | Cria a reserva e devolve o localizador (`ConfID`) |
| `POST api/aluguel/consulta-reserva` | Consulta por localizador + sobrenome |
| `POST api/aluguel/cancelamento-reserva` | Cancela a reserva |

O que a disponibilidade devolve por grupo, em detalhe: código ACRISS, descrição,
transmissão, passageiros, portas, bagagem, ar-condicionado, política de
quilometragem, diária e quantidade, taxas embutidas e cobradas à parte,
coberturas com preço por dia, opcionais, total estimado e taxa de no-show.

---

## O que a API **não** entrega

Isto é o que o site precisou resolver por fora. Cada linha é uma pergunta a
fazer ao time deles.

### 1. Horário de funcionamento da loja

**Não existe em endpoint nenhum.** O spec inteiro foi varrido — há uma
"Agenda de Manutenção", que é outra coisa. A validação mora só no servidor, que
recusa a busca **depois** do submit, com a mensagem:

```
Data/hora fora do horário de atendimento da loja.
Segunda a Sexta | 08:00 às 17:30
Sábado          | 08:00 às 12:00
Domingo         | Fechado
```

Consequência prática: sem esse dado, ou o site deixa o cliente escolher um
horário que vai ser recusado, ou a gente mantém a grade duplicada do nosso lado
e ela sai de sincronia no dia em que a loja mudar o expediente. Hoje o site
mantém a grade em `api/_lib/storeHours.js`, levantada por sondagem.

A antecedência mínima (48h nesta loja) e o período mínimo **têm** endpoint; o
horário não.

### 2. Foto ou imagem do veículo

A reserva é por **grupo** (B, C, D, D PLUS, E, G, G PLUS), não por modelo, e a
API não devolve imagem. A descrição textual cita um exemplo ("Kwid ou
similar"), mas não há campo de mídia.

### 3. Pagamento

A aba ReservaOTA não tem endpoint de pagamento. O fluxo termina em "reserva
confirmada" com o localizador, e o pagamento acontece no balcão.

Existe um caminho de boleto **fora** da ReservaOTA — `POST /reservas/criar` com
`gerar_boleto=true`, nas contas PJBANK, ASAAS ou Banco do Brasil — mas é outra
tag, outra autenticação e outro contrato comercial. Trabalha com
`local_retirada` como id interno, não com `LocationCode`.

### 4. Consistência de tipos e de encoding

Valores monetários vêm ora como string (`"390.00"`), ora como número.
Booleanos vêm como string (`"true"`). E há acento corrompido nos textos —
`Econ?mico`, `Dire??o`. O próprio portal da JCompany remenda isso no
JavaScript do cliente, com um `replace` por palavra.

O site trata tudo em `api/_lib/otaNormalize.js`. Não é bloqueio, mas é retrabalho
que a origem poderia evitar.

---

## O que pedir ao time de desenvolvimento

Em ordem de urgência.

### 1. Provisionar a conta da Locafacil e entregar as credenciais

É o único item que bloqueia o site de verdade. Precisamos de:

- `client_id` e `client_secret` de **produção**
- Os mesmos de **homologação**, se existir ambiente separado
- O `LocationCode` correto da loja de Nova Iguaçu, e confirmação de que
  `get-locais` passa a devolver as lojas da Locafacil depois do provisionamento

### 2. Expor o horário de funcionamento

Um endpoint por loja, no mesmo formato dos outros. Alternativa aceitável:
incluir o horário no retorno de `get-locais`.

### 3. Preencher `termos_url` e `clausulas_url`

Hoje vêm vazios. O checkout exibe o aceite dos termos e precisa apontar para
algum lugar.

### 4. Confirmar se haverá campo de imagem por grupo

Se não houver na API, resolvemos do nosso lado — mas precisamos saber, para não
manter duas fontes.

---

## Mensagem pronta para enviar

> Olá, pessoal!
>
> Estamos finalizando o novo site da Locafacil, com o fluxo de reserva
> integrado à ReservaOTA. O front já está completo e rodando contra o contrato
> de vocês — busca, disponibilidade, coberturas, confirmação, consulta e
> cancelamento. Para virar a chave, preciso de quatro coisas:
>
> **1. Credenciais OAuth da Locafacil.** Nossa conta parece não estar
> provisionada ainda: os endpoints públicos respondem, mas pelo tenant de
> demonstração — `get-locais` devolve uma loja que não é nossa e
> `get-personalizacao` devolve "JCOMPANY RENT A CAR". Precisamos do `client_id`
> e `client_secret` de produção (e de homologação, se houver), além do
> `LocationCode` da nossa loja em Nova Iguaçu.
>
> **2. Horário de funcionamento por endpoint.** Procurei no spec inteiro e não
> encontrei — só a Agenda de Manutenção, que é outra coisa. Hoje a validação só
> acontece no servidor de vocês, depois do submit: se o cliente escolhe um
> horário fora do expediente, ele só descobre ao clicar em buscar. Para barrar
> antes, mantive a grade do nosso lado, levantada da própria mensagem de erro
> (seg–sex 08:00–17:30, sábado 08:00–12:00, domingo fechado). O risco é óbvio:
> no dia em que a loja mudar o expediente, o site vai continuar mostrando o
> antigo. Daria para expor isso num endpoint, ou incluir no retorno de
> `get-locais`?
>
> **3. `termos_url` e `clausulas_url`.** Voltam vazios em
> `get-personalizacao`. O checkout tem o aceite dos termos e precisa apontar
> para os documentos.
>
> **4. Imagem do veículo.** A disponibilidade não devolve mídia por grupo. Está
> no roadmap, ou tratamos do nosso lado mesmo?
>
> Aproveito para registrar dois detalhes do retorno, caso ajude: valores
> monetários vêm ora como string (`"390.00"`), ora como número, e os textos
> chegam com acento corrompido (`Econ?mico`, `Dire??o`). Tratamos os dois no
> nosso lado, então não são bloqueio — mas notei que o portal de vocês também
> remenda o acento no JavaScript do cliente, então talvez valha corrigir na
> origem.
>
> Qualquer coisa, estou à disposição.

---

## O que muda no site quando as credenciais chegarem

Nada de código. Preencher `OTA_CLIENT_ID` e `OTA_CLIENT_SECRET` em
`.env.local` e no painel da Vercel desliga as fixtures: o proxy passa a bater na
API real e o campo `demo` some das respostas.

Depois disso, vale refazer o percurso completo contra a API de verdade e
conferir o normalizador contra a resposta real — encoding, tipos e campos
ausentes. A confirmação cria uma reserva de verdade: faça em homologação, ou
cancele em seguida pelo atendimento da loja. O site não tem mais tela de
consulta — `api/reservation-lookup.js` e `api/reservation-cancel.js` seguem
prontos, sem chamador no front.
