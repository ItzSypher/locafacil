// Fixtures no formato exato da API ReservaOTA (JCompany/SGLOC), usadas
// enquanto OTA_CLIENT_ID/OTA_CLIENT_SECRET não estiverem configurados.
// Assim que as credenciais reais forem definidas, otaClient.js para de
// chamar estas fixtures e passa a bater na API real automaticamente.
//
// Os grupos, preços e coberturas abaixo foram observados no portal da
// JCompany em produção para a loja LOCAFACIL NOVA IGUAÇU (2026-09-23), numa
// busca de 2 diárias. São fixtures: toda resposta que passa por aqui carrega
// `demo: true` até a ponta.
//
// Os tipos imitam o descuido da API real de propósito — valor monetário ora
// string, ora number; booleano como string. Um mock mais limpo que o real
// esconde bug de conversão.

export const mockLocations = [
  // Sem IATA: exercita o fallback `code = iata || String(id)` de api/locations.js.
  { id: '26015', descricao: 'LOCAFACIL NOVA IGUAÇU', iata: '' },
]

export const mockMinimumNotice = { antecedencia_minima: 48 }

export const mockMinimumPeriod = { periodo_minimo_horas: 48, tempo_informacao: 'horas' }

// Totais observados para 2 diárias; a diária é derivada.
const GRUPOS = [
  { code: 'B', nome: 'GRUPO - B', total2d: 260, transmissao: 'Manual', porte: 'Compacto', categoria: 'Econômico', descricao: 'Econômico 1.0 com Ar e Direção - Kwid ou similar' },
  { code: 'C', nome: 'GRUPO - C', total2d: 300, transmissao: 'Manual', porte: 'Compacto', categoria: 'Econômico', descricao: 'Econômico 1.0 com Ar e Direção - Mobi ou similar' },
  { code: 'D', nome: 'GRUPO - D', total2d: 320, transmissao: 'Manual', porte: 'Compacto', categoria: 'Hatch', descricao: 'Hatch 1.0 completo - Argo ou similar' },
  { code: 'DP', nome: 'GRUPO - D PLUS', total2d: 340, transmissao: 'Automático', porte: 'Compacto', categoria: 'Hatch', descricao: 'Hatch 1.0 turbo automático - Pulse ou similar' },
  { code: 'E', nome: 'GRUPO - E', total2d: 380, transmissao: 'Manual', porte: 'Médio', categoria: 'Sedan', descricao: 'Sedan 1.3 completo - Cronos ou similar' },
  { code: 'G', nome: 'GRUPO - G', total2d: 380, transmissao: 'Automático', porte: 'Médio', categoria: 'SUV', descricao: 'SUV compacto 1.0 turbo - Pulse ou similar' },
  { code: 'GP', nome: 'GRUPO - G PLUS', total2d: 440, transmissao: 'Automático', porte: 'Médio', categoria: 'SUV', descricao: 'SUV compacto 1.0 turbo completo - Fastback ou similar' },
]

// Diárias/dia observadas no portal, com as descrições longas de "Ver mais".
const COBERTURAS = [
  {
    CoverageType: '13',
    Code: 'BASICO',
    nome: 'Básico',
    descricao: 'Proteção contra furto. Proteção contra incêndio. Perda total do veículo. Danos e/ou avarias causadas ao veículo locado, com participação do locatário.',
    diaria: 30,
  },
  {
    CoverageType: '15',
    Code: 'PADRAO',
    nome: 'Padrão',
    descricao: 'Proteção contra furto. Proteção contra incêndio. Perda total do veículo. Danos e/ou avarias causadas ao veículo locado e a terceiros, com participação reduzida do locatário.',
    diaria: 60,
  },
  {
    CoverageType: '14',
    Code: 'COMPLETA',
    nome: 'Completa',
    descricao: 'Proteção contra roubo. Proteção contra furto. Proteção contra incêndio. Perda total do veículo. Danos e/ou avarias causadas ao veículo locado e a terceiros, sem participação do locatário.',
    diaria: 95,
  },
]

// A loja real não publica opcionais hoje. Só entram no cenário 'com-opcionais',
// para a interface de itens opcionais ainda ser exercitável.
const OPCIONAIS = [
  { EquipType: '4', Description: 'Bebê conforto', diaria: 19.9 },
  { EquipType: '7', Description: 'Wi-Fi portátil', diaria: 14.9 },
  { EquipType: '2', Description: 'Condutor adicional', diaria: 24.9 },
]

export const MOCK_SCENARIOS = [
  { id: 'ok', label: 'Disponibilidade normal (7 grupos)' },
  { id: 'um-carro', label: 'Um único grupo disponível' },
  { id: 'com-opcionais', label: 'Com itens opcionais' },
  { id: 'vazio', label: 'Sem veículos no período' },
  { id: 'erro-422', label: 'Erro 422 da API' },
  { id: 'lento', label: 'Resposta lenta (3s)' },
  { id: 'mojibake', label: 'Texto com encoding quebrado' },
  { id: 'expirado', label: 'Quote já expirada' },
]

function money(n) {
  return n.toFixed(2)
}

// Quebra o acento como a API real faz quando erra o encoding.
function quebrarEncoding(texto) {
  return texto
    .replace(/á/g, '?')
    .replace(/é/g, '?')
    .replace(/í/g, '?')
    .replace(/ó/g, '?')
    .replace(/ç/g, '?')
    .replace(/ã/g, '?')
    .replace(/ô/g, '?')
}

function vehicle(grupo, textoOf) {
  return {
    Description: textoOf(grupo.descricao),
    AirConditionInd: 'true',
    Code: grupo.code,
    PassengerQuantity: 5,
    BaggageQuantity: 2,
    TransmissionType: grupo.transmissao,
    CodeContext: 'ACRISS',
    VehType: { VehicleCategory: textoOf(grupo.categoria), DoorCount: '4' },
    VehClass: { Size: textoOf(grupo.porte) },
    VehMakeModel: { Code: grupo.code, Name: textoOf(grupo.nome) },
  }
}

export function buildMockAvailability({ pickUpDateTime, returnDateTime, scenario = 'ok' }) {
  const days = Math.max(1, Math.ceil((new Date(returnDateTime) - new Date(pickUpDateTime)) / (1000 * 60 * 60 * 24)))
  const textoOf = scenario === 'mojibake' ? quebrarEncoding : (s) => s

  let grupos = GRUPOS
  if (scenario === 'um-carro') grupos = GRUPOS.slice(0, 1)
  if (scenario === 'vazio') grupos = []

  const comOpcionais = scenario === 'com-opcionais'

  const vehAvails = grupos.map((grupo) => {
    const diaria = grupo.total2d / 2
    const total = diaria * days
    const taxaServico = Number((total * 0.05).toFixed(2))

    return {
      VehAvail: {
        VehAvailCore: {
          Status: 'Available',
          Vehicle: vehicle(grupo, textoOf),
          RentalRate: {
            RateDistance: {
              Unlimited: 'false',
              DistUnitName: 'Km',
              Quantity: 200,
              VehiclePeriodUnitName: 'RentalPeriod',
              NoShowFeeInfo: { FeeAmount: { Amount: money(diaria), CurrencyCode: 'BRL', RateConvertedInd: 'false' } },
            },
            VehicleCharges: [{
              VehicleCharge: {
                TaxInclusive: 'false',
                Description: textoOf(`${grupo.nome} Diária`),
                GuaranteedInd: 'false',
                IncludedInRate: 'true',
                IncludedInEstTotalInd: 'true',
                // string, como a API real devolve
                Amount: money(total),
                CurrencyCode: 'BRL',
                Purpose: '1',
                TaxAmounts: [{
                  TaxAmount: {
                    Total: money(taxaServico),
                    CurrencyCode: 'BRL',
                    Description: textoOf('Taxa de serviço'),
                    ExtraDescription: textoOf('Inclusa nas diárias'),
                    Percentage: '5.00',
                  },
                }],
                Calculation: { UnitName: 'Day', Quantity: days, UnitCharge: money(diaria) },
              },
            }],
            RateQualifier: { RateCategory: '3', RateQualifier: 'PADRAO', CorpDiscountNmbr: '' },
          },
          PricedEquips: comOpcionais
            ? OPCIONAIS.map((e) => ({
              PricedEquip: {
                Equipment: { EquipType: e.EquipType, Quantity: '1', Description: textoOf(e.Description) },
                Charge: {
                  TaxInclusive: 'false',
                  IncludedInRate: 'false',
                  // number, como a API real devolve neste ponto
                  Amount: Number((e.diaria * days).toFixed(2)),
                  CurrencyCode: 'BRL',
                  Calculation: { UnitName: 'Day', Quantity: days, UnitCharge: e.diaria },
                },
              },
            }))
            : [],
        },
        VehAvailInfo: {
          PricedCoverages: COBERTURAS.map((c) => ({
            PricedCoverage: {
              Coverage: {
                CoverageType: c.CoverageType,
                Code: c.Code,
                Details: { CoverageTextType: 'Description', Value: textoOf(c.nome), Description: textoOf(c.descricao) },
              },
              Charge: {
                TaxInclusive: 'false',
                IncludedInRate: 'false',
                Amount: Number((c.diaria * days).toFixed(2)),
                CurrencyCode: 'BRL',
                Calculation: { UnitName: 'Day', Quantity: days, UnitCharge: c.diaria },
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

export function buildMockConfirmation({ vehicle: veh, customer, pickUpDateTime, returnDateTime, totals, coverages = [], equipments = [] }) {
  return {
    VehResRSCore: {
      ConfID: { Type: '14', ID: String(Math.floor(100000 + Math.random() * 900000)) },
      ReservationStatus: 'Confirmed',
      VehReservation: {
        CreateDateTime: new Date().toISOString(),
        Customer: customer,
        VehSegmentCore: {
          ConfID: { Type: '14', ID: 1 },
          VehRentalCore: { PickUpDateTime: pickUpDateTime, ReturnDateTime: returnDateTime },
          Vehicle: veh,
          RentalRate: {
            RateDistance: { Unlimited: 'false', DistUnitName: 'Km', Quantity: 200, VehiclePeriodUnitName: 'RentalPeriod' },
            VehicleCharges: [],
            RateQualifier: { RateCategory: '3', RateQualifier: 'PADRAO', CorpDiscountNmbr: '' },
            NoShowFeeInfo: { FeeAmount: { Amount: '0.00', CurrencyCode: 'BRL', RateConvertedInd: 'false' } },
          },
          PricedEquips: equipments,
          TotalCharge: totals ?? { RateTotalAmount: '0.00', ExtraAmount: '0.00', EstimatedTotalAmount: '0.00', CurrencyCode: 'BRL' },
        },
        VehSegmentInfo: { PricedCoverages: coverages },
      },
    },
  }
}

/**
 * Reserva de exemplo para a tela de consulta em desenvolvimento.
 * Só é usada quando NODE_ENV !== 'production' (ver api/reservation-lookup.js):
 * em produção, sem integração, a consulta diz que está indisponível em vez de
 * inventar uma reserva.
 */
export function buildMockLookup({ confId, surname }) {
  const grupo = GRUPOS[0]
  const days = 2
  const diaria = grupo.total2d / 2
  const total = diaria * days
  const cobertura = COBERTURAS[2]

  return {
    VehRetResRSCore: {
      ReservationStatus: 'Confirmed',
      ConfID: { Type: '14', ID: String(confId ?? '000000') },
      VehReservation: {
        CreateDateTime: new Date().toISOString(),
        Customer: {
          Primary: {
            PersonName: { GivenName: 'JOAO', Surname: String(surname ?? 'SILVA').toUpperCase() },
            Telephone: { AreaCityCode: '21', PhoneNumber: '988540185', PhoneTechType: '1' },
            Email: 'cliente@exemplo.com',
            Document: { DocID: '52998224725', DocType: '5' },
          },
          Additional: {
            Address: {
              AddressLine: 'Rua das Flores, 100',
              CityName: 'Nova Iguaçu',
              StateProv: { StateCode: 'RJ' },
              CountryName: { Code: 'BR' },
            },
            Document: { DocID: '52998224725', DocType: '5' },
          },
        },
        VehSegmentCore: {
          ConfID: { Type: '14', ID: 1 },
          VehRentalCore: {
            PickUpDateTime: '2026-09-28T09:00:00',
            ReturnDateTime: '2026-09-30T09:00:00',
            PickUpLocation: { LocationCode: '26015', CodeContext: 'IATA' },
            ReturnLocation: { LocationCode: '26015', CodeContext: 'IATA' },
          },
          Vehicle: vehicle(grupo, (s) => s),
          RentalRate: {
            RateDistance: {
              Unlimited: 'false',
              DistUnitName: 'Km',
              Quantity: 200,
              VehiclePeriodUnitName: 'RentalPeriod',
              NoShowFeeInfo: { FeeAmount: { Amount: money(diaria), CurrencyCode: 'BRL', RateConvertedInd: 'false' } },
            },
            VehicleCharges: [{
              VehicleCharge: {
                TaxInclusive: 'false',
                Description: `${grupo.nome} Diária`,
                GuaranteedInd: 'false',
                IncludedInRate: 'true',
                IncludedInEstTotalInd: 'true',
                Amount: money(total),
                CurrencyCode: 'BRL',
                Purpose: '1',
                TaxAmounts: [],
                Calculation: { UnitName: 'Day', Quantity: days, UnitCharge: money(diaria) },
              },
            }],
            RateQualifier: { RateCategory: '3', RateQualifier: 'PADRAO', CorpDiscountNmbr: '' },
          },
          PricedEquips: [],
          TotalCharge: {
            RateTotalAmount: money(total),
            ExtraAmount: money(cobertura.diaria * days),
            EstimatedTotalAmount: money(total + cobertura.diaria * days),
            CurrencyCode: 'BRL',
          },
        },
        VehSegmentInfo: {
          PricedCoverages: [{
            PricedCoverage: {
              Coverage: {
                CoverageType: cobertura.CoverageType,
                Code: cobertura.Code,
                Details: { CoverageTextType: 'Description', Value: cobertura.nome, Description: cobertura.descricao },
              },
              Charge: {
                TaxInclusive: 'false',
                IncludedInRate: 'false',
                Amount: Number((cobertura.diaria * days).toFixed(2)),
                CurrencyCode: 'BRL',
                Calculation: { UnitName: 'Day', Quantity: days, UnitCharge: cobertura.diaria },
              },
            },
          }],
        },
      },
    },
  }
}
