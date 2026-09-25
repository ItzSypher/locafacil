import { otaFetch } from './_lib/otaClient.js'
import { normalizeCancellation } from './_lib/otaNormalize.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, data: null, errors: ['Método não permitido'] })
  }

  const result = await otaFetch('api/aluguel/cancelamento-reserva', {
    method: 'POST',
    body: req.body,
    auth: true,
  })

  if (result.mock) {
    return res.status(200).json({
      success: false,
      data: null,
      errors: ['O cancelamento fica disponível assim que a integração com o sistema de locação for liberada.'],
      demo: true,
    })
  }

  if (!result.json?.success) {
    const errors = result.json?.errors?.length
      ? result.json.errors
      : ['Não foi possível cancelar a reserva. Fale com a loja.']
    return res.status(result.status).json({ success: false, data: null, errors, demo: false })
  }

  return res.status(result.status).json({
    success: true,
    data: normalizeCancellation(result.json),
    errors: [],
    demo: false,
  })
}
