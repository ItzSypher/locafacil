# Textos prontos para enviar

Três públicos, três tons. Copie, troque o que estiver entre colchetes e mande.

Os textos de e-mail supõem o PDF anexado (`apresentacao/Locafacil-Apresentacao.pdf`,
gerado por `node scripts/gerar-pdf.mjs`). Os de WhatsApp supõem que o PDF vai
junto ou que o link basta.

---

## 1. E-mail — cliente e time de marketing

Para pedir a homologação. É o e-mail principal: ele explica o que está pronto,
o que falta, de quem depende cada coisa e o que se espera de volta.

**Assunto:** `Novo site da Locafácil — no ar para homologação`

**Anexo:** `Locafacil-Apresentacao.pdf`

---

Olá, pessoal!

O novo site da Locafácil está no ar, em endereço de teste, e já dá para
percorrer inteiro:

**https://locafacil-nine.vercel.app**

Abre em qualquer navegador, no computador ou no celular, sem senha. **Pode
clicar à vontade: nada ali vira reserva de verdade** — o site ainda não está
ligado ao sistema da loja, então os carros, os preços e o localizador que
aparece no fim são de exemplo. Ninguém do balcão recebe nada.

Anexei um documento com tudo: as telas, o roteiro de homologação passo a passo,
o fluxo de reserva explicado, as cores e a tipografia para quem produz arte, e a
lista do que ainda falta com o responsável de cada item.

**O que peço de vocês nesta rodada**

1. Percorrer o roteiro da seção 3 do documento — leva uns dez minutos — uma vez
   no computador e uma vez no celular.
2. Devolver os ajustes numa lista só: texto que soa errado, coisa desalinhada ou
   cortada, informação que falta e que o cliente perguntaria, preço ou condição
   que não bata com a operação real.
3. Confirmar três coisas da operação: o horário de funcionamento da loja, os
   sete grupos de veículo e os preços de tabela que estão no documento.

**O que ainda não dá para conferir**

Disponibilidade e preço por data. Eles vêm do sistema da JCompany, e a conta da
Locafácil ainda não foi liberada por eles — já cobramos, em paralelo. Enquanto
não chega, o site mostra a tabela fixa. No dia em que as credenciais chegarem,
a virada é de configuração, sem mexer em código e sem mudar nenhuma tela.

**Dois itens que dependem de vocês para publicar**

- **Termos de uso e cláusulas contratuais.** O checkout já pede o aceite, mas
  não existe link para os documentos. Ou a JCompany preenche no cadastro deles,
  ou vocês nos mandam os textos e hospedamos no próprio site.
- **Arte de compartilhamento, 1200 × 630 px.** É a miniatura que aparece quando
  alguém manda o link no WhatsApp ou no Instagram. Sem ela, o link vai sem
  imagem.

Qualquer dúvida, é só chamar.

Abraço,
[seu nome]

---

## 2. E-mail — time de desenvolvimento da JCompany

Para destravar os dados reais. Versão resumida; a completa, com os detalhes
técnicos, está em [`API-JCOMPANY.md`](API-JCOMPANY.md).

**Assunto:** `Locafácil — credenciais de acesso à API de reservas`

---

Olá, pessoal!

Estamos finalizando o novo site da Locafácil, com o fluxo de reserva integrado à
ReservaOTA de vocês. O front já está completo e rodando contra o contrato —
busca, disponibilidade, coberturas, confirmação. Para virar a chave, preciso de
quatro coisas:

**1. Credenciais OAuth da Locafácil.** Nossa conta parece não estar provisionada
ainda: os endpoints públicos respondem, mas pelo tenant de demonstração —
`get-locais` devolve uma loja que não é nossa e `get-personalizacao` devolve
"JCOMPANY RENT A CAR". Precisamos do `client_id` e do `client_secret` de
produção, e de homologação se houver ambiente separado, além do `LocationCode`
da nossa loja em Nova Iguaçu.

**2. Horário de funcionamento por endpoint.** Procurei no spec inteiro e não
encontrei — só a Agenda de Manutenção, que é outra coisa. Hoje a validação
acontece só no servidor de vocês, depois do submit: se o cliente escolhe um
horário fora do expediente, ele só descobre ao clicar em buscar. Para barrar
antes, mantive a grade do nosso lado, levantada da própria mensagem de erro
(seg–sex 08:00–17:30, sábado 08:00–12:00, domingo fechado). O risco é óbvio: no
dia em que a loja mudar o expediente, o site continua mostrando o antigo. Daria
para expor isso num endpoint, ou incluir no retorno de `get-locais`?

**3. `termos_url` e `clausulas_url`.** Voltam vazios em `get-personalizacao`. O
checkout tem o aceite dos termos e precisa apontar para os documentos.

**4. Imagem do veículo.** A disponibilidade não devolve mídia por grupo. Está no
roadmap, ou tratamos do nosso lado mesmo?

Aproveito para registrar dois detalhes do retorno, caso ajude: valores monetários
vêm ora como string (`"390.00"`), ora como número, e os textos chegam com acento
corrompido (`Econ?mico`, `Dire??o`). Tratamos os dois no nosso lado, então não
são bloqueio — mas notei que o portal de vocês também remenda o acento no
JavaScript do cliente, então talvez valha corrigir na origem.

Qualquer coisa, estou à disposição.

Abraço,
[seu nome]

---

## 3. WhatsApp

Mensagens curtas, para mandar direto. Cada bloco é uma mensagem só.

### Para o cliente — apresentação

> Oi, [nome]! O site novo da Locafácil já está no ar para você ver:
> https://locafacil-nine.vercel.app
>
> Dá para percorrer inteiro, no celular mesmo. Pode clicar à vontade que nada
> vira reserva de verdade — ainda estamos esperando a JCompany liberar o acesso
> ao sistema, então os carros e preços que aparecem são de exemplo.
>
> Te mandei por e-mail um PDF com as telas, o passo a passo do que conferir e a
> lista do que ainda falta. Qualquer coisa que te incomodar, me manda que ajusto.

### Para o cliente — cobrança dos três itens

> Oi, [nome]! Para o site poder ir ao ar no domínio da Locafácil, preciso de
> três coisas de vocês:
>
> 1. Confirmar o horário de funcionamento da loja. O site hoje usa seg a sex das
> 08:00 às 17:30, sábado das 08:00 às 12:00, domingo fechado, com 48h de
> antecedência mínima. Esse é o horário que o sistema da JCompany aceita — se a
> loja atende em outro, o cadastro lá precisa ser corrigido primeiro.
>
> 2. Os textos de termos de uso e cláusulas contratuais. O checkout já pede o
> aceite, mas não tem para onde apontar.
>
> 3. Apagar a chave antiga do Google AI Studio. O assistente com IA saiu do site
> e não precisa gerar outra — mas a chave antiga ficou exposta e é cobrável por
> quem tenha copiado.

### Para o time de marketing

> Oi, pessoal! Site novo da Locafácil no ar para homologação:
> https://locafacil-nine.vercel.app
>
> Mandei por e-mail um PDF com as telas e o roteiro do que conferir. Leva uns
> dez minutos, e vale fazer uma vez no computador e uma no celular.
>
> Duas coisas que preciso de vocês: uma arte 1200x630 com a marca, que é a
> miniatura que aparece quando o link é compartilhado, e uma lida nas frases de
> atendimento do WhatsApp do site — são seis assuntos prontos, e é literalmente
> o texto que o cliente vai mandar.
>
> Os prints das telas para banner eu tenho em alta resolução, é só pedir.

### Para o contato na JCompany

> Oi, [nome], tudo bem? Estamos finalizando o site da Locafácil com a integração
> da ReservaOTA e travamos num ponto: nossa conta parece não estar provisionada
> ainda. Os endpoints públicos respondem, mas pelo tenant de demonstração —
> `get-locais` devolve uma loja que não é nossa.
>
> Preciso do `client_id` e `client_secret` da Locafácil e do `LocationCode` da
> loja de Nova Iguaçu. Mandei um e-mail com o detalhe e mais três pontos
> menores. Dá para me dar uma previsão?

---

## Antes de mandar

- Gere o PDF com o visual de agora: `node scripts/print-telas.mjs` e depois
  `node scripts/gerar-pdf.mjs`. Os prints do PDF têm data no rodapé da seção 4 —
  se o site mudou, o PDF precisa ser refeito.
- Confira o endereço. Se o domínio próprio já estiver apontado, troque
  `locafacil-nine.vercel.app` por ele em todos os textos.
- **Nunca mande credencial por e-mail ou WhatsApp.** Quando a JCompany responder
  com `client_id` e `client_secret`, peça por um canal que permita apagar depois,
  e cadastre direto no painel da Vercel — nada de colar em conversa, em issue ou
  em arquivo do projeto.
