export const digits = (value) => String(value ?? '').replace(/\D/g, '')

export function maskCPF(value) {
  const d = digits(value).slice(0, 11)
  if (d.length <= 3) return d
  if (d.length <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`
  if (d.length <= 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`
}

// Celular (9 dígitos) e fixo (8) usam agrupamentos diferentes.
export function maskPhone(value) {
  const d = digits(value).slice(0, 9)
  if (d.length <= 4) return d
  if (d.length <= 8) return `${d.slice(0, 4)}-${d.slice(4)}`
  return `${d.slice(0, 5)}-${d.slice(5)}`
}

export function maskAreaCode(value) {
  return digits(value).slice(0, 2)
}

/* Contar 11 dígitos aceita "111.111.111-11" e qualquer número digitado à toa.
   O dígito verificador é a diferença entre recusar o erro de digitação aqui e
   descobrir na hora de emitir o contrato. */
export function isValidCPF(value) {
  const cpf = digits(value)
  if (cpf.length !== 11) return false
  if (/^(\d)\1{10}$/.test(cpf)) return false

  const checkDigit = (length) => {
    let sum = 0
    for (let i = 0; i < length; i += 1) {
      sum += Number(cpf[i]) * (length + 1 - i)
    }
    const rest = (sum * 10) % 11
    return rest === 10 ? 0 : rest
  }

  return checkDigit(9) === Number(cpf[9]) && checkDigit(10) === Number(cpf[10])
}

export const UFS = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG',
  'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO',
]
