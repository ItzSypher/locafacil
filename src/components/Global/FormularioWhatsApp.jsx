import { useId, useState } from 'react'
import { motion } from 'framer-motion'

/**
 * Formulário que termina no WhatsApp.
 *
 * Nada vai para servidor: as respostas viram uma mensagem já escrita e o
 * WhatsApp abre com ela na caixa de texto. A loja recebe o pedido completo na
 * primeira mensagem, e a pessoa só aperta enviar. Envio por e-mail ficou para
 * depois (reunião de 29/09/2026).
 *
 * `campos`: { nome, rotulo, tipo: 'texto' | 'tel' | 'selecao' | 'area',
 *             opcoes?, obrigatorio?, autoComplete?, placeholder? }
 * `abertura`: primeira linha da mensagem.
 */
export default function FormularioWhatsApp({ campos, abertura, telefone, rotuloBotao, nota }) {
  const base = useId()
  const [valores, setValores] = useState({})

  const enviar = (evento) => {
    evento.preventDefault()
    const linhas = campos
      .filter((campo) => (valores[campo.nome] ?? '').trim())
      .map((campo) => `${campo.rotulo}: ${valores[campo.nome].trim()}`)
    const texto = [abertura, '', ...linhas].join('\n')
    window.open(
      `https://api.whatsapp.com/send?phone=${telefone}&text=${encodeURIComponent(texto)}`,
      '_blank',
      'noopener',
    )
  }

  const classe =
    'w-full bg-surface-light border border-line rounded-xl px-4 py-3 text-sm text-text-dark focus:border-brand-accent focus:ring-1 focus:ring-brand-accent outline-none'

  return (
    <form onSubmit={enviar} className="grid sm:grid-cols-2 gap-4 text-left">
      {campos.map((campo) => {
        const id = `${base}-${campo.nome}`
        const comum = {
          id,
          name: campo.nome,
          required: campo.obrigatorio,
          value: valores[campo.nome] ?? '',
          onChange: (e) => setValores((v) => ({ ...v, [campo.nome]: e.target.value })),
          className: classe,
        }
        return (
          <div key={campo.nome} className={campo.tipo === 'area' || campo.largo ? 'sm:col-span-2' : ''}>
            <label htmlFor={id} className="type-label text-text-dark block mb-1.5">
              {campo.rotulo}
              {!campo.obrigatorio && <span className="text-text-muted font-normal"> (opcional)</span>}
            </label>
            {campo.tipo === 'selecao' ? (
              <select {...comum}>
                <option value="">Selecione</option>
                {campo.opcoes.map((opcao) => (
                  <option key={opcao} value={opcao}>{opcao}</option>
                ))}
              </select>
            ) : campo.tipo === 'area' ? (
              <textarea {...comum} rows={4} placeholder={campo.placeholder} />
            ) : (
              <input
                {...comum}
                type={campo.tipo === 'tel' ? 'tel' : 'text'}
                inputMode={campo.tipo === 'tel' ? 'tel' : undefined}
                autoComplete={campo.autoComplete}
                placeholder={campo.placeholder}
              />
            )}
          </div>
        )
      })}

      <div className="sm:col-span-2 mt-2">
        <motion.button
          type="submit"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          className="w-full bg-brand-whatsapp hover:bg-brand-whatsapp-hover text-white font-semibold px-8 py-4 rounded-xl transition-colors duration-300 flex items-center justify-center gap-3 cursor-pointer"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
          </svg>
          {rotuloBotao}
        </motion.button>
        {nota && <p className="type-meta text-text-muted mt-3 text-center">{nota}</p>}
      </div>
    </form>
  )
}
