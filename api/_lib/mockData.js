// Fixtures no formato exato da API ReservaOTA (JCompany/SGLOC), usadas
// enquanto OTA_CLIENT_ID/OTA_CLIENT_SECRET não estiverem configurados.
// Assim que as credenciais reais forem definidas, otaClient.js para de
// chamar estas fixtures e passa a bater na API real automaticamente.

export const mockLocations = [
  { id: '1', descricao: 'Nova Iguaçu - RJ', iata: 'NIG' },
  { id: '2', descricao: 'Rio de Janeiro - Centro', iata: 'RIO' },
  { id: '3', descricao: 'Niterói - RJ', iata: 'NIT' },
]

export const mockMinimumNotice = { antecedencia_minima: 24 }

export const mockMinimumPeriod = { periodo_minimo_horas: 48, tempo_informacao: 'horas' }

function vehicle({ code, name, category, size, passengers, baggage, transmission, ac, doors, image }) {
  return {
    Description: name,
    AirConditionInd: ac,
    Code: code,
    PassengerQuantity: passengers,
    BaggageQuantity: baggage,
    TransmissionType: transmission,
    CodeContext: 'ACRISS',
    VehType: { VehicleCategory: category, DoorCount: doors },
    VehClass: { Size: size },
    VehMakeModel: { Code: code, Name: name },
    image,
  }
}

const mockVehicles = [
  {
    vehicle: vehicle({ code: 'ECMR', name: 'HB20 ou similar', category: 'Econômico', size: 'Compacto', passengers: 5, baggage: 2, transmission: 'Manual', ac: 'true', doors: 4, image: '/src/assets/images/hyundai.webp' }),
    dailyRate: 129.9,
  },
  {
    vehicle: vehicle({ code: 'CDMR', name: 'Onix ou similar', category: 'Intermediário', size: 'Médio', passengers: 5, baggage: 3, transmission: 'Manual', ac: 'true', doors: 4, image: '/src/assets/images/chevrolet.webp' }),
    dailyRate: 149.9,
  },
  {
    vehicle: vehicle({ code: 'SDAR', name: 'Corolla ou similar', category: 'SUV', size: 'Grande', passengers: 5, baggage: 4, transmission: 'Automático', ac: 'true', doors: 4, image: '/src/assets/images/nissan.webp' }),
    dailyRate: 219.9,
  },
]

const coverages = [
  { CoverageType: 13, Code: 'BASICA', Details: { CoverageTextType: 'Text', Value: 'Proteção Básica', Description: 'Cobertura contra colisão com franquia reduzida' }, dailyCharge: 0 },
  { CoverageType: 14, Code: 'COMPLETA', Details: { CoverageTextType: 'Text', Value: 'Proteção Completa', Description: 'Zero franquia em caso de colisão ou furto' }, dailyCharge: 39.9 },
]

const equipments = [
  { EquipType: '4', Description: 'Bebê Conforto', dailyCharge: 19.9 },
  { EquipType: '7', Description: 'Wi-Fi Portátil', dailyCharge: 14.9 },
  { EquipType: '2', Description: 'Condutor Adicional', dailyCharge: 24.9 },
]

function money(n) {
  return n.toFixed(2)
}

export function buildMockAvailability({ pickUpDateTime, returnDateTime }) {
  const days = Math.max(1, Math.ceil((new Date(returnDateTime) - new Date(pickUpDateTime)) / (1000 * 60 * 60 * 24)))

  const vehAvails = mockVehicles.map(({ vehicle: v, dailyRate }) => {
    const total = dailyRate * days
    return {
      VehAvail: {
        VehAvailCore: {
          Status: 'Available',
          Vehicle: v,
          RentalRate: {
            RateDistance: { Unlimited: 'true', DistUnitName: 'Km', VehiclePeriodUnitName: 'RentalPeriod' },
            VehicleCharges: [{
              VehicleCharge: {
                TaxInclusive: 'true',
                Description: 'Diária',
                GuaranteedInd: 'true',
                IncludedInRate: 'true',
                Amount: money(dailyRate),
                CurrencyCode: 'BRL',
                Purpose: '5',
                Calculation: { UnitName: 'Day', Quantity: days, UnitCharge: money(dailyRate) },
              },
            }],
            RateQualifier: { RateCategory: '3', RateQualifier: 'PADRAO', CorpDiscountNmbr: '' },
          },
          PricedEquips: equipments.map((e) => ({
            Equipment: { EquipType: e.EquipType, Quantity: '1', Description: e.Description },
            Charge: {
              TaxInclusive: 'true',
              IncludedInRate: 'false',
              Amount: e.dailyCharge * days,
              CurrencyCode: 'BRL',
              Calculation: { UnitName: 'Day', Quantity: days, UnitCharge: e.dailyCharge },
            },
          })),
        },
        VehAvailInfo: {
          PricedCoverages: coverages.map((c) => ({
            PricedCoverage: {
              Coverage: { CoverageType: c.CoverageType, Code: c.Code, Details: c.Details },
              Charge: {
                TaxInclusive: 'true',
                IncludedInRate: c.dailyCharge === 0 ? 'true' : 'false',
                Amount: c.dailyCharge * days,
                CurrencyCode: 'BRL',
                Calculation: { UnitName: 'Day', Quantity: days, UnitCharge: c.dailyCharge },
              },
            },
          })),
        },
        TotalCharge: {
          RateTotalAmount: money(total),
          ExtraAmount: '0.00',
          EstimatedTotalAmount: money(total),
          CurrencyCode: 'BRL',
        },
      },
    }
  })

  return {
    VehAvailRSCore: {
      VehRentalCore: { PickUpDateTime: pickUpDateTime, ReturnDateTime: returnDateTime },
      VehVendorAvails: [{ VehVendorAvail: { VehAvails: vehAvails } }],
    },
  }
}

export function buildMockQuoteId() {
  return crypto.randomUUID()
}

export function buildMockConfirmation({ vehicle, customer }) {
  return {
    VehResRSCore: {
      ConfID: { Type: '14', ID: String(Math.floor(100000 + Math.random() * 900000)) },
      ReservationStatus: 'Confirmed',
      VehReservation: {
        CreateDateTime: new Date().toISOString(),
        Customer: customer,
        VehSegmentCore: { Vehicle: vehicle },
      },
    },
  }
}
