const MODEL = 'gemini-1.5-flash'
const ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`

const SYSTEM_PROMPT = `
Você é a Locagora, a assistente virtual especialista e amigável da Locafacil.
A Locafacil aluga carros e motos no Rio de Janeiro sem caução, sem cartão de crédito, com todos os seguros inclusos e dobro de franquia de quilometragem.
Responda de forma curta, prestativa e persuasiva.
Seja gentil.
Sempre recomende o botão de WhatsApp ao final de uma explicação para finalizar a contratação com um consultor humano.
Não invente preços exatos ou detalhes se não souber, apenas promova os benefícios.
`

const FALLBACK =
  'Tive um problema na conexão agora. Me chama no botão do WhatsApp aqui embaixo que um consultor continua com você na hora.'

/**
 * A chave do Gemini vivia no bundle do cliente, visível para qualquer visitante
 * no DevTools. Aqui ela fica só no ambiente do servidor, como as credenciais da
 * API OTA. Sem `GEMINI_API_KEY` configurada, o assistente não quebra: devolve a
 * saída para o WhatsApp, que é o caminho que ele recomenda de qualquer forma.
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, errors: ['Método não permitido.'] })
  }

  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    return res.status(200).json({ success: true, data: { text: FALLBACK }, unavailable: true })
  }

  const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {}
  const history = Array.isArray(body.history) ? body.history : []
  const message = typeof body.message === 'string' ? body.message.trim() : ''
  const userName = typeof body.userName === 'string' ? body.userName.slice(0, 60) : ''

  if (!message) {
    return res.status(400).json({ success: false, errors: ['Mensagem vazia.'] })
  }

  const contents = [
    // Últimos turnos apenas: o histórico completo cresce sem limite e a conversa
    // não precisa de mais contexto que isso.
    ...history.slice(-10).map((m) => ({
      role: m.role === 'model' ? 'model' : 'user',
      parts: [{ text: String(m.text ?? '').slice(0, 2000) }],
    })),
    { role: 'user', parts: [{ text: message.slice(0, 2000) }] },
  ]

  try {
    const upstream = await fetch(`${ENDPOINT}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: {
          parts: [{ text: `${SYSTEM_PROMPT}\nO nome do usuário é ${userName || 'Cliente'}.` }],
        },
        contents,
      }),
    })

    if (!upstream.ok) {
      return res.status(200).json({ success: true, data: { text: FALLBACK }, unavailable: true })
    }

    const data = await upstream.json()
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim()
    return res.status(200).json({ success: true, data: { text: text || FALLBACK } })
  } catch {
    return res.status(200).json({ success: true, data: { text: FALLBACK }, unavailable: true })
  }
}
