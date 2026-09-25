/* Conteúdo das páginas internas de documentação (`/doc/cliente` e
 * `/doc/marketing`).
 *
 * Uma fonte só para os dois públicos. O que muda entre eles é o recorte — o
 * cliente quer saber o que falta da operação dele, o marketing quer as telas,
 * a marca e os textos —, não os fatos. Quando um preço ou um prazo mudar,
 * muda aqui e as duas páginas acompanham.
 *
 * Os números e as descrições de grupo vêm de `api/_lib/mockData.js`, que por
 * sua vez espelha a tabela real da loja. Se um divergir do outro, o errado é
 * este arquivo.
 */

export const SITE = {
  url: 'https://locafacil-nine.vercel.app',
  rotulo: 'locafacil-nine.vercel.app',
  atualizado: '25 de setembro de 2026',
  /* Reunião de validação. Data ISO para a conta de dias; o rótulo é escrito à
     mão porque "segunda-feira, 28" lê melhor do que qualquer formatação
     automática no meio de uma frase. */
  reuniao: '2026-09-28',
  reuniaoRotulo: 'segunda-feira, 28 de setembro',
  pdfCliente: '/doc/Locafacil-Apresentacao-Cliente.pdf',
  pdfMarketing: '/doc/Locafacil-Apresentacao-Marketing.pdf',
  repositorio: 'https://github.com/ItzSypher/locafacil',
}

/* ---------------------------------------------------------------- status -- */

export const BLOCOS = [
  { nome: 'Visual e conteúdo', situacao: 'Todas as telas prontas, do celular ao desktop', estado: 'pronto' },
  { nome: 'Fluxo de reserva', situacao: 'Cinco etapas completas, da busca ao localizador', estado: 'pronto' },
  { nome: 'Fotos da frota', situacao: 'Uma foto por grupo, dos modelos que a própria loja cita', estado: 'pronto' },
  { nome: 'Publicação', situacao: 'No ar, e atualiza sozinho a cada ajuste aprovado', estado: 'pronto' },
  { nome: 'Preço e disponibilidade reais', situacao: 'Dependem das credenciais da JCompany', estado: 'travado' },
  { nome: 'Termos e cláusulas', situacao: 'O checkout pede o aceite, mas não há link para os documentos', estado: 'travado' },
  { nome: 'Documentação do projeto', situacao: 'Código, arquitetura, sistema visual e integração, versionados no GitHub', estado: 'pronto' },
  { nome: 'Domínio próprio', situacao: 'Roda em endereço de teste; falta apontar o domínio', estado: 'a-fazer' },
]

export const ESTADOS = {
  pronto: { rotulo: 'Pronto', classe: 'text-brand-success' },
  travado: { rotulo: 'Travado', classe: 'text-state-error' },
  'a-fazer': { rotulo: 'A fazer', classe: 'text-brand-gold' },
}

/* -------------------------------------------------------------- roteiro --- */

/* O `id` entra na chave de armazenamento das anotações: mudar um id apaga a
   nota que alguém escreveu. Só acrescente. */
export const ROTEIRO = [
  {
    id: 'home',
    titulo: 'Abra a home e desça até o fim',
    texto: 'Confira o texto do topo, os blocos de serviço, as marcas da frota e o rodapé. É por aqui que a maior parte das pessoas chega pelo Google.',
  },
  {
    id: 'busca',
    titulo: 'Clique em “Reservar” e faça uma busca',
    texto: 'Use os dados de teste da busca. O site não deixa escolher domingo nem horário fora do expediente — é proposital, é a grade que o sistema da loja aceita.',
  },
  {
    id: 'veiculos',
    titulo: 'Veja a lista de grupos',
    texto: 'Sete grupos, cada um com foto, características e preço do período. Teste os filtros (Automático, Ar-condicionado, 5 lugares) e abra “Ver detalhes e composição do valor” em um deles.',
  },
  {
    id: 'protecao',
    titulo: 'Escolha a proteção — é aqui o upsell',
    texto: 'Comece pela Básico e troque para a Completa: o preço por dia e o total do período mudam na hora, lado a lado. É obrigatório escolher uma para seguir.',
  },
  {
    id: 'dados',
    titulo: 'Preencha os dados do condutor',
    texto: 'Use os dados de teste do condutor. CPF e telefone têm máscara e validação — experimente errar um dígito do CPF. Há também a opção de estrangeiro, que troca o CPF por passaporte.',
  },
  {
    id: 'revisao',
    titulo: 'Revise e confirme',
    texto: 'Tudo outra vez, com o valor aberto em linhas e um atalho para trocar cada bloco. Confira se a proteção escolhida entrou na soma. Só aqui a reserva é criada.',
  },
  {
    id: 'confirmacao',
    titulo: 'Confira a tela final',
    texto: 'Localizador em destaque, resumo, “Adicionar ao calendário” e botão de WhatsApp. Olhe com atenção: é a tela que o cliente vai printar.',
  },
  {
    id: 'celular',
    titulo: 'Repita no celular',
    texto: 'Abra o mesmo endereço no telefone. Teste o menu, o formulário de busca e a escolha de carro. É de onde vem a maioria dos acessos.',
  },
]

export const O_QUE_ANOTAR = [
  'Texto que soa errado, comprido demais, ou que a Locafácil não fala assim.',
  'Qualquer coisa que pareça quebrada, desalinhada ou cortada na tela.',
  'Informação que falta e que o cliente perguntaria: documentos, idade mínima, o que está incluso.',
  'Preço, nome de grupo ou condição que não bata com a operação real.',
]

/* -------------------------------------------------------- dados de teste -- */

/* Dados fictícios para percorrer o fluxo inteiro sem inventar nada na hora.
 *
 * As datas caem numa segunda e numa quarta, dentro do expediente, e valem
 * para qualquer teste feito até sábado, 3 de outubro — depois disso a
 * antecedência de 48 horas passa a recusar a retirada, e é só avançar a
 * semana. Duas diárias exatas, para o total bater com a tabela de grupos.
 *
 * O condutor é o mesmo do andaime de desenvolvimento, com duas trocas: o
 * telefone e o e-mail. O telefone do andaime diferia do WhatsApp real da loja
 * por um dígito, e podia ser de alguém; `example.com` é reservado por norma e
 * nunca entrega nada. O CPF passa no dígito verificador e é um exemplo
 * público, não o documento de uma pessoa. */
export const DADOS_TESTE = [
  {
    tela: 'Busca',
    campos: [
      ['Local de retirada', 'LOCAFACIL NOVA IGUAÇU'],
      ['Local de devolução', 'Mesmo local da retirada'],
      ['Retirada', '05/10/2026', '09:00'],
      ['Devolução', '07/10/2026', '09:00'],
    ],
    dica: 'Qualquer dia de segunda a sábado, a partir de 48 horas depois de hoje, também serve.',
  },
  {
    tela: 'Veículo',
    campos: [['Grupo', 'D — Argo ou similar']],
    dica: 'Qualquer grupo funciona. O D fica no meio da tabela e deixa a diferença da proteção bem visível.',
  },
  {
    tela: 'Proteção',
    // O upsell do fluxo: o cartão ocupa a linha inteira e ganha destaque.
    destaque: true,
    campos: [
      ['Primeiro', 'Básico — R$ 30,00 por dia'],
      ['Depois troque para', 'Completa — R$ 95,00 por dia'],
    ],
    dica: 'É o upsell do fluxo: em duas diárias a proteção sai de R$ 60,00 para R$ 190,00, e a tela mostra o total mudar na hora.',
  },
  {
    tela: 'Dados do condutor',
    campos: [
      ['Nome', 'Joana'],
      ['Sobrenome', 'Ribeiro'],
      ['DDD', '21'],
      ['Telefone', '91234-5678'],
      ['E-mail', 'joana.teste@example.com'],
      ['CPF', '529.982.247-25'],
      ['Endereço', 'Rua das Palmeiras, 240 - Centro'],
      ['Complemento', 'Apto 402'],
      ['Cidade', 'Nova Iguaçu'],
      ['Estado', 'RJ'],
    ],
    dica: 'Para ver a validação trabalhar, troque o último dígito do CPF: o campo acusa na hora.',
  },
  {
    tela: 'Revisão',
    campos: [['Termos', 'Marcar “Li e aceito”'], ['Botão', 'Confirmar reserva']],
    dica: 'Nada vira reserva de verdade: o site ainda não está ligado ao sistema da loja.',
  },
]

/* --------------------------------------------------------------- reunião -- */

export const REUNIAO = {
  horario: 'horário a combinar',
  pauta: [
    {
      titulo: 'Pontos finais de design',
      texto: 'Tipografia, cores, fotos da frota e o tom dos textos. O que ainda incomoda antes de publicar.',
    },
    {
      titulo: 'Responsividade',
      texto: 'O site no celular, no tablet e no computador, lado a lado. Menu, formulário de busca e escolha de carro.',
    },
    {
      titulo: 'O fluxo de agendamento',
      texto: 'A reserva percorrida ao vivo com os dados de teste, da busca ao localizador — para validar se o front-end está de acordo com a operação.',
    },
    {
      titulo: 'API e próximos passos',
      texto: 'O que falta da JCompany para ligar os dados reais, e a ordem do que vem depois.',
    },
  ],
}

/* ----------------------------------------------------------------- telas -- */

export const TELAS = [
  {
    id: 'home',
    titulo: 'Home',
    legenda: 'O que aparece antes de qualquer rolagem: proposta, busca rápida e acesso ao WhatsApp.',
    desktop: '/doc/telas/01-home-desktop.jpg',
    celular: '/doc/telas/01-home-mobile.jpg',
  },
  {
    id: 'reservar',
    titulo: 'Reserva',
    legenda: 'Local, datas e horários. É a porta do fluxo inteiro.',
    desktop: '/doc/telas/02-reservar-busca-desktop.jpg',
    celular: '/doc/telas/02-reservar-busca-mobile.jpg',
  },
  {
    id: 'empresas',
    titulo: 'Para empresas',
    legenda: 'A frente comercial de frota e assinatura mensal.',
    desktop: '/doc/telas/03-para-empresas-desktop.jpg',
    celular: '/doc/telas/03-para-empresas-mobile.jpg',
  },
  {
    id: 'contato',
    titulo: 'Contato',
    legenda: 'Canais, endereço da loja e horário de atendimento.',
    desktop: '/doc/telas/04-contato-desktop.jpg',
    celular: '/doc/telas/04-contato-mobile.jpg',
  },
]

/* ---------------------------------------------------------------- reserva - */

export const ETAPAS = [
  { etapa: 'Busca', oQue: 'Loja, data e hora de retirada e devolução', cria: false },
  { etapa: '1. Veículo', oQue: 'Lista de grupos com foto, preço e filtros', cria: false },
  { etapa: '2. Proteção', oQue: 'Básico, Padrão ou Completa; opcionais, se houver', cria: false },
  { etapa: '3. Dados', oQue: 'Condutor e endereço, com validação campo a campo', cria: false },
  { etapa: '4. Revisão', oQue: 'Resumo, valor aberto, aceite dos termos', cria: true },
  { etapa: 'Confirmação', oQue: 'Localizador, resumo e WhatsApp', cria: null },
]

export const GRUPOS = [
  { codigo: 'B', perfil: 'Econômico 1.0 — Kwid ou similar', cambio: 'Manual', total: 260 },
  { codigo: 'C', perfil: 'Econômico 1.0 — Mobi ou similar', cambio: 'Manual', total: 300 },
  { codigo: 'D', perfil: 'Hatch 1.0 completo — Argo ou similar', cambio: 'Manual', total: 320 },
  { codigo: 'D PLUS', perfil: 'Hatch 1.0 turbo — Pulse ou similar', cambio: 'Automático', total: 340 },
  { codigo: 'E', perfil: 'Sedan 1.3 completo — Cronos ou similar', cambio: 'Manual', total: 380 },
  { codigo: 'G', perfil: 'SUV compacto 1.0 turbo — Pulse ou similar', cambio: 'Automático', total: 380 },
  { codigo: 'G PLUS', perfil: 'SUV 1.0 turbo completo — Fastback ou similar', cambio: 'Automático', total: 440 },
]

export const PROTECOES = [
  { nome: 'Básico', cobre: 'Furto, incêndio e perda total; danos ao veículo locado, com participação do locatário', diaria: 30 },
  { nome: 'Padrão', cobre: 'O anterior, mais danos a terceiros, com participação reduzida', diaria: 60 },
  { nome: 'Completa', cobre: 'Roubo, furto, incêndio, perda total e danos a terceiros, sem participação', diaria: 95 },
]

export const REGRAS = [
  { regra: 'Antecedência mínima de 48 horas', detalhe: 'Não dá para reservar para amanhã.' },
  { regra: 'Segunda a sexta, 08:00 às 17:30. Sábado, 08:00 às 12:00. Domingo fechado', detalhe: 'Vale para a retirada e para a devolução.' },
  { regra: 'O pagamento é no balcão', detalhe: 'O site não cobra nada — a API de reservas não tem pagamento.' },
]

/* ------------------------------------------------------------------- API -- */

export const API_ENTREGA = [
  { item: 'Lista de lojas', nota: 'Nome e código de cada unidade' },
  { item: 'Grupos disponíveis no período', nota: 'Com diária, taxas, coberturas e política de quilometragem' },
  { item: 'Antecedência mínima', nota: '48 horas nesta loja' },
  { item: 'Período mínimo de locação', nota: 'Consultado a cada busca' },
  { item: 'Criação da reserva', nota: 'Devolve o localizador que o cliente leva ao balcão' },
  { item: 'Consulta e cancelamento', nota: 'Existe no contrato; hoje passa pelo atendimento' },
]

export const API_NAO_ENTREGA = [
  {
    id: 'horario',
    titulo: 'Horário de funcionamento',
    responsavel: 'JCompany',
    linhas: [
      ['O que falta', 'Não existe forma de perguntar ao sistema quando a loja abre. A validação só acontece depois que o cliente clica em buscar.'],
      ['Como resolvemos', 'A grade está guardada do nosso lado, levantada testando o sistema deles. O site barra o horário errado antes do clique.'],
      ['O risco', 'No dia em que a loja mudar o expediente, o site continua mostrando o antigo até alguém avisar o desenvolvimento.'],
    ],
  },
  {
    id: 'foto',
    titulo: 'Foto do carro',
    responsavel: 'Resolvido por nós',
    linhas: [
      ['O que falta', 'A reserva é por grupo, não por modelo, e o sistema não devolve imagem nenhuma.'],
      ['Como resolvemos', 'Uma foto por grupo, do modelo que a própria descrição cita, com legenda avisando que é ilustrativa.'],
      ['Observação', 'D PLUS e G usam a mesma foto de propósito: as duas descrições dizem “Pulse ou similar”.'],
    ],
  },
  {
    id: 'pagamento',
    titulo: 'Pagamento online',
    responsavel: 'Decisão comercial',
    linhas: [
      ['O que falta', 'O contrato de reservas da JCompany não tem pagamento. O fluxo termina no localizador e o cliente paga no balcão.'],
      ['Existe caminho?', 'Existe um caminho de boleto fora desse contrato, com conta em PJBANK, ASAAS ou Banco do Brasil. É outra integração, outra autenticação e outro acordo comercial.'],
      ['Decisão', 'Ficou fora desta entrega. Nada foi inventado na tela: o site não promete pagamento que não existe.'],
    ],
  },
  {
    id: 'termos',
    titulo: 'Termos de uso e cláusulas',
    responsavel: 'JCompany / jurídico',
    linhas: [
      ['O que falta', 'O sistema tem os campos para os links dos documentos, mas eles voltam vazios.'],
      ['Hoje', 'O checkout mostra “Li e aceito os termos e as cláusulas contratuais” sem link — melhor um texto sem link do que um link morto.'],
      ['Precisa antes de publicar', 'Sim. Ou a JCompany preenche, ou a Locafácil manda os textos e hospedamos no próprio site.'],
    ],
  },
]

/* --------------------------------------------------- para fechar a API -- */

/* O que falta para o site sair dos dados de exemplo e falar com o sistema da
   loja, na ordem em que as coisas destravam umas às outras. `quem` separa o
   que depende de terceiro do que é nosso — a primeira linha segura todas as
   outras. */
export const API_FALTA = [
  {
    passo: 'Credenciais de acesso da Locafácil',
    quem: 'JCompany',
    texto: 'Usuário e senha de sistema (client_id e client_secret) de produção e, se existir, de homologação. É o único item que segura todos os outros.',
  },
  {
    passo: 'Código da loja e lista de lojas',
    quem: 'JCompany',
    texto: 'Confirmar o código da loja de Nova Iguaçu e que a lista de lojas passa a devolver as da Locafácil — hoje ela responde pela conta de demonstração deles.',
  },
  {
    passo: 'Ligar as credenciais no site',
    quem: 'Desenvolvimento',
    texto: 'Cadastrar os dois valores no painel da hospedagem. Sem mudança de código e sem mudança de tela: o site troca sozinho os dados de exemplo pelos reais.',
  },
  {
    passo: 'Rodada de homologação contra a API real',
    quem: 'Desenvolvimento',
    texto: 'Percorrer busca, disponibilidade e confirmação com dados verdadeiros e conferir a leitura da resposta — acentos, valores e campos que a documentação não mostra. A reserva de teste é cancelada em seguida pela loja.',
  },
  {
    passo: 'Horário de funcionamento',
    quem: 'JCompany e operação',
    texto: 'Expor o horário da loja no sistema ou confirmar a grade que o site usa hoje. Enquanto não houver endpoint, a grade vive do nosso lado.',
  },
  {
    passo: 'Links de termos e cláusulas',
    quem: 'JCompany / jurídico',
    texto: 'Preencher os dois links no cadastro deles, ou mandar os textos para hospedarmos no próprio site.',
  },
  {
    passo: 'Tirar o andaime e publicar',
    quem: 'Desenvolvimento',
    texto: 'Remover o botão de dados falsos de desenvolvimento — ele já não sai no site publicado, mas some do código — e apontar o domínio da Locafácil.',
  },
]

/* O repositório é público; os links vão direto para o arquivo no GitHub. */
export const DOCUMENTACAO = [
  { arquivo: 'README.md', para: 'Visão geral do projeto, como rodar, como publicar' },
  { arquivo: 'CLAUDE.md', para: 'Arquitetura e convenções — para quem for mexer no código' },
  { arquivo: 'DESIGN.md', para: 'Sistema visual: cores, tipografia, regras de interface' },
  { arquivo: 'docs/API-JCOMPANY.md', para: 'O que a API entrega, o que falta e o que pedir ao time deles' },
  { arquivo: 'docs/OPERACAO.md', para: 'Pendências de infraestrutura e de marketing, com responsável' },
  { arquivo: 'SECURITY.md', para: 'Onde ficam as credenciais, assinatura de commit, bloqueio de segredo' },
]

export const PROXIMOS_PASSOS = [
  {
    quando: 'Até segunda',
    titulo: 'Percorrer o roteiro com os dados de teste',
    texto: 'Marcando o que conferiu e escrevendo as observações na própria página. O que não der para escrever, leva para a reunião.',
  },
  {
    quando: 'Segunda, 28 de setembro',
    titulo: 'Reunião de validação',
    texto: 'Design final, responsividade e o fluxo de agendamento percorrido ao vivo.',
  },
  {
    quando: 'Em paralelo',
    titulo: 'Cobrança à JCompany',
    texto: 'Credenciais, código da loja, horário por sistema e links de termos. É a resposta mais demorada, por isso já está sendo cobrada.',
  },
  {
    quando: 'Depois da reunião',
    titulo: 'Ajustes e publicação no domínio',
    texto: 'Os pontos da reunião aplicados, e o site no domínio da Locafácil assim que os termos existirem. Pode ir ao ar mostrando a tabela.',
  },
  {
    quando: 'Quando as credenciais chegarem',
    titulo: 'Dados reais',
    texto: 'Virada de configuração e rodada de homologação contra a API da JCompany. A partir daí, preço e disponibilidade são os da agenda da loja.',
  },
]

/* ------------------------------------------------------------ pendências -- */

/* `publicos` diz em qual página o item aparece. `trava` separa o que segura a
   publicação do que pode ir depois — é o filtro da lista. */
export const PENDENCIAS = [
  {
    id: 'credenciais',
    titulo: 'Credenciais de acesso ao sistema de reservas',
    responsavel: 'JCompany',
    trava: true,
    publicos: ['cliente', 'marketing'],
    linhas: [
      ['O que é', 'Um usuário e uma senha de sistema para a conta da Locafácil, de produção e, se existir, de homologação. Junto, o código correto da loja de Nova Iguaçu.'],
      ['Por que importa', 'É o único item que separa o site de dados reais.'],
      ['Enquanto não chega', 'O site funciona inteiro com dados de exemplo. Dá para demonstrar; não dá para receber reserva.'],
      ['Quanto custa ligar', 'Duas linhas de configuração, sem tocar em código.'],
    ],
  },
  {
    id: 'termos',
    titulo: 'Termos de uso e cláusulas contratuais',
    responsavel: 'Locafácil / jurídico',
    trava: true,
    publicos: ['cliente', 'marketing'],
    linhas: [
      ['O que é', 'Os dois documentos que o cliente aceita antes de confirmar.'],
      ['Por que importa', 'O aceite já está na tela. Publicar sem os documentos é pedir concordância com algo que ninguém pode ler.'],
      ['Duas saídas', 'Pedir à JCompany que preencha no cadastro, ou nos mandar os textos para hospedarmos no site.'],
    ],
  },
  {
    id: 'horario',
    titulo: 'Confirmar o horário de funcionamento',
    responsavel: 'Operação da loja',
    trava: true,
    publicos: ['cliente'],
    linhas: [
      ['O que é', 'Dizer se a grade seg–sex 08:00–17:30, sábado 08:00–12:00, domingo fechado e 48 horas de antecedência é a operação de hoje.'],
      ['Por que importa', 'É o que o site usa para barrar data inválida. Se estiver errada, o cliente escolhe um horário que a loja vai recusar.'],
      ['Cuidado', 'Se mudou, o cadastro no SGLOC precisa mudar primeiro. O site só reflete.'],
    ],
  },
  {
    id: 'chave',
    titulo: 'Revogar a chave antiga de inteligência artificial',
    responsavel: 'Conta Google',
    trava: true,
    publicos: ['cliente'],
    linhas: [
      ['O que é', 'Uma versão anterior do site tinha um assistente com IA, e a chave de acesso ficou publicada. O assistente já foi removido — hoje o botão de atendimento abre o WhatsApp com frases prontas, sem IA nenhuma.'],
      ['Por que importa', 'A chave chegou a ficar visível e é cobrável por quem a tenha copiado. Limpar o código não desfaz isso.'],
      ['O que fazer', 'Entrar no Google AI Studio e apagar a chave. Não precisa gerar outra — o projeto não usa mais IA.'],
    ],
  },
  {
    id: 'dominio',
    titulo: 'Domínio próprio e e-mail',
    responsavel: 'Quem administra o domínio',
    trava: false,
    publicos: ['cliente'],
    linhas: [
      ['O que é', 'Apontar o domínio da Locafácil para a hospedagem, e confirmar que o e-mail usado no rodapé está ativo.'],
      ['Enquanto não', 'O site responde só no endereço de teste, que não serve para campanha.'],
    ],
  },
  {
    id: 'frases',
    titulo: 'Revisar as frases do atendimento',
    responsavel: 'Marketing',
    trava: false,
    publicos: ['marketing'],
    linhas: [
      ['O que é', 'O botão flutuante oferece seis assuntos, e cada um abre o WhatsApp com a mensagem já escrita.'],
      ['Por que importa', 'É literalmente o texto que o cliente vai mandar. Vale a leitura de quem cuida da voz da marca.'],
      ['Onde conferir', 'As seis frases estão nesta página, na seção “Frases do atendimento” — são as que estão no ar agora.'],
    ],
  },
  {
    id: 'prova-social',
    titulo: 'Números de prova social',
    responsavel: 'Marketing',
    trava: false,
    publicos: ['cliente', 'marketing'],
    linhas: [
      ['O que é', 'O site exibia “Nota 4,9” e “+5.000 clientes” sem dizer de onde vinham. Foram retirados.'],
      ['Para voltarem', 'Precisamos da origem — avaliações do Google, número interno de locações — para citar junto. Com fonte, voltam.'],
    ],
  },
  {
    id: 'fotos-frota',
    titulo: 'Fotos da frota real',
    responsavel: 'Marketing — opcional',
    trava: false,
    publicos: ['marketing'],
    linhas: [
      ['Hoje', 'Cada grupo tem foto do modelo que a loja cita, em fundo transparente e enquadramento igual.'],
      ['O ganho', 'Fotos dos carros da própria frota, na cor e no estado reais, vendem mais que foto de catálogo.'],
      ['Como mandar', 'PNG, carro em três quartos, fundo claro e neutro. A troca leva um comando.'],
    ],
  },
]

/* ----------------------------------------------------------------- marca -- */

export const CORES = [
  { hex: '#0628DA', nome: 'Azul da marca', uso: 'Logotipo e superfícies de marca' },
  { hex: '#2AE82A', nome: 'Verde', uso: 'Só dentro da marca. Nunca carrega texto' },
  { hex: '#939598', nome: 'Cinza', uso: 'Apoio' },
  { hex: '#424245', nome: 'Grafite', uso: 'Apoio' },
  { hex: '#2563EB', nome: 'Azul de interface', uso: 'Só no site, no que é clicável' },
]

/* ---------------------------------------------------------------- textos -- */

/* Os textos que vão para fora. Ficam aqui, e não num arquivo de documentação,
   porque a página de marketing os entrega com um botão de copiar — e texto
   que se copia da tela não pode estar numa segunda cópia.

   Os destinatários não entram aqui de propósito: a página é pública para quem
   tiver o link, e endereço de e-mail de cliente e de agência não se publica. */
export const TEXTOS = [
  {
    id: 'email-geral',
    canal: 'E-mail',
    titulo: 'Para o cliente e a agência, juntos',
    assunto: 'Locafácil — novo site para homologação e reunião de validação na segunda (28/09)',
    quando: 'O e-mail principal: resumo, links, dados de teste, reunião, API e próximos passos.',
    corpo: `Olá, pessoal!

O novo site da Locafácil está no ar, em endereço de teste, pronto para homologação. Segue o resumo e tudo o que vocês precisam para conferir.

RESUMO

- Todas as telas prontas, do celular ao computador.
- Fluxo de reserva completo: busca, veículo, proteção, dados do condutor, revisão e confirmação com localizador.
- Fotos da frota por grupo, identidade visual aplicada e atendimento por WhatsApp com frases prontas.
- Preços e disponibilidade ainda são de exemplo: dependem das credenciais da JCompany (detalhe mais abaixo).

LINKS

Site: https://locafacil-nine.vercel.app
Página do cliente: https://locafacil-nine.vercel.app/doc/cliente
Página do marketing: https://locafacil-nine.vercel.app/doc/marketing

Para anexar ou baixar:
PDF do cliente: https://locafacil-nine.vercel.app/doc/Locafacil-Apresentacao-Cliente.pdf
PDF do marketing: https://locafacil-nine.vercel.app/doc/Locafacil-Apresentacao-Marketing.pdf

Nas duas páginas dá para marcar o que já conferiu e escrever as observações passo a passo. Tudo é salvo automaticamente e chega para mim; no fim, um botão manda o retorno também pelo WhatsApp.

COMO TESTAR — DADOS FICTÍCIOS, TELA A TELA

Pode clicar à vontade: nada vira reserva de verdade.

1. Busca — Loja LOCAFACIL NOVA IGUAÇU, devolução no mesmo local. Retirada em 05/10/2026 às 09:00; devolução em 07/10/2026 às 09:00.
2. Veículo — Grupo D (Argo ou similar).
3. Proteção — escolha a Básico e depois troque para a Completa. É aqui o upsell: em duas diárias a proteção vai de R$ 60,00 para R$ 190,00, e a tela mostra o total mudar na hora.
4. Dados do condutor — Joana Ribeiro · (21) 91234-5678 · joana.teste@example.com · CPF 529.982.247-25 · Rua das Palmeiras, 240 - Centro, Apto 402 · Nova Iguaçu/RJ.
5. Revisão — marque "Li e aceito" e clique em Confirmar reserva.
6. Confirmação — localizador, resumo e WhatsApp.

Vale fazer uma vez no computador e uma no celular. Os mesmos dados estão nas páginas, com botão de copiar ao lado de cada campo.

REUNIÃO DE VALIDAÇÃO — SEGUNDA-FEIRA, 28 DE SETEMBRO

Sugiro uma reunião na segunda para fechar:
- os pontos finais de design;
- a responsividade, no celular, no tablet e no computador;
- o fluxo de agendamento percorrido ao vivo, para validar se o front-end está de acordo com a operação;
- a API e os próximos passos.

Me digam o melhor horário.

ONDE ESTAMOS COM A API

O site está pronto para os dados reais; falta a JCompany liberar a conta da Locafácil. Na ordem:
1. Credenciais de acesso (client_id e client_secret) — JCompany. É o que segura todo o resto.
2. Código da loja de Nova Iguaçu e lista de lojas da Locafácil — JCompany.
3. Ligar as credenciais no site — nosso lado, sem mudança de código nem de tela.
4. Rodada de homologação contra a API real — nosso lado.
5. Horário de funcionamento por sistema e links de termos e cláusulas — JCompany e jurídico.

A cobrança à JCompany já está correndo em paralelo.

DOCUMENTAÇÃO DO PROJETO

O código está versionado no GitHub, com documentação de arquitetura, sistema visual, integração com a API e operação:
https://github.com/ItzSypher/locafacil

- README — visão geral, como rodar e como publicar
- DESIGN.md — sistema visual: cores, tipografia, regras de interface
- docs/API-JCOMPANY.md — o que a API entrega, o que falta e o que pedir
- docs/OPERACAO.md — pendências de infraestrutura e marketing, com responsável

PRÓXIMOS PASSOS

1. Até segunda: percorrer o roteiro com os dados de teste.
2. Segunda, 28/09: reunião de validação.
3. Em paralelo: cobrança à JCompany.
4. Depois da reunião: ajustes e publicação no domínio da Locafácil.
5. Com as credenciais: dados reais e homologação final.

O QUE PRECISO DE VOCÊS

- Locafácil: confirmar o horário de funcionamento, os sete grupos e os preços de tabela; os textos de termos e cláusulas; e apagar a chave antiga do Google AI Studio, que não é mais usada.
- Marketing: a lista de ajustes da homologação e uma leitura nas frases de atendimento do WhatsApp.

Qualquer dúvida, é só chamar.

Abraço,`,
  },
  {
    id: 'email-jcompany',
    canal: 'E-mail',
    titulo: 'Para o time de desenvolvimento da JCompany',
    assunto: 'Locafácil — credenciais de acesso à API de reservas',
    quando: 'Destrava os dados reais. É a cobrança mais demorada: mande primeiro.',
    corpo: `Olá, pessoal!

Estamos finalizando o novo site da Locafácil, com o fluxo de reserva integrado à ReservaOTA de vocês. O front já está completo e rodando contra o contrato — busca, disponibilidade, coberturas, confirmação. Para virar a chave, preciso de quatro coisas:

1. Credenciais OAuth da Locafácil. Nossa conta parece não estar provisionada ainda: os endpoints públicos respondem, mas pelo tenant de demonstração — get-locais devolve uma loja que não é nossa e get-personalizacao devolve "JCOMPANY RENT A CAR". Precisamos do client_id e do client_secret de produção, e de homologação se houver ambiente separado, além do LocationCode da nossa loja em Nova Iguaçu.

2. Horário de funcionamento por endpoint. Procurei no spec inteiro e não encontrei — só a Agenda de Manutenção, que é outra coisa. Hoje a validação acontece só no servidor de vocês, depois do submit: se o cliente escolhe um horário fora do expediente, ele só descobre ao clicar em buscar. Para barrar antes, mantive a grade do nosso lado, levantada da própria mensagem de erro (seg-sex 08:00-17:30, sábado 08:00-12:00, domingo fechado). O risco é óbvio: no dia em que a loja mudar o expediente, o site continua mostrando o antigo. Daria para expor isso num endpoint, ou incluir no retorno de get-locais?

3. termos_url e clausulas_url. Voltam vazios em get-personalizacao. O checkout tem o aceite dos termos e precisa apontar para os documentos.

4. Imagem do veículo. A disponibilidade não devolve mídia por grupo. Está no roadmap, ou tratamos do nosso lado mesmo?

Aproveito para registrar dois detalhes do retorno, caso ajude: valores monetários vêm ora como string ("390.00"), ora como número, e os textos chegam com acento corrompido. Tratamos os dois no nosso lado, então não são bloqueio — mas notei que o portal de vocês também remenda o acento no JavaScript do cliente, então talvez valha corrigir na origem.

Consigo um retorno até segunda-feira, 28 de setembro?

Abraço,`,
  },
  {
    id: 'zap-cliente',
    canal: 'WhatsApp',
    titulo: 'Para o cliente — apresentação',
    quando: 'Primeiro contato, junto com o link.',
    corpo: `Oi! O site novo da Locafácil já está no ar para você ver: https://locafacil-nine.vercel.app

Montei uma página com tudo o que você precisa para conferir, com dados de teste prontos para percorrer a reserva inteira: https://locafacil-nine.vercel.app/doc/cliente

Pode clicar à vontade que nada vira reserva de verdade — ainda estamos esperando a JCompany liberar o acesso ao sistema, então os carros e preços que aparecem são de exemplo.

Sugiro uma reunião na segunda, dia 28, para fechar design, responsividade e o fluxo de agendamento. Qual horário fica bom para você?`,
  },
  {
    id: 'zap-cobranca',
    canal: 'WhatsApp',
    titulo: 'Para o cliente — os três itens que dependem dele',
    quando: 'Depois da apresentação, para destravar a publicação.',
    corpo: `Oi! Para o site poder ir ao ar no domínio da Locafácil, preciso de três coisas de vocês — se der, até a reunião de segunda, dia 28:

1. Confirmar o horário de funcionamento da loja. O site hoje usa seg a sex das 08:00 às 17:30, sábado das 08:00 às 12:00, domingo fechado, com 48h de antecedência mínima. Esse é o horário que o sistema da JCompany aceita — se a loja atende em outro, o cadastro lá precisa ser corrigido primeiro.

2. Os textos de termos de uso e cláusulas contratuais. O checkout já pede o aceite, mas não tem para onde apontar.

3. Apagar a chave antiga do Google AI Studio. O assistente com IA saiu do site e não precisa gerar outra — mas a chave antiga ficou exposta e é cobrável por quem tenha copiado.`,
  },
  {
    id: 'zap-marketing',
    canal: 'WhatsApp',
    titulo: 'Para o time de marketing',
    quando: 'Junto com o link da página de marketing.',
    corpo: `Oi, pessoal! Site novo da Locafácil no ar para homologação: https://locafacil-nine.vercel.app

Montei uma página com as telas em alta, as cores e os arquivos da marca, as frases do atendimento e dados de teste para percorrer a reserva inteira: https://locafacil-nine.vercel.app/doc/marketing

Leva uns dez minutos, e vale fazer uma vez no computador e uma no celular. Dá para anotar na própria página, que salva sozinha, e mandar o retorno pelo WhatsApp no fim.

Sugiro uma reunião na segunda, dia 28, para fechar os pontos finais de design e responsividade. Qual horário fica bom para vocês?`,
  },
  {
    id: 'zap-jcompany',
    canal: 'WhatsApp',
    titulo: 'Para o contato na JCompany',
    quando: 'Empurrão depois do e-mail.',
    corpo: `Oi, tudo bem? Estamos finalizando o site da Locafácil com a integração da ReservaOTA e travamos num ponto: nossa conta parece não estar provisionada ainda. Os endpoints públicos respondem, mas pelo tenant de demonstração — get-locais devolve uma loja que não é nossa.

Preciso do client_id e client_secret da Locafácil e do LocationCode da loja de Nova Iguaçu. Mandei um e-mail com o detalhe e mais três pontos menores. Consigo um retorno até segunda, dia 28?`,
  },
]
