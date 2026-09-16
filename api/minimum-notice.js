import { otaFetch } from './_lib/otaClient.js'
import { mockMinimumNotice } from './_lib/mockData.js'

export default async function handler(req, res) {
  const { LocationCode } = req.query
  const result = await otaFetch('api/aluguel/pesquisa-antecedencia', {
    method: 'GET',
    params: { LocationCode },
  })

  if (result.mock) {
    return res.status(200).json({ success: true, data: mockMinimumNotice, errors: [] })
  }

  return res.status(result.status).json(result.json)
}
