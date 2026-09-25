import DocShell from './DocShell'
import { Secao, Aviso, BotaoCopiar } from './Pecas'
import Checklist from './Checklist'
import Galeria from './Galeria'
import Pendencias from './Pendencias'
import TextosProntos from './TextosProntos'
import { ASSUNTOS, linkWhatsApp } from '../../config/atendimento'
import { SITE, CORES } from '../../content/documentacao'

const SECOES = [
  { id: 'acesso', rotulo: 'Acesso' },
  { id: 'telas', rotulo: 'Telas' },
  { id: 'marca', rotulo: 'Marca' },
  { id: 'frases', rotulo: 'Atendimento' },
  { id: 'precisamos', rotulo: 'O que precisamos' },
  { id: 'textos', rotulo: 'Textos prontos' },
  { id: 'roteiro', rotulo: 'Homologação' },
]

const ARQUIVOS_MARCA = [
  { arquivo: '/doc/marca/logo-lockup-color.svg', nome: 'Logotipo colorido', uso: 'Fundo claro' },
  { arquivo: '/doc/marca/logo-lockup-white.svg', nome: 'Logotipo branco', uso: 'Fundo escuro ou foto' },
  { arquivo: '/doc/marca/logo-lockup-black.svg', nome: 'Logotipo preto', uso: 'Impressão em uma cor' },
  { arquivo: '/doc/marca/symbol-color.svg', nome: 'Símbolo colorido', uso: 'Avatar, selo, favicon' },
  { arquivo: '/doc/marca/symbol-white.svg', nome: 'Símbolo branco', uso: 'Sobre a cor da marca' },
]

export default function DocMarketing() {
  return (
    <DocShell
      publico="marketing"
      titulo="Material para o marketing"
      resumo="Do novo site da Locafácil: as telas em alta, as cores da marca, as frases que o cliente manda, e os textos prontos para disparar."
      secoes={SECOES}
      pdf={SITE.pdfMarketing}
    >
      {/* ---------------------------------------------------------- acesso -- */}
      <Secao id="acesso" numero={1} titulo="O site está no ar">
        <a
          href={SITE.url}
          target="_blank"
          rel="noopener noreferrer"
          className="type-title text-brand-accent hover:text-brand-glow transition-colors break-all inline-block min-h-11"
        >
          {SITE.rotulo}
        </a>

        <p className="type-body text-text-dark mt-4 max-w-2xl">
          Endereço de teste, sem senha, aberto a qualquer navegador. Pode
          percorrer inteiro: nada ali vira reserva de verdade, porque o site
          ainda não está ligado ao sistema da loja. Os carros e os preços que
          aparecem são de exemplo.
        </p>

        <Aviso titulo="O que ainda não dá para usar em campanha">
          <p>
            O endereço é temporário e vai mudar quando o domínio da Locafácil for
            apontado. E o link ainda não tem imagem de compartilhamento — quando
            alguém manda no WhatsApp, aparece sem miniatura. As duas coisas estão
            na lista de <a className="text-brand-accent hover:text-brand-glow transition-colors" href="#precisamos">o que precisamos</a>.
          </p>
        </Aviso>
      </Secao>

      {/* ----------------------------------------------------------- telas -- */}
      <Secao
        id="telas"
        numero={2}
        titulo="As telas"
        resumo={`Capturas do site no ar, em ${SITE.atualizado}. Clique para ampliar e salvar.`}
      >
        <Galeria />

        <Aviso titulo="Precisa de resolução maior?">
          <p>
            Existem dezesseis capturas em resolução dobrada, própria para retina:
            cada tela em duas versões — só a primeira dobra e a página inteira —
            em computador e em celular. Elas são geradas por comando e podem ser
            refeitas sempre que o visual mudar. Peça ao desenvolvimento.
          </p>
        </Aviso>
      </Secao>

      {/* ----------------------------------------------------------- marca -- */}
      <Secao
        id="marca"
        numero={3}
        titulo="Marca"
        resumo="Do Manual de Identidade Visual da Locafácil, de fevereiro de 2025."
      >
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {CORES.map((cor) => (
            <div key={cor.hex} className="flex flex-col">
              <div
                className="h-20 rounded-xl border border-line"
                style={{ background: cor.hex }}
                aria-hidden="true"
              />
              <p className="type-numeric type-label text-text-dark mt-2">{cor.hex}</p>
              <p className="type-meta text-text-dark">{cor.nome}</p>
              <p className="type-meta text-text-muted">{cor.uso}</p>
              {/* O botão desce para o fim do cartão: as descrições têm uma e
                  duas linhas, e alinhados ao texto eles ficariam em degrau. */}
              <BotaoCopiar texto={cor.hex} rotulo="Copiar" className="mt-auto pt-3 self-start" />
            </div>
          ))}
        </div>

        <Aviso titulo="Uma regra que vale para banner também">
          <p>
            <strong>O verde nunca carrega texto.</strong> Escrito sobre branco,
            ele dá contraste de cerca de 1,6 para 1 — abaixo de qualquer mínimo
            legível. Ele funciona como elemento de marca, não como fundo de frase
            nem como cor de letra.
          </p>
          <p>
            <strong>Os dois azuis não se misturam.</strong> O azul do manual
            identifica a marca; o azul de interface sinaliza ação, e é a cor de
            tudo que se clica no site. Em peça de campanha, use o do manual.
          </p>
        </Aviso>

        <h3 className="type-subtitle text-text-dark mt-10 mb-3">Tipografia</h3>
        <p className="type-body text-text-dark max-w-2xl">
          <strong>Archivo</strong>, nos pesos 400 a 800. É uma fonte gratuita do
          Google Fonts, então dá para baixar e usar nas peças sem custo nem
          licença:{' '}
          <a
            href="https://fonts.google.com/specimen/Archivo"
            target="_blank"
            rel="noopener noreferrer"
            className="text-brand-accent hover:text-brand-glow transition-colors"
          >
            fonts.google.com/specimen/Archivo
          </a>
          .
        </p>

        <h3 className="type-subtitle text-text-dark mt-10 mb-3">Arquivos do logotipo</h3>
        <ul className="grid sm:grid-cols-2 gap-3">
          {ARQUIVOS_MARCA.map((item) => (
            <li key={item.arquivo}>
              <a
                href={item.arquivo}
                download
                className="flex items-center justify-between gap-4 rounded-xl border border-line bg-white p-4 min-h-11 hover:border-brand-accent transition-colors cursor-pointer"
              >
                <span>
                  <span className="type-body text-text-dark block">{item.nome}</span>
                  <span className="type-meta text-text-muted block">{item.uso} · SVG</span>
                </span>
                <svg className="w-5 h-5 shrink-0 text-brand-accent" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v11m0 0l-4-4m4 4l4-4M5 19h14" />
                </svg>
              </a>
            </li>
          ))}
        </ul>
      </Secao>

      {/* ---------------------------------------------------------- frases -- */}
      <Secao
        id="frases"
        numero={4}
        titulo="Frases do atendimento"
        resumo="O botão flutuante do site oferece seis assuntos. Quem toca cai no WhatsApp com a frase já escrita na caixa de texto — é literalmente o que o cliente vai mandar. Estas são as que estão no ar agora."
      >
        <div className="space-y-3">
          {ASSUNTOS.map((assunto) => (
            <article key={assunto.rotulo} className="rounded-2xl border border-line bg-white p-5">
              <p className="type-subtitle text-text-dark">{assunto.rotulo}</p>
              <p className="type-meta text-text-muted mt-1">{assunto.detalhe}</p>
              <p className="type-body text-text-dark mt-3 rounded-xl bg-surface-light border border-line p-4">
                {assunto.frase}
              </p>
              <div className="flex flex-wrap gap-3 mt-3">
                <BotaoCopiar texto={assunto.frase} rotulo="Copiar frase" />
                <a
                  href={linkWhatsApp(assunto.frase)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="min-h-11 inline-flex items-center px-4 rounded-xl type-label text-text-muted hover:text-text-dark transition-colors cursor-pointer"
                >
                  Testar no WhatsApp
                </a>
              </div>
            </article>
          ))}
        </div>

        <Aviso titulo="Como sugerir mudança">
          <p>
            Reescreva a frase do jeito que a Locafácil fala e mande de volta — o
            rótulo do botão é curto para caber na tela, a frase é completa para a
            pessoa do outro lado entender de primeira. Assunto novo também cabe.
          </p>
        </Aviso>
      </Secao>

      {/* ------------------------------------------------------ precisamos -- */}
      <Secao
        id="precisamos"
        numero={5}
        titulo="O que precisamos de vocês"
        resumo={`Cada item diz por que importa e o que acontece enquanto ninguém resolve. O retorno é para ${SITE.prazoRotulo}.`}
      >
        <Pendencias publico="marketing" />
      </Secao>

      {/* ---------------------------------------------------------- textos -- */}
      <Secao
        id="textos"
        numero={6}
        titulo="Textos prontos para enviar"
        resumo="E-mails e mensagens de WhatsApp já escritos. Abra, copie e mande."
      >
        <TextosProntos />

        <Aviso titulo="Antes de mandar">
          <p>
            Confira o endereço: se o domínio próprio já estiver apontado, troque{' '}
            {SITE.rotulo} por ele em todos os textos.
          </p>
          <p>
            <strong>Nunca mande credencial por e-mail ou WhatsApp.</strong> Quando
            a JCompany responder com usuário e senha de sistema, peça por um canal
            que permita apagar depois — nada de colar em conversa.
          </p>
        </Aviso>
      </Secao>

      {/* --------------------------------------------------------- roteiro -- */}
      <Secao
        id="roteiro"
        numero={7}
        titulo="Roteiro de homologação"
        resumo="Leva cerca de dez minutos. Faça uma vez no computador e uma vez no celular. Marque o que conferiu e escreva as observações aqui mesmo; no fim, um botão monta o retorno."
      >
        <Checklist publico="marketing" />
      </Secao>
    </DocShell>
  )
}
