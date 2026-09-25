import './assets/css/global.css'
import { BrowserRouter as Router, useLocation } from 'react-router-dom'
import Routes from './Routes'
import Preloader from './components/Global/Preloader'
import DescontoPopup from './components/Global/DescontoPopup'
import FaleConosco from './components/Global/FaleConosco'
import { modoPrint } from './lib/modoPrint'

// As páginas internas de documentação são material de trabalho, não o site:
// nem o convite de desconto nem o botão de atendimento têm o que fazer ali.
const ehDocumentacao = (pathname) => pathname.startsWith('/doc')

// Popups de captação atrapalham quem já está reservando: só aparecem fora do checkout.
function MarketingPopups() {
  const { pathname } = useLocation()
  if (pathname.startsWith('/reservar')) return null
  if (ehDocumentacao(pathname)) return null
  if (modoPrint()) return null

  return <DescontoPopup />
}

function AtendimentoFlutuante() {
  const { pathname } = useLocation()
  if (ehDocumentacao(pathname)) return null
  if (modoPrint()) return null

  return <FaleConosco />
}

export default function App() {
  return (
    <Router>
      {!modoPrint() && <Preloader />}
      <MarketingPopups />
      <Routes />
      <AtendimentoFlutuante />
    </Router>
  )
}
