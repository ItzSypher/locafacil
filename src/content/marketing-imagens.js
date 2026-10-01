/* Imagens do site: o que a agência de design (Marketins) entrega por
 * /doc/marketing.
 *
 * A partir da revisão do Marcelo Sousa (01/10/2026), todas as imagens do site
 * passam pelo time de design: as fotos das seções, as logos das montadoras e
 * as fotos da frota. Este arquivo é a ficha de cada espaço — onde fica, o que
 * o cliente pediu, a copy que vai junto e o tamanho em que o arquivo deve vir.
 *
 * As medidas não são chutadas: `node scripts/capturar-espacos.mjs` abre o
 * site em 1440, 768 e 390, mede cada imagem como o navegador a desenha e
 * grava `marketing-imagens-medidas.json` (e os recortes em
 * `public/doc/marketing/espacos/`). O tamanho de exportação é o dobro da
 * maior caixa medida, arredondado para cima, na proporção escolhida aqui.
 *
 * A copy de cada espaço é a que está no ar, transcrita do código (o arquivo
 * de origem vai em `arquivo`). Ela NÃO vem do inventário de copy
 * (`src/content/copy/inventario.json`), que guarda os textos de antes da
 * revisão — é contra eles que o retorno do cliente foi escrito. Se um texto
 * mudar no site, mude aqui também.
 */

import medidas from './marketing-imagens-medidas.json'

import image1 from '../assets/images/image-1.webp'
import image3 from '../assets/images/image-3.webp'
import image4 from '../assets/images/image-4.webp'
import image5 from '../assets/images/image-5.webp'
import image6 from '../assets/images/image-6.webp'
import headerEmpresas from '../assets/images/header-empresas.webp'

import nissan from '../assets/images/nissan.webp'
import hyundai from '../assets/images/hyundai.webp'
import chevrolet from '../assets/images/chevrolet.webp'
import renault from '../assets/images/renault.webp'

import grupoB from '../assets/veiculos/grupo-b.webp'
import grupoC from '../assets/veiculos/grupo-c.webp'
import grupoD from '../assets/veiculos/grupo-d.webp'
import grupoDP from '../assets/veiculos/grupo-dp.webp'
import grupoE from '../assets/veiculos/grupo-e.webp'
import grupoG from '../assets/veiculos/grupo-g.webp'
import grupoGP from '../assets/veiculos/grupo-gp.webp'

export const MEDIDO_EM = medidas.medidoEm

export const REVISAO = {
  quem: 'Marcelo Sousa',
  data: '01/10/2026',
}

/* Limite do envio pela página, por arquivo. É o mesmo de `api/retornos.js`:
   a Vercel não aceita corpo acima de 4,5 MB, e o arquivo viaja em base64. */
export const LIMITE_ENVIO = 3 * 1024 * 1024

export const FORMATOS_ACEITOS = {
  extensoes: ['jpg', 'jpeg', 'png', 'webp', 'svg'],
  tipos: { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp', svg: 'image/svg+xml' },
  accept: '.jpg,.jpeg,.png,.webp,.svg,image/jpeg,image/png,image/webp,image/svg+xml',
}

/* -------------------------------------------------------------- medidas -- */

const ROTULO_FORMATO = { desktop: 'Computador (1440)', tablet: 'Tablet (768)', celular: 'Celular (390)' }

/** Caixas medidas de um espaço, na ordem computador, tablet, celular. */
export function caixasDe(id) {
  const formatos = medidas[id]?.formatos ?? {}
  return ['desktop', 'tablet', 'celular']
    .filter((nome) => formatos[nome]?.imagens?.length)
    .map((nome) => {
      const imagem = formatos[nome].imagens[0]
      return {
        formato: nome,
        rotulo: ROTULO_FORMATO[nome],
        largura: Math.round(imagem.largura),
        altura: Math.round(imagem.altura),
      }
    })
}

/** Recorte destacado de um espaço num formato (`desktop` ou `celular`). */
export function recorteDe(id, formato) {
  return medidas[id]?.formatos?.[formato]?.recorte ?? null
}

/** Altura renderizada das logos, por formato (a faixa fixa a altura). */
export function alturasDasLogos() {
  const formatos = medidas['home-04-montadoras']?.formatos ?? {}
  return ['desktop', 'tablet', 'celular']
    .filter((nome) => formatos[nome]?.imagens?.length)
    .map((nome) => ({
      formato: nome,
      rotulo: ROTULO_FORMATO[nome],
      altura: Math.round(formatos[nome].imagens[0].altura),
    }))
}

/**
 * Área segura de uma imagem cortada com `object-cover`.
 *
 * A caixa muda de forma entre celular, tablet e computador, e o navegador
 * corta o que sobra, sempre a partir do centro. A área segura é o retângulo
 * central que aparece em TODAS as caixas medidas: rosto, carro e logotipo
 * precisam ficar dentro dele.
 */
export function areaSegura(id, [largura, altura]) {
  const proporcao = largura / altura
  let visivelL = largura
  let visivelA = altura
  for (const caixa of caixasDe(id)) {
    const forma = caixa.largura / caixa.altura
    if (forma < proporcao) visivelL = Math.min(visivelL, altura * forma)
    else visivelA = Math.min(visivelA, largura / forma)
  }
  const l = Math.floor(visivelL / 10) * 10
  const a = Math.floor(visivelA / 10) * 10
  return {
    largura: l,
    altura: a,
    pctLargura: Math.round((l / largura) * 100),
    pctAltura: Math.round((a / altura) * 100),
  }
}

/* --------------------------------------------------------------- espaços -- */

/* Cada espaço de foto. `corte`:
     'cover'   a caixa tem forma própria e corta a foto (há área segura);
     'inteira' a foto aparece inteira e a altura da caixa segue o arquivo —
               a proporção pedida é a que mantém o desenho da página. */
export const ESPACOS = [
  {
    id: 'home-05-solucoes-assinatura',
    pagina: 'Home',
    parte: 'Soluções que movem você · Assinatura Locafacil',
    rota: '/',
    pedido: 'Trocar as imagens.',
    leitura:
      'Primeiro dos dois blocos da seção. A foto fica à esquerda no computador e em cima do texto no celular, cortada para caber na caixa.',
    copy: {
      arquivo: 'src/pages/Home/Content.jsx',
      textos: [
        { tipo: 'Título da seção', texto: 'Soluções que movem você.' },
        { tipo: 'Título do bloco', texto: 'Assinatura Locafacil' },
        { tipo: 'Linha de apoio', texto: 'Esqueça tudo o que você sabe sobre ter carro.' },
        {
          tipo: 'Texto',
          texto:
            'Esqueça as preocupações com oficina, IPVA, seguro e depreciação. Com a Assinatura Locafacil, você escolhe o carro, pega a chave e deixa o restante com a gente. Uma forma prática, inteligente e sem complicação de ter um carro à sua disposição.',
        },
        { tipo: 'Botão', texto: 'Quero saber da assinatura' },
      ],
    },
    atual: { src: image1, arquivo: 'image-1.webp', largura: 620, altura: 358 },
    corte: 'cover',
    proporcao: '4:3',
    exportar: [1600, 1200],
    formato: 'WebP (ou JPG)',
    peso: '350 KB',
    nome: 'home-solucoes-assinatura.webp',
  },
  {
    id: 'home-05-solucoes-empresas',
    pagina: 'Home',
    parte: 'Soluções que movem você · Locafacil Empresas',
    rota: '/',
    pedido:
      'Trocar as imagens. Na parte de empresas, um carro hatch junto com um carro mais alto; hoje não há Fiorino nem carro de entregas na frota.',
    leitura:
      'A foto de hoje mostra uma van de entregas, que a Locafacil não tem. Da frota atual: hatch é o Mobi ou o Polo; mais alto é o Basalt ou o Tera (SUV), ou a picape Strada.',
    copy: {
      arquivo: 'src/pages/Home/Content.jsx',
      textos: [
        { tipo: 'Título do bloco', texto: 'Locafacil Empresas' },
        { tipo: 'Linha de apoio', texto: 'Seu negócio não pode parar.' },
        {
          tipo: 'Texto',
          texto:
            'Terceirizar a frota da sua empresa é a jogada de mestre para salvar o fluxo de caixa. Modelos ideais para a sua operação girar forte, sem você esquentar a cabeça com burocracia.',
        },
        { tipo: 'Botão', texto: 'Receber proposta comercial' },
      ],
    },
    atual: { src: image3, arquivo: 'image-3.webp', largura: 620, altura: 358 },
    corte: 'cover',
    proporcao: '4:3',
    exportar: [1600, 1200],
    formato: 'WebP (ou JPG)',
    peso: '350 KB',
    nome: 'home-solucoes-empresas.webp',
  },
  {
    id: 'home-06-por-que',
    pagina: 'Home',
    parte: 'Por que alugar com a Locafacil?',
    rota: '/',
    pedido: 'Imagens melhores, com mais a cara da Locafacil.',
    leitura: 'A foto fica ao lado da lista de quatro motivos, inteira, com cantos arredondados.',
    compartilhada: 'empresas-contato-06-contato-equipe',
    copy: {
      arquivo: 'src/pages/Home/Content.jsx',
      textos: [
        { tipo: 'Título da seção', texto: 'Por que alugar com a Locafacil?' },
        { tipo: 'Motivo', texto: 'Aceleração de aprovação' },
        {
          tipo: 'Descrição',
          texto: 'Você tem pressa. Então cortamos a burocracia inútil. Do orçamento à chave na mão num piscar de olhos.',
        },
        { tipo: 'Motivo', texto: 'O que você vê é o que você paga' },
        {
          tipo: 'Descrição',
          texto:
            'Sem surpresas na hora de fechar a locação. Na Locafacil, você conhece as condições e os valores com clareza desde o início, com um contrato simples, transparente e direto.',
        },
        { tipo: 'Motivo', texto: 'Máquinas selecionadas a dedo' },
        {
          tipo: 'Descrição',
          texto: 'Só trabalhamos com veículos novos ou recém-revisados das melhores marcas. Sente, ligue e sinta o conforto.',
        },
        { tipo: 'Motivo', texto: 'Gente de verdade do outro lado' },
        {
          tipo: 'Descrição',
          texto:
            'Nada de atendimento frio ou respostas automáticas. Na Locafácil, você fala com uma equipe preparada para ouvir, entender e resolver o que você precisa.',
        },
      ],
    },
    atual: { src: image4, arquivo: 'image-4.webp', largura: 727, altura: 563 },
    corte: 'inteira',
    proporcao: '4:3',
    exportar: [1600, 1200],
    formato: 'WebP (ou JPG)',
    peso: '350 KB',
    nome: 'home-por-que.webp',
  },
  {
    id: 'empresas-contato-01-empresas-topo',
    pagina: 'Para Empresas',
    parte: 'Topo da página (banner)',
    rota: '/para-empresas',
    pedido: 'Trocar a imagem do banner.',
    leitura:
      'É uma arte recortada, sem fundo, sobre o degradê azul-escuro do topo: hoje dois carros brancos sobre manchas nas cores da marca. Ela flutua devagar e o site já põe uma sombra por baixo — não precisa vir com sombra pesada.',
    copy: {
      arquivo: 'src/pages/Empresas/Header.jsx',
      textos: [
        { tipo: 'Título', texto: 'Locafacil Business' },
        { tipo: 'Texto', texto: 'Eficiência em movimento: soluções completas em terceirização de frota.' },
        { tipo: 'Botão', texto: 'Solicitar Proposta Comercial' },
      ],
    },
    atual: { src: headerEmpresas, arquivo: 'header-empresas.webp', largura: 899, altura: 687 },
    corte: 'inteira',
    proporcao: '4:3',
    exportar: [1200, 900],
    formato: 'PNG ou WebP com fundo transparente',
    peso: '400 KB',
    nome: 'empresas-topo.png',
    transparente: true,
  },
  {
    id: 'empresas-contato-02-empresas-crescer',
    pagina: 'Para Empresas',
    parte: 'Crescer dói, mas não precisa ser assim',
    rota: '/para-empresas',
    pedido: 'Imagem sem veículos de serviço.',
    leitura:
      'Foto inteira ao lado do texto, cantos arredondados. A de hoje é uma fila de vans brancas, em preto e branco — veículo de serviço, que a frota não tem.',
    copy: {
      arquivo: 'src/pages/Empresas/Content.jsx',
      textos: [
        { tipo: 'Título', texto: 'Crescer dói, mas não precisa ser assim.' },
        {
          tipo: 'Texto',
          texto:
            'Com a Locafacil Business, sua empresa conta com muito mais do que uma frota: conta com uma consultoria especializada em mobilidade.',
        },
        {
          tipo: 'Texto',
          texto:
            'Entendemos a necessidade da sua operação, analisamos o perfil de uso dos veículos e desenvolvemos uma solução sob medida para reduzir custos, simplificar a gestão e dar mais eficiência ao seu negócio.',
        },
        {
          tipo: 'Texto',
          texto:
            'Cuidamos da gestão da frota, manutenção e suporte, para que sua empresa possa focar no que realmente importa: crescer com segurança e eficiência.',
        },
        { tipo: 'Botão', texto: 'Solicitar Cotação Agora' },
      ],
    },
    atual: { src: image5, arquivo: 'image-5.webp', largura: 766, altura: 423 },
    corte: 'inteira',
    proporcao: '16:9',
    exportar: [1600, 900],
    formato: 'WebP (ou JPG)',
    peso: '300 KB',
    nome: 'empresas-crescer.webp',
  },
  {
    id: 'empresas-contato-03-empresas-motivos',
    pagina: 'Para Empresas',
    parte: '4 motivos para contratar hoje',
    rota: '/para-empresas',
    pedido: 'Imagens melhores.',
    leitura: 'Foto em pé, inteira, ao lado da lista de motivos. É o espaço mais alto do site.',
    compartilhada: 'empresas-contato-05-contato-topo',
    copy: {
      arquivo: 'src/pages/Empresas/Content.jsx',
      textos: [
        { tipo: 'Título da seção', texto: '4 motivos para contratar hoje' },
        { tipo: 'Motivo', texto: 'Custos' },
        {
          tipo: 'Descrição',
          texto:
            'Com a terceirização de frota da Locafacil você reduz custos e elimina gastos inesperados com manutenções e substituição de veículos. Na prática é a sua empresa operando forte, com custo fixo mensal e sem surpresas desagradáveis.',
        },
        { tipo: 'Motivo', texto: 'Agilidade' },
        {
          tipo: 'Descrição',
          texto:
            'A Locafacil Business garante o processo de contratação mais ágil do mercado. Sem sua empresa pagar caução, com atendimento humanizado e planos 100% personalizados de acordo com sua necessidade.',
        },
        { tipo: 'Motivo', texto: 'Foco' },
        {
          tipo: 'Descrição',
          texto:
            'Você, empresário, sabe bem que tempo + foco = resultado! Terceirizando sua frota com a Locafacil Business você ganha tempo para pensar no que realmente importa. O crescimento da sua empresa.',
        },
        { tipo: 'Motivo', texto: 'Planejamento' },
        {
          tipo: 'Descrição',
          texto:
            'Transformar despesas variáveis em custos fixos auxiliará todo o seu processo de gestão financeira e planejamento operacional. Além disso, você conta com a nossa flexibilidade de poder aumentar a frota sempre que quiser.',
        },
      ],
    },
    atual: { src: image6, arquivo: 'image-6.webp', largura: 794, altura: 1021 },
    corte: 'inteira',
    proporcao: '4:5',
    exportar: [1600, 2000],
    formato: 'WebP (ou JPG)',
    peso: '450 KB',
    nome: 'empresas-motivos.webp',
  },
  {
    id: 'empresas-contato-05-contato-topo',
    pagina: 'Contato',
    parte: 'Topo da página',
    rota: '/contato',
    pedido: 'Trocar as imagens.',
    leitura:
      'Arte recortada, sem fundo, sobre o degradê azul-escuro do topo: hoje três fotos sobrepostas com formas nas cores da marca. Flutua devagar, como a do topo de Para Empresas.',
    compartilhada: 'empresas-contato-03-empresas-motivos',
    copy: {
      arquivo: 'src/pages/Contato/Header.jsx',
      textos: [
        { tipo: 'Título', texto: 'Estamos aqui por você.' },
        { tipo: 'Texto', texto: 'Conheça a equipe por trás da Locafacil e entre em contato conosco.' },
      ],
    },
    atual: { src: image6, arquivo: 'image-6.webp', largura: 794, altura: 1021 },
    corte: 'inteira',
    proporcao: '4:5',
    exportar: [1200, 1500],
    formato: 'PNG ou WebP com fundo transparente',
    peso: '450 KB',
    nome: 'contato-topo.png',
    transparente: true,
  },
  {
    id: 'empresas-contato-06-contato-equipe',
    pagina: 'Contato',
    parte: 'Pessoas que fazem acontecer (equipe)',
    rota: '/contato',
    pedido: 'Trocar as imagens.',
    leitura: 'Foto inteira ao lado do texto sobre a equipe, cantos arredondados.',
    compartilhada: 'home-06-por-que',
    copy: {
      arquivo: 'src/pages/Contato/Content.jsx',
      textos: [
        { tipo: 'Título da seção', texto: 'Pessoas que fazem acontecer.' },
        {
          tipo: 'Texto',
          texto:
            'Nossa equipe é formada por especialistas apaixonados por mobilidade. Mais do que alugar carros, trabalhamos para oferecer a melhor experiência.',
        },
        { tipo: 'Título do bloco', texto: 'Um atendimento humano e próximo' },
        {
          tipo: 'Texto',
          texto:
            'Acreditamos que a tecnologia deve facilitar processos, mas o atendimento precisa ser humano. Nossa equipe de especialistas está sempre pronta para entender a sua necessidade e encontrar o plano ideal para você ou para a sua empresa.',
        },
        {
          tipo: 'Texto',
          texto: 'Sem robôs, sem burocracia desnecessária. Fale diretamente com quem pode resolver o seu problema.',
        },
      ],
    },
    atual: { src: image4, arquivo: 'image-4.webp', largura: 727, altura: 563 },
    corte: 'inteira',
    proporcao: '4:3',
    exportar: [1600, 1200],
    formato: 'WebP (ou JPG)',
    peso: '350 KB',
    nome: 'contato-equipe.webp',
  },
]

export const ESPACO_POR_ID = new Map(ESPACOS.map((espaco) => [espaco.id, espaco]))

/* ----------------------------------------------------------------- logos -- */

export const LOGOS = {
  id: 'home-04-montadoras',
  pagina: 'Home',
  parte: 'Montadoras que fazem parte da nossa frota',
  rota: '/',
  pedido:
    'Logos de Fiat, Renault, Citroën, Hyundai, BYD, Nissan, Chevrolet, Volkswagen, Jeep, Peugeot, Geely e GWM. A Ford sai.',
  copy: {
    arquivo: 'src/pages/Home/Content.jsx',
    textos: [{ tipo: 'Título da seção', texto: 'Montadoras que fazem parte da nossa frota' }],
  },
  /* Na ordem do pedido do cliente. `atual` é a logo que já está no site. */
  marcas: [
    { id: 'fiat', nome: 'Fiat' },
    { id: 'renault', nome: 'Renault', atual: { src: renault, arquivo: 'renault.webp', largura: 118, altura: 98 } },
    { id: 'citroen', nome: 'Citroën' },
    { id: 'hyundai', nome: 'Hyundai', atual: { src: hyundai, arquivo: 'hyundai.webp', largura: 121, altura: 71 } },
    { id: 'byd', nome: 'BYD' },
    { id: 'nissan', nome: 'Nissan', atual: { src: nissan, arquivo: 'nissan.webp', largura: 115, altura: 100 } },
    { id: 'chevrolet', nome: 'Chevrolet', atual: { src: chevrolet, arquivo: 'chevrolet.webp', largura: 107, altura: 59 } },
    { id: 'volkswagen', nome: 'Volkswagen' },
    { id: 'jeep', nome: 'Jeep' },
    { id: 'peugeot', nome: 'Peugeot' },
    { id: 'geely', nome: 'Geely' },
    { id: 'gwm', nome: 'GWM' },
  ],
  sai: 'Ford',
  /* A regra de simetria. A faixa fixa a ALTURA de cada logo (40 px no
     celular, 48 no tablet, 56 no computador) e deixa a largura livre — então
     é o respiro dentro do arquivo que decide o tamanho que cada marca
     aparenta. Hoje cada arquivo tem um respiro, e a Nissan parece menor que a
     Ford. A regra abaixo iguala isso. */
  regras: [
    {
      titulo: 'Mesma caixa para todas',
      texto:
        'Arte com 240 px de altura (no SVG, viewBox com 240 de altura) e fundo transparente. A marca ocupa a altura toda menos 12 px de respiro em cima e embaixo: 216 px de marca. A largura é a da marca, sem respiro dos lados — o espaço entre as logos o site já põe.',
    },
    {
      titulo: 'Mesmo peso visual',
      texto:
        'Emblema (Chevrolet, Renault, Volkswagen, Nissan) ocupa os 216 px de altura. Marca só de letras, larga (Geely, GWM, BYD, Jeep), não passa de 3 vezes a altura: 720 px de largura no máximo, e aí fica mais baixa. Assim nenhuma domina a faixa, como a Ford dominava.',
    },
    {
      titulo: 'Versão plana, uma cor',
      texto:
        'A versão oficial plana da marca, numa cor só: a cor oficial, ou preto quando a marca não tem versão plana colorida. Nada de cromado, 3D, brilho ou sombra — as de hoje são cromadas e, no cinza da faixa, viram borrão. O site deixa todas em cinza a 50% e mostra a cor ao passar o mouse.',
    },
    {
      titulo: 'Emblema com nome ou só o emblema: igual para todas',
      texto:
        'Hoje vêm emblema e nome juntos (Hyundai, Chevrolet, Renault). Mantenha o mesmo critério nas doze: se a marca tem versão com o nome embaixo, use essa.',
    },
  ],
  formato: 'SVG (de preferência) ou PNG transparente com 240 px de altura',
  peso: '30 KB por logo',
  nome: 'logo-<marca>.svg (ex.: logo-fiat.svg, logo-citroen.svg)',
}

/* ----------------------------------------------------------------- frota -- */

export const FROTA = {
  id: 'frota',
  pagina: 'Reserva',
  parte: 'Escolha do veículo: a foto de cada grupo',
  rota: '/reservar/veiculos',
  pedido:
    'Brancos ou prata, três quartos de frente, com pelo menos 1.200 px de largura, fundo branco ou transparente. Outros modelos por grupo podem vir, com nome e grupo.',
  duvida: 'O Basalt grafite pode ficar?',
  leitura:
    'As fotos de hoje são provisórias: vieram do sistema da loja com 366×192 px, boas no celular e moles numa tela grande. No site, cada foto entra numa placa 4:3 (800×600 hoje) com a legenda "<modelo> ou similar · imagem ilustrativa".',
  grupos: [
    { codigo: 'B', modelo: 'Mobi', categoria: 'Econômico', atual: grupoB },
    { codigo: 'C', modelo: 'Polo', categoria: 'Hatch', atual: grupoC },
    { codigo: 'D', modelo: 'Onix Plus', categoria: 'Sedã', atual: grupoD },
    { codigo: 'DP', modelo: 'Onix Plus automático', categoria: 'Sedã', atual: grupoDP },
    { codigo: 'E', modelo: 'Strada', categoria: 'Picape', atual: grupoE },
    { codigo: 'G', modelo: 'Basalt', categoria: 'SUV', atual: grupoG, observacao: 'Hoje em grafite. Dúvida em aberto: pode ficar?' },
    { codigo: 'GP', modelo: 'Tera', categoria: 'SUV', atual: grupoGP },
  ],
  proporcao: '4:3',
  exportar: [1600, 1200],
  formato: 'PNG transparente (de preferência), WebP com transparência ou JPG em fundo branco puro',
  peso: '1,5 MB por foto (nós convertemos para o site)',
  regras: [
    'Carro branco ou prata, três quartos de frente, inteiro: rodas, retrovisores e antena dentro do quadro.',
    'Fundo transparente ou branco puro (#FFFFFF), sem chão, sem reflexo e sem sombra longa. Sombra curta de contato, se vier, embaixo das rodas.',
    'O carro ocupa cerca de 90% da largura da placa, centrado. Mesmo ângulo e mesma altura de câmera em todos, para a grade não dançar.',
    'Sem placa legível e sem marca de outra locadora.',
    'Outro modelo para o mesmo grupo é bem-vindo: diga o modelo e o grupo no nome do arquivo.',
  ],
  nome: 'frota-grupo-<código>-<modelo>.png (ex.: frota-grupo-b-mobi.png)',
}

/* Nome de arquivo sugerido para a foto de um grupo, sem acento:
   `frota-grupo-dp-onix-plus-automatico`. Sem extensão: quem chama põe. */
export function nomeDoGrupo(grupo) {
  const modelo = grupo.modelo
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
  return `frota-grupo-${grupo.codigo.toLowerCase()}-${modelo}`
}

/* Todos os destinos de envio, com o rótulo que /doc/retornos mostra. O id é
   o que vai no caminho do Blob (`marketing-arquivos/<pessoa>/<id>/`). */
export const DESTINOS = [
  ...ESPACOS.map((espaco) => ({ id: espaco.id, rotulo: `${espaco.pagina} · ${espaco.parte}` })),
  { id: LOGOS.id, rotulo: `${LOGOS.pagina} · Logos das montadoras` },
  ...FROTA.grupos.map((grupo) => ({
    id: `frota-${grupo.codigo.toLowerCase()}`,
    rotulo: `Frota · Grupo ${grupo.codigo} (${grupo.modelo})`,
  })),
]

export const ROTULO_DO_DESTINO = new Map(DESTINOS.map((destino) => [destino.id, destino.rotulo]))
