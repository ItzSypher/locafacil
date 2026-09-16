import './assets/css/global.css'
import Routes from './Routes'
import Preloader from './components/Global/Preloader'
import WelcomePopup from './components/Global/WelcomePopup'
import ExitPopup from './components/Global/ExitPopup'
import MicroAgent from './components/Global/MicroAgent'

export default function App() {
  return (
    <>
      <Preloader />
      <WelcomePopup />
      <Routes />
      <ExitPopup />
      <MicroAgent />
    </>
  )
}