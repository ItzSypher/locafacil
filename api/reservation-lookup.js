import { otaFetch } from './_lib/otaClient.js'
import { buildMockLookup } from './_lib/mockData.js'
import { normalizeReservation } from './_lib/otaNormalize.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, data: null, errors: ['Método não permitido'] })
  }

  const result = await otaFetch('api/aluguel/consulta-reserva', {
    method: 'POST',
    body: req.body,
    auth: true,
  })

  if (result.mock) {
    // Em desenvolvimento devolve uma reserva de exemplo, senão a tela de
    // detalhe e o cancelamento nunca chegam a ser exercitados. Em produção
    // continua dizendo a verdade: sem integração, não há o que consultar.
    if (process.env.NODE_ENV !== 'production') {
      const core = req.body?.VehRetResRQCore ?? {}
      return res.status(200).json({
        success: true,
        data: normalizeReservation(buildMockLookup({
          confId: core.UniqueID?.ID,
          surname: core.PersonName?.Surname,
        })),
        errors: [],
        demo: true,
      })
    }

    return res.status(200).json({
      success: false,
      data: null,
      errors: ['A consulta de reservas fica disponível assim que a integração com o sistema de locação for liberada.'],
      demo: true,
    })
  }

  if (!result.json?.success) {
    const errors = result.json?.errors?.length
      ? result.json.errors
      : ['Reserva não encontrada. Confira o localizador e o sobrenome.']
    return res.status(result.status).json({ success: false, data: null, errors, demo: false })
  }

  return res.status(result.status).json({
    success: true,
    data: normalizeReservation(result.json),
    errors: [],
    demo: false,
  })
}
