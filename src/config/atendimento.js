/* Atendimento por WhatsApp: o número e os assuntos que a loja recebe.
 *
 * Vive fora do componente porque tem dois leitores: o botão flutuante, que
 * abre a conversa, e a página de documentação do marketing, que mostra as
 * frases para revisão. São o texto que o cliente vai mandar — quem cuida da
 * voz da marca precisa ler o que está no ar, não uma cópia que envelhece.
 */

export const TELEFONE = '5521968540185'

/* `frase` é o texto que vai para o WhatsApp; `rotulo` é o que aparece no
   botão. Os dois são diferentes de propósito — o botão é curto para caber na
   tela, a frase é completa para a pessoa do outro lado entender de primeira. */
export const ASSUNTOS = [
  {
    rotulo: 'Quero alugar um carro',
    detalhe: 'Diárias, grupos disponíveis e como retirar',
    frase: 'Olá! Vim pelo site e quero alugar um carro. Pode me passar os valores e a disponibilidade?',
  },
  {
    rotulo: 'Quero assinar um carro por mês',
    detalhe: 'Locafacil Express, sem IPVA nem manutenção',
    frase: 'Olá! Vim pelo site e tenho interesse na assinatura mensal. Como funciona e quais são os planos?',
  },
  {
    rotulo: 'Preciso de carro para minha empresa',
    detalhe: 'Frota, contrato e proposta comercial',
    frase: 'Olá! Vim pelo site e preciso de veículos para a minha empresa. Gostaria de receber uma proposta comercial.',
  },
  {
    rotulo: 'Quais documentos eu preciso levar',
    detalhe: 'Requisitos para retirar o veículo',
    frase: 'Olá! Vim pelo site. Quais documentos e requisitos eu preciso para retirar um veículo?',
  },
  {
    rotulo: 'Tenho dúvida sobre a minha reserva',
    detalhe: 'Alterar, confirmar ou cancelar',
    frase: 'Olá! Vim pelo site e tenho uma dúvida sobre uma reserva que já fiz.',
  },
  {
    rotulo: 'Outro assunto',
    detalhe: 'Fale direto com a equipe',
    frase: 'Olá! Vim pelo site da Locafacil e gostaria de falar com um atendente.',
  },
]

export const linkWhatsApp = (frase) =>
  `https://api.whatsapp.com/send?phone=${TELEFONE}&text=${encodeURIComponent(frase)}`
