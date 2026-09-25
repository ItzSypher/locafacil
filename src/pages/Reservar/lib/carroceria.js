/* Porte do veículo a partir do texto que a API devolve.
 *
 * Mora fora do componente porque o `VehicleImage` também precisa do nome do
 * porte para a legenda — e um arquivo que exporta componente e função ao mesmo
 * tempo quebra o fast refresh do Vite. */

const CARROCERIAS = {
  hatch: {
    nome: 'hatch',
    // Traseira que termina logo atrás da roda — é esse corte, e não o teto,
    // que faz o olho ler "hatch" a 150px de largura.
    corpo: 'M20 46 C20 40 23 37 29 36 L39 35 C42 26 48 20 57 18.5 L92 14 C104 12.6 113 15.4 121 22 L134 33 L141 34.6 C147 36 150 39.4 150 45 L150 53 C150 56 148 58 145 58 L25 58 C22 58 20 56 20 53 Z',
    vidro: 'M56 23.4 L88 19.6 C96 18.6 102 20.2 108 24.8 L119 33 L54 35.6 C52 35.6 51 34 52 31.4 Z',
    coluna: 'M86 19.8 L84 34.2',
    vinco: 'M28 45 L142 45',
    eixoD: 54, eixoT: 120, raio: 11,
    caixa: '8 4 154 72',
  },
  sedan: {
    nome: 'sedã',
    // Teto mais longo e porta-malas com volume proprio.
    corpo: 'M14 46 C14 40 17 37 23 36 L33 35 C36 27 42 21 51 19.5 L86 15.5 C97 14 106 16.5 114 22.5 L127 32.5 L158 36.5 C166 37.6 170 41 170 47 L170 53 C170 56 168 58 165 58 L19 58 C16 58 14 56 14 53 Z',
    vidro: 'M50 24 L82 20.8 C90 20 96 21.6 102 26 L112 33.4 L48 36 C46 36 45 34.5 46 32 Z',
    coluna: 'M80 21 L78 35',
    vinco: 'M22 45 L161 45',
    eixoD: 50, eixoT: 136, raio: 11,
    caixa: '4 4 174 72',
  },
  suv: {
    nome: 'SUV',
    // Mais alto, vão livre maior, traseira reta.
    corpo: 'M16 44 C16 37 19 33 25 32 L34 31 C37 22 43 16 53 14.5 L96 12 C107 11.4 115 14 122 20 L134 29 L157 33 C165 34.4 169 38 169 45 L169 53 C169 56 167 58 164 58 L21 58 C18 58 16 56 16 53 Z',
    vidro: 'M54 19.5 L92 17 C100 16.6 106 18.4 111 22.6 L120 30 L52 32 C50 32 49 30.4 50 28 Z',
    coluna: 'M88 17.2 L86 31',
    vinco: 'M24 43 L160 43',
    eixoD: 52, eixoT: 134, raio: 12.5,
    caixa: '6 2 172 74',
  },
}

/* A API não tem campo de carroceria: o porte sai do texto que ela devolve.
   A ordem importa — "SUV compacto" tem as duas palavras, e SUV vence. */
export function carroceriaDe(offer) {
  const texto = `${offer?.category ?? ''} ${offer?.description ?? ''} ${offer?.size ?? ''}`.toLowerCase()
  if (/\bsuv\b|utilit|pick[- ]?up|crossover/.test(texto)) return CARROCERIAS.suv
  if (/seda|sedã/.test(texto)) return CARROCERIAS.sedan
  return CARROCERIAS.hatch
}
