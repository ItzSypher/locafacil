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

export const getMinimumNotice = (locationCode) =>
  call('minimum-notice', { params: { LocationCode: locationCode } })

export const getMinimumPeriod = (locationCode) =>
  call('minimum-period', { params: { LocationCode: locationCode } })

export const searchAvailability = (payload) =>
  call('availability', { method: 'POST', body: payload })

export const getAgreementRate = (payload) =>
  call('agreement-rate', { method: 'POST', body: payload })

export const confirmReservation = (payload) =>
  call('reservation-confirm', { method: 'POST', body: payload })

export const lookupReservation = (payload) =>
  call('reservation-lookup', { method: 'POST', body: payload })

export const cancelReservation = (payload) =>
  call('reservation-cancel', { method: 'POST', body: payload })
