/* Foto e modelo de referência por grupo de veículo.
 *
 * As fotos são as que a Locafácil cadastrou no SGLOC: a disponibilidade da API
 * traz `VehicleURLPhoto` em cada grupo, e o modelo sai do nome do arquivo que
 * está lá (mobi_pronto.jpg, polo_pronto.jpg...). A descrição do grupo na API é
 * só "GRUPO - B", então o modelo mora aqui, junto da foto que o representa.
 *
 * São PROVISÓRIAS (reunião de 29/09/2026): no SGLOC elas têm 366×192, boas no
 * celular e moles numa tela grande. Ficam sobre fundo branco, como chegaram —
 * recortar carro branco de fundo branco num JPEG desse tamanho come a lataria
 * e deixa franja no card escuro. Quando o Marcelo mandar os originais em alta:
 *
 *   1. PNG em `public/__tmp-veiculos/<CODIGO>.png` (B, C, D, DP, E, G, GP).
 *   2. `node scripts/converter-veiculos.mjs` — recorta a moldura vazia, apaga
 *      o fundo e normaliza tudo em 800×600 sobre transparente.
 *   3. Apague `public/__tmp-veiculos/` e tire o `fundo: 'branco'` daqui.
 *
 * O grupo manda no arquivo, não o modelo: a reserva é por grupo, e a legenda
 * avisa que a imagem é ilustrativa.
 */

import grupoB from '../assets/veiculos/grupo-b.webp'
import grupoC from '../assets/veiculos/grupo-c.webp'
import grupoD from '../assets/veiculos/grupo-d.webp'
import grupoDP from '../assets/veiculos/grupo-dp.webp'
import grupoE from '../assets/veiculos/grupo-e.webp'
import grupoG from '../assets/veiculos/grupo-g.webp'
import grupoGP from '../assets/veiculos/grupo-gp.webp'

/** Código do grupo (ACRISS) → foto, modelo e categoria. A categoria cobre a
    loja real, que não manda VehType. Grupo fora daqui cai na ilustração. */
export const VEHICLE_PHOTOS = {
  B: { foto: grupoB, modelo: 'Mobi', categoria: 'Econômico', fundo: 'branco' },
  C: { foto: grupoC, modelo: 'Polo', categoria: 'Hatch', fundo: 'branco' },
  D: { foto: grupoD, modelo: 'Onix Plus', categoria: 'Sedã', fundo: 'branco' },
  DP: { foto: grupoDP, modelo: 'Onix Plus', categoria: 'Sedã', fundo: 'branco' },
  E: { foto: grupoE, modelo: 'Strada', categoria: 'Picape', fundo: 'branco' },
  G: { foto: grupoG, modelo: 'Basalt', categoria: 'SUV', fundo: 'branco' },
  GP: { foto: grupoGP, modelo: 'Tera', categoria: 'SUV', fundo: 'branco' },
}

export function photoFor(groupCode) {
  if (!groupCode) return null
  return VEHICLE_PHOTOS[String(groupCode).trim().toUpperCase()] ?? null
}
