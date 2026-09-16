import { otaFetch } from './_lib/otaClient.js'
import { mockMinimumPeriod } from './_lib/mockData.js'

export default async function handler(req, res) {
  const { LocationCode } = req.query
  const result = await otaFetch('api/aluguel/pesquisa-periodo-minimo', {
    method: 'GET',
    params: { LocationCode },
  })

  if (result.mock) {
    return res.status(200).json({ success: true, data: mockMinimumPeriod, errors: [] })
  }

  return res.status(result.status).json(result.json)
}
