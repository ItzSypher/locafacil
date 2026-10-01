/* Texto com as quebras à vista: cada `\n` vira um ↵ e uma linha nova. */
export default function ComQuebras({ texto, className = '' }) {
  const linhas = String(texto ?? '').split('\n')
  return (
    <span className={`whitespace-normal ${className}`}>
      {linhas.map((linha, i) => (
        <span key={i}>
          {linha}
          {i < linhas.length - 1 && (
            <>
              <span className="text-brand-accent font-semibold" aria-label="quebra de linha"> ↵</span>
              <br />
            </>
          )}
        </span>
      ))}
    </span>
  )
}
