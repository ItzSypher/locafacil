/* Imagem anexada na revisão de copy, preparada no navegador antes de subir.
 *
 * Um print de celular sai com 3 a 6 MB, e quem anexa costuma estar no próprio
 * celular, às vezes no 4G. Reduzir aqui faz o envio levar um segundo em vez de
 * vinte, e mantém cada arquivo abaixo do limite de `/api/retornos` sem pedir
 * para a pessoa editar a imagem antes.
 */

export const LIMITE_ANEXO = 1.5 * 1024 * 1024
const LADO_MAIOR = 1600
const LADO_MINIATURA = 320
const TIPOS = new Set(['image/jpeg', 'image/jpg', 'image/png', 'image/webp'])

/** Erro que pode ser mostrado como veio: já está escrito para quem anexou. */
export class ErroImagem extends Error {}

/* `createImageBitmap` já aplica a rotação gravada pela câmera; o `<img>` é o
   caminho de quem não tem ele (Safari antigo). */
async function abrir(arquivo) {
  if (typeof createImageBitmap === 'function') {
    try {
      return await createImageBitmap(arquivo)
    } catch {
      // Cai no <img> abaixo.
    }
  }
  return new Promise((resolve, reject) => {
    const endereco = URL.createObjectURL(arquivo)
    const imagem = new Image()
    imagem.onload = () => {
      URL.revokeObjectURL(endereco)
      resolve(imagem)
    }
    imagem.onerror = () => {
      URL.revokeObjectURL(endereco)
      reject(new ErroImagem('Não consegui abrir essa imagem. Tente outra.'))
    }
    imagem.src = endereco
  })
}

function desenhar(fonte, ladoMaior) {
  const largura = fonte.naturalWidth || fonte.width
  const altura = fonte.naturalHeight || fonte.height
  const escala = Math.min(1, ladoMaior / Math.max(largura, altura))
  const tela = document.createElement('canvas')
  tela.width = Math.max(1, Math.round(largura * escala))
  tela.height = Math.max(1, Math.round(altura * escala))
  const contexto = tela.getContext('2d')
  // JPEG não tem transparência: sem um fundo, o PNG recortado vira preto.
  contexto.fillStyle = 'white'
  contexto.fillRect(0, 0, tela.width, tela.height)
  contexto.drawImage(fonte, 0, 0, tela.width, tela.height)
  return tela
}

const emJpeg = (tela, qualidade) =>
  new Promise((resolve) => tela.toBlob(resolve, 'image/jpeg', qualidade))

const emDataUrl = (blob) =>
  new Promise((resolve, reject) => {
    const leitor = new FileReader()
    leitor.onload = () => resolve(leitor.result)
    leitor.onerror = () => reject(new ErroImagem('Não consegui ler essa imagem. Tente outra.'))
    leitor.readAsDataURL(blob)
  })

/**
 * Reduz a imagem para JPEG com lado maior de até 1600px.
 *
 * Devolve `{ dataUrl, miniatura }`: o primeiro sobe para o servidor, a segunda
 * (320px) fica no navegador para a pessoa ver o que anexou quando voltar —
 * o anexo guardado no servidor só se lê com a senha da equipe.
 */
export async function prepararAnexo(arquivo) {
  if (!arquivo || !TIPOS.has(arquivo.type)) {
    throw new ErroImagem('Use uma imagem JPG, PNG ou WEBP.')
  }

  const fonte = await abrir(arquivo)
  try {
    const tela = desenhar(fonte, LADO_MAIOR)

    // Qualidade 0,8 resolve quase tudo. Print cheio de detalhe miúdo ainda
    // passa do limite; aí desce a qualidade antes de desistir.
    let reduzida = null
    for (const qualidade of [0.8, 0.65, 0.5]) {
      reduzida = await emJpeg(tela, qualidade)
      if (reduzida && reduzida.size <= LIMITE_ANEXO) break
    }
    if (!reduzida) throw new ErroImagem('Não consegui preparar essa imagem. Tente outra.')
    if (reduzida.size > LIMITE_ANEXO) {
      throw new ErroImagem('Essa imagem continua grande demais mesmo reduzida. Tente um recorte menor.')
    }

    const miniatura = await emJpeg(desenhar(fonte, LADO_MINIATURA), 0.7)
    return {
      dataUrl: await emDataUrl(reduzida),
      miniatura: miniatura ? await emDataUrl(miniatura) : null,
    }
  } finally {
    fonte.close?.()
  }
}
