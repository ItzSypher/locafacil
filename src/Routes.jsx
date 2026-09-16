import { lazy, Suspense } from 'react'
import { Route, Routes } from 'react-router-dom'
import { ReservationProvider } from './context/ReservationContext'

/* A Home é a porta de entrada e continua no pacote inicial. Todo o resto
   chega quando alguém pede — não faz sentido baixar as cinco telas do
   checkout para quem só quer o telefone da loja. */
import Home from './pages/Home/Index'

const Empresas = lazy(() => import('./pages/Empresas/Index'))
const Contato = lazy(() => import('./pages/Contato/Index'))
const Reservar = lazy(() => import('./pages/Reservar/Index'))
const ReservarVeiculos = lazy(() => import('./pages/Reservar/Veiculos/Index'))
const ReservarExtras = lazy(() => import('./pages/Reservar/Extras/Index'))
const ReservarDados = lazy(() => import('./pages/Reservar/Dados/Index'))
const ReservarConfirmacao = lazy(() => import('./pages/Reservar/Confirmacao/Index'))

/* Enquanto o pedaço da rota chega, a página fica no fundo da marca em vez de
   piscar branco. O texto é para quem ouve a tela, não para quem a vê. */
function RouteFallback() {
  return (
    <div className="min-h-screen bg-hero-gradient" role="status" aria-live="polite">
      <span className="sr-only">Carregando página</span>
    </div>
  )
}

export default function Rotas() {
  return (
    <Suspense fallback={<RouteFallback />}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/para-empresas" element={<Empresas />} />
        <Route path="/contato" element={<Contato />} />
        <Route
          path="/reservar/*"
          element={
            <ReservationProvider>
              <Routes>
                <Route index element={<Reservar />} />
                <Route path="veiculos" element={<ReservarVeiculos />} />
                <Route path="extras" element={<ReservarExtras />} />
                <Route path="dados" element={<ReservarDados />} />
                <Route path="confirmacao" element={<ReservarConfirmacao />} />
              </Routes>
            </ReservationProvider>
          }
        />
      </Routes>
    </Suspense>
  )
}
