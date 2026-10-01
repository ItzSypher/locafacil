import { motion } from 'framer-motion'
import TeamImage from '../../assets/images/image-4.webp'
import FormularioWhatsApp from '../../components/Global/FormularioWhatsApp'
import { FORM_CONTATO } from '../../config/formularios'

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
                    <a href="mailto:reservas@locafacilaluguel.com" className="type-body text-text-muted hover:text-brand-accent transition-colors block mt-1">reservas@locafacilaluguel.com</a>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-card">
              <h3 className="type-title text-text-dark mb-2">Fale com a gente</h3>
              <p className="type-body text-text-muted mb-6 max-w-[45ch]">
                Conte o que precisa e a mensagem chega pronta no WhatsApp da loja.
              </p>
              <FormularioWhatsApp {...FORM_CONTATO} />
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
