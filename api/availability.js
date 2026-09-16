import { otaFetch } from './_lib/otaClient.js'
import { buildMockAvailability, buildMockQuoteId } from './_lib/mockData.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, errors: ['Método não permitido'] })
  }

  const payload = req.body
  const core = payload?.VehAvailRQCore?.VehRentalCore

  const result = await otaFetch('api/aluguel/pesquisa-disponibilidade', {
    method: 'POST',
    body: payload,
    auth: true,
  })

  if (result.mock) {
    const quoteId = buildMockQuoteId()
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString()
    return res.status(200).json({
      success: true,
      data: { VehAvailRSCore: buildMockAvailability({
        pickUpDateTime: core?.PickUpDateTime,
        returnDateTime: core?.ReturnDateTime,
      }).VehAvailRSCore },
      errors: [],
      quoteId,
      expiresAt,
      redirectUrl: null,
    })
  }

  return res.status(result.status).json(result.json)
}
