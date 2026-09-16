import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import Logo from '../../assets/images/logo-white.webp'

/**
 * Topbar premium com glassmorphism, menu mobile animado e CTA.
 * Fica fixa no topo e ganha opacidade ao scrollar.
 */
export default function Topbar() {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const navLinks = [
    { label: 'Início', href: '/' },
    { label: 'Reservar', href: '/reservar' },
    { label: 'Para Empresas', href: '/para-empresas' },
    { label: 'Contato', href: '/contato' },
  ]

  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'glass-dark shadow-glass'
          : 'bg-transparent'
      }`}
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">

          {/* Logo */}
          <Link to="/" className="flex-shrink-0">
            <img
              src={Logo}
              alt="Locafacil Aluguel de Veículos"
              className="h-8 sm:h-10 w-auto"
            />
          </Link>

          {/* Navegação Desktop */}
          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                to={link.href}
                className="relative type-label text-text-secondary hover:text-white transition-colors duration-200 cursor-pointer group"
              >
                {link.label}
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-brand-accent transition-all duration-300 group-hover:w-full" />
              </Link>
            ))}

            {/* CTA Desktop */}
            <a href="https://api.whatsapp.com/send?phone=5521968540185&text=Ol%C3%A1,%20Locafacil!%20Quero%20alugar%20um%20ve%C3%ADculo." target="_blank" rel="noopener noreferrer">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.97 }}
                className="bg-brand-accent hover:bg-brand-glow text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors duration-300 cursor-pointer"
              >
                Garanta seu veículo
              </motion.button>
            </a>
          </nav>

          {/* Botão Hamburger Mobile */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden relative w-8 h-8 flex flex-col items-center justify-center gap-1.5 cursor-pointer z-50"
            aria-label="Abrir menu"
          >
            <motion.span
              animate={menuOpen ? { rotate: 45, y: 6 } : { rotate: 0, y: 0 }}
              className="w-6 h-0.5 bg-white block transition-colors"
            />
            <motion.span
              animate={menuOpen ? { opacity: 0 } : { opacity: 1 }}
              className="w-6 h-0.5 bg-white block"
            />
            <motion.span
              animate={menuOpen ? { rotate: -45, y: -6 } : { rotate: 0, y: 0 }}
              className="w-6 h-0.5 bg-white block transition-colors"
            />
          </button>
        </div>
      </div>

      {/* Menu Mobile Fullscreen */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="md:hidden fixed inset-0 top-16 glass-dark z-40"
          >
            <nav className="flex flex-col items-center justify-center h-full gap-8 -mt-16">
              {navLinks.map((link, i) => (
                <motion.div
                  key={link.label}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06 }}
                >
                  <Link
                    to={link.href}
                    onClick={() => setMenuOpen(false)}
                    className="type-title text-white hover:text-brand-accent transition-colors cursor-pointer"
                  >
                    {link.label}
                  </Link>
                </motion.div>
              ))}
              <a
                href="https://api.whatsapp.com/send?phone=5521968540185&text=Ol%C3%A1,%20Locafacil!%20Quero%20alugar%20um%20ve%C3%ADculo."
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setMenuOpen(false)}
              >
                <motion.button
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  whileTap={{ scale: 0.95 }}
                  className="bg-brand-accent text-white text-lg font-semibold px-8 py-3 rounded-xl cursor-pointer"
                >
                  Garanta seu veículo
                </motion.button>
              </a>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  )
}