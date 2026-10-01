/* ZIP mínimo, sem compressão, para "baixar todas" nas páginas internas.
 *
 * Baixar quatro arquivos com quatro cliques, ou deixar o navegador perguntar
 * "permitir vários downloads?", é pior do que um .zip. As imagens já vêm
 * comprimidas (WEBP, JPG), então guardar sem compressão quase não muda o
 * tamanho — e dispensa uma biblioteca de 30 kB para um botão.
 *
 * Formato: cabeçalho local + bytes de cada arquivo, diretório central e o
 * registro de fim (PKWARE APPNOTE, método 0 = "stored").
 */

const TABELA_CRC = (() => {
  const tabela = new Uint32Array(256)
  for (let n = 0; n < 256; n += 1) {
    let c = n
    for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    tabela[n] = c >>> 0
  }
  return tabela
})()

function crc32(bytes) {
  let c = 0xffffffff
  for (let i = 0; i < bytes.length; i += 1) c = TABELA_CRC[(c ^ bytes[i]) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}

/* Data e hora no formato do MS-DOS, que é o que o ZIP guarda. */
function dataDos(data) {
  const hora = (data.getHours() << 11) | (data.getMinutes() << 5) | Math.floor(data.getSeconds() / 2)
  const dia = ((data.getFullYear() - 1980) << 9) | ((data.getMonth() + 1) << 5) | data.getDate()
  return { hora, dia }
}

/** `arquivos`: `[{ nome, bytes: Uint8Array }]`. Devolve um `Blob` .zip. */
export function montarZip(arquivos) {
  const codificador = new TextEncoder()
  const { hora, dia } = dataDos(new Date())
  const partes = []
  const central = []
  let deslocamento = 0

  for (const { nome, bytes } of arquivos) {
    const nomeBytes = codificador.encode(nome)
    const crc = crc32(bytes)

    const local = new DataView(new ArrayBuffer(30))
    local.setUint32(0, 0x04034b50, true)
    local.setUint16(4, 20, true)
    local.setUint16(6, 0x0800, true) // nome em UTF-8
    local.setUint16(8, 0, true)
    local.setUint16(10, hora, true)
    local.setUint16(12, dia, true)
    local.setUint32(14, crc, true)
    local.setUint32(18, bytes.length, true)
    local.setUint32(22, bytes.length, true)
    local.setUint16(26, nomeBytes.length, true)
    local.setUint16(28, 0, true)
    partes.push(local.buffer, nomeBytes, bytes)

    const registro = new DataView(new ArrayBuffer(46))
    registro.setUint32(0, 0x02014b50, true)
    registro.setUint16(4, 20, true)
    registro.setUint16(6, 20, true)
    registro.setUint16(8, 0x0800, true)
    registro.setUint16(10, 0, true)
    registro.setUint16(12, hora, true)
    registro.setUint16(14, dia, true)
    registro.setUint32(16, crc, true)
    registro.setUint32(20, bytes.length, true)
    registro.setUint32(24, bytes.length, true)
    registro.setUint16(28, nomeBytes.length, true)
    registro.setUint32(42, deslocamento, true)
    central.push(registro.buffer, nomeBytes)

    deslocamento += 30 + nomeBytes.length + bytes.length
  }

  const tamanhoCentral = central.reduce((soma, parte) => soma + parte.byteLength, 0)
  const fim = new DataView(new ArrayBuffer(22))
  fim.setUint32(0, 0x06054b50, true)
  fim.setUint16(8, arquivos.length, true)
  fim.setUint16(10, arquivos.length, true)
  fim.setUint32(12, tamanhoCentral, true)
  fim.setUint32(16, deslocamento, true)

  return new Blob([...partes, ...central, fim.buffer], { type: 'application/zip' })
}

/** Baixa cada endereço (mesma origem) e devolve o .zip com os nomes dados. */
export async function zipDeEnderecos(itens) {
  const arquivos = await Promise.all(
    itens.map(async ({ nome, endereco }) => {
      const resposta = await fetch(endereco)
      if (!resposta.ok) throw new Error(`Não consegui baixar ${nome}.`)
      return { nome, bytes: new Uint8Array(await resposta.arrayBuffer()) }
    }),
  )
  return montarZip(arquivos)
}
