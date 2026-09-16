---
name: Locafacil
description: Locadora de veículos do Rio de Janeiro sem caução e sem burocracia
colors:
  brand-dark: "#0A1628"
  brand-navy: "#0F2240"
  brand-deep: "#1E3A5F"
  brand-accent: "#2563EB"
  brand-glow: "#3B82F6"
  brand-success: "#10B981"
  brand-gold: "#F59E0B"
  text-primary: "#F8FAFC"
  text-secondary: "#94A3B8"
  text-dark: "#1E293B"
  text-muted: "#64748B"
  surface-light: "#F8FAFC"
  border-light: "#E2E8F0"
  glass-surface: "rgba(255,255,255,0.08)"
  glass-surface-hover: "rgba(255,255,255,0.12)"
  glass-border: "rgba(255,255,255,0.12)"
  glass-field: "rgba(255,255,255,0.10)"
  glass-field-border: "rgba(255,255,255,0.15)"
  glass-light-surface: "rgba(255,255,255,0.7)"
  glass-light-border: "rgba(255,255,255,0.4)"
  glass-dark-surface: "rgba(10,22,40,0.85)"
typography:
  display:
    fontFamily: "Montserrat, system-ui, -apple-system, sans-serif"
    fontSize: "clamp(2.25rem, 6vw, 4.5rem)"
    fontWeight: 900
    lineHeight: 1.05
    letterSpacing: "-0.025em"
  headline:
    fontFamily: "Montserrat, system-ui, -apple-system, sans-serif"
    fontSize: "clamp(1.875rem, 4vw, 3rem)"
    fontWeight: 900
    lineHeight: 1.1
    letterSpacing: "-0.025em"
  title:
    fontFamily: "Montserrat, system-ui, -apple-system, sans-serif"
    fontSize: "clamp(1.5rem, 3vw, 1.875rem)"
    fontWeight: 900
    lineHeight: 1.2
    letterSpacing: "-0.025em"
  body:
    fontFamily: "Montserrat, system-ui, -apple-system, sans-serif"
    fontSize: "clamp(1rem, 1.5vw, 1.125rem)"
    fontWeight: 400
    lineHeight: 1.6
    letterSpacing: "normal"
  label:
    fontFamily: "Montserrat, system-ui, -apple-system, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 900
    lineHeight: 1.4
    letterSpacing: "0.2em"
rounded:
  xl: "0.75rem"
  2xl: "1rem"
  pill: "9999px"
spacing:
  sm: "0.5rem"
  md: "1rem"
  lg: "1.5rem"
  xl: "2rem"
  section: "4rem"
  section-lg: "6rem"
components:
  button-primary:
    backgroundColor: "{colors.brand-accent}"
    textColor: "#FFFFFF"
    rounded: "{rounded.xl}"
    padding: "0.875rem 2rem"
  button-primary-hover:
    backgroundColor: "{colors.brand-glow}"
    textColor: "#FFFFFF"
    rounded: "{rounded.xl}"
    padding: "0.875rem 2rem"
  button-ghost:
    backgroundColor: "rgba(255,255,255,0.05)"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.xl}"
    padding: "0.875rem 2rem"
  input-light:
    backgroundColor: "{colors.surface-light}"
    textColor: "{colors.text-dark}"
    rounded: "{rounded.xl}"
    padding: "0.75rem 1rem"
  input-glass:
    backgroundColor: "rgba(255,255,255,0.10)"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.xl}"
    padding: "1rem 1.25rem"
  card-glass:
    backgroundColor: "rgba(255,255,255,0.08)"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.2xl}"
    padding: "1.5rem"
  card-light:
    backgroundColor: "#FFFFFF"
    textColor: "{colors.text-dark}"
    rounded: "{rounded.2xl}"
    padding: "1.5rem"
  badge-scarcity:
    backgroundColor: "rgba(245,158,11,0.10)"
    textColor: "{colors.brand-gold}"
    rounded: "{rounded.pill}"
    padding: "0.375rem 1rem"
---

# Design System: Locafacil

## Overview

**Creative North Star: "A Estrada Noturna"**

O sistema inteiro é a visão de quem dirige de madrugada: asfalto azul-escuro até o
horizonte, o azul frio dos faróis cortando, superfícies de vidro fosco que deixam
a luz passar sem revelar tudo. A locação de carro aqui não é um balcão iluminado
por lâmpada fluorescente — é a liberdade de pegar a estrada quando der vontade,
sem ninguém pedindo caução.

O humor é **confiante e veloz**. Nada de hesitar: títulos em peso máximo, decisões
diretas, movimento que responde na hora. Mas velocidade não é gritaria — a
confiança vem de parecer que a empresa já resolveu tudo antes de você perguntar.
Contenção onde a maioria das locadoras berra.

O sistema rejeita três mundos de forma explícita. Não é uma **locadora de
promoção** (banner amarelo, preço riscado, cara de panfleto). Não é uma
**concessionária antiga** (stock photo de aperto de mão, azul corporativo morto,
carrossel pesado). Não é um **site de viagem lotado** (filtros por toda parte,
contador piscando, densidade de OTA). Quando uma decisão visual puder ser lida
como um desses, ela está errada.

**Key Characteristics:**
- Fundo escuro contínuo como ambiente padrão; o claro é a exceção funcional
- Um único azul como voz da marca, do CTA ao foco de campo
- Vidro fosco no lugar de sombra: profundidade por luz e camada
- Tipografia de peso 900 para afirmar, peso 400 para explicar — sem meio-termo
- Urgência rara e factual, nunca decorativa

## Colors

Uma paleta de estrada noturna: azuis frios e profundos em quase tudo, com dois
sinais quentes usados com parcimônia.

### Primary
- **Azul Farol** (#2563EB): a voz única da marca. Todo CTA primário, todo estado
  de foco de campo, toda barra de progresso ativa, todo texto de destaque em
  gradiente. Se um elemento precisa ser escolhido, ele é desta cor.
- **Farol Alto** (#3B82F6): o mesmo azul um passo mais claro, reservado para
  resposta a interação — hover de botão, fim do gradiente `.text-gradient`,
  degradê da barra de rolagem. Nunca é cor de repouso.

### Neutral
- **Asfalto Noturno** (#0A1628): o chão de tudo. Fundo padrão de página, base do
  gradiente de hero, fundo de `<option>` em selects escuros.
- **Azul de Madrugada** (#0F2240): passo intermediário do gradiente de hero e
  fundo de superfícies escuras que precisam se separar do asfalto.
- **Horizonte** (#1E3A5F): o ponto mais claro do gradiente escuro, onde o fundo
  encontra a luz. Fecha o `.bg-hero-gradient`.
- **Névoa Clara** (#F8FAFC) e **Cinza de Painel** (#94A3B8): texto sobre fundo
  escuro — primário e secundário respectivamente. A névoa nunca é branco puro.
- **Tinta** (#1E293B) e **Grafite** (#64748B): texto sobre fundo claro — título e
  corpo. Mesma hierarquia invertida.
- **Papel** (#F8FAFC) e **Traço** (#E2E8F0): fundo e borda de campos de formulário
  em superfície clara.
- **Vidro** (branco a 8% com borda a 12%): a superfície padrão sobre fundo escuro.
  Campos dentro dele sobem para 10% de fundo e 15% de borda, para se separarem do
  painel que os contém. O `glass-dark` (asfalto a 85%) é exclusivo da barra de
  navegação após a rolagem.

### Tertiary
- **Verde Sinal** (#10B981): confirmação e conclusão. Etapa concluída no fluxo de
  reserva, ícone de sucesso, indicador de canal ativo. É estado, não decoração.
- **Âmbar de Alerta** (#F59E0B): escassez e prazo reais. A cor mais restrita do
  sistema (ver regra abaixo).

### Named Rules

**A Regra da Voz Única.** O Azul Farol é a única cor que convida a clicar. Se dois
elementos azuis competem na mesma tela, um deles está errado — vira fantasma
(`button-ghost`) ou texto puro. Nunca colorir de azul algo que não seja acionável.

**A Regra do Âmbar Escasso.** O Âmbar de Alerta só aparece quando o fato é
verdadeiro, verificável e útil para a decisão ("últimas 3 unidades nesta
categoria" quando realmente são três). No máximo um sinal de urgência por tela, e
nunca no checkout — a partir da escolha do veículo, o cliente já decidiu.
Escassez inventada é o que transforma este site em locadora de promoção.

**A Regra do Fundo Escuro.** Escuro é o repouso; claro é ferramenta. Superfície
clara existe só onde a tarefa exige leitura longa ou digitação (formulário de
condutor, seções de conteúdo denso). Uma tela clara sem tarefa dentro dela está
fora do mundo.

## Typography

**Display Font:** Montserrat (com system-ui, -apple-system, sans-serif)
**Body Font:** Montserrat (mesma família)
**Label/Mono Font:** nenhuma — o sistema é monofamiliar por decisão

**Character:** Uma única voz que muda de volume, não de sotaque. O peso 900 em
caixa apertada (-0.025em) dá o tom de placa de sinalização vista em velocidade;
o peso 400 com entrelinha 1.6 devolve o ar para quem parou para ler. A ausência
de uma segunda família é o que mantém o sistema veloz — nenhum contraste
tipográfico rouba atenção do azul.

### Hierarchy
- **Display** (900, clamp 2.25rem–4.5rem, entrelinha 1.05): promessa principal do
  hero. Uma por página, quebrada em duas linhas por `<br />` — a quebra é
  autoral, não acidental.
- **Headline** (900, clamp 1.875rem–3rem, entrelinha 1.1): abertura de seção.
  Vem sozinha, com `text-balance` para equilibrar as linhas.
- **Title** (900, clamp 1.5rem–1.875rem, entrelinha 1.2): título de card,
  cabeçalho de etapa, nome de veículo.
- **Body** (400, clamp 1rem–1.125rem, entrelinha 1.6, medida máxima 65ch):
  explicação e descrição. Palavras que carregam a proposta de valor ganham
  `<strong>` em cor de texto primário, não em azul.
- **Label** (900, 0.75rem, tracking 0.2em, CAIXA ALTA): uso restrito a badges de
  escassez. Não é rótulo de formulário nem antecede headline.

### Named Rules

**A Regra dos Dois Pesos.** Só existem 900 e 400. Pesos intermediários (500, 600,
700) diluem a diferença entre afirmar e explicar — a única exceção é `font-bold`
em texto de botão, onde 900 fecharia demais o contorno em corpo pequeno.

**A Regra do Título Sozinho.** Headline de seção não recebe eyebrow, kicker ou
rótulo acima. O título carrega o próprio peso; um label antes dele é muleta e
deixa a página com cara de template. Rótulo de formulário é caixa baixa, tamanho
de corpo, e fica colado no campo que nomeia.

## Layout

Container central com respiro lateral progressivo (1rem no celular, 1.5rem a
partir de 640px, 2rem a partir de 1024px), sem largura máxima rígida global — os
blocos de conteúdo é que se limitam (`max-w-5xl` para o formulário de busca,
`max-w-6xl` para a grade de veículos, `max-w-2xl` para formulários longos).

Ritmo vertical de seção: 4rem no celular, 6rem a partir de 640px. Dentro da
seção, o passo é 1.5rem entre itens relacionados e 2rem entre grupos.

Grades sempre colapsam para uma coluna abaixo de 640px. A grade de veículos vai
de 1 para 2 colunas em 640px e para 3 em 1024px; formulários de dados pareiam
campos em 2 colunas a partir de 640px e mantêm campos curtos (DDD, UF) em fração
de linha via grade de 3 colunas.

Breakpoints reais do sistema: 375 (piso testado), 640 (`sm`), 768 (`md`), 1024
(`lg`), 1440 (alvo de desktop amplo).

O hero usa uma sobreposição deliberada: o formulário de busca sobe sobre o limite
inferior do hero com margem negativa (-6rem no celular, -8rem a partir de 640px),
criando a articulação entre o mundo escuro e a seção seguinte. É o único uso de
margem negativa estrutural do sistema.

### Named Rules

**A Regra do Colapso Único.** Nenhum componente muda de arranjo mais de duas
vezes entre 375 e 1440. Se precisa de três reorganizações, o componente está
fazendo coisa demais.

## Elevation & Depth

Este sistema constrói profundidade com **luz e camada, não com sombra
projetada**. As superfícies são vidro fosco: fundo translúcido, `backdrop-filter:
blur(16px)` e uma borda de 1px em branco baixíssima opacidade que desenha o
limite onde a sombra faria. O que separa dois planos é o quanto o fundo aparece
através deles.

O halo azul luminoso (`box-shadow` de brilho em CTAs) foi **removido do sistema**.
Os tokens `shadow-glow`, `shadow-glow-lg`, `shadow-glow-green` e a animação
`glow-pulse` não existem mais no `tailwind.config.js`: o brilho difuso empurrava
o sistema para um registro "gamer" que não combina com o humor confiante e veloz.

Sombra tradicional sobrevive apenas em superfície clara, onde o vidro não tem o
que filtrar — cards brancos sobre fundo branco precisam de um contato sutil para
não flutuar sem apoio.

### Shadow Vocabulary
- **Contato de card** (`box-shadow: 0 4px 24px rgba(0,0,0,0.06)`): repouso de card
  branco sobre fundo claro.
- **Contato elevado** (`box-shadow: 0 8px 40px rgba(0,0,0,0.12)`): o mesmo card em
  hover, quando a elevação comunica que ele é clicável.
- **Peso de vidro** (`box-shadow: 0 8px 32px rgba(0,0,0,0.2)`): reservado a
  painéis de vidro que pairam sobre outra seção. Não acumula com borda.

### Named Rules

**A Regra do Vidro Sem Halo.** Profundidade vem de transparência e borda, nunca
de brilho colorido. Nenhum `box-shadow` com matiz azul existe no sistema.

**A Regra da Elevação Declarada Uma Vez.** Uma superfície escolhe borda **ou**
sombra, nunca as duas. Borda de 1px sob sombra larga e difusa é o card fantasma:
lê como erro de camada, não como profundidade. O vidro já traz sua borda, então
não recebe sombra.

**A Regra da Borda Fantasma.** Todo painel de vidro carrega uma borda de 1px em
branco translúcido. Sem ela o vidro derrete no fundo e o limite do painel some em
telas de baixo contraste.

## Shapes

A linguagem de forma é arredondada e contida, com apenas dois degraus. Botões e
campos de formulário usam 12px (0.75rem): o suficiente para suavizar sem perder
a leitura de "controle". Cards, painéis e modais usam 16px (1rem), o raio
assinatura do sistema.

Nada passa de 16px. Cantos maiores deixam o painel mole e empurram o sistema para
o registro de app de consumo genérico, longe da precisão que a Estrada Noturna
pede.

A pílula completa (9999px) fica reservada a controles pequenos: badge de
escassez, dot de status, chip. Elementos circulares aparecem em indicadores de
estado — passo do fluxo de reserva, ícone de sucesso, avatar do assistente,
botão de fechar de modal. Círculo significa estado ou identidade; retângulo de
12px significa ação.

### Named Rules

**A Regra dos Dois Degraus.** 12px para o que se aperta ou se digita, 16px para o
que contém conteúdo. Qualquer terceiro valor de raio é ruído. Botão em pílula é
coisa de controle pequeno, nunca de CTA de largura total.

## Components

### Buttons
- **Shape:** 12px (0.75rem) em toda variante e todo tamanho.
- **Primary:** fundo Azul Farol (#2563EB), texto branco, peso bold, padding
  0.875rem 2rem. É a única ação primária visível por tela.
- **Hover / Focus:** fundo migra para Farol Alto (#3B82F6) com transição de cor
  de 300ms; a escala sobe entre 1.01 e 1.03 conforme a largura do botão (quanto
  maior o alvo, menor o ganho) e cai para 0.97–0.98 ao pressionar. A resposta é
  tátil — o botão reage como objeto físico, não como link colorido.
- **Ghost:** fundo branco a 5%, borda branca a 15%, texto Névoa Clara. Hover
  clareia o fundo para 10%; a borda não muda.
- **Disabled:** opacidade 0.6, cursor default, sem mudança de escala.
- **Rótulo:** nomeia a ação inteira, não o gesto. "Selecionar HB20 ou similar",
  "Continuar para seus dados" — nunca "Continuar →" solto. Sem seta decorativa.

### Cards / Containers
- **Corner Style:** 16px (1rem).
- **Background:** vidro (branco a 8%) sobre fundo escuro; branco puro quando a
  seção é clara.
- **Shadow Strategy:** ver Elevation & Depth — o vidro tem borda, logo não recebe
  sombra; o card branco recebe contato de card e não tem borda.
- **Internal Padding:** 1.5rem no celular, 2.5rem a partir de 640px em painéis
  grandes.

### Inputs / Fields
- **Style (superfície clara):** fundo Papel (#F8FAFC), borda Traço (#E2E8F0),
  raio 12px, padding 0.75rem 1rem, texto 0.875rem.
- **Style (superfície escura):** fundo branco a 10%, borda branco a 15%, mesmo
  raio, padding maior (1rem 1.25rem) porque o campo vive dentro de painel de
  vidro amplo.
- **Focus:** borda passa a Azul Farol e ganha anel de 1px da mesma cor; o cursor
  de texto (caret) também é Azul Farol. O foco é sempre visível — nunca
  `outline: none` sem substituto.
- **Label:** acima do campo, caixa baixa, 0.875rem, peso medium, cor Grafite.
- **Error:** bloco em vermelho com fundo e borda suaves, `role="alert"`, abaixo do
  grupo. Erro vindo da API é exibido literalmente em português, sem reescrita.

### Navigation
- **Style:** barra fixa no topo, transparente no repouso, virando vidro escuro
  (`.glass-dark`) depois de 50px de rolagem. Entra deslizando de cima na carga.
- **Links:** texto 0.875rem peso medium em Cinza de Painel; no hover viram branco
  e uma barra de 2px em Azul Farol cresce da esquerda até a largura total.
- **Mobile:** hambúrguer que se transforma em X por rotação das barras; menu
  ocupa a tela inteira em vidro escuro com links em 1.5rem entrando em cascata.

### Reservation Stepper (signature)
Quatro círculos ligados por traços, no topo de cada etapa do fluxo de reserva,
marcados como `<ol>` para que leitores de tela leiam a sequência. A etapa atual é
círculo de 2.5rem em Azul Farol com o número; as concluídas viram Verde Sinal com
um ícone de check em SVG e pintam de verde o traço que ficou para trás; as
futuras são vidro com número em Cinza de Painel. O estado de cada etapa também é
anunciado por texto só para leitor de tela, já que cor e ícone sozinhos não
comunicam. É o componente que carrega a promessa de "sem burocracia": o cliente
vê o fim do caminho desde o primeiro passo.

### Skeleton (loading)
Enquanto a busca de disponibilidade responde, a grade mostra três cards de vidro
com blocos em branco a 10% pulsando na forma exata do conteúdo final — categoria,
nome, quatro especificações, preço e botão. Nunca um texto "Carregando...":
o esqueleto mantém a página no lugar e evita o salto de layout quando os dados
chegam.

## Do's and Don'ts

### Do:
- **Do** usar o Azul Farol (#2563EB) como única cor de ação; hover vai para
  #3B82F6 por transição de cor, com ganho de escala entre 1.01 e 1.03.
- **Do** construir profundidade com vidro (`backdrop-filter: blur(16px)` + borda
  branca translúcida de 1px).
- **Do** deixar a headline de seção sozinha, com `text-balance`.
- **Do** manter apenas dois pesos tipográficos: 900 para afirmar, 400 para
  explicar.
- **Do** usar 12px de raio em botões e campos, 16px em cards e painéis.
- **Do** manter o foco de teclado visível em todo elemento interativo (anel de
  2px em Azul Farol com 2px de afastamento) e o caret na cor da marca.
- **Do** nomear a ação inteira no rótulo do botão ("Continuar para seus dados").
- **Do** mostrar esqueleto na forma do conteúdo enquanto a API responde.
- **Do** exibir mensagens de erro da API OTA em português, como vieram, dentro de
  um bloco com `role="alert"` e uma saída de recuperação ao lado.

### Don't:
- **Don't** adicionar `box-shadow` com matiz azul: o halo saiu do sistema.
- **Don't** acumular borda e sombra na mesma superfície.
- **Don't** usar texto em gradiente para dar ênfase — ênfase vem de peso e
  tamanho.
- **Don't** colocar eyebrow, kicker ou rótulo em caixa alta acima de um título.
- **Don't** usar o Âmbar de Alerta para escassez inventada, nem exibir mais de um
  sinal de urgência por tela, nem qualquer urgência dentro do checkout.
- **Don't** introduzir uma segunda família tipográfica ou pesos 500/600/700 fora
  de texto de botão.
- **Don't** colorir de azul qualquer elemento que não seja acionável.
- **Don't** usar emoji como ícone de interface — ícones são SVG inline de traço
  1.75 e tamanho 16px.
- **Don't** repetir a mesma entrada animada em toda seção, nem animar o que já
  está visível no primeiro quadro.
- **Don't** abrir tela clara sem tarefa de leitura ou digitação dentro dela.
- **Don't** empilhar filtros, contadores e selos na mesma tela: densidade de OTA
  é anti-referência declarada.
