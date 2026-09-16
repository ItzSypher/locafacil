import { otaFetch } from './_lib/otaClient.js'

export default async function handler(req, res) {
  const { LocationCode } = req.query

  // Endpoint público: devolve nome, logo, cores e textos legais do portal.
  const result = await otaFetch('api/get-personalizacao', {
    method: 'GET',
    params: { LocationCode },
  })

  return res.status(result.status).json({ success: true, data: result.json, errors: [] })
}
