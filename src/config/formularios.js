/* Campos dos formulários que terminam no WhatsApp (Empresas e Contato).
 *
 * Provisórios: saíram da reunião de 29/09/2026 ("quantos veículos e tal") e
 * esperam a copy do Marcelo nas lâminas. Mudar um rótulo aqui muda o
 * formulário e a linha correspondente na mensagem que chega à loja.
 */

import { ASSUNTOS, TELEFONE } from './atendimento'

export const FORM_EMPRESAS = {
  // Desde 01/10/2026 a cotação cai no mesmo WhatsApp do atendimento; o
  // número comercial (99329-7697) saiu do site a pedido do Marcelo.
  telefone: TELEFONE,
  abertura: 'Olá! Vim pelo site e quero uma proposta de frota para a minha empresa.',
  rotuloBotao: 'Enviar pedido de cotação',
  nota: 'As respostas abrem prontas no seu WhatsApp. É só apertar enviar.',
  campos: [
    { nome: 'nome', rotulo: 'Nome', tipo: 'texto', obrigatorio: true, autoComplete: 'name' },
    { nome: 'empresa', rotulo: 'Empresa', tipo: 'texto', obrigatorio: true, autoComplete: 'organization' },
    { nome: 'telefone', rotulo: 'Telefone', tipo: 'tel', obrigatorio: true, autoComplete: 'tel', placeholder: '(21) 99999-9999' },
    { nome: 'cnpj', rotulo: 'CNPJ', tipo: 'texto' },
    {
      nome: 'quantidade',
      rotulo: 'Quantos veículos',
      tipo: 'selecao',
      obrigatorio: true,
      opcoes: ['1 a 5', '6 a 10', '11 a 30', 'Mais de 30'],
    },
    {
      nome: 'prazo',
      rotulo: 'Por quanto tempo',
      tipo: 'selecao',
      opcoes: ['Até 3 meses', 'De 3 a 12 meses', 'Mais de 12 meses', 'Ainda não sei'],
    },
    { nome: 'mensagem', rotulo: 'Conte mais sobre a operação', tipo: 'area', placeholder: 'Tipo de veículo, cidade, quando precisa começar…' },
  ],
}

export const FORM_CONTATO = {
  telefone: TELEFONE,
  abertura: 'Olá! Vim pelo site da Locafacil.',
  rotuloBotao: 'Enviar pelo WhatsApp',
  nota: 'As respostas abrem prontas no seu WhatsApp. É só apertar enviar.',
  campos: [
    { nome: 'nome', rotulo: 'Nome', tipo: 'texto', obrigatorio: true, autoComplete: 'name', largo: true },
    { nome: 'assunto', rotulo: 'Assunto', tipo: 'selecao', obrigatorio: true, opcoes: ASSUNTOS.map((a) => a.rotulo), largo: true },
    { nome: 'mensagem', rotulo: 'Mensagem', tipo: 'area', obrigatorio: true },
  ],
}
