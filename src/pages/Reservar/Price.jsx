const BRL = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })

/* O tamanho mora no invólucro; as partes são medidas em em a partir dele.
   Assim o "R$" e os centavos mantêm a mesma proporção em qualquer escala. */
const SIZES = {
  sm: 'text-lg',
  md: 'text-3xl',
  lg: 'text-4xl sm:text-5xl',
}

/**
 * Valor em reais no padrão de locadora: símbolo recuado, inteiro em destaque,
 * centavos reduzidos e unidade como metadado. Dígito de largura fixa, para que
 * preços empilhados alinhem e o total não dance ao recalcular.
 */
export default function Price({ value, size = 'md', suffix, className = '' }) {
  const amount = Number(value) || 0
  const parts = BRL.formatToParts(amount)
  const symbol = parts.find((p) => p.type === 'currency')?.value ?? 'R$'
  const integer = parts
    .filter((p) => p.type === 'integer' || p.type === 'group')
    .map((p) => p.value)
    .join('')
  const fraction = parts.find((p) => p.type === 'fraction')?.value ?? '00'
  const decimal = parts.find((p) => p.type === 'decimal')?.value ?? ','

  return (
    <span className={`type-numeric inline-flex items-baseline ${SIZES[size]} ${className}`}>
      <span className="sr-only">{BRL.format(amount)}{suffix ? ` ${suffix}` : ''}</span>
      <span aria-hidden="true" className="inline-flex items-baseline gap-[0.15em]">
        <span className="text-[0.5em] font-semibold text-text-secondary">{symbol}</span>
        <span className="font-extrabold">{integer}</span>
        <span className="text-[0.56em] font-extrabold">{decimal}{fraction}</span>
        {suffix && <span className="text-[0.4em] font-medium text-text-secondary">{suffix}</span>}
      </span>
    </span>
  )
}
