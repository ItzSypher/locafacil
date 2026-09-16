// Proxy server-side para a API ReservaOTA (JCompany/SGLOC).
// client_id/client_secret NUNCA devem ir para o bundle do front-end —
// só existem aqui, em código que roda como serverless function.

let cachedToken = null // { token, expiresAt }

function hasCredentials() {
  return Boolean(process.env.OTA_CLIENT_ID && process.env.OTA_CLIENT_SECRET && process.env.OTA_BASE_URL)
}

async function getToken() {
  if (cachedToken && cachedToken.expiresAt > Date.now()) {
    return cachedToken.token
  }

  const tokenUrl = new URL('/oauth/token', process.env.OTA_BASE_URL).origin + '/oauth/token'
  const res = await fetch(tokenUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      grant_type: 'client_credentials',
      client_id: process.env.OTA_CLIENT_ID,
      client_secret: process.env.OTA_CLIENT_SECRET,
    }),
  })

  if (!res.ok) {
    throw new Error(`Falha ao obter token OAuth da API OTA (status ${res.status})`)
  }

  const json = await res.json()
  const expiresInMs = (json.expires_in ?? 3600) * 1000
  cachedToken = {
    token: json.access_token,
    expiresAt: Date.now() + expiresInMs - 5 * 60 * 1000, // renova 5 min antes de expirar
  }
  return cachedToken.token
}

export async function otaFetch(path, { method = 'GET', body, params, auth = false } = {}) {
  if (!hasCredentials()) {
    return { mock: true }
  }

  const url = new URL(path, process.env.OTA_BASE_URL + '/')
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value != null) url.searchParams.set(key, value)
    })
  }

  const headers = { 'Content-Type': 'application/json' }
  if (auth) {
    headers.Authorization = `Bearer ${await getToken()}`
  }

  const res = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  })

  const json = await res.json().catch(() => null)
  return { mock: false, status: res.status, json }
}

export { hasCredentials }
