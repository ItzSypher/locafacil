import { lazy, Suspense } from 'react'
import Topbar from '../../components/Topbar/Index'
import Footer from '../../components/Footer/Index'
import Header from './Header'

/* Tudo abaixo da dobra chega depois: o hero pinta sem esperar pelas cinco
   seções e pelas imagens delas. O espaço já fica reservado para nada saltar
   quando o pedaço chegar. */
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
