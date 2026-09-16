import Topbar from '../../components/Topbar/Index'
import Footer from '../../components/Footer/Index'
import Header from './Header'
import Content from './Content'

export default function Contato() {
  return (
    <div className="min-h-screen overflow-x-hidden">
      <Topbar />
      <Header />
      <Content />
      <Footer />
    </div>
  )
}
