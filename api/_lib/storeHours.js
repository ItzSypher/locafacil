// Horário de funcionamento das lojas.
//
// A API ReservaOTA NÃO expõe isso em nenhum endpoint — o spec inteiro foi
// varrido. A validação existe só no servidor da JCompany, que recusa a busca
// depois do submit com "Data/hora fora do horário de atendimento da loja".
//
// Este arquivo é a fonte única da grade no nosso lado. Serve para bloquear o
// horário inválido ANTES do submit; o erro da API continua tratado como rede
// de segurança, caso a grade aqui fique desatualizada.
//
// Para mudar o horário de uma loja, edite só este objeto.

export const STORE_HOURS = {
  // Grade confirmada contra o SGLOC em 2026-09-23, sondando
  // POST /verificar-disponibilidade em cada dia e hora.
  26015: {
    nome: 'LOCAFACIL NOVA IGUAÇU',
    // 0 = domingo ... 6 = sábado. null = fechado.
    dias: {
      0: null,
      1: { abre: '08:00', fecha: '17:30' },
      2: { abre: '08:00', fecha: '17:30' },
      3: { abre: '08:00', fecha: '17:30' },
      4: { abre: '08:00', fecha: '17:30' },
      5: { abre: '08:00', fecha: '17:30' },
      6: { abre: '08:00', fecha: '12:00' },
    },
    feriados: [], // 'YYYY-MM-DD'
    slotMinutos: 30,
    antecedenciaMinimaHoras: 48,
  },
}

const DIA_NOME = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado']

function toMinutes(hhmm) {
  const [h, m] = String(hhmm).split(':').map(Number)
  return h * 60 + m
}

function toHHMM(minutes) {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

// Gera os horários selecionáveis de um dia. Inclui o horário de fechamento:
// a sondagem mostrou que 17:30 é aceito numa loja que fecha 17:30.
function slotsFor(janela, slotMinutos) {
  if (!janela) return []
  const slots = []
  const fim = toMinutes(janela.fecha)
  for (let m = toMinutes(janela.abre); m <= fim; m += slotMinutos) {
    slots.push(toHHMM(m))
  }
  return slots
}

// Resumo legível, para exibir ao lado do calendário.
function resumo(dias) {
  const linhas = []
  const semana = dias[1]
  const sabado = dias[6]
  const domingo = dias[0]

  if (semana) linhas.push(`Segunda a sexta · ${semana.abre} às ${semana.fecha}`)
  linhas.push(sabado ? `Sábado · ${sabado.abre} às ${sabado.fecha}` : 'Sábado · fechado')
  linhas.push(domingo ? `Domingo · ${domingo.abre} às ${domingo.fecha}` : 'Domingo · fechado')
  return linhas
}

/**
 * Grade de uma loja. Quando o código não está cadastrado aqui, devolve
 * `known: false` — nesse caso o front libera o horário todo e deixa a API
 * validar, para nunca bloquear uma loja nova por desconhecimento nosso.
 */
export function storeHoursFor(locationCode) {
  const store = STORE_HOURS[String(locationCode)]

  if (!store) {
    return {
      known: false,
      locationCode: String(locationCode ?? ''),
      slotMinutos: 30,
      antecedenciaMinimaHoras: null,
      diasFechados: [],
      feriados: [],
      slotsPorDia: {},
      resumo: [],
    }
  }

  const slotsPorDia = {}
  const diasFechados = []
  for (let dia = 0; dia <= 6; dia += 1) {
    const janela = store.dias[dia]
    slotsPorDia[dia] = slotsFor(janela, store.slotMinutos)
    if (!janela) diasFechados.push(dia)
  }

  return {
    known: true,
    locationCode: String(locationCode),
    nome: store.nome,
    slotMinutos: store.slotMinutos,
    antecedenciaMinimaHoras: store.antecedenciaMinimaHoras,
    diasFechados,
    diasFechadosNomes: diasFechados.map((d) => DIA_NOME[d]),
    feriados: store.feriados,
    slotsPorDia,
    resumo: resumo(store.dias),
  }
}
