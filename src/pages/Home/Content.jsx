import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'

import ReasonList from '../../components/Global/ReasonList'

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

/* ===== DADOS DOS BENEFÍCIOS =====
   Quatro promessas que a operação cumpre e que o cliente confere no contrato.
   O quinto card era "Nota 4,9 entre os clientes" — número sem origem, e saiu. */
const beneficios = [
  {
    icone: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
      </svg>
    ),
    titulo: '0% de caução',
    descricao: 'Por que prender seu limite de cartão se o carro já está pago? Saia dirigindo sem depositar um centavo de garantia.',
  },
  {
    icone: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
      </svg>
    ),
    titulo: 'Seguro total sem pegadinhas',
    descricao: 'Cobertura completa já inclusa no preço da tela. As letras miúdas nós deixamos para a concorrência.',
  },
  {
    icone: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
      </svg>
    ),
    titulo: 'Dobro de quilometragem',
    descricao: 'Não fique contando quilômetros de olho no painel. Nossos planos entregam o dobro de franquia. Rode livre e sem surpresa na fatura.',
  },
  {
    icone: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    titulo: 'Cancele quando quiser',
    descricao: 'Seu carro não pode ser uma prisão. Planos de assinatura sem período mínimo absurdo. Não quer mais? É só devolver.',
  },
]

/* ===== DADOS DAS MARCAS (Social Proof) ===== */
/* Dimensões reais de cada arquivo: o navegador reserva o espaço antes de
   baixar e a faixa não pula quando as logos chegam. */
const marcas = [
  { src: Nissan, alt: 'Nissan', w: 115, h: 100 },
  { src: Hyundai, alt: 'Hyundai', w: 121, h: 71 },
  { src: Mazda, alt: 'Mazda', w: 166, h: 92 },
  { src: Chevrolet, alt: 'Chevrolet', w: 107, h: 59 },
  { src: Renault, alt: 'Renault', w: 118, h: 98 },
  { src: Ford, alt: 'Ford', w: 167, h: 62 },
  { src: Dodge, alt: 'Dodge', w: 102, h: 106 },
]

/* ===== DADOS DOS SERVIÇOS ===== */
const servicos = [
  {
    imagem: Image1,
    titulo: 'Assinatura Locafacil Express',
    subtitulo: 'Esqueça tudo o que você sabe sobre ter carro.',
    descricao: 'Esqueça oficina, IPVA, seguro caro e depreciação. Você assina um carro zero, pega a chave e o resto do trabalho é nosso. O caminho mais rápido e inteligente para andar de carro novo hoje.',
    cta: 'Quero saber da assinatura',
    link: 'https://api.whatsapp.com/send?phone=5521968540185&text=Ol%C3%A1,%20Locafacil!%20Tenho%20interesse%20na%20Assinatura.',
  },
  {
    imagem: Image3,
    titulo: 'Locafacil Empresas',
    subtitulo: 'Seu negócio não pode parar.',
    descricao: 'Terceirizar a frota da sua empresa é a jogada de mestre para salvar o fluxo de caixa. Modelos ideais para a sua operação girar forte, sem você esquentar a cabeça com burocracia.',
    cta: 'Receber proposta comercial',
    link: '/para-empresas',
    interno: true,
  },
]

/* ===== DADOS "POR QUE ESCOLHER" ===== */
const diferenciais = [
  {
    titulo: 'Aceleração de aprovação',
    descricao: 'Você tem pressa. Então cortamos a burocracia inútil. Do orçamento à chave na mão num piscar de olhos.',
  },
  {
    titulo: 'O que você vê é o que você paga',
    descricao: 'Esqueça as taxas ocultas de "proteção extra" no balcão. O combinado não sai caro, o nosso contrato é reto e direto.',
  },
  {
    titulo: 'Máquinas selecionadas a dedo',
    descricao: 'Só trabalhamos com veículos novos ou recém-revisados das melhores marcas. Sente, ligue e sinta o conforto.',
  },
  {
    titulo: 'Atendimento corpo a corpo',
    descricao: 'Quando ligar, não falará com um robô burro. Falará com alguém da equipe focado em resolver seu problema real.',
  },
]

const WHATSAPP_GARANTIR = 'https://api.whatsapp.com/send?phone=5521968540185&text=Ol%C3%A1,%20Locafacil!%20Quero%20garantir%20meu%20ve%C3%ADculo%20agora!'

/**
 * Conteúdo principal da Home com seções:
 * 1. Benefícios (grade, não carrossel — quatro cards curtos cabem na tela)
 * 2. Montadoras (marquee em CSS)
 * 3. Serviços (dois blocos alternados, não carrossel — são só dois)
 * 4. Por que escolher
 * 5. CTA final
 */
export default function HomeContent() {
  return (
    <main>

      {/* ===== SEÇÃO BENEFÍCIOS =====
          Era um carrossel com autoplay de 3s. Quatro cards curtos cabem na
          tela: o carrossel só escondia conteúdo, cortava o card na borda e
          movia sozinho o que ninguém pediu para mover. */}
      <section id="beneficios" className="on-light pt-32 sm:pt-40 pb-16 sm:pb-24 bg-surface-light">
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
            <p className="type-body text-text-muted text-lg mt-4 max-w-[60ch] mx-auto text-balance">
              Quatro condições que estão no contrato, não só no anúncio.
            </p>
          </motion.div>

          <motion.ul
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.1 }}
            variants={staggerContainer}
            className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 lg:gap-6"
          >
            {beneficios.map((item) => (
              <motion.li
                key={item.titulo}
                variants={fadeInUp}
                className="bg-white rounded-2xl p-6 lg:p-7 shadow-card hover:shadow-card-hover transition-shadow duration-300 group flex flex-col"
              >
                <div className="w-14 h-14 bg-brand-accent/10 text-brand-accent rounded-2xl flex items-center justify-center mb-5 group-hover:bg-brand-accent group-hover:text-white transition-colors duration-300">
                  {item.icone}
                </div>
                <h3 className="type-subtitle text-text-dark mb-2 text-balance">{item.titulo}</h3>
                <p className="type-meta text-text-muted">{item.descricao}</p>
              </motion.li>
            ))}
          </motion.ul>
        </div>
      </section>

      {/* ===== SEÇÃO MONTADORAS =====
          Marquee em CSS (ver global.css). A lista é duplicada de propósito: a
          segunda cópia é o que preenche a tela quando a primeira sai. Ela é
          `aria-hidden` para o leitor de tela não anunciar Nissan duas vezes. */}
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
        </div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.12 }}
          variants={fadeInUp}
          className="marquee"
        >
          <div className="marquee__track">
            {[0, 1].map((copia) => (
              <ul
                key={copia}
                aria-hidden={copia === 1 || undefined}
                className="flex items-center shrink-0"
              >
                {marcas.map((marca) => (
                  <li key={marca.alt} className="px-8 sm:px-12 lg:px-14">
                    <img
                      src={marca.src}
                      alt={copia === 0 ? marca.alt : ''}
                      loading="lazy"
                      decoding="async"
                      width={marca.w}
                      height={marca.h}
                      className="h-10 sm:h-12 lg:h-14 w-auto object-contain grayscale opacity-50 transition duration-500 hover:grayscale-0 hover:opacity-100"
                    />
                  </li>
                ))}
              </ul>
            ))}
          </div>
        </motion.div>
      </section>

      {/* ===== SEÇÃO SERVIÇOS =====
          Eram dois slides num carrossel com transição de fade e setas soltas
          na margem. Dois itens não são um carrossel: viram dois blocos, com a
          imagem trocando de lado para a página não repetir o mesmo desenho. */}
      <section className="on-light py-16 sm:py-24 bg-surface-light">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.12 }}
            variants={fadeInUp}
            className="text-center mb-12 sm:mb-16"
          >
            <h2 className="type-headline text-text-dark text-balance">
              Soluções que movem você.
            </h2>
          </motion.div>

          <div className="space-y-6 lg:space-y-8 max-w-5xl mx-auto">
            {servicos.map((servico, i) => (
              <motion.article
                key={servico.titulo}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.12 }}
                variants={fadeInUp}
                className="bg-white rounded-2xl overflow-hidden shadow-card grid md:grid-cols-2 items-center"
              >
                <img
                  src={servico.imagem}
                  alt=""
                  loading="lazy"
                  decoding="async"
                  width={620}
                  height={465}
                  className={`w-full h-56 md:h-full object-cover ${i % 2 === 1 ? 'md:order-last' : ''}`}
                />

                <div className="p-6 sm:p-10">
                  <h3 className="type-title text-text-dark text-balance">{servico.titulo}</h3>
                  <p className="type-meta text-text-muted mt-2">{servico.subtitulo}</p>
                  <p className="type-body text-text-muted mt-5 max-w-[55ch]">{servico.descricao}</p>

                  <div className="mt-7">
                    {servico.interno ? (
                      <Link
                        to={servico.link}
                        className="inline-flex items-center justify-center bg-brand-accent hover:bg-brand-glow text-white font-semibold px-7 py-3.5 rounded-xl transition-colors duration-300 cursor-pointer"
                      >
                        {servico.cta}
                      </Link>
                    ) : (
                      <a
                        href={servico.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center bg-brand-accent hover:bg-brand-glow text-white font-semibold px-7 py-3.5 rounded-xl transition-colors duration-300 cursor-pointer"
                      >
                        {servico.cta}
                      </a>
                    )}
                  </div>
                </div>
              </motion.article>
            ))}
          </div>
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
                  Por que alugar com a Locafacil?
                </h2>
              </motion.div>

              <ReasonList items={diferenciais} />
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
                loading="lazy"
                decoding="async"
                width={727}
                height={563}
                className="w-full rounded-2xl shadow-card"
              />
            </motion.div>
          </div>
        </div>
      </section>

      {/* ===== CTA FINAL =====
          Os dois botões moravam dentro de um <a> sem largura, então cada um
          media o próprio texto: alturas diferentes e rótulo quebrado em duas
          linhas. Agora o <a> É o botão, com base igual e rótulo que não
          quebra. */}
      <section className="relative py-20 sm:py-28 overflow-hidden">
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
              className="type-body text-text-secondary text-lg mb-10 max-w-[58ch] mx-auto text-balance"
            >
              As unidades são limitadas e a procura é alta. Garanta agora a liberdade de dirigir sem complicação e com o melhor custo-benefício do Rio de Janeiro.
            </motion.p>

            <motion.div
              variants={fadeInUp}
              className="flex flex-col sm:flex-row sm:justify-center gap-3 sm:gap-4"
            >
              <a
                href={WHATSAPP_GARANTIR}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center whitespace-nowrap bg-brand-accent hover:bg-brand-glow text-white font-semibold text-base sm:text-lg px-8 py-4 rounded-xl transition-colors duration-300 cursor-pointer"
              >
                Garantir meu carro agora
              </a>
              <a
                href="tel:+5521968540185"
                className="inline-flex items-center justify-center whitespace-nowrap type-numeric bg-white/5 border border-white/15 text-white font-medium text-base sm:text-lg px-8 py-4 rounded-xl hover:bg-white/10 transition-colors duration-300 cursor-pointer"
              >
                Ligar: (21) 96854-0185
              </a>
            </motion.div>

            {/* Confiança final — o visto é desenhado, não é um caractere */}
            <motion.ul
              variants={fadeInUp}
              className="type-meta text-text-secondary mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2"
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
