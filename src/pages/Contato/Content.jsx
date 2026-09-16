import { motion } from 'framer-motion'
import TeamImage from '../../assets/images/image-4.webp'

const fadeInUp = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } }
}

const staggerContainer = {
  hidden: { opacity: 1 },
  visible: {
    transition: { staggerChildren: 0.06 }
  }
}

export default function Content() {
  return (
    <main className="on-light py-16 sm:py-24 bg-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Equipe Section */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.12 }}
          variants={staggerContainer}
          className="mb-20"
        >
          <motion.div variants={fadeInUp} className="text-center mb-12 sm:mb-16">
            <h2 className="type-headline text-text-dark text-balance">
              Pessoas que fazem acontecer.
            </h2>
            <p className="type-body text-text-muted text-lg mt-4 max-w-[65ch] mx-auto text-balance">
              Nossa equipe é formada por especialistas apaixonados por mobilidade. Mais do que alugar carros, trabalhamos para oferecer a melhor experiência.
            </p>
          </motion.div>

          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div variants={fadeInUp}>
              <img 
                src={TeamImage} 
                alt="Nossa Equipe" 
                className="w-full rounded-2xl shadow-card"
              />
            </motion.div>
            <motion.div variants={fadeInUp} className="space-y-6">
              <h3 className="type-title text-text-dark">Um atendimento humano e próximo</h3>
              <p className="type-body text-text-muted text-lg max-w-[65ch]">
                Acreditamos que a tecnologia deve facilitar processos, mas o atendimento precisa ser humano. Nossa equipe de especialistas está sempre pronta para entender a sua necessidade e encontrar o plano ideal para você ou para a sua empresa.
              </p>
              <p className="type-body text-text-muted text-lg max-w-[65ch]">
                Sem robôs, sem burocracia desnecessária. Fale diretamente com quem pode resolver o seu problema.
              </p>
            </motion.div>
          </div>
        </motion.div>

        {/* Formulário / Infos de Contato */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.12 }}
          variants={fadeInUp}
          className="bg-surface-light rounded-2xl p-8 sm:p-12"
        >
          <div className="grid md:grid-cols-2 gap-12">
            <div>
              <h3 className="type-title text-text-dark mb-6">Informações de contato</h3>
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-brand-accent/10 text-brand-accent rounded-xl flex items-center justify-center flex-shrink-0">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="type-subtitle text-text-dark">Telefone / WhatsApp</h4>
                    <a href="tel:5521968540185" className="type-body type-numeric text-text-muted hover:text-brand-accent transition-colors block mt-1">(21) 96854-0185</a>
                    <a href="tel:5521993297697" className="type-body type-numeric text-text-muted hover:text-brand-accent transition-colors block mt-1">(21) 99329-7697 (Empresas)</a>
                  </div>
                </div>
                
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-brand-accent/10 text-brand-accent rounded-xl flex items-center justify-center flex-shrink-0">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="type-subtitle text-text-dark">E-mail</h4>
                    <a href="mailto:contato@locafacil.com.br" className="type-body text-text-muted hover:text-brand-accent transition-colors block mt-1">contato@locafacil.com.br</a>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex flex-col justify-center items-center text-center bg-white p-8 rounded-2xl shadow-card">
              <h3 className="type-title text-text-dark mb-4">Fale no WhatsApp</h3>
              <p className="type-body text-text-muted mb-8 max-w-[45ch]">
                Nossa equipe responde rapidamente. Clique no botão abaixo para iniciar o atendimento.
              </p>
              <a href="https://api.whatsapp.com/send?phone=5521968540185&text=Ol%C3%A1,%20Locafacil!%20Gostaria%20de%20tirar%20uma%20d%C3%BAvida." target="_blank" rel="noopener noreferrer" className="w-full">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full bg-brand-whatsapp hover:bg-brand-whatsapp-hover text-white font-semibold px-8 py-4 rounded-xl transition-colors duration-300 flex items-center justify-center gap-3 cursor-pointer"
                >
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                  </svg>
                  Conversar no WhatsApp
                </motion.button>
              </a>
            </div>
          </div>
        </motion.div>

        {/* Mapa de Localização */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.12 }}
          variants={fadeInUp}
          className="mt-12 sm:mt-16 bg-surface-light rounded-2xl p-4 overflow-hidden"
        >
          <h3 className="type-title text-text-dark mb-4 px-4 pt-4">Nossa localização central</h3>
          <div className="w-full h-[300px] sm:h-[450px] rounded-2xl overflow-hidden border border-line">
            <iframe 
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d117621.57143977202!2d-43.53580551065604!3d-22.753361111623912!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x9967b5eb17e1a3%3A0xc4b901a5cc63b151!2sNova%20Igua%C3%A7u%2C%20RJ!5e0!3m2!1spt-BR!2sbr!4v1714578161726!5m2!1spt-BR!2sbr" 
              width="100%" 
              height="100%" 
              style={{ border: 0 }} 
              allowFullScreen="" 
              loading="lazy" 
              referrerPolicy="no-referrer-when-downgrade"
              title="Mapa Locafacil Nova Iguaçu"
            ></iframe>
          </div>
        </motion.div>

      </div>
    </main>
  )
}
