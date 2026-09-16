import { otaFetch } from './_lib/otaClient.js'
import { mockLocations } from './_lib/mockData.js'

export default async function handler(req, res) {
  const result = await otaFetch('api/get-locais', { method: 'GET' })

  if (result.mock) {
    return res.status(200).json({ success: true, data: mockLocations, errors: [] })
  }

  return res.status(result.status).json(result.json)
}
