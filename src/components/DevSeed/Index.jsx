/* ============================================================================
 * ANDAIME TEMPORÁRIO — REMOVER ANTES DE PUBLICAR
 * ----------------------------------------------------------------------------
 * Preenche o checkout inteiro com dados falsos em um clique, para exercitar a
 * infraestrutura sem redigitar busca, veículo, proteção e condutor a cada
 * recarga. Nada aqui entra no bundle de produção: o componente devolve `null`
 * fora de `import.meta.env.DEV`, e o único ponto de montagem está em
 * `src/Routes.jsx`, marcado com o mesmo aviso.
 *
 * Para remover: apagar esta pasta e a linha <DevSeed /> em src/Routes.jsx.
 * ==========================================================================*/

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useReservation } from '../../context/ReservationContext'
import { getStoreHours, searchAvailability, ReservationApiError } from '../../lib/api/reservation'
import { buildAvailabilityPayload } from '../../pages/Reservar/lib/reservation'

const DEV = import.meta.env.DEV

const LOCATION_CODE = '26015'

const FAKE_DRIVER = {
  givenName: 'Joana',
  surname: 'Ribeiro',
  areaCode: '21',
  phone: '98854-0185',
  email: 'joana.ribeiro@exemplo.com.br',
  // CPF com dígito verificador válido — o formulário recusa sequência repetida.
  docId: '529.982.247-25',
  passport: '',
  foreigner: false,
  addressLine: 'Rua das Palmeiras, 240 - Centro',
  complement: 'Apto 402',
  cityName: 'Nova Iguaçu',
  stateCode: 'RJ',
  countryCode: 'BR',
}

const pad = (n) => String(n).padStart(2, '0')
const isoDate = (date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`

/**
 * Primeiro dia aberto a partir de agora que respeita a antecedência mínima.
 * A grade vem de /api/store-hours; sem ela, cai num dia de semana qualquer e
 * deixa a API validar.
 */
function pickWindow(hours) {
  const noticeHours = hours?.antecedenciaMinimaHoras ?? 48
  const closed = new Set(hours?.diasFechados ?? [0])

  const start = new Date()
  start.setHours(start.getHours() + noticeHours + 2)

  const pickup = new Date(start)
  for (let i = 0; i < 14; i += 1) {
    if (!closed.has(pickup.getDay()) && pickup.getDay() !== 6) break
    pickup.setDate(pickup.getDate() + 1)
  }

  const retorno = new Date(pickup)
  for (let i = 0; i < 14; i += 1) {
    retorno.setDate(retorno.getDate() + 1)
    if (i >= 1 && !closed.has(retorno.getDay()) && retorno.getDay() !== 6) break
  }

  return {
    pickUpDateTime: `${isoDate(pickup)}T09:00:00`,
    returnDateTime: `${isoDate(retorno)}T10:00:00`,
  }
}

export default function DevSeed() {
  const navigate = useNavigate()
  const { patch, reset } = useReservation()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  if (!DEV) return null

  const seed = async () => {
    setBusy(true)
    setError('')

    try {
      let hours = null
      try {
        const res = await getStoreHours(LOCATION_CODE)
        hours = res.data
      } catch {
        // Sem grade, o pickWindow usa o padrão e a API decide.
      }

      const janela = pickWindow(hours)
      const search = {
        pickupLocationCode: LOCATION_CODE,
        returnLocationCode: LOCATION_CODE,
        pickupLocationName: hours?.nome ?? 'LOCAFACIL NOVA IGUAÇU',
        returnLocationName: hours?.nome ?? 'LOCAFACIL NOVA IGUAÇU',
        ...janela,
        scenario: '',
      }

      const res = await searchAvailability(buildAvailabilityPayload(search), '')
      const offer = res.data.offers?.[0]
      if (!offer) throw new Error('A busca não devolveu nenhum grupo para o período.')

      const coverage = offer.coverages?.[0] ?? null

      patch({
        search,
        quote: { quoteId: res.data.quoteId, expiresAt: res.data.expiresAt },
        selectedVehicle: offer,
        extras: {
          coverageType: coverage?.type ?? null,
          equipTypes: (offer.equipments ?? []).slice(0, 1).map((e) => e.type),
        },
        driver: FAKE_DRIVER,
        confirmation: null,
      })

      navigate('/reservar/revisao')
    } catch (err) {
      setError(err instanceof ReservationApiError ? err.errors.join(' ') : err.message)
    } finally {
      setBusy(false)
    }
  }

  const limpar = () => {
    reset()
    setError('')
    navigate('/reservar')
  }

  return (
    <div className="fixed bottom-4 left-4 z-[9991] flex flex-col items-start gap-2 max-w-[calc(100vw-2rem)] sm:max-w-sm">
      {error && (
        <p className="type-meta text-state-error bg-white border border-state-error-line rounded-xl px-3 py-2 shadow-card" role="alert">
          {error}
        </p>
      )}
      <div className="flex items-center gap-1 bg-brand-gold text-brand-dark rounded-xl shadow-card overflow-hidden">
        <button
          type="button"
          onClick={seed}
          disabled={busy}
          className="type-label px-4 h-11 hover:bg-white/30 transition-colors cursor-pointer disabled:cursor-wait"
        >
          {busy ? 'Preenchendo' : 'Dados falsos'}
        </button>
        <button
          type="button"
          onClick={limpar}
          className="type-label px-3 h-11 border-l border-brand-dark/20 hover:bg-white/30 transition-colors cursor-pointer"
          title="Limpar o estado do checkout e voltar para a busca"
        >
          Limpar
        </button>
      </div>
    </div>
  )
}
