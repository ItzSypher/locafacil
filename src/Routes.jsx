import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Home from './pages/Home/Index';
import Empresas from './pages/Empresas/Index';
import Contato from './pages/Contato/Index';
import Reservar from './pages/Reservar/Index';
import ReservarVeiculos from './pages/Reservar/Veiculos/Index';
import ReservarExtras from './pages/Reservar/Extras/Index';
import ReservarDados from './pages/Reservar/Dados/Index';
import ReservarConfirmacao from './pages/Reservar/Confirmacao/Index';
import { ReservationProvider } from './context/ReservationContext';

export default function Rotas() {
   return (
      <Router>
         <Routes>
            <Route path="/" exact element={<Home />} />
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
      </Router>
   );
}