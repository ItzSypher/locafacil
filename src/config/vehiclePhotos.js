/* Foto por grupo de veículo.
 *
 * A API da JCompany não devolve imagem: a disponibilidade traz código ACRISS,
 * descrição e preço, e nada de mídia. Então a foto é nossa.
 *
 * O grupo manda no arquivo, não o modelo. A API diz "Kwid ou similar" — a foto
 * mostra o Kwid porque é o representante daquele grupo, e a legenda avisa que
 * é ilustrativa. D PLUS e G usam a mesma foto de propósito: as duas descrições
 * dizem "Pulse ou similar", e inventar carro diferente para cada uma seria
 * prometer o que o contrato não separa.
 *
 * PARA TROCAR UMA FOTO
 *
 *   1. PNG com fundo branco ou transparente, carro em três quartos, em
 *      `public/__tmp-veiculos/<CODIGO>.png` (B, C, D, DP, E, G, GP).
 *   2. `node scripts/converter-veiculos.mjs` — recorta a moldura vazia, apaga
 *      o fundo e normaliza tudo em 800×600 sobre transparente.
 *   3. Apague `public/__tmp-veiculos/`.
 *
 * A normalização não é capricho: as fotos chegaram em 623×401, 667×374 e
 * 1100×628. Postas direto no card, cada uma ocuparia uma altura e a grade
 * dançaria de linha em linha.
 */

import grupoB from '../assets/veiculos/grupo-b.webp'
import grupoC from '../assets/veiculos/grupo-c.webp'
import grupoD from '../assets/veiculos/grupo-d.webp'
import grupoDP from '../assets/veiculos/grupo-dp.webp'
import grupoE from '../assets/veiculos/grupo-e.webp'
import grupoG from '../assets/veiculos/grupo-g.webp'
import grupoGP from '../assets/veiculos/grupo-gp.webp'

/** Código do grupo (ACRISS) → foto. Grupo fora daqui cai na ilustração. */
export const VEHICLE_PHOTOS = {
  B: grupoB,   // Kwid ou similar
  C: grupoC,   // Mobi ou similar
  D: grupoD,   // Argo ou similar
  DP: grupoDP, // Pulse ou similar
  E: grupoE,   // Cronos ou similar
  G: grupoG,   // Pulse ou similar
  GP: grupoGP, // Fastback ou similar
}

export function photoFor(groupCode) {
  if (!groupCode) return null
  return VEHICLE_PHOTOS[String(groupCode).toUpperCase()] ?? null
}
