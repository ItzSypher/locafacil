import { otaFetch, hasCredentials } from './_lib/otaClient.js'
import { mockMinimumPeriod } from './_lib/mockData.js'

export default async function handler(req, res) {
  const { LocationCode } = req.query

  // Ver api/locations.js: sem credenciais, o público responde por outro tenant.
  if (hasCredentials()) {
    const result = await otaFetch('api/aluguel/pesquisa-periodo-minimo', {
      method: 'GET',
      params: { LocationCode },
    })

    if (result.json?.success) {
      return res.status(200).json({ ...result.json, demo: false })
    }
  }

  return res.status(200).json({ success: true, data: mockMinimumPeriod, errors: [], demo: true })
}
