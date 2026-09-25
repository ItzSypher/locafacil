/* A API não devolve foto do veículo, e a reserva é por grupo, não por modelo —
   uma foto de um carro específico prometeria o que a locadora não garante.
   A silhueta diz o porte sem mentir sobre o modelo, e sendo SVG acompanha o
   tema e não pesa no carregamento. */

const BODIES = {
  hatch: {
    // Teto curto, traseira cortada.
    body: 'M14 44 L22 44 C24 34 30 26 40 24 L74 21 C84 20 92 23 100 29 L112 38 L134 41 C142 42 146 46 146 52 L146 58 L14 58 Z',
    window: 'M44 28 L72 26 C79 25 85 27 91 31 L100 38 L44 41 Z',
    pillar: 'M70 26 L70 39',
  },
  sedan: {
    // Teto longo e porta-malas destacado.
    body: 'M10 44 L20 44 C22 34 28 26 38 24 L72 21 C82 20 90 23 98 29 L110 38 L142 42 C150 43 152 47 152 53 L152 58 L10 58 Z',
    window: 'M42 28 L70 26 C77 25 83 27 89 31 L98 38 L42 41 Z',
    pillar: 'M68 26 L68 39',
  },
  suv: {
    // Mais alto, maior vão livre, traseira reta.
    body: 'M12 42 L20 42 C22 30 28 21 40 19 L82 17 C92 17 99 20 105 26 L118 36 L140 39 C148 40 152 44 152 51 L152 58 L12 58 Z',
    window: 'M44 24 L78 22 C85 22 90 24 95 28 L105 36 L44 38 Z',
    pillar: 'M74 22 L74 37',
  },
}

function bodyFor(offer) {
  const haystack = `${offer?.category ?? ''} ${offer?.description ?? ''} ${offer?.size ?? ''}`.toLowerCase()
  if (haystack.includes('suv') || haystack.includes('utilitário') || haystack.includes('pick')) return BODIES.suv
  if (haystack.includes('sedan') || haystack.includes('sedã')) return BODIES.sedan
  return BODIES.hatch
}

/**
 * Silhueta do grupo. Decorativa: o card já nomeia o grupo em texto, então o
 * desenho não precisa ser anunciado.
 */
export default function VehicleArt({ offer, className = '' }) {
  const shape = bodyFor(offer)

  return (
    <svg
      viewBox="0 0 164 72"
      className={`w-full h-auto ${className}`}
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <path d={shape.body} fill="currentColor" fillOpacity="0.14" />
      <path d={shape.body} stroke="currentColor" strokeOpacity="0.45" strokeWidth="1.75" strokeLinejoin="round" />
      <path d={shape.window} fill="currentColor" fillOpacity="0.22" />
      <path d={shape.pillar} stroke="currentColor" strokeOpacity="0.45" strokeWidth="1.5" strokeLinecap="round" />

      {/* Rodas */}
      <circle cx="44" cy="58" r="10" fill="currentColor" fillOpacity="0.14" />
      <circle cx="44" cy="58" r="10" stroke="currentColor" strokeOpacity="0.5" strokeWidth="1.75" />
      <circle cx="44" cy="58" r="3.5" stroke="currentColor" strokeOpacity="0.35" strokeWidth="1.5" />
      <circle cx="122" cy="58" r="10" fill="currentColor" fillOpacity="0.14" />
      <circle cx="122" cy="58" r="10" stroke="currentColor" strokeOpacity="0.5" strokeWidth="1.75" />
      <circle cx="122" cy="58" r="3.5" stroke="currentColor" strokeOpacity="0.35" strokeWidth="1.5" />

      {/* Solo */}
      <path d="M4 68 L160 68" stroke="currentColor" strokeOpacity="0.16" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}
