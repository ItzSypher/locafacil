import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Autoplay, Pagination, Navigation, EffectFade } from 'swiper/modules'

// Import Swiper styles
import 'swiper/css'
import 'swiper/css/pagination'
import 'swiper/css/navigation'
import 'swiper/css/effect-fade'

/* Importação de imagens existentes */
import Nissan from '../../assets/images/nissan.webp'
import Hyundai from '../../assets/images/hyundai.webp'
import Mazda from '../../assets/images/mazda.webp'
import Chevrolet from '../../assets/images/chevrolet.webp'
import Renault from '../../assets/images/renault.webp'
import Ford from '../../assets/images/ford.webp'
import Dodge from '../../assets/images/dodge.webp'

import Image1 from '../../assets/images/image-1.webp'
import Image3 from '../../assets/images/image-3.webp'
import Image4 from '../../assets/images/image-4.webp'

/* Entrada curta com ease exponencial: o conteúdo assenta, não desliza.
   O container nunca fica invisível — só orquestra os filhos. */
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

/* ===== DADOS DOS BENEFÍCIOS ===== */
const beneficios = [
  {
    icone: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
      </svg>
    ),
    titulo: '0% de Caução',
    descricao: 'Por que prender seu limite de cartão se o carro já está pago? Saia dirigindo sem depositar um centavo de garantia.',
  },
  {
    icone: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
      </svg>
    ),
    titulo: 'Seguro Total Sem Pegadinhas',
    descricao: 'Dormir tranquilo custa caro? Aqui não. Cobertura completa já inclusa no preço da tela. As letras miúdas nós deixamos para a concorrência.',
  },
  {
    icone: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
      </svg>
    ),
    titulo: 'Dobro de Quilometragem',
    descricao: 'Não fique contando quilômetros de olho no painel. Nossos planos entregam o dobro de franquia. Rode livre e sem surpresa na fatura.',
  },
  {
    icone: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    titulo: 'Cancele Quando Quiser',
    descricao: 'Seu carro não pode ser uma prisão. Planos de assinatura sem período mínimo absurdo. Não quer mais? É só devolver.',
  },
  {
    icone: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
      </svg>
    ),
    titulo: 'Eleita 4.9 ★ pelos Clientes',
    descricao: 'Não acredite na gente, acredite em quem já testou e aprovou nossa frota. São avaliações reais de clientes extremamente satisfeitos.',
  },
]

/* ===== DADOS DAS MARCAS (Social Proof) ===== */
const marcas = [
  { src: Nissan, alt: 'Nissan' },
  { src: Hyundai, alt: 'Hyundai' },
  { src: Mazda, alt: 'Mazda' },
  { src: Chevrolet, alt: 'Chevrolet' },
  { src: Renault, alt: 'Renault' },
  { src: Ford, alt: 'Ford' },
  { src: Dodge, alt: 'Dodge' },
]

/* ===== DADOS DOS SERVIÇOS ===== */
const servicos = [
  {
    imagem: Image1,
    titulo: 'Assinatura Locafacil Express',
    subtitulo: 'Esqueça tudo o que você sabe sobre ter carro.',
    descricao: 'Esqueça oficina, IPVA, seguro caro e depreciação. Você assina um carro zero, pega a chave e o resto do trabalho é nosso. O caminho mais rápido e inteligente para andar de carro novo hoje.',
    cta: 'Quero Liberdade Agora',
    link: 'https://api.whatsapp.com/send?phone=5521968540185&text=Ol%C3%A1,%20Locafacil!%20Tenho%20interesse%20na%20Assinatura.',
  },
  {
    imagem: Image3,
    titulo: 'Locafacil Empresas',
    subtitulo: 'Seu negócio não pode parar.',
    descricao: 'Terceirizar a frota da sua empresa é a jogada de mestre para salvar o fluxo de caixa. Modelos ideais para a sua operação girar forte, sem você esquentar a cabeça com burocracia.',
    cta: 'Receber Proposta Comercial',
    link: '/para-empresas',
    interno: true,
  },
]

/* ===== DADOS "POR QUE ESCOLHER" ===== */
const diferenciais = [
  {
    numero: '01',
    titulo: 'Aceleração de Aprovação',
    descricao: 'Você tem pressa. Então cortamos a burocracia inútil. Do orçamento à chave na mão num piscar de olhos.',
  },
  {
    numero: '02',
    titulo: 'O Que Você Vê É O Que Você Paga',
    descricao: 'Esqueça as taxas ocultas de "proteção extra" no balcão. O combinado não sai caro, o nosso contrato é reto e direto.',
  },
  {
    numero: '03',
    titulo: 'Máquinas Selecionadas a Dedo',
    descricao: 'Só trabalhamos com veículos novos ou recém-revisados das melhores marcas. Sente, ligue e sinta o conforto.',
  },
  {
    numero: '04',
    titulo: 'Atendimento Corpo a Corpo',
    descricao: 'Quando ligar, não falará com um robô burro. Falará com alguém da equipe focado em resolver seu problema real.',
  },
]

/* ===== CARDS DOS SERVIÇOS AGORA SÃO RENDERIZADOS DIRETAMENTE NO GRID ===== */

/**
 * Conteúdo principal da Home com seções:
 * 1. Benefícios (staggered cards)
 * 2. Social Proof / Montadoras (grayscale → color hover)
 * 3. Serviços Premium (carrossel horizontal scroll-linked)
 * 4. Por que Escolher (numerado com animação)
 * 5. CTA Final (urgência + conversão)
 */
export default function HomeContent() {
  return (
    <main>

      {/* ===== SEÇÃO BENEFÍCIOS ===== */}
      <section id="beneficios" className="on-light pt-32 sm:pt-40 pb-16 sm:pb-24 bg-slate-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.12 }}
            variants={fadeInUp}
            className="text-center mb-12 sm:mb-16"
          >
            <h2 className="type-headline text-text-dark text-balance">
              Aluguel de carro não é tudo igual.
            </h2>
            <p className="type-body text-text-muted text-lg mt-4 max-w-[65ch] mx-auto text-balance">
              Só na Locafacil você tem benefícios que ninguém mais oferece. Compare e comprove.
            </p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.1 }}
            variants={fadeInUp}
            className="w-full relative"
          >
            <Swiper
              modules={[Pagination, Autoplay]}
              spaceBetween={24}
              slidesPerView={1}
              pagination={{ clickable: true, dynamicBullets: true }}
              autoplay={{ delay: 3000, disableOnInteraction: false }}
              breakpoints={{
                640: { slidesPerView: 2 },
                1024: { slidesPerView: 3 },
              }}
              className="pb-16"
            >
              {beneficios.map((item, i) => (
                <SwiperSlide key={i} className="h-auto">
                  <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-card hover:shadow-card-hover transition-all duration-300 cursor-grab active:cursor-grabbing group h-full flex flex-col border border-slate-100 hover:border-brand-accent/20">
                    <div className="w-14 h-14 bg-brand-accent/10 text-brand-accent rounded-2xl flex items-center justify-center mb-5 group-hover:bg-brand-accent group-hover:text-white group-hover:scale-110 transition-all duration-300">
                      {item.icone}
                    </div>
                    <h3 className="type-subtitle text-text-dark mb-2">{item.titulo}</h3>
                    <p className="text-text-muted leading-relaxed flex-grow">{item.descricao}</p>
                  </div>
                </SwiperSlide>
              ))}
            </Swiper>
          </motion.div>
        </div>
      </section>

      {/* ===== SEÇÃO SOCIAL PROOF - MONTADORAS ===== */}
      <section className="on-light py-16 sm:py-20 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.12 }}
            variants={fadeInUp}
            className="text-center mb-10"
          >
            <h2 className="type-headline text-text-dark text-balance">
              Montadoras que fazem parte da nossa frota
            </h2>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.12 }}
            variants={fadeInUp}
            className="w-full overflow-hidden"
          >
            <Swiper
              modules={[Autoplay]}
              spaceBetween={40}
              slidesPerView={3}
              loop={true}
              speed={3000}
              autoplay={{
                delay: 0,
                disableOnInteraction: false,
              }}
              allowTouchMove={false}
              breakpoints={{
                640: { slidesPerView: 4, spaceBetween: 60 },
                1024: { slidesPerView: 6, spaceBetween: 80 },
              }}
              className="marcas-swiper"
            >
              {marcas.map((marca, i) => (
                <SwiperSlide key={i} className="flex justify-center items-center">
                  <div className="grayscale opacity-50 hover:grayscale-0 hover:opacity-100 hover:scale-110 transition-all duration-500 cursor-pointer flex justify-center w-full">
                    <img
                      src={marca.src}
                      alt={marca.alt}
                      className="h-10 sm:h-12 lg:h-14 w-auto object-contain"
                    />
                  </div>
                </SwiperSlide>
              ))}
            </Swiper>
          </motion.div>
        </div>
      </section>

      {/* ===== SEÇÃO SERVIÇOS ===== */}
      <section className="on-light py-16 sm:py-24 bg-slate-50 relative overflow-hidden">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          {/* Título */}
          <div className="mb-12 sm:mb-16 text-center">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.12 }}
              variants={fadeInUp}
            >
              <h2 className="type-headline text-text-dark text-balance">
                Soluções que movem você.
              </h2>
            </motion.div>
          </div>

          {/* Cards de Serviços em Carousel */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.12 }}
            variants={fadeInUp}
            className="w-full relative"
          >
            <div className="w-full max-w-5xl mx-auto relative px-10 sm:px-16">
              <Swiper
                modules={[Navigation, Pagination, EffectFade]}
                effect={'fade'}
                fadeEffect={{ crossFade: true }}
                grabCursor={true}
                navigation
                pagination={{ clickable: true }}
                className="w-full services-swiper !pb-16"
              >
              {servicos.map((servico, i) => (
                <SwiperSlide key={i}>
                  <div className="bg-white rounded-2xl p-6 sm:p-10 shadow-card flex flex-col md:flex-row gap-8 items-center">
                    {/* Imagem */}
                    <div className="w-full md:w-1/2 relative overflow-hidden rounded-2xl group">
                      <img
                        src={servico.imagem}
                        alt={servico.titulo}
                        className="relative w-full rounded-2xl group-hover:scale-105 transition-transform duration-700 object-cover aspect-[4/3]"
                      />
                    </div>

                    {/* Texto */}
                    <div className="w-full md:w-1/2 space-y-5 flex flex-col text-left">
                      <h3 className="type-title text-text-dark text-balance">
                        {servico.titulo}
                      </h3>
                      <p className="type-meta text-text-muted !mt-2">{servico.subtitulo}</p>
                      <p className="type-body text-text-muted sm:text-lg max-w-[60ch]">
                        {servico.descricao}
                      </p>
                      <div className="pt-4">
                        {servico.interno ? (
                          <Link to={servico.link}>
                            <motion.button
                              whileHover={{ scale: 1.03 }}
                              whileTap={{ scale: 0.97 }}
                              className="bg-brand-accent hover:bg-brand-glow text-white font-bold px-8 py-3.5 rounded-xl transition-colors duration-300 cursor-pointer"
                            >
                              {servico.cta}
                            </motion.button>
                          </Link>
                        ) : (
                          <a href={servico.link} target="_blank" rel="noopener noreferrer">
                            <motion.button
                              whileHover={{ scale: 1.03 }}
                              whileTap={{ scale: 0.97 }}
                              className="bg-brand-accent hover:bg-brand-glow text-white font-bold px-8 py-3.5 rounded-xl transition-colors duration-300 cursor-pointer"
                            >
                              {servico.cta}
                            </motion.button>
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                </SwiperSlide>
              ))}
              </Swiper>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ===== SEÇÃO POR QUE ESCOLHER ===== */}
      <section className="on-light py-16 sm:py-24 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Texto com itens numerados */}
            <div>
              <motion.div
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.12 }}
                variants={fadeInUp}
              >
                <h2 className="type-headline text-text-dark mb-10 text-balance">
                  Por que mais de 5.000 clientes escolhem a Locafacil?
                </h2>
              </motion.div>

              <motion.div
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.12 }}
                variants={staggerContainer}
                className="space-y-6"
              >
                {diferenciais.map((item, i) => (
                  <motion.div
                    key={i}
                    variants={fadeInUp}
                    className="flex gap-5 group"
                  >
                    <div className="flex-shrink-0 w-12 h-12 bg-brand-accent/10 text-brand-accent rounded-xl flex items-center justify-center type-numeric font-bold text-lg group-hover:bg-brand-accent group-hover:text-white transition-all duration-300">
                      {item.numero}
                    </div>
                    <div>
                      <h4 className="type-subtitle text-text-dark mb-1">{item.titulo}</h4>
                      <p className="text-text-muted leading-relaxed">{item.descricao}</p>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            </div>

            {/* Imagem */}
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.12 }}
              variants={fadeInUp}
            >
              <img
                src={Image4}
                alt="Equipe Locafacil pronta para atender com excelência"
                className="w-full rounded-2xl shadow-card"
              />
            </motion.div>
          </div>
        </div>
      </section>

      {/* ===== CTA FINAL - URGÊNCIA + CONVERSÃO ===== */}
      <section className="relative py-20 sm:py-28 overflow-hidden">
        {/* Background gradient premium */}
        <div className="absolute inset-0 bg-hero-gradient" />
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-brand-accent/15 rounded-full blur-[120px]" />
          <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-brand-glow/10 rounded-full blur-[100px]" />
        </div>

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.12 }}
            variants={staggerContainer}
            className="max-w-3xl mx-auto text-center"
          >
            <motion.h2
              variants={fadeInUp}
              className="type-headline text-text-primary mb-6 text-balance"
            >
              Não deixe outro motorista<br />pegar o seu carro.
            </motion.h2>

            <motion.p
              variants={fadeInUp}
              className="type-body text-text-secondary text-lg mb-10 max-w-[60ch] mx-auto text-balance"
            >
              As unidades são limitadas e a procura é alta. Garanta agora a liberdade de dirigir sem complicação e com o melhor custo-benefício do Rio de Janeiro.
            </motion.p>

            <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row justify-center gap-4">
              <a href="https://api.whatsapp.com/send?phone=5521968540185&text=Ol%C3%A1,%20Locafacil!%20Quero%20garantir%20meu%20ve%C3%ADculo%20agora!" target="_blank" rel="noopener noreferrer">
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  className="w-full sm:w-auto bg-brand-accent hover:bg-brand-glow text-white font-semibold text-lg px-10 py-4 rounded-xl transition-colors duration-300 cursor-pointer"
                >
                  Garantir Meu Carro Agora
                </motion.button>
              </a>
              <a href="tel:5521968540185">
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  className="w-full sm:w-auto bg-white/5 border border-white/15 text-white font-medium text-lg px-10 py-4 rounded-xl hover:bg-white/10 transition-colors duration-300 cursor-pointer"
                >
                  Ligar Agora: (21) 96854-0185
                </motion.button>
              </a>
            </motion.div>

            {/* Confiança final — o visto é desenhado, não é um caractere */}
            <motion.ul
              variants={fadeInUp}
              className="type-meta text-text-secondary/60 mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2"
            >
              {['Sem caução', 'Todos os seguros inclusos', 'Cancele quando quiser'].map((item) => (
                <li key={item} className="flex items-center gap-2">
                  <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  {item}
                </li>
              ))}
            </motion.ul>
          </motion.div>
        </div>
      </section>

    </main>
  )
}