import { otaFetch } from './_lib/otaClient.js'
import { buildMockConfirmation } from './_lib/mockData.js'
import { normalizeReservation } from './_lib/otaNormalize.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, data: null, errors: ['Método não permitido'] })
  }

  const payload = req.body ?? {}
  const core = payload.VehResRQCore ?? {}

  // Campos `_*` são espelhos locais para a fixture; nunca vão para a API real.
  const otaPayload = Object.fromEntries(
    Object.entries(payload).filter(([key]) => !key.startsWith('_')),
  )

  const result = await otaFetch('api/aluguel/confirmacao-reserva', {
    method: 'POST',
    body: otaPayload,
    auth: true,
  })

  if (result.mock) {
    // O front manda um espelho do veículo escolhido em `_mockVehicle` só para
    // a fixture conseguir devolver a mesma reserva que a tela montou. A API
    // real ignora campos extras; quando as credenciais entrarem, este ramo
    // deixa de existir.
    const mock = buildMockConfirmation({
      vehicle: payload?._mockVehicle ?? { Code: core.VehPrefs?.VehPref?.Code, VehMakeModel: { Name: core.VehPrefs?.VehPref?.Code } },
      customer: core.Customer,
      pickUpDateTime: core.VehRentalCore?.PickUpDateTime,
      returnDateTime: core.VehRentalCore?.ReturnDateTime,
      totals: payload?._mockTotals,
      coverages: payload?._mockCoverages ?? [],
      equipments: payload?._mockEquipments ?? [],
    })

    return res.status(200).json({
      success: true,
      data: normalizeReservation(mock),
      errors: [],
      demo: true,
    })
  }

  if (!result.json?.success) {
    const errors = result.json?.errors?.length
      ? result.json.errors
      : ['Não foi possível confirmar a reserva. Tente novamente.']
    return res.status(result.status).json({ success: false, data: null, errors, demo: false })
  }

  return res.status(result.status).json({
    success: true,
    data: normalizeReservation(result.json),
    errors: [],
    demo: false,
  })
}
