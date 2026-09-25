import './assets/css/global.css'
import { BrowserRouter as Router, useLocation } from 'react-router-dom'
import Routes from './Routes'
import Preloader from './components/Global/Preloader'
import DescontoPopup from './components/Global/DescontoPopup'
import FaleConosco from './components/Global/FaleConosco'

/* Modo de captura, só em desenvolvimento: `?print=1` cala os popups e o
   assistente, e pula a abertura da marca, para tirar print limpo das telas —
   senão a captura headless congela no preloader. Em produção a bandeira não
   existe: `import.meta.env.DEV` some no build. */
function modoPrint() {
  if (!import.meta.env.DEV) return false
  try {
    return new URLSearchParams(window.location.search).get('print') === '1'
  } catch {
    return false
  }
}

// Popups de captação atrapalham quem já está reservando: só aparecem fora do checkout.
function MarketingPopups() {
  const { pathname } = useLocation()
  if (pathname.startsWith('/reservar')) return null
  if (modoPrint()) return null

  return <DescontoPopup />
}

export default function App() {
  return (
    <Router>
      {!modoPrint() && <Preloader />}
      <MarketingPopups />
      <Routes />
      {!modoPrint() && <FaleConosco />}
    </Router>
  )
}
