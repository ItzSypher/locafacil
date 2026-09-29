import VehicleArt from './VehicleArt'
import { carroceriaDe } from './lib/carroceria'
import { photoFor } from '../../config/vehiclePhotos'

/**
 * A imagem do grupo, venha ela de onde vier.
 *
 * Grupo com foto cadastrada em `src/config/vehiclePhotos.js` mostra a foto;
 * grupo sem foto cai na ilustração. Os componentes do checkout falam só com
 * este, então trocar ilustração por foto é editar um objeto — nenhuma tela
 * precisa saber qual dos dois está no ar.
 *
 * Foto com fundo branco ganha uma placa branca arredondada: no card escuro,
 * é ela que faz o fundo da foto parecer moldura e não um retângulo colado.
 *
 * A legenda "imagem ilustrativa" acompanha os dois casos de propósito: a
 * reserva é por grupo, e nem a foto da frota garante o modelo que vai estar
 * no pátio no dia.
 */
export default function VehicleImage({ offer, className = '', legenda = true }) {
  const cadastro = photoFor(offer?.groupCode)
  const rotulo = cadastro?.modelo ? `${cadastro.modelo} ou similar` : carroceriaDe(offer).nome

  return (
    <figure className={className}>
      {cadastro ? (
        <img
          src={cadastro.foto}
          alt=""
          width={800}
          height={600}
          loading="lazy"
          decoding="async"
          className={`w-full h-auto object-contain ${cadastro.fundo === 'branco' ? 'bg-white rounded-xl' : ''}`}
        />
      ) : (
        <VehicleArt offer={offer} />
      )}

      {/* Cor própria, não `currentColor` herdado com opacidade: a legenda
          carrega informação ("ilustrativa") e precisa de contraste de texto,
          não de enfeite. */}
      {legenda && (
        <figcaption className="type-meta text-text-secondary text-center mt-2">
          {rotulo} · imagem ilustrativa
        </figcaption>
      )}
    </figure>
  )
}
