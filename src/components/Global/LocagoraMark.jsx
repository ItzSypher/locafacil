import Simbolo from '../../assets/brand/symbol-white.svg'

/**
 * Rosto da assistente.
 *
 * O avatar anterior era uma ilustração de banco de imagem: uma pessoa que não
 * trabalha aqui, sem nada da marca, e que a 32px virava um borrão colorido.
 * A Locagora não precisa fingir ser alguém — precisa ser reconhecível. Aqui
 * ela usa o símbolo da própria Locafacil sobre o azul do manual.
 *
 * O azul de marca (`brand-brand`) e não o azul clicável (`brand-accent`):
 * pela Regra da Voz Única, quem carrega cor de ação é o botão, não o
 * distintivo dentro dele.
 */
export default function LocagoraMark({ className = '', simboloClassName = 'w-1/2' }) {
  return (
    <span
      className={`inline-flex items-center justify-center rounded-full bg-brand-brand overflow-hidden ${className}`}
      aria-hidden="true"
    >
      <img
        src={Simbolo}
        alt=""
        width={213}
        height={255}
        decoding="async"
        className={`${simboloClassName} h-auto object-contain`}
      />
    </span>
  )
}
