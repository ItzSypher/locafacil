import { otaFetch } from './_lib/otaClient.js'
import { buildMockConfirmation } from './_lib/mockData.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, errors: ['Método não permitido'] })
  }

  const payload = req.body

  const result = await otaFetch('api/aluguel/confirmacao-reserva', {
    method: 'POST',
    body: payload,
    auth: true,
  })

  if (result.mock) {
    const mock = buildMockConfirmation({
      vehicle: payload?.VehResRQCore?.VehPrefs?.VehPref,
      customer: payload?.VehResRQCore?.Customer,
    })
    return res.status(200).json({ success: true, data: mock, errors: [] })
  }

  return res.status(result.status).json(result.json)
}
