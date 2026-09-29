# Plano — reunião Fox + Marketins + Locafácil (29/09/2026)

Tudo o que saiu da reunião com Marcelo Sousa (Locafácil), o que muda no site,
onde mexe e de quem depende. Transcrição e resumo do Gemini ficaram com o
Arthur; aqui está só o que vira trabalho.

Legenda de status: **agora** (não depende de ninguém), **copy** (espera o
retorno do Marcelo nas lâminas, prazo sexta 02/10), **imagens** (espera o banco
de fotos do Marcelo e as artes da Gabriella), **v2** (fora desta versão).

## Decisões confirmadas depois da reunião

- Pré-reserva tem **dois contatos diferentes**: um em até 24 h para confirmar a
  reserva e o pagamento, outro antes da retirada para lembrar.
- Homologação da integração usa **reservas de teste** (nome RESERVA TESTE,
  canceladas pela loja). Não esperamos ambiente de testes da JCompany.
- Formulários caem **só no WhatsApp**. Envio por e-mail fica para depois (e é
  cobrado à parte, se vier).
- Endereço: Rod. Pres. Dutra, **13.900**. E-mail público:
  **reservas@locafacilaluguel.com**. WhatsApp oficial: (21) 96854-0185.
- O "app" da Locafácil é o portal da JCompany em booking.locafacilaluguel.com.br,
  que lê a mesma base do SGLOC. O site não substitui nem integra o app: os dois
  falam com o mesmo sistema.

## 1. Marca

| # | Mudança | Onde mexe | Status |
|---|---|---|---|
| 1.1 | Logotipo com o pingo verde no header, no menu do celular e no rodapé | `src/assets/brand/`, `Topbar`, `Footer`, cabeçalho das páginas `/doc` | agora |
| 1.2 | Ícone novo (corpo branco, pingo verde) no preloader | `Preloader.jsx` | agora |
| 1.3 | Ícone novo no botão flutuante de atendimento (e no popup de desconto, que usa o mesmo selo) | `LocagoraMark.jsx` | agora |
| 1.4 | Ícone novo na aba do navegador | `public/favicon.*`, `apple-touch-icon`, `android-chrome-*` | agora |
| 1.5 | Mais verde e azul no layout ("pode soltar o freio") | design geral | imagens (Gabriella) |

O verde continua só na marca, nunca como cor de texto: sobre fundo claro ele
dá 1,6:1 de contraste.

## 2. Copy

| # | Mudança | Onde mexe | Status |
|---|---|---|---|
| 2.1 | Tirar "seguros inclusos": a Locafácil não trabalha mais com isso | `Home/Header.jsx`, `Home/Content.jsx`, `index.html` | agora |
| 2.2 | Aviso de taxa de não comparecimento dizia "cancele pelo site" — o site não cancela | `Reservar/Revisao` | agora |
| 2.3 | Revisão de todos os textos do site, lâmina por lâmina | todas as páginas | copy |
| 2.4 | "O que você vê é o que você paga… taxas ocultas de proteção extra no balcão" conflita com a proteção paga no fluxo | `Home/Content.jsx` | copy |
| 2.5 | Descrição das proteções (hoje vem da API em caixa alta) | fluxo de reserva | copy |

## 3. Pré-reserva

| # | Mudança | Onde mexe | Status |
|---|---|---|---|
| 3.1 | Botão "Confirmar pré-reserva" | `Reservar/Revisao` | agora |
| 3.2 | Aviso antes do botão com os dois contatos (confirmação em até 24 h e lembrete antes da retirada) | `Reservar/Revisao` | agora (texto final: copy) |
| 3.3 | Tela final: "Pré-reserva enviada", o que acontece a seguir, pagamento combinado no contato | `Reservar/Confirmacao` | agora (texto final: copy) |
| 3.4 | Páginas `/doc` e dados de teste falando em "Confirmar pré-reserva" | `src/content/documentacao.js`, `Doc/Cliente.jsx` | agora |

## 4. Frota e imagens

| # | Mudança | Onde mexe | Status |
|---|---|---|---|
| 4.1 | Montadoras: sair Mazda e Dodge | `Home/Content.jsx` | agora |
| 4.2 | Montadoras: entrar Fiat, Citroën e outras nacionais | idem | imagens (lista do Marcelo, logos da Gabriella) |
| 4.3 | Carros brancos ou prata, nunca preto | `src/assets/veiculos/` | imagens |
| 4.4 | Pulse repetido em D PLUS e G | idem | imagens |
| 4.5 | Carrossel com os modelos de cada grupo, legenda "imagem ilustrativa" | card de veículo | imagens |
| 4.6 | Trocar imagens genéricas e de baixa resolução das seções | Home, Empresas, Contato | imagens (Gabriella) |

A API já devolve uma foto por grupo (`VehicleURLPhoto`), subida pela própria
Locafácil no SGLOC. Mostrar ao Arthur antes de usar.

## 5. Rodapé e contato

| # | Mudança | Onde mexe | Status |
|---|---|---|---|
| 5.1 | E-mail público reservas@locafacilaluguel.com | `Footer` | agora |
| 5.2 | "Feito com amor por Fox TI + Marketins", raposa e link para foxtisolutions.com.br | `Footer` | agora |
| 5.3 | Link do site da Locafácil no site da Fox | site da Fox | fora deste repositório |

## 6. Formulários (só WhatsApp)

| # | Mudança | Onde mexe | Status |
|---|---|---|---|
| 6.1 | Formulário para empresas: monta a mensagem e abre o WhatsApp comercial (21) 99329-7697 | `Empresas/Content.jsx` | agora (campos finais: copy) |
| 6.2 | Formulário de contato: monta a mensagem e abre o WhatsApp (21) 96854-0185 | `Contato/Content.jsx` | agora (campos finais: copy) |

## 7. Integração e ambiente de homologação

| # | Mudança | Onde mexe | Status |
|---|---|---|---|
| 7.1 | Prévia `api-real` na Vercel ligada na API real | variáveis `OTA_BASE_URL` e `OTA_ACCESS_TOKEN` (preview, branch `api-real`) | Arthur cadastra na Vercel |
| 7.2 | Pré-reserva de teste RESERVA TESTE e cancelamento pela loja | fluxo real | depois da 7.1 e da resposta sobre `VehPref.Code` |
| 7.3 | Virar a chave para produção | Vercel | depois da homologação |

## 8. Lâminas para o Marcelo

Uma lâmina por dobra de página, com a captura e os textos editáveis. Formato
em alinhamento (PPTX, link editável na homologação ou os dois). Entra depois
das mudanças "agora", para as capturas já saírem com a marca nova e sem
"seguros inclusos".

## 9. Fora desta versão

- Área do cliente (v2/v3). Marcelo manda o painel do cliente do SGLOC e dá
  acesso ao Arthur.
- Envio de formulário por e-mail (Resend ou similar).
