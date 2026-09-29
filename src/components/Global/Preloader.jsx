import { useEffect, useState } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import Simbolo from '../../assets/brand/symbol-pingo.svg'

// Espera curta: a marca aparece por um instante e sai da frente. Uma tela de
// abertura longa custa a primeira impressão inteira em conexão lenta.
const HOLD_MS = 900

/**
 * Abertura da marca: o ícone da Locafácil se preenchendo de baixo para cima.
 *
 * Antes o logotipo inteiro entrava como máscara. Máscara só enxerga o canal
 * alfa — funcionava com a marca toda branca, mas apagaria o pingo verde. Aqui
 * são duas cópias do mesmo arquivo: uma apagada, de fundo, e outra por cima
 * com as cores, revelada por um recorte que sobe. Trocar o ícone continua
 * sendo trocar o import.
 */
export default function Preloader() {
  const [loading, setLoading] = useState(true)
  const reduzMovimento = useReducedMotion()

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), HOLD_MS)
    return () => clearTimeout(timer)
  }, [])

  return (
    <AnimatePresence>
      {loading && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="fixed inset-0 z-[9999] bg-hero-gradient flex items-center justify-center"
          role="status"
          aria-label="Carregando"
        >
          {/* Mesma proporção do arquivo (213×255) para as duas camadas casarem. */}
          <div className="relative w-16 sm:w-20 aspect-[213/255]">
            <img src={Simbolo} alt="" width={213} height={255} className="absolute inset-0 w-full h-full opacity-[0.18]" />
            <motion.img
              src={Simbolo}
              alt=""
              width={213}
              height={255}
              initial={{ clipPath: reduzMovimento ? 'inset(0% 0 0 0)' : 'inset(100% 0 0 0)' }}
              animate={{ clipPath: 'inset(0% 0 0 0)' }}
              transition={{ duration: HOLD_MS / 1000, ease: [0.33, 1, 0.68, 1] }}
              className="absolute inset-0 w-full h-full"
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
