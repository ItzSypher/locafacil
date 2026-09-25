import { otaFetch } from './_lib/otaClient.js'
import { buildMockAvailability, buildMockQuoteId } from './_lib/mockData.js'
import { normalizeAvailability } from './_lib/otaNormalize.js'

const QUOTE_TTL_MS = 15 * 60 * 1000

// Cenários de teste, só fora de produção. Ver MOCK_SCENARIOS em _lib/mockData.js.
function scenarioFrom(req) {
  if (process.env.NODE_ENV === 'production') return 'ok'
  return req.query?.cenario || 'ok'
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, data: null, errors: ['Método não permitido'] })
  }

  const payload = req.body
  const core = payload?.VehAvailRQCore?.VehRentalCore

  const result = await otaFetch('api/aluguel/pesquisa-disponibilidade', {
    method: 'POST',
    body: payload,
    auth: true,
  })

  if (result.mock) {
    const scenario = scenarioFrom(req)

    if (scenario === 'lento') await sleep(3000)

    if (scenario === 'erro-422') {
      return res.status(422).json({
        success: false,
        data: null,
        errors: ['Não há veículos disponíveis para o período solicitado.'],
        demo: true,
      })
    }

    const raw = buildMockAvailability({
      pickUpDateTime: core?.PickUpDateTime,
      returnDateTime: core?.ReturnDateTime,
      scenario,
    })

    const expiresAt = scenario === 'expirado'
      ? new Date(Date.now() - 60 * 1000).toISOString()
      : new Date(Date.now() + QUOTE_TTL_MS).toISOString()

    const data = normalizeAvailability({
      data: raw,
      quoteId: buildMockQuoteId(),
      expiresAt,
    })

    return res.status(200).json({ success: true, data, errors: [], demo: true })
  }

  if (!result.json?.success) {
    const errors = result.json?.errors?.length
      ? result.json.errors
      : ['Não há veículos disponíveis para o período solicitado.']
    return res.status(result.status).json({ success: false, data: null, errors, demo: false })
  }

  return res.status(result.status).json({
    success: true,
    data: normalizeAvailability(result.json),
    errors: [],
    demo: false,
  })
}
