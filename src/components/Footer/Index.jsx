import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { Icon } from '@iconify-icon/react'
import Logo from '../../assets/brand/logo-lockup-white.svg'

const fadeInUp = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } }
}

const stagger = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.2 } }
}

export default function Footer() {
  return (
    <footer className="bg-brand-dark relative overflow-hidden">
      {/* Glow decorativo sutil */}
      <div className="absolute top-0 left-1/3 w-[300px] h-[300px] bg-brand-accent/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-8 relative z-10">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          variants={stagger}
          className="grid sm:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-8 mb-12"
        >
          {/* Coluna 1 - Logo e redes */}
          <motion.div variants={fadeInUp}>
            <img
              src={Logo}
              alt="Locafacil Aluguel de Veículos"
              width={850}
              height={255}
              loading="lazy"
              decoding="async"
              className="h-10 w-auto mb-4"
            />
            <p className="type-meta text-text-secondary mb-5 max-w-xs">
              A melhor experiência em locação de veículos do Rio de Janeiro. Mobilidade que descomplica.
            </p>
            <div className="flex items-center gap-3">
              <a
                href="https://www.instagram.com/locafacilaluguel/"
                target="_blank"
                rel="noopener noreferrer"
                className="w-11 h-11 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center text-text-secondary hover:text-white hover:bg-brand-accent hover:border-brand-accent transition-colors duration-300 cursor-pointer"
                aria-label="Instagram da Locafacil"
              >
                <Icon icon="uil:instagram" className="text-xl" />
              </a>
              <a
                href="https://api.whatsapp.com/send?phone=5521968540185&text=Ol%C3%A1,%20Locafacil!"
                target="_blank"
                rel="noopener noreferrer"
                className="w-11 h-11 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center text-text-secondary hover:text-white hover:bg-brand-success hover:border-brand-success transition-colors duration-300 cursor-pointer"
                aria-label="WhatsApp da Locafacil"
              >
                <Icon icon="uil:whatsapp" className="text-xl" />
              </a>
            </div>
          </motion.div>

          {/* Coluna 2 - Links rápidos */}
          <motion.div variants={fadeInUp}>
            <h2 className="type-label text-text-primary mb-4">Links Rápidos</h2>
            <nav className="space-y-3">
              {[
                { label: 'Início', href: '/' },
                { label: 'Reservar', href: '/reservar' },
                { label: 'Para Empresas', href: '/para-empresas' },
                { label: 'Contato', href: '/contato' },
              ].map((link) => (
                <Link
                  key={link.label}
                  to={link.href}
                  className="flex items-center min-h-11 type-meta text-text-secondary hover:text-brand-accent transition-colors duration-200 cursor-pointer -my-1"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </motion.div>

          {/* Coluna 3 - Contatos */}
          <motion.div variants={fadeInUp}>
            <h2 className="type-label text-text-primary mb-4">Contatos</h2>
            <div className="space-y-3">
              <a href="tel:2127861404" className="flex items-center gap-2 min-h-11 type-meta type-numeric text-text-secondary hover:text-brand-accent transition-colors cursor-pointer -my-1">
                <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
                </svg>
                (21) 2786-1404
              </a>
              <a href="tel:21968540185" className="flex items-center gap-2 min-h-11 type-meta type-numeric text-text-secondary hover:text-brand-accent transition-colors cursor-pointer -my-1">
                <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3" />
                </svg>
                (21) 96854-0185
              </a>
              <a href="mailto:gerencia@locafacilaluguel.com" className="flex items-center gap-2 min-h-11 type-meta text-text-secondary hover:text-brand-accent transition-colors cursor-pointer -my-1">
                <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                </svg>
                gerencia@locafacilaluguel.com
              </a>
            </div>
          </motion.div>

          {/* Coluna 4 - Endereço */}
          <motion.div variants={fadeInUp}>
            <h2 className="type-label text-text-primary mb-4">Endereço</h2>
            <div className="flex gap-2 type-meta text-text-secondary">
              <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
              </svg>
              <div>
                Cidade da Moda<br />
                Rod. Pres. Dutra, 13900<br />
                Jardim Tropical - Nova Iguaçu<br />
                Rio de Janeiro
              </div>
            </div>
          </motion.div>
        </motion.div>

        {/* Divisor e copyright */}
        <div className="border-t border-white/10 pt-6">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="type-meta text-text-secondary">
              © {new Date().getFullYear()} Locafacil Aluguel de Veículos. Todos os direitos reservados.
            </p>
            <p className="type-meta type-numeric text-text-secondary">
              CNPJ 30.787.245/0001-71
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}