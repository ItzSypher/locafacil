import { otaFetch } from './_lib/otaClient.js'
import { mockLocations } from './_lib/mockData.js'

// A API real devolve um array puro [{id, descricao, iata}]; o portal precisa
// de um `code` utilizável como LocationCode (IATA quando cadastrado, senão id).
function normalize(list) {
  return list.map((loc) => ({
    id: loc.id,
    descricao: loc.descricao,
    iata: loc.iata,
    code: loc.iata || String(loc.id),
  }))
}

export default async function handler(req, res) {
  const result = await otaFetch('api/get-locais', { method: 'GET' })

  const real = Array.isArray(result.json) ? result.json : result.json?.data
  if (Array.isArray(real) && real.length > 0) {
    return res.status(200).json({ success: true, data: normalize(real), errors: [], demo: false })
  }

  return res.status(200).json({ success: true, data: normalize(mockLocations), errors: [], demo: true })
}
