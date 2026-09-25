import { otaFetch, hasCredentials } from './_lib/otaClient.js'
import { mockMinimumNotice } from './_lib/mockData.js'

export default async function handler(req, res) {
  const { LocationCode } = req.query

  // Sem credenciais, o endpoint público responde pelo tenant de demonstração
  // da JCompany — regra de outra locadora. Ver api/locations.js.
  if (hasCredentials()) {
    const result = await otaFetch('api/aluguel/pesquisa-antecedencia', {
      method: 'GET',
      params: { LocationCode },
    })

    if (result.json?.success) {
      return res.status(200).json({ ...result.json, demo: false })
    }
  }

  // Local ainda não provisionado na API: mantém a regra padrão para não travar a busca.
  return res.status(200).json({ success: true, data: mockMinimumNotice, errors: [], demo: true })
}
