import Topbar from '../../components/Topbar/Index'
import Footer from '../../components/Footer/Index'
import SearchWidget from './SearchWidget'

export default function Reservar() {
  return (
    <div className="min-h-screen overflow-x-hidden">
      <Topbar />
      <section className="relative min-h-screen bg-hero-gradient overflow-hidden flex items-center" id="reservar">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-1/4 -right-1/4 w-[600px] h-[600px] bg-brand-accent/10 rounded-full blur-[120px]" />
          <div className="absolute top-1/2 -left-1/4 w-[400px] h-[400px] bg-brand-glow/5 rounded-full blur-[100px]" />
        </div>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-24 relative z-10">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-text-primary text-center mb-10 tracking-tight">
            Reserve seu veículo
          </h1>
          <SearchWidget />
        </div>
      </section>
      <Footer />
    </div>
  )
}
