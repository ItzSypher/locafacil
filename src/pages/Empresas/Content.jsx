import { motion } from 'framer-motion'
import ReasonList from '../../components/Global/ReasonList'
import FormularioWhatsApp from '../../components/Global/FormularioWhatsApp'
import { FORM_EMPRESAS } from '../../config/formularios'

import Image1 from '../../assets/images/image-5.webp'
import Image2 from '../../assets/images/image-6.webp'
import BannerFinal from '../../assets/images/banner-empresas.webp'

/**
 * Conteúdo da página Empresas com estilo premium.
 */
const fadeInUp = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } }
}


const motivos = [
  {
    titulo: 'Custos',
    descricao: 'Com a terceirização de frota da Locafacil você reduz custos e elimina gastos inesperados com manutenções e substituição de veículos. Na prática é a sua empresa operando forte, com custo fixo mensal e sem surpresas desagradáveis.',
  },
  {
    titulo: 'Agilidade',
    descricao: 'A Locafacil Business garante o processo de contratação mais ágil do mercado. Sem sua empresa pagar caução, com atendimento humanizado e planos 100% personalizados de acordo com sua necessidade.',
  },
  {
    titulo: 'Foco',
    descricao: 'Você, empresário, sabe bem que tempo + foco = resultado! Terceirizando sua frota com a Locafacil Business você ganha tempo para pensar no que realmente importa — o crescimento da sua empresa.',
  },
  {
    titulo: 'Planejamento',
    descricao: 'Transformar despesas variáveis em custos fixos auxiliará todo o seu processo de gestão financeira e planejamento operacional. Além disso, você conta com a nossa flexibilidade de poder aumentar a frota sempre que quiser.',
  },
]

export default function EmpresasContent() {
  return (
    <main>
      {/* Seção principal */}
      <section className="on-light py-16 sm:py-24 bg-surface-light">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.12 }}
            variants={fadeInUp}
            className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center"
          >
            <div>
              <h2 className="type-headline text-text-dark mb-6 text-balance">
                Crescer dói, mas não precisa ser assim.
              </h2>
              <p className="type-body text-text-muted text-lg mb-8 max-w-[65ch]">
                Com a Locafacil Business você pode expandir sua operação sem precisar se preocupar com custos de aquisição, gestão da frota e manutenção dos veículos. Oferecemos soluções completas em terceirização de frotas para você focar no que realmente importa — o crescimento da sua empresa.
              </p>
              {/* Leva ao formulário: a cotação chega à loja já com o tamanho da
                  frota e o prazo, em vez de um "Olá" que pede três perguntas. */}
              <motion.a
                href="#cotacao"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="inline-block bg-brand-accent hover:bg-brand-glow text-white font-semibold px-8 py-3.5 rounded-xl transition-colors duration-300 cursor-pointer"
              >
                Solicitar Cotação Agora
              </motion.a>
            </div>
            <motion.div
              whileHover={{ y: -8 }}
              transition={{ type: 'spring', stiffness: 200 }}
            >
              <img src={Image1} alt="Frota empresarial Locafacil" loading="lazy" decoding="async" width={620} height={358} className="w-full rounded-2xl shadow-card" />
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* 4 Motivos */}
      <section className="on-light py-16 sm:py-24 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.12 }}
            variants={fadeInUp}
            className="text-center mb-12"
          >
            <h2 className="type-headline text-text-dark text-balance">
              4 motivos para contratar hoje
            </h2>
          </motion.div>

          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-start">
            <ReasonList items={motivos} />

            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.12 }}
              variants={fadeInUp}
            >
              <img src={Image2} alt="Equipe Locafacil Business" loading="lazy" decoding="async" width={620} height={358} className="w-full rounded-2xl shadow-card" />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Cotação */}
      <section id="cotacao" className="on-light py-16 sm:py-24 bg-surface-light scroll-mt-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.12 }}
            variants={fadeInUp}
            className="max-w-3xl mx-auto bg-white rounded-2xl p-6 sm:p-10 shadow-card"
          >
            <h2 className="type-headline text-text-dark text-balance">Peça sua cotação</h2>
            <p className="type-body text-text-muted mt-3 mb-8 max-w-[60ch]">
              Conte o tamanho da operação e a equipe comercial responde com uma proposta sob medida.
            </p>
            <FormularioWhatsApp {...FORM_EMPRESAS} />
          </motion.div>
        </div>
      </section>

      {/* Banner final */}
      <section className="on-light hidden md:block py-8 bg-surface-light">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.img
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.12 }}
            transition={{ duration: 0.6 }}
            src={BannerFinal}
            alt="Locafacil Business - Terceirização de Frotas"
            className="w-full rounded-2xl shadow-card"
          />
        </div>
      </section>
    </main>
  )
}