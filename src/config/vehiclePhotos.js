/* ============================================================================
 * Foto por grupo de veículo
 * ----------------------------------------------------------------------------
 * A API da JCompany não devolve imagem: a disponibilidade traz código ACRISS,
 * descrição e preço, e nada de mídia. Então a foto é nossa.
 *
 * COMO ADICIONAR UMA FOTO
 *
 *   1. Coloque o arquivo em `src/assets/veiculos/` — de preferência `.webp`,
 *      com fundo claro e neutro, o carro em três quartos, recortado.
 *      Proporção de trabalho: 4:3. Largura útil: 800px basta (o card mostra
 *      no máximo ~380px em tela de alta densidade).
 *   2. Importe aqui e associe ao código do grupo.
 *
 *      import grupoB from '../assets/veiculos/grupo-b.webp'
 *      export const VEHICLE_PHOTOS = { B: grupoB }
 *
 * O `VehicleImage` faz o resto: grupo com foto mostra a foto, grupo sem foto
 * cai na ilustração do `VehicleArt`. Não é preciso tocar em componente nenhum,
 * e a tela nunca fica com buraco.
 *
 * POR QUE ESTÁ VAZIO
 *
 * A reserva é por **grupo** (B, C, D, D PLUS, E, G, G PLUS), não por modelo —
 * a própria descrição da API diz "Kwid ou similar". Uma foto de um carro
 * específico promete o que o contrato não garante, então ela precisa ser da
 * frota real ou, no mínimo, do mesmo porte.
 *
 * Procurei um conjunto de banco de imagem que servisse como provisório e não
 * encontrei: o acervo livre tem carro de luxo, esportivo e pátio de
 * estacionamento, e quase nada de econômico em fundo neutro. Um conjunto
 * remendado — um hatch azul, um sedã preto de estúdio e um Mini clássico —
 * ficaria pior do que a ilustração, que ao menos é coerente entre os sete
 * grupos e não promete modelo nenhum.
 *
 * Assim que as fotos da frota chegarem, é preencher este objeto.
 * ==========================================================================*/

/** @type {Record<string, string>} código do grupo (ACRISS) → imagem importada */
export const VEHICLE_PHOTOS = {}

export function photoFor(groupCode) {
  if (!groupCode) return null
  return VEHICLE_PHOTOS[String(groupCode).toUpperCase()] ?? null
}
