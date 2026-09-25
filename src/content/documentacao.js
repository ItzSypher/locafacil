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
  /* Prazo combinado para o retorno das duas frentes. Data ISO para a conta de
     dias; o rótulo é escrito à mão porque "segunda-feira, 28" lê melhor do que
     qualquer formatação automática no meio de uma frase. */
  prazo: '2026-09-28',
  prazoRotulo: 'segunda-feira, 28 de setembro',
  pdfCliente: '/doc/Locafacil-Apresentacao-Cliente.pdf',
  pdfMarketing: '/doc/Locafacil-Apresentacao-Marketing.pdf',
}

/* ---------------------------------------------------------------- status -- */

export const BLOCOS = [
  { nome: 'Visual e conteúdo', situacao: 'Todas as telas prontas, do celular ao desktop', estado: 'pronto' },
  { nome: 'Fluxo de reserva', situacao: 'Cinco etapas completas, da busca ao localizador', estado: 'pronto' },
  { nome: 'Fotos da frota', situacao: 'Uma foto por grupo, dos modelos que a própria loja cita', estado: 'pronto' },
  { nome: 'Publicação', situacao: 'No ar, e atualiza sozinho a cada ajuste aprovado', estado: 'pronto' },
  { nome: 'Preço e disponibilidade reais', situacao: 'Dependem das credenciais da JCompany', estado: 'travado' },
  { nome: 'Termos e cláusulas', situacao: 'O checkout pede o aceite, mas não há link para os documentos', estado: 'travado' },
  { nome: 'Domínio próprio', situacao: 'Roda em endereço de teste; falta apontar o domínio', estado: 'a-fazer' },
  { nome: 'Imagem de compartilhamento', situacao: 'Falta a arte que aparece ao mandar o link no WhatsApp', estado: 'a-fazer' },
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
    texto: 'Escolha a loja, uma data de retirada e uma de devolução, com horário. O site não deixa escolher domingo nem horário fora do expediente — é proposital, é a grade que o sistema da loja aceita.',
  },
  {
    id: 'veiculos',
    titulo: 'Veja a lista de grupos',
    texto: 'Sete grupos, cada um com foto, características e preço do período. Use os filtros de câmbio, ar e passageiros, e abra “Ver detalhes” em um deles para ver a composição do valor.',
  },
  {
    id: 'protecao',
    titulo: 'Escolha a proteção',
    texto: 'Básico, Padrão ou Completa, com o preço por dia e o total do período lado a lado. É obrigatório escolher uma para seguir.',
  },
  {
    id: 'dados',
    titulo: 'Preencha os dados do condutor',
    texto: 'CPF, telefone e CEP têm máscara e validação. Há também a opção de estrangeiro, que troca o CPF por passaporte.',
  },
  {
    id: 'revisao',
    titulo: 'Revise e confirme',
    texto: 'A tela de revisão mostra tudo outra vez, com o valor aberto em linhas e um link “editar” em cada bloco. Só aqui a reserva é criada.',
  },
  {
    id: 'confirmacao',
    titulo: 'Confira a tela final',
    texto: 'Localizador em destaque, resumo e botão de WhatsApp. Olhe com atenção: é a tela que o cliente vai printar.',
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
    id: 'og-image',
    titulo: 'Imagem de compartilhamento',
    responsavel: 'Marketing',
    trava: false,
    publicos: ['cliente', 'marketing'],
    linhas: [
      ['O que é', 'Uma arte de 1200 × 630 pixels com a marca, que aparece como miniatura quando alguém manda o link no WhatsApp, no Instagram ou no Facebook.'],
      ['Enquanto não', 'O link é compartilhado sem imagem — no meio de uma conversa, some.'],
      ['Formato', 'JPG ou PNG, texto grande e centralizado: em conversa a miniatura aparece pequena.'],
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
   que se copia da tela não pode estar numa segunda cópia. */
export const TEXTOS = [
  {
    id: 'email-cliente',
    canal: 'E-mail',
    titulo: 'Para o cliente e o time de marketing',
    assunto: 'Novo site da Locafácil — no ar para homologação',
    quando: 'Abre a homologação. É o e-mail principal.',
    corpo: `Olá, pessoal!

O novo site da Locafácil está no ar, em endereço de teste, e já dá para percorrer inteiro:

https://locafacil-nine.vercel.app

Abre em qualquer navegador, no computador ou no celular, sem senha. Pode clicar à vontade: nada ali vira reserva de verdade — o site ainda não está ligado ao sistema da loja, então os carros, os preços e o localizador que aparece no fim são de exemplo. Ninguém do balcão recebe nada.

Montei uma página com tudo o que vocês precisam: as telas, o roteiro de homologação passo a passo, o fluxo de reserva explicado, as cores e a tipografia para quem produz arte, e a lista do que ainda falta com o responsável de cada item. Dá para ir marcando o que já conferiu e escrever as observações na própria página, que no fim ela monta o retorno para me mandar.

O que peço de vocês até segunda-feira, 28 de setembro:

1. Percorrer o roteiro de homologação — leva uns dez minutos — uma vez no computador e uma vez no celular.
2. Devolver os ajustes numa lista só: texto que soa errado, coisa desalinhada ou cortada, informação que falta e que o cliente perguntaria, preço ou condição que não bata com a operação real.
3. Confirmar três coisas da operação: o horário de funcionamento da loja, os sete grupos de veículo e os preços de tabela.

O que ainda não dá para conferir: disponibilidade e preço por data. Eles vêm do sistema da JCompany, e a conta da Locafácil ainda não foi liberada por eles — já cobramos, em paralelo. Enquanto não chega, o site mostra a tabela fixa. No dia em que as credenciais chegarem, a virada é de configuração, sem mexer em código e sem mudar nenhuma tela.

Dois itens que dependem de vocês para publicar:

- Termos de uso e cláusulas contratuais. O checkout já pede o aceite, mas não existe link para os documentos.
- Arte de compartilhamento, 1200 x 630 px. É a miniatura que aparece quando alguém manda o link no WhatsApp ou no Instagram.

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

Dá para percorrer inteiro, no celular mesmo. Pode clicar à vontade que nada vira reserva de verdade — ainda estamos esperando a JCompany liberar o acesso ao sistema, então os carros e preços que aparecem são de exemplo.

Te mandei por e-mail uma página com as telas, o passo a passo do que conferir e a lista do que ainda falta. Qualquer coisa que te incomodar, me manda que ajusto. Se der, até segunda-feira, dia 28.`,
  },
  {
    id: 'zap-cobranca',
    canal: 'WhatsApp',
    titulo: 'Para o cliente — os três itens que dependem dele',
    quando: 'Depois da apresentação, para destravar a publicação.',
    corpo: `Oi! Para o site poder ir ao ar no domínio da Locafácil, preciso de três coisas de vocês até segunda, dia 28:

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

Montei uma página com as telas em alta, as cores da marca, as frases do atendimento e o roteiro do que conferir. Leva uns dez minutos, e vale fazer uma vez no computador e uma no celular.

Duas coisas que preciso de vocês até segunda, dia 28: uma arte 1200x630 com a marca, que é a miniatura que aparece quando o link é compartilhado, e uma lida nas frases de atendimento do WhatsApp do site — são seis assuntos prontos, e é literalmente o texto que o cliente vai mandar.`,
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
