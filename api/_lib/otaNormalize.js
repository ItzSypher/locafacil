// Ponto único onde a resposta crua da API ReservaOTA vira a forma interna do site.
// Nenhum componente do front deve conhecer VehVendorAvails/VehAvailCore/PricedCoverage.
//
// A API mistura tipos: valor monetário ora chega string ("0.00"), ora number;
// booleano chega como string ("true"); e texto às vezes chega com encoding
// quebrado. Tudo isso morre aqui.

// --- primitivas de tipo -----------------------------------------------------

// "1.234,56" (BR), "1234.56" (US), 1234.56, null → number
export function toNumber(value) {
  if (value == null) return 0
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0

  const raw = String(value).trim()
  if (!raw) return 0

  const lastComma = raw.lastIndexOf(',')
  const lastDot = raw.lastIndexOf('.')

  let normalized
  if (lastComma > lastDot) {
    // vírgula é o separador decimal: "1.234,56"
    normalized = raw.replace(/\./g, '').replace(',', '.')
  } else {
    // ponto é o separador decimal (ou não há decimal): "1,234.56" | "1234.56"
    normalized = raw.replace(/,/g, '')
  }

  const parsed = Number.parseFloat(normalized.replace(/[^\d.-]/g, ''))
  return Number.isFinite(parsed) ? parsed : 0
}

// "true" | true | "1" | 1 → boolean
export function toBool(value) {
  if (typeof value === 'boolean') return value
  if (value == null) return false
  const raw = String(value).trim().toLowerCase()
  return raw === 'true' || raw === '1' || raw === 'sim' || raw === 's'
}

// Palavras que a API devolve com o acento perdido. O portal da JCompany faz o
// mesmo remendo em js/verificar-disponibilidade.js.
const BROKEN_WORDS = [
  [/Di\?ria/g, 'Diária'],
  [/di\?ria/g, 'diária'],
  [/Ver\?o/g, 'Verão'],
  [/Prote\?\?o/g, 'Proteção'],
  [/prote\?\?o/g, 'proteção'],
  [/Ve\?culo/g, 'Veículo'],
  [/ve\?culo/g, 'veículo'],
  [/Servi\?o/g, 'Serviço'],
  [/servi\?o/g, 'serviço'],
  [/Econ\?mico/g, 'Econômico'],
  [/econ\?mico/g, 'econômico'],
  [/Dire\?\?o/g, 'Direção'],
  [/dire\?\?o/g, 'direção'],
  [/Autom\?tico/g, 'Automático'],
  [/autom\?tico/g, 'automático'],
  [/B\?sico/g, 'Básico'],
  [/b\?sico/g, 'básico'],
  [/Padr\?o/g, 'Padrão'],
  [/padr\?o/g, 'padrão'],
  [/Ju\?/g, 'Juí'],
]

// Repara mojibake e acento perdido. Aplicado em todo campo textual da API.
export function fixText(value) {
  if (value == null) return ''
  let text = String(value)

  // utf-8 lido como latin1: "Ã©" → "é". Só tenta quando o padrão aparece,
  // para não corromper texto que já está correto.
  if (/[ÃÂ][\u0080-¿]/.test(text)) {
    try {
      const repaired = Buffer.from(text, 'latin1').toString('utf8')
      if (!repaired.includes('�')) text = repaired
    } catch {
      // mantém o original
    }
  }

  for (const [pattern, replacement] of BROKEN_WORDS) {
    text = text.replace(pattern, replacement)
  }

  // "?" órfão entre letras é acento perdido, não pontuação: "Econ?mico".
  // Aceita sequências: "Dire??o" perdeu dois caracteres de uma vez.
  text = text.replace(/(?<=\p{L})\?+(?=\p{L})/gu, '')

  return text.trim()
}

// --- mapas de domínio -------------------------------------------------------

// VehicleCharge.Purpose, conforme o portal da JCompany interpreta.
const CHARGE_PURPOSE = {
  1: 'diaria',
  2: 'taxa_retorno',
  28: 'taxa_no_show',
  82: 'taxa_horario',
}

function chargePurpose(value) {
  return CHARGE_PURPOSE[String(value)] ?? 'taxa_outra'
}

function asArray(value) {
  if (Array.isArray(value)) return value
  if (value == null) return []
  return [value]
}

// A API aninha cada item num wrapper de nome próprio: [{ VehicleCharge: {...} }].
// Alguns ambientes devolvem o objeto direto, sem wrapper.
function unwrap(item, key) {
  if (!item || typeof item !== 'object') return null
  return item[key] ?? item
}

// --- normalizações ----------------------------------------------------------

function normalizeTax(entry) {
  const tax = unwrap(entry, 'TaxAmount')
  if (!tax) return null
  return {
    total: toNumber(tax.Total),
    currency: tax.CurrencyCode || 'BRL',
    description: fixText(tax.Description),
    extraDescription: fixText(tax.ExtraDescription),
    percentage: toNumber(tax.Percentage),
  }
}

function normalizeCharge(entry) {
  const charge = unwrap(entry, 'VehicleCharge')
  if (!charge) return null

  const calculation = charge.Calculation ?? {}
  return {
    purpose: chargePurpose(charge.Purpose),
    purposeCode: String(charge.Purpose ?? ''),
    description: fixText(charge.Description),
    amount: toNumber(charge.Amount),
    currency: charge.CurrencyCode || 'BRL',
    includedInRate: toBool(charge.IncludedInRate),
    includedInTotal: toBool(charge.IncludedInEstTotalInd),
    taxInclusive: toBool(charge.TaxInclusive),
    quantity: calculation.Quantity != null ? toNumber(calculation.Quantity) : null,
    unitName: calculation.UnitName || null,
    unitCharge: calculation.UnitCharge != null ? toNumber(calculation.UnitCharge) : null,
    taxes: asArray(charge.TaxAmounts).map(normalizeTax).filter((t) => t && t.total > 0),
  }
}

function normalizeCoverage(entry, days) {
  const priced = unwrap(entry, 'PricedCoverage')
  if (!priced) return null

  const coverage = priced.Coverage ?? {}
  const details = coverage.Details ?? {}
  const charge = priced.Charge ?? {}
  const calculation = charge.Calculation ?? {}

  const total = toNumber(charge.Amount)
  const perDay = calculation.UnitCharge != null
    ? toNumber(calculation.UnitCharge)
    : (days > 0 ? total / days : total)

  return {
    // CoverageType chega ora number, ora string. String é a forma que volta no
    // payload de confirmação, então é a que guardamos.
    type: String(coverage.CoverageType ?? ''),
    code: fixText(coverage.Code),
    name: fixText(details.Value) || 'Proteção',
    description: fixText(details.Description),
    amountPerDay: perDay,
    amountTotal: total,
    includedInRate: toBool(charge.IncludedInRate),
    currency: charge.CurrencyCode || 'BRL',
  }
}

function normalizeEquipment(entry, days) {
  const priced = unwrap(entry, 'PricedEquip')
  if (!priced) return null

  const equipment = priced.Equipment ?? {}
  const charge = priced.Charge ?? {}
  const calculation = charge.Calculation ?? {}

  const total = toNumber(charge.Amount)
  const perDay = calculation.UnitCharge != null
    ? toNumber(calculation.UnitCharge)
    : (days > 0 ? total / days : total)

  return {
    type: String(equipment.EquipType ?? ''),
    description: fixText(equipment.Description),
    quantity: toNumber(equipment.Quantity) || 1,
    amountPerDay: perDay,
    amountTotal: total,
    currency: charge.CurrencyCode || 'BRL',
  }
}

function normalizeVehicle(vehicle = {}) {
  const vehType = vehicle.VehType ?? {}
  const vehClass = vehicle.VehClass ?? {}
  const makeModel = vehicle.VehMakeModel ?? {}

  return {
    groupCode: fixText(vehicle.Code),
    groupName: fixText(makeModel.Name) || fixText(vehicle.Code),
    description: fixText(vehicle.Description),
    category: fixText(vehType.VehicleCategory),
    size: fixText(vehClass.Size),
    doors: vehType.DoorCount != null ? toNumber(vehType.DoorCount) : null,
    passengers: toNumber(vehicle.PassengerQuantity),
    baggage: toNumber(vehicle.BaggageQuantity),
    transmission: fixText(vehicle.TransmissionType),
    airCondition: toBool(vehicle.AirConditionInd),
    codeContext: vehicle.CodeContext || 'ACRISS',
  }
}

function normalizeRateDistance(rateDistance = {}) {
  const unlimited = toBool(rateDistance.Unlimited)
  const unit = fixText(rateDistance.DistUnitName) || 'Km'
  // Quantity não consta no model RateDistance do spec, mas o portal exibe a
  // franquia ("Km controlada (200 km)"). Usamos quando vier; caímos no rótulo
  // genérico quando não vier.
  const included = rateDistance.Quantity != null ? toNumber(rateDistance.Quantity) : null

  let label
  if (unlimited) label = `${unit} livre`
  else if (included) label = `${unit} controlada (${included} ${unit.toLowerCase()})`
  else label = `${unit} controlada`

  return {
    unlimited,
    unit,
    includedDistance: included,
    label,
    periodUnit: fixText(rateDistance.VehiclePeriodUnitName),
  }
}

function noShowFeeOf(source) {
  const fee = source?.NoShowFeeInfo?.FeeAmount
  return fee ? toNumber(fee.Amount) : 0
}

export function diariasBetween(pickUpDateTime, returnDateTime) {
  const start = new Date(pickUpDateTime)
  const end = new Date(returnDateTime)
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return 1
  return Math.max(1, Math.ceil((end - start) / (1000 * 60 * 60 * 24)))
}

function normalizeOffer(entry, index, days) {
  const avail = unwrap(entry, 'VehAvail')
  if (!avail) return null

  const core = avail.VehAvailCore ?? {}
  const info = avail.VehAvailInfo ?? {}
  const rentalRate = core.RentalRate ?? {}
  const totalCharge = avail.TotalCharge ?? core.TotalCharge ?? {}

  const vehicle = normalizeVehicle(core.Vehicle)
  const charges = asArray(rentalRate.VehicleCharges).map(normalizeCharge).filter(Boolean)

  const daily = charges.find((c) => c.purpose === 'diaria')
  const kmPolicy = normalizeRateDistance(rentalRate.RateDistance)

  return {
    // Chave estável: o índice sozinho quebra quando a lista é filtrada.
    id: `${vehicle.groupCode || 'GRUPO'}-${index}`,
    ...vehicle,
    kmPolicy,
    days,
    dailyRate: daily?.unitCharge ?? (days > 0 ? toNumber(totalCharge.RateTotalAmount) / days : 0),
    charges,
    coverages: asArray(info.PricedCoverages).map((c) => normalizeCoverage(c, days)).filter(Boolean),
    equipments: asArray(core.PricedEquips).map((e) => normalizeEquipment(e, days)).filter(Boolean),
    totals: {
      rate: toNumber(totalCharge.RateTotalAmount),
      extra: toNumber(totalCharge.ExtraAmount),
      estimated: toNumber(totalCharge.EstimatedTotalAmount),
      currency: totalCharge.CurrencyCode || 'BRL',
    },
    noShowFee: noShowFeeOf(rentalRate.RateDistance) || noShowFeeOf(rentalRate),
    rateQualifier: rentalRate.RateQualifier ?? null,
    // Preservado: o payload de confirmação é remontado a partir daqui.
    raw: avail,
  }
}

// Achata os três níveis de aninhamento OTA numa lista de ofertas.
export function normalizeAvailability(json) {
  const core = json?.data?.VehAvailRSCore ?? json?.VehAvailRSCore ?? {}
  const rentalCore = core.VehRentalCore ?? {}

  const pickUpDateTime = rentalCore.PickUpDateTime ?? null
  const returnDateTime = rentalCore.ReturnDateTime ?? null
  const days = diariasBetween(pickUpDateTime, returnDateTime)

  const offers = asArray(core.VehVendorAvails)
    .flatMap((vendor) => asArray(unwrap(vendor, 'VehVendorAvail')?.VehAvails))
    .map((entry, index) => normalizeOffer(entry, index, days))
    .filter(Boolean)

  return {
    pickUpDateTime,
    returnDateTime,
    days,
    offers,
    quoteId: json?.quoteId ?? null,
    expiresAt: json?.expiresAt ?? null,
    // Ignorado de propósito: o portal é nosso, não o da JCompany.
    redirectUrl: json?.redirectUrl ?? null,
  }
}

function normalizeCustomer(customer = {}) {
  const primary = customer.Primary ?? {}
  const additional = customer.Additional ?? {}
  const name = primary.PersonName ?? {}
  const phone = primary.Telephone ?? {}
  const address = additional.Address ?? {}

  return {
    givenName: fixText(name.GivenName),
    surname: fixText(name.Surname),
    email: fixText(primary.Email),
    areaCode: fixText(phone.AreaCityCode),
    phone: fixText(phone.PhoneNumber),
    docId: fixText(primary.Document?.DocID),
    docType: String(primary.Document?.DocType ?? ''),
    addressLine: fixText(address.AddressLine),
    cityName: fixText(address.CityName),
    stateCode: fixText(address.StateProv?.StateCode),
    countryCode: fixText(address.CountryName?.Code) || 'BR',
  }
}

// confirmacao-reserva e consulta-reserva devolvem a mesma estrutura sob
// nomes de envelope diferentes.
export function normalizeReservation(json) {
  const core = json?.data?.VehResRSCore
    ?? json?.data?.VehRetResRSCore
    ?? json?.VehResRSCore
    ?? json?.VehRetResRSCore
    ?? {}

  const reservation = core.VehReservation ?? {}
  const segment = reservation.VehSegmentCore ?? {}
  const segmentInfo = reservation.VehSegmentInfo ?? {}
  const rentalCore = segment.VehRentalCore ?? {}
  const rentalRate = segment.RentalRate ?? {}
  const totalCharge = segment.TotalCharge ?? {}

  const days = diariasBetween(rentalCore.PickUpDateTime, rentalCore.ReturnDateTime)

  return {
    status: core.ReservationStatus ?? null,
    confId: String(core.ConfID?.ID ?? segment.ConfID?.ID ?? ''),
    confIdType: String(core.ConfID?.Type ?? segment.ConfID?.Type ?? '14'),
    createdAt: reservation.CreateDateTime ?? null,
    customer: normalizeCustomer(reservation.Customer),
    vehicle: normalizeVehicle(segment.Vehicle),
    pickUpDateTime: rentalCore.PickUpDateTime ?? null,
    returnDateTime: rentalCore.ReturnDateTime ?? null,
    pickUpLocationCode: rentalCore.PickUpLocation?.LocationCode ?? null,
    returnLocationCode: rentalCore.ReturnLocation?.LocationCode ?? null,
    days,
    kmPolicy: normalizeRateDistance(rentalRate.RateDistance),
    charges: asArray(rentalRate.VehicleCharges).map(normalizeCharge).filter(Boolean),
    coverages: asArray(segmentInfo.PricedCoverages).map((c) => normalizeCoverage(c, days)).filter(Boolean),
    equipments: asArray(segment.PricedEquips).map((e) => normalizeEquipment(e, days)).filter(Boolean),
    totals: {
      rate: toNumber(totalCharge.RateTotalAmount),
      extra: toNumber(totalCharge.ExtraAmount),
      estimated: toNumber(totalCharge.EstimatedTotalAmount),
      currency: totalCharge.CurrencyCode || 'BRL',
    },
    noShowFee: noShowFeeOf(rentalRate) || noShowFeeOf(rentalRate.RateDistance),
  }
}

export function normalizeCancellation(json) {
  const core = json?.data?.VehCancelRSCore ?? json?.VehCancelRSCore ?? {}
  return {
    status: core.CancelStatus ?? null,
    confId: String(core.UniqueID?.ID ?? ''),
  }
}
