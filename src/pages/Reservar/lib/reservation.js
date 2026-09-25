/* Regras compartilhadas pelas etapas do checkout.
   O total aparece em três telas (opcionais, revisão, confirmação) e precisa
   ser calculado num lugar só — duas contas equivalentes viram duas contas
   diferentes no primeiro ajuste. */

const DATE_TIME = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
})

const DATE_ONLY = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
const TIME_ONLY = new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' })

function parse(value) {
  if (!value) return null
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

export function formatDateTime(value) {
  const date = parse(value)
  return date ? DATE_TIME.format(date).replace(', ', ' às ') : '—'
}

export function formatDate(value) {
  const date = parse(value)
  return date ? DATE_ONLY.format(date) : '—'
}

export function formatTime(value) {
  const date = parse(value)
  return date ? TIME_ONLY.format(date) : '—'
}

export function diariasLabel(days) {
  return days === 1 ? '1 diária' : `${days} diárias`
}

/**
 * Composição do valor da reserva.
 *
 * `base` sai de TotalCharge.EstimatedTotalAmount — é o que a API já somou,
 * incluindo as taxas embutidas. Cobertura e opcionais entram por fora, porque
 * são escolha do cliente e a API só os precifica, não os soma.
 */
export function computeTotals({ offer, extras }) {
  if (!offer) return { base: 0, coverage: 0, equipments: 0, total: 0, lines: [], coverageItem: null, equipmentItems: [] }

  const days = offer.days || 1
  const base = offer.totals?.estimated ?? 0

  const coverageItem = extras?.coverageType
    ? offer.coverages?.find((c) => c.type === extras.coverageType) ?? null
    : null
  const coverage = coverageItem && !coverageItem.includedInRate ? coverageItem.amountTotal : 0

  const equipmentItems = (offer.equipments ?? []).filter((e) => extras?.equipTypes?.includes(e.type))
  const equipments = equipmentItems.reduce((sum, e) => sum + e.amountTotal, 0)

  const lines = []

  const diaria = offer.charges?.find((c) => c.purpose === 'diaria')
  lines.push({
    key: 'diarias',
    label: diariasLabel(days),
    detail: diaria?.unitCharge ? `${days} × ${diaria.unitCharge.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}` : null,
    amount: diaria?.amount ?? base,
  })

  // Taxas já embutidas na diária: informativas, não somam de novo.
  for (const charge of offer.charges ?? []) {
    for (const tax of charge.taxes ?? []) {
      lines.push({
        key: `tax-${charge.purposeCode}-${tax.description}`,
        label: tax.description || 'Taxa de serviço',
        detail: tax.extraDescription || null,
        amount: tax.total,
        included: true,
      })
    }
  }

  // Taxas cobradas por fora da diária.
  for (const charge of offer.charges ?? []) {
    if (charge.purpose === 'diaria') continue
    if (charge.includedInRate || charge.amount <= 0) continue
    lines.push({ key: `charge-${charge.purposeCode}`, label: charge.description, amount: charge.amount })
  }

  if (coverageItem) {
    lines.push({
      key: 'cobertura',
      label: `Proteção ${coverageItem.name}`,
      detail: coverageItem.includedInRate
        ? 'Inclusa na diária'
        : `${days} × ${coverageItem.amountPerDay.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`,
      amount: coverage,
      included: coverageItem.includedInRate,
    })
  }

  for (const item of equipmentItems) {
    lines.push({
      key: `equip-${item.type}`,
      label: item.description,
      detail: `${days} × ${item.amountPerDay.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`,
      amount: item.amountTotal,
    })
  }

  return {
    base,
    coverage,
    equipments,
    total: base + coverage + equipments,
    lines,
    coverageItem,
    equipmentItems,
  }
}

const DOC_TYPE_CPF = '5'
const DOC_TYPE_PASSAPORTE = '2'

/**
 * Monta o envelope VehResRQCore a partir do estado do checkout.
 *
 * Os campos `_mock*` são espelhos locais consumidos só pela fixture; o proxy
 * em api/reservation-confirm.js os remove antes de falar com a API real.
 */
export function buildConfirmPayload({ search, offer, extras, driver, quoteId }) {
  const document = driver.foreigner
    ? { DocID: driver.passport, DocType: DOC_TYPE_PASSAPORTE }
    : { DocID: driver.docId.replace(/\D/g, ''), DocType: DOC_TYPE_CPF }

  const customer = {
    Primary: {
      PersonName: { GivenName: driver.givenName.toUpperCase(), Surname: driver.surname.toUpperCase() },
      Telephone: {
        AreaCityCode: driver.areaCode.replace(/\D/g, ''),
        PhoneNumber: driver.phone.replace(/\D/g, ''),
        PhoneTechType: '1',
      },
      Email: driver.email,
      Document: document,
      CitizenCountryName: { Code: driver.countryCode || 'BR' },
    },
    Additional: {
      Address: {
        AddressLine: driver.addressLine,
        CityName: driver.cityName,
        StateProv: { StateCode: driver.stateCode },
        CountryName: { Code: driver.countryCode || 'BR' },
      },
      Document: document,
    },
  }

  const coveragePrefs = extras?.coverageType ? [{ CoverageType: extras.coverageType }] : []
  const equipPrefs = (extras?.equipTypes ?? []).map((type) => ({ EquipType: type, Quantity: '1' }))

  const rawCore = offer.raw?.VehAvailCore ?? {}

  return {
    VehResRQCore: {
      Status: 'Available',
      VehRentalCore: {
        PickUpDateTime: search.pickUpDateTime,
        ReturnDateTime: search.returnDateTime,
        PickUpLocation: { LocationCode: search.pickupLocationCode, CodeContext: 'IATA' },
        ReturnLocation: { LocationCode: search.returnLocationCode, CodeContext: 'IATA' },
      },
      Customer: customer,
      VehPrefs: { VehPref: { Code: offer.groupCode, CodeContext: 'SIPP' } },
      RateQualifier: offer.rateQualifier ?? { RateCategory: '3', RateQualifier: 'PADRAO', CorpDiscountNmbr: '' },
    },
    VehResRQInfo: {
      CoveragePrefs: { CoveragePref: coveragePrefs },
      SpecialEquipPrefs: { SpecialEquipPref: equipPrefs },
    },
    quoteId: quoteId ?? undefined,
    _mockVehicle: rawCore.Vehicle,
    _mockTotals: offer.raw?.TotalCharge,
    _mockCoverages: offer.raw?.VehAvailInfo?.PricedCoverages ?? [],
    _mockEquipments: rawCore.PricedEquips ?? [],
  }
}

export function buildAvailabilityPayload(search) {
  return {
    VehAvailRQCore: {
      Status: 'Available',
      VehRentalCore: {
        PickUpDateTime: search.pickUpDateTime,
        ReturnDateTime: search.returnDateTime,
        PickUpLocation: { LocationCode: search.pickupLocationCode, CodeContext: 'IATA' },
        ReturnLocation: { LocationCode: search.returnLocationCode, CodeContext: 'IATA' },
      },
      RateQualifier: { RateCategory: '3', RateQualifier: 'PADRAO', CorpDiscountNmbr: '' },
    },
  }
}
