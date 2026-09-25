const BASE = '/api'

export class ReservationApiError extends Error {
  constructor(errors, status) {
    super(errors[0] ?? 'Erro inesperado')
    this.errors = errors
    this.status = status
  }
}

async function call(path, { method = 'GET', body, params } = {}) {
  const query = params ? `?${new URLSearchParams(params)}` : ''
  const res = await fetch(`${BASE}/${path}${query}`, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  })

  const json = await res.json().catch(() => null)

  if (!res.ok || !json?.success) {
    const errors = json?.errors?.length ? json.errors : ['Erro inesperado. Tente novamente.']
    throw new ReservationApiError(errors, res.status)
  }

  return json
}

export const getLocations = () => call('locations')

export const getStoreHours = (locationCode) =>
  call('store-hours', { params: { LocationCode: locationCode } })

export const getPersonalizacao = (locationCode) =>
  call('personalizacao', { params: { LocationCode: locationCode } })

export const getMinimumNotice = (locationCode) =>
  call('minimum-notice', { params: { LocationCode: locationCode } })

export const getMinimumPeriod = (locationCode) =>
  call('minimum-period', { params: { LocationCode: locationCode } })

// `cenario` só tem efeito em desenvolvimento (ver api/availability.js).
export const searchAvailability = (payload, cenario) =>
  call('availability', { method: 'POST', body: payload, params: cenario ? { cenario } : undefined })

export const getAgreementRate = (payload) =>
  call('agreement-rate', { method: 'POST', body: payload })

export const confirmReservation = (payload) =>
  call('reservation-confirm', { method: 'POST', body: payload })

/* `reservation-lookup` e `reservation-cancel` continuam em api/, mas não têm
   chamador no front: a tela de consulta saiu porque a reserva não é
   consultada aqui — quem precisa alterar ou cancelar fala com a loja pelo
   WhatsApp, e a confirmação já leva o localizador na mensagem. Os proxies
   ficam porque são operações reais do contrato (ver docs/API-JCOMPANY.md);
   voltar a ter tela é reescrever as duas linhas abaixo. */
