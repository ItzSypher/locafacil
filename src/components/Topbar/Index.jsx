import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { Link, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useDialog } from '../../hooks/useDialog'
import Logo from '../../assets/brand/logo-lockup-white.svg'

const NAV_LINKS = [
  { label: 'Início', href: '/' },
  { label: 'Reservar', href: '/reservar' },
  { label: 'Minha Reserva', href: '/reservar/consultar' },
  { label: 'Para Empresas', href: '/para-empresas' },
  { label: 'Contato', href: '/contato' },
]

const WHATSAPP = 'https://api.whatsapp.com/send?phone=5521968540185&text=Ol%C3%A1,%20Locafacil!%20Quero%20alugar%20um%20ve%C3%ADculo.'

/**
 * Topbar fixa com navegação inteira no desktop e menu em camada no toque.
 *
 * O painel do menu é renderizado em portal no `body`, e não dentro do
 * `<header>`, de propósito: o framer-motion deixa `will-change: transform` no
 * header e a `.glass-dark` traz `backdrop-filter` — cada um deles basta para o
 * header virar o bloco de contenção de um filho `position: fixed`. Dentro
 * dele, `inset-0` media os 64px do header em vez da janela, e o menu abria com
 * 2px de altura, com os três primeiros links fora da tela.
 *
 * O corte para o menu de toque é `lg` (1024px) e não `md`: a 768px os cinco
 * rótulos e o botão não cabem na linha e quebram em duas e três linhas.
 */
export default function Topbar() {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const { pathname } = useLocation()

  const closeMenu = () => setMenuOpen(false)
  const panelRef = useDialog(menuOpen, closeMenu)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Navegar fecha o menu — inclusive pelo botão voltar do navegador, que não
  // passa pelo onClick dos links.
  useEffect(() => {
    setMenuOpen(false)
  }, [pathname])

  // Voltar ao desktop com o menu aberto deixaria a camada travando a página.
  useEffect(() => {
    if (!menuOpen) return undefined
    const query = window.matchMedia('(min-width: 1024px)')
    const handleChange = (event) => { if (event.matches) setMenuOpen(false) }
    query.addEventListener('change', handleChange)
    return () => query.removeEventListener('change', handleChange)
  }, [menuOpen])

  const isActive = (href) => (href === '/' ? pathname === '/' : pathname === href)

  return (
    <>
      <motion.header
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled ? 'glass-dark shadow-glass' : 'bg-transparent'
        }`}
      >
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20">

            <Link to="/" className="flex-shrink-0 flex items-center h-11" aria-label="Locafacil — página inicial">
              <img
                src={Logo}
                alt="Locafacil Aluguel de Veículos"
                width={850}
                height={255}
                decoding="async"
                className="h-8 sm:h-10 w-auto"
              />
            </Link>

            {/* Navegação — a partir de lg, onde a linha inteira cabe. A 1024px
                a linha fecha com folga de poucos pixels, por isso o gap menor
                até xl. */}
            <nav className="hidden lg:flex items-center gap-6 xl:gap-8" aria-label="Principal">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.label}
                  to={link.href}
                  aria-current={isActive(link.href) ? 'page' : undefined}
                  className={`relative type-label whitespace-nowrap transition-colors duration-200 cursor-pointer group py-3 ${
                    isActive(link.href) ? 'text-white' : 'text-text-secondary hover:text-white'
                  }`}
                >
                  {link.label}
                  <span
                    className={`absolute bottom-2 left-0 h-0.5 bg-brand-accent transition-all duration-300 ${
                      isActive(link.href) ? 'w-full' : 'w-0 group-hover:w-full'
                    }`}
                  />
                </Link>
              ))}

              <a href={WHATSAPP} target="_blank" rel="noopener noreferrer">
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  className="bg-brand-accent hover:bg-brand-glow text-white text-sm font-semibold whitespace-nowrap px-5 h-11 rounded-xl transition-colors duration-300 cursor-pointer"
                >
                  Garanta seu veículo
                </motion.button>
              </a>
            </nav>

            {/* Abre a camada. O fechar mora dentro dela, no mesmo lugar da tela. */}
            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              className="lg:hidden w-11 h-11 -mr-2 flex flex-col items-center justify-center gap-1.5 cursor-pointer"
              aria-label="Abrir menu"
              aria-expanded={menuOpen}
              aria-controls="menu-principal"
            >
              <span className="w-6 h-0.5 bg-white block rounded-full" />
              <span className="w-6 h-0.5 bg-white block rounded-full" />
              <span className="w-6 h-0.5 bg-white block rounded-full" />
            </button>
          </div>
        </div>
      </motion.header>

      <MobileMenu
        open={menuOpen}
        onClose={closeMenu}
        panelRef={panelRef}
        isActive={isActive}
      />
    </>
  )
}

/* Camada de navegação do toque. Fora do header por causa do bloco de
   contenção; fora do AnimatePresence na saída porque um painel em opacidade 0
   continua tabulável. */
function MobileMenu({ open, onClose, panelRef, isActive }) {
  if (typeof document === 'undefined') return null

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          key="menu-mobile"
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          aria-label="Menu principal"
          id="menu-principal"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          /* Acima do assistente flutuante (9990), abaixo dos popups de captação
             (9995/9998) e do preloader (9999). */
          className="lg:hidden fixed inset-0 z-[9992] bg-brand-dark/95 backdrop-blur-xl overflow-y-auto overscroll-contain"
        >
          <div className="container mx-auto px-4 sm:px-6 min-h-full flex flex-col">
            <div className="flex items-center justify-between h-16 sm:h-20 flex-shrink-0">
              <img
                src={Logo}
                alt="Locafacil Aluguel de Veículos"
                width={850}
                height={255}
                decoding="async"
                className="h-8 sm:h-10 w-auto"
              />
              <button
                type="button"
                onClick={onClose}
                className="w-11 h-11 -mr-2 flex items-center justify-center text-text-secondary hover:text-white transition-colors cursor-pointer"
                aria-label="Fechar menu"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <nav className="flex-1 flex flex-col justify-center py-8" aria-label="Principal">
              <ul className="space-y-1">
                {NAV_LINKS.map((link, i) => (
                  <motion.li
                    key={link.label}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.04 + i * 0.05 }}
                  >
                    <Link
                      to={link.href}
                      onClick={onClose}
                      aria-current={isActive(link.href) ? 'page' : undefined}
                      className={`flex items-center justify-between gap-4 type-subtitle border-b border-white/10 py-4 transition-colors cursor-pointer ${
                        isActive(link.href) ? 'text-brand-accent' : 'text-white hover:text-brand-accent'
                      }`}
                    >
                      {link.label}
                      <svg className="w-4 h-4 flex-shrink-0 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                      </svg>
                    </Link>
                  </motion.li>
                ))}
              </ul>
            </nav>

            <div className="pb-8 flex-shrink-0">
              <motion.a
                href={WHATSAPP}
                target="_blank"
                rel="noopener noreferrer"
                onClick={onClose}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                whileTap={{ scale: 0.98 }}
                className="flex items-center justify-center w-full bg-brand-accent hover:bg-brand-glow text-white font-semibold text-base px-8 py-4 rounded-xl transition-colors cursor-pointer"
              >
                Garanta seu veículo
              </motion.a>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  )
}
