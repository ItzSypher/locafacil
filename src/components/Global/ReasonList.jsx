import { motion } from 'framer-motion'

const list = {
  hidden: { opacity: 1 },
  visible: { transition: { staggerChildren: 0.06 } },
}

const item = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } },
}

/**
 * Lista de argumentos sobre superfície clara.
 *
 * Os itens viviam em dois arquivos, cada um com um círculo numerado de 48px na
 * frente. A ordem não significava nada — ninguém precisa ler o motivo 3 antes
 * do 4 — então o número era enfeite ocupando o lugar do texto. Aqui a
 * separação é um fio de 1px e o espaço entre os itens; a hierarquia vem do
 * peso do título, não de um distintivo.
 */
export default function ReasonList({ items, className = '' }) {
  return (
    <motion.ul
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.12 }}
      variants={list}
      className={`divide-y divide-line ${className}`}
    >
      {items.map((reason) => (
        <motion.li key={reason.titulo} variants={item} className="py-6 first:pt-0 last:pb-0">
          <h3 className="type-subtitle text-text-dark mb-2">{reason.titulo}</h3>
          <p className="type-body text-text-muted max-w-[62ch]">{reason.descricao}</p>
        </motion.li>
      ))}
    </motion.ul>
  )
}
