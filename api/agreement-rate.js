import { otaFetch } from './_lib/otaClient.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, errors: ['Método não permitido'] })
  }

  // Endpoint público na API OTA: sempre consulta tarifas reais.
  const result = await otaFetch('api/aluguel/pesquisa-tarifa-acordo', {
    method: 'POST',
    body: req.body,
  })

  return res.status(result.status).json(result.json)
}
