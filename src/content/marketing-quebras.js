/* Quebras de linha dos textos do site, para o time de design marcar em
 * /doc/marketing ("Textos: quebras de linha e leitura").
 *
 * Um bloco por parte visível do site, com os textos onde a quebra pesa:
 * títulos, subtítulos, selos e botões. Cada texto tem o seletor CSS do
 * elemento na página. É por ele que `node scripts/capturar-textos.mjs`:
 *
 *   - lê o texto como está no ar (a copy atual, não a do inventário);
 *   - mede em quantas linhas ele quebra hoje, e com quantos caracteres cada
 *     linha, em 1440 e em 390;
 *   - contorna o texto no recorte (`public/doc/marketing/textos/`).
 *
 * O resultado vai para `marketing-quebras-medidas.json`. Este arquivo é JS
 * puro, sem imagem importada, para o script em Node ler o mesmo que a página.
 *
 * O `id` do bloco e do texto entra no retorno salvo (`quebras` do público
 * `marketing`): mudar um id desliga a resposta que alguém já deu. Só
 * acrescente.
 */

const HERO = '#hero .max-w-xl'
const SOLUCOES = 'main > section:nth-of-type(3)'
const POR_QUE = 'main > section:nth-of-type(4)'
const FINAL = 'main > section:nth-of-type(5)'
const PRE_RESERVA = 'section[aria-labelledby="aviso-pre-reserva"]'
const APLICATIVOS = 'section[aria-labelledby="aviso-aplicativos"]'

export const BLOCOS_TEXTO = [
  {
    id: 'home-topo',
    pagina: 'Home',
    parte: 'Topo da página',
    rota: '/',
    textos: [
      { id: 'titulo', tipo: 'Título', seletor: `${HERO} h1` },
      { id: 'apoio', tipo: 'Texto de apoio', seletor: `${HERO} h1 + p` },
      { id: 'botao-1', tipo: 'Botão', seletor: `${HERO} a[href^="https://api.whatsapp"]` },
      { id: 'botao-2', tipo: 'Botão', seletor: `${HERO} a[href="#beneficios"]` },
      { id: 'selo-1', tipo: 'Selo', seletor: `${HERO} ul > li:nth-child(1)` },
      { id: 'selo-2', tipo: 'Selo', seletor: `${HERO} ul > li:nth-child(2)` },
      { id: 'selo-3', tipo: 'Selo', seletor: `${HERO} ul > li:nth-child(3)` },
    ],
  },
  {
    id: 'home-beneficios',
    pagina: 'Home',
    parte: 'Benefícios',
    rota: '/',
    textos: [
      { id: 'titulo', tipo: 'Título', seletor: '#beneficios h2' },
      { id: 'apoio', tipo: 'Texto de apoio', seletor: '#beneficios h2 + p' },
      { id: 'card-1', tipo: 'Título do cartão', seletor: '#beneficios ul > li:nth-child(1) h3' },
      { id: 'card-2', tipo: 'Título do cartão', seletor: '#beneficios ul > li:nth-child(2) h3' },
      { id: 'card-3', tipo: 'Título do cartão', seletor: '#beneficios ul > li:nth-child(3) h3' },
      { id: 'card-4', tipo: 'Título do cartão', seletor: '#beneficios ul > li:nth-child(4) h3' },
    ],
  },
  {
    id: 'home-solucoes',
    pagina: 'Home',
    parte: 'Soluções que movem você',
    rota: '/',
    textos: [
      { id: 'titulo', tipo: 'Título', seletor: `${SOLUCOES} h2` },
      { id: 'assinatura-titulo', tipo: 'Título do bloco', seletor: `${SOLUCOES} article:nth-of-type(1) h3` },
      { id: 'assinatura-apoio', tipo: 'Linha de apoio', seletor: `${SOLUCOES} article:nth-of-type(1) h3 + p` },
      { id: 'assinatura-botao', tipo: 'Botão', seletor: `${SOLUCOES} article:nth-of-type(1) a` },
      { id: 'empresas-titulo', tipo: 'Título do bloco', seletor: `${SOLUCOES} article:nth-of-type(2) h3` },
      { id: 'empresas-apoio', tipo: 'Linha de apoio', seletor: `${SOLUCOES} article:nth-of-type(2) h3 + p` },
      { id: 'empresas-botao', tipo: 'Botão', seletor: `${SOLUCOES} article:nth-of-type(2) a` },
    ],
  },
  {
    id: 'home-por-que',
    pagina: 'Home',
    parte: 'Por que alugar com a Locafacil?',
    rota: '/',
    textos: [
      { id: 'titulo', tipo: 'Título', seletor: `${POR_QUE} h2` },
      { id: 'motivo-1', tipo: 'Motivo', seletor: `${POR_QUE} ul > li:nth-child(1) h3` },
      { id: 'motivo-2', tipo: 'Motivo', seletor: `${POR_QUE} ul > li:nth-child(2) h3` },
      { id: 'motivo-3', tipo: 'Motivo', seletor: `${POR_QUE} ul > li:nth-child(3) h3` },
      { id: 'motivo-4', tipo: 'Motivo', seletor: `${POR_QUE} ul > li:nth-child(4) h3` },
    ],
  },
  {
    id: 'home-chamada-final',
    pagina: 'Home',
    parte: 'Chamada final',
    rota: '/',
    textos: [
      { id: 'titulo', tipo: 'Título', seletor: `${FINAL} h2` },
      { id: 'apoio', tipo: 'Texto de apoio', seletor: `${FINAL} h2 + p` },
      { id: 'botao-1', tipo: 'Botão', seletor: `${FINAL} a[href^="https://api.whatsapp"]` },
      { id: 'botao-2', tipo: 'Botão', seletor: `${FINAL} a[href^="tel:"]` },
      { id: 'selo-1', tipo: 'Selo', seletor: `${FINAL} ul > li:nth-child(1)` },
      { id: 'selo-2', tipo: 'Selo', seletor: `${FINAL} ul > li:nth-child(2)` },
      { id: 'selo-3', tipo: 'Selo', seletor: `${FINAL} ul > li:nth-child(3)` },
    ],
  },
  {
    id: 'empresas-topo',
    pagina: 'Para Empresas',
    parte: 'Topo da página',
    rota: '/para-empresas',
    textos: [
      { id: 'titulo', tipo: 'Título', seletor: 'header + div h1' },
      { id: 'apoio', tipo: 'Texto de apoio', seletor: 'header + div h1 + p' },
      { id: 'botao', tipo: 'Botão', seletor: 'header + div button' },
    ],
  },
  {
    id: 'empresas-crescer',
    pagina: 'Para Empresas',
    parte: 'Crescer dói, mas não precisa ser assim',
    rota: '/para-empresas',
    textos: [
      { id: 'titulo', tipo: 'Título', seletor: 'main > section:nth-of-type(1) h2' },
      { id: 'botao', tipo: 'Botão', seletor: 'main > section:nth-of-type(1) a[href="#cotacao"]' },
    ],
  },
  {
    id: 'empresas-motivos',
    pagina: 'Para Empresas',
    parte: '4 motivos para contratar hoje',
    rota: '/para-empresas',
    textos: [
      { id: 'titulo', tipo: 'Título', seletor: 'main > section:nth-of-type(2) h2' },
      { id: 'motivo-1', tipo: 'Motivo', seletor: 'main > section:nth-of-type(2) ul > li:nth-child(1) h3' },
      { id: 'motivo-2', tipo: 'Motivo', seletor: 'main > section:nth-of-type(2) ul > li:nth-child(2) h3' },
      { id: 'motivo-3', tipo: 'Motivo', seletor: 'main > section:nth-of-type(2) ul > li:nth-child(3) h3' },
      { id: 'motivo-4', tipo: 'Motivo', seletor: 'main > section:nth-of-type(2) ul > li:nth-child(4) h3' },
    ],
  },
  {
    id: 'contato-topo',
    pagina: 'Contato',
    parte: 'Topo da página',
    rota: '/contato',
    textos: [
      { id: 'titulo', tipo: 'Título', seletor: 'header + div h1' },
      { id: 'apoio', tipo: 'Texto de apoio', seletor: 'header + div h1 + p' },
    ],
  },
  {
    id: 'contato-equipe',
    pagina: 'Contato',
    parte: 'Pessoas que fazem acontecer (equipe)',
    rota: '/contato',
    textos: [
      { id: 'titulo', tipo: 'Título', seletor: 'main > div > div:nth-of-type(1) h2' },
      { id: 'apoio', tipo: 'Texto de apoio', seletor: 'main > div > div:nth-of-type(1) h2 + p' },
      { id: 'subtitulo', tipo: 'Título do bloco', seletor: 'main > div > div:nth-of-type(1) h3' },
    ],
  },
  {
    id: 'reserva-revisao',
    pagina: 'Pré-reserva',
    parte: 'Revisão: aviso de pré-reserva e aviso Uber/99',
    rota: '/reservar/revisao',
    checkout: 'revisao',
    textos: [
      { id: 'pre-reserva-titulo', tipo: 'Título do aviso', seletor: `${PRE_RESERVA} h2` },
      { id: 'pre-reserva-passo-1', tipo: 'Passo', seletor: `${PRE_RESERVA} li:nth-child(1) p` },
      { id: 'pre-reserva-passo-2', tipo: 'Passo', seletor: `${PRE_RESERVA} li:nth-child(2) p` },
      { id: 'aplicativos-titulo', tipo: 'Título do aviso', seletor: `${APLICATIVOS} h2` },
      { id: 'aplicativos-texto', tipo: 'Aviso', seletor: `${APLICATIVOS} h2 + p` },
      { id: 'aplicativos-ciente', tipo: 'Caixa de marcar', seletor: `${APLICATIVOS} label span` },
      { id: 'botao', tipo: 'Botão', seletor: 'main button.flex-1' },
    ],
  },
  {
    id: 'reserva-confirmacao',
    pagina: 'Pré-reserva',
    parte: 'Pré-reserva enviada (confirmação)',
    rota: '/reservar/confirmacao',
    checkout: 'confirmacao',
    textos: [
      { id: 'titulo', tipo: 'Título', seletor: 'main .glass h1' },
      { id: 'apoio', tipo: 'Texto de apoio', seletor: 'main .glass h1 + p' },
      { id: 'proximos', tipo: 'Título da lista', seletor: 'main .glass h2' },
      { id: 'passo-1', tipo: 'Passo', seletor: 'main .glass ol > li:nth-child(1) p' },
      { id: 'passo-2', tipo: 'Passo', seletor: 'main .glass ol > li:nth-child(2) p' },
      { id: 'passo-3', tipo: 'Passo', seletor: 'main .glass ol > li:nth-child(3) p' },
      { id: 'botao-suporte', tipo: 'Botão', seletor: 'main .glass a.block span' },
      { id: 'botao-calendario', tipo: 'Botão', seletor: 'main .glass a[download]' },
      { id: 'link-alterar', tipo: 'Link', seletor: 'main .glass p > a' },
    ],
  },
]

export const BLOCO_TEXTO_POR_ID = new Map(BLOCOS_TEXTO.map((bloco) => [bloco.id, bloco]))

/* Destino do anexo de um bloco no envio de arquivos do design
   (`marketing-arquivos/<pessoa>/quebras-<bloco>/`). */
export const destinoDoBloco = (idBloco) => `quebras-${idBloco}`

/* Limites da resposta, os mesmos que `api/retornos.js` confere. */
export const LIMITES_QUEBRA = {
  texto: 600,
  nota: 2000,
}
