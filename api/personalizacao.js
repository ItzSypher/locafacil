import { otaFetch } from './_lib/otaClient.js'
import { fixText } from './_lib/otaNormalize.js'

// Endpoint público: nome, logo, cores e textos legais do portal do tenant.
export default async function handler(req, res) {
  const { LocationCode } = req.query

  const result = await otaFetch('api/get-personalizacao', {
    method: 'GET',
    params: { LocationCode },
  })

  const raw = result.json ?? {}

  return res.status(result.status ?? 200).json({
    success: true,
    data: {
      empresaNome: fixText(raw.empresa_nome),
      empresaEmail: fixText(raw.empresa_email),
      empresaTelefone: fixText(raw.empresa_telefone),
      empresaSite: fixText(raw.empresa_site),
      logomarcaUrl: raw.logomarca_url || null,
      // Vazios no tenant de demonstração; o front cai nos textos do próprio site.
      termosUrl: raw.termos_url || null,
      clausulasUrl: raw.clausulas_url || null,
      faqUrl: raw.faq || null,
      faleConoscoUrl: raw.fale_conosco || null,
      cores: raw.cores ?? null,
    },
    errors: [],
  })
}
