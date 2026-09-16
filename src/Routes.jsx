import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Home from './pages/Home/Index';
import Empresas from './pages/Empresas/Index';
import Contato from './pages/Contato/Index';

export default function Rotas() {
   return (
      <Router>
         <Routes>
            <Route path="/" exact element={<Home />} />
            <Route path="/para-empresas" element={<Empresas />} />
            <Route path="/contato" element={<Contato />} />
         </Routes>
      </Router>
   );
}