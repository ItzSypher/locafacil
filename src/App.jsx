import './assets/css/global.css'
import { BrowserRouter as Router, useLocation } from 'react-router-dom'
import Routes from './Routes'
import Preloader from './components/Global/Preloader'
import WelcomePopup from './components/Global/WelcomePopup'
import ExitPopup from './components/Global/ExitPopup'
import MicroAgent from './components/Global/MicroAgent'

// Popups de captação atrapalham quem já está reservando: só aparecem fora do checkout.
function MarketingPopups() {
  const { pathname } = useLocation()
  if (pathname.startsWith('/reservar')) return null

  return (
    <>
      <WelcomePopup />
      <ExitPopup />
    </>
  )
}

export default function App() {
  return (
    <Router>
      <Preloader />
      <MarketingPopups />
      <Routes />
      <MicroAgent />
    </Router>
  )
}
