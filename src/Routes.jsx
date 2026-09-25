import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { ReservationProvider } from './context/ReservationContext'

/* A Home é a porta de entrada e continua no pacote inicial. Todo o resto
   chega quando alguém pede — não faz sentido baixar as cinco telas do
   checkout para quem só quer o telefone da loja. */
import Home from './pages/Home/Index'

// ANDAIME TEMPORÁRIO — REMOVER ANTES DE PUBLICAR (ver src/components/DevSeed)
import DevSeed from './components/DevSeed/Index'

const Empresas = lazy(() => import('./pages/Empresas/Index'))
const Contato = lazy(() => import('./pages/Contato/Index'))
const Reservar = lazy(() => import('./pages/Reservar/Index'))
const ReservarVeiculos = lazy(() => import('./pages/Reservar/Veiculos/Index'))
const ReservarExtras = lazy(() => import('./pages/Reservar/Extras/Index'))
const ReservarDados = lazy(() => import('./pages/Reservar/Dados/Index'))
const ReservarRevisao = lazy(() => import('./pages/Reservar/Revisao/Index'))
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
              {/* ANDAIME TEMPORÁRIO — REMOVER ANTES DE PUBLICAR */}
              <DevSeed />
              <Routes>
                <Route index element={<Reservar />} />
                <Route path="veiculos" element={<ReservarVeiculos />} />
                <Route path="extras" element={<ReservarExtras />} />
                <Route path="dados" element={<ReservarDados />} />
                <Route path="revisao" element={<ReservarRevisao />} />
                <Route path="confirmacao" element={<ReservarConfirmacao />} />
                {/* `/reservar/consultar` existiu e saiu. Sem isto a rota
                    antiga pinta uma tela em branco — pior que um erro, porque
                    não diz nada e não tem saída. */}
                <Route path="*" element={<Navigate to="/reservar" replace />} />
              </Routes>
            </ReservationProvider>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  )
}
