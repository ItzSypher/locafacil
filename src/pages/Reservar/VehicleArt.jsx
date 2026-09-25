import { carroceriaDe } from './lib/carroceria'

/* Ilustração do grupo, para quando não há foto (ver src/config/vehiclePhotos.js).
 *
 * A reserva é por grupo, não por modelo — "Kwid ou similar" é o que a API
 * promete. O desenho diz o porte com honestidade: qualquer pessoa reconhece um
 * hatch, um sedã e um SUV, e ninguém confunde isso com a promessa de um carro
 * específico.
 *
 * Sendo SVG, herda a cor do contexto (`currentColor` no corpo, acento no
 * vidro), funciona em fundo claro e escuro, e custa menos de 2 kB. */

function Roda({ cx, r }) {
  return (
    <g>
      <circle cx={cx} cy="58" r={r} fill="currentColor" fillOpacity="0.18" />
      <circle cx={cx} cy="58" r={r} stroke="currentColor" strokeOpacity="0.5" strokeWidth="2" />
      <circle cx={cx} cy="58" r={r * 0.42} fill="currentColor" fillOpacity="0.12" />
      <circle cx={cx} cy="58" r={r * 0.42} stroke="currentColor" strokeOpacity="0.38" strokeWidth="1.5" />
    </g>
  )
}

/**
 * Decorativa: o card já nomeia o grupo em texto, então o desenho não precisa
 * ser anunciado ao leitor de tela.
 */
export default function VehicleArt({ offer, className = '' }) {
  const c = carroceriaDe(offer)

  return (
    <svg
      viewBox={c.caixa}
      className={`w-full h-auto ${className}`}
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      {/* Sombra de contato: um borrão achatado sob o carro. Sem ela o desenho
          flutua, e o olho lê "adesivo" em vez de "objeto". */}
      <ellipse cx={(c.eixoD + c.eixoT) / 2} cy="70" rx={(c.eixoT - c.eixoD) / 2 + 26} ry="4" fill="currentColor" fillOpacity="0.1" />

      {/* Corpo, com um leve degradê para o topo não ficar chapado. */}
      <path d={c.corpo} fill="currentColor" fillOpacity="0.16" />
      <path d={c.corpo} stroke="currentColor" strokeOpacity="0.55" strokeWidth="2" strokeLinejoin="round" />

      {/* Vinco lateral: o traço que separa a porta da saia e dá volume. */}
      <path d={c.vinco} stroke="currentColor" strokeOpacity="0.22" strokeWidth="1.5" strokeLinecap="round" />

      {/* Vidro no azul da interface: o único ponto de cor, e é o que faz a
          ilustração parecer desenhada e não recortada. */}
      <path d={c.vidro} className="text-brand-accent" fill="currentColor" fillOpacity="0.32" />
      <path d={c.coluna} stroke="currentColor" strokeOpacity="0.45" strokeWidth="1.5" strokeLinecap="round" />

      <Roda cx={c.eixoD} r={c.raio} />
      <Roda cx={c.eixoT} r={c.raio} />
    </svg>
  )
}
