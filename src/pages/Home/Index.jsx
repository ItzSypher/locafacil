import { lazy, Suspense } from 'react'
import Topbar from '../../components/Topbar/Index'
import Footer from '../../components/Footer/Index'
import Header from './Header'

/* O conteúdo abaixo da dobra carrega o Swiper inteiro. Adiado, o hero pinta
   sem esperar por ele; o espaço já fica reservado para nada saltar quando
   chegar. */
const Content = lazy(() => import('./Content'))

export default function Home() {
  return (
    <div className="min-h-screen overflow-x-hidden">
      <Topbar />
      <Header />
      <Suspense fallback={<div className="min-h-screen bg-surface-light" aria-hidden="true" />}>
        <Content />
      </Suspense>
      <Footer />
    </div>
  )
}
