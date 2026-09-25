import { storeHoursFor } from './_lib/storeHours.js'

// Endpoint próprio: a API ReservaOTA não expõe horário de funcionamento.
// Servido por HTTP (e não importado direto pelo front) para que mudar a grade
// seja editar api/_lib/storeHours.js, sem rebuild do bundle.
export default async function handler(req, res) {
  const { LocationCode } = req.query

  if (!LocationCode) {
    return res.status(400).json({ success: false, data: null, errors: ['LocationCode é obrigatório.'] })
  }

  return res.status(200).json({
    success: true,
    data: storeHoursFor(LocationCode),
    errors: [],
  })
}
