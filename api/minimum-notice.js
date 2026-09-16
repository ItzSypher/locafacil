import { otaFetch } from './_lib/otaClient.js'
import { mockMinimumNotice } from './_lib/mockData.js'

export default async function handler(req, res) {
  const { LocationCode } = req.query
  const result = await otaFetch('api/aluguel/pesquisa-antecedencia', {
    method: 'GET',
    params: { LocationCode },
  })

  if (result.json?.success) {
    return res.status(200).json(result.json)
  }

  // Local ainda não provisionado na API: mantém a regra padrão para não travar a busca.
  return res.status(200).json({ success: true, data: mockMinimumNotice, errors: [], demo: true })
}
