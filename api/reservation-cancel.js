import { otaFetch } from './_lib/otaClient.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, errors: ['Método não permitido'] })
  }

  const result = await otaFetch('api/aluguel/cancelamento-reserva', {
    method: 'POST',
    body: req.body,
    auth: true,
  })

  if (result.mock) {
    return res.status(200).json({ success: false, data: null, errors: ['Cancelamento indisponível em modo demonstração'] })
  }

  return res.status(result.status).json(result.json)
}
