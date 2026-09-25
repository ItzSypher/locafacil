import { useEffect, useState } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import Logo from '../../assets/brand/logo-lockup-white.svg'

// Espera curta: a marca aparece por um instante e sai da frente. Uma tela de
// abertura longa custa a primeira impressão inteira em conexão lenta.
const HOLD_MS = 900

/**
 * Abertura da marca.
 *
 * Antes era um ícone genérico de carro — qualquer locadora do mundo poderia
 * usar aquela tela. Agora é o próprio logotipo se preenchendo: o arquivo entra
 * como máscara (o `.webp` é branco sobre transparente, então o canal alfa já é
 * a forma das letras) e a cor sobe por dentro dele como um tanque enchendo.
 *
 * Duas camadas sob a mesma máscara: o vazio em branco a 18% e o cheio subindo
 * de baixo. Nenhuma imagem extra, nenhum SVG duplicado — trocar o logotipo é
 * trocar o import.
 */
export default function Preloader() {
  const [loading, setLoading] = useState(true)
  const reduzMovimento = useReducedMotion()

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), HOLD_MS)
    return () => clearTimeout(timer)
  }, [])

  const mask = {
    WebkitMaskImage: `url(${Logo})`,
    maskImage: `url(${Logo})`,
  }

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
          {/* Mesma proporção do arquivo (850×255) para a máscara não distorcer. */}
          <div className="relative w-56 sm:w-72 aspect-[850/255] brand-mask" style={mask}>
            <div className="absolute inset-0 bg-white/[0.18]" />
            <motion.div
              initial={{ height: reduzMovimento ? '100%' : '0%' }}
              animate={{ height: '100%' }}
              transition={{ duration: HOLD_MS / 1000, ease: [0.33, 1, 0.68, 1] }}
              className="absolute inset-x-0 bottom-0 bg-white"
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
