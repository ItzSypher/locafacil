import DocShell from './DocShell'
import { Secao, Selo, Cartao, Aviso, Tabela } from './Pecas'
import Checklist from './Checklist'
import Galeria from './Galeria'
import Pendencias from './Pendencias'
import Price from '../Reservar/Price'
import {
  SITE, BLOCOS, TELAS, ETAPAS, GRUPOS, PROTECOES, REGRAS,
  API_ENTREGA, API_NAO_ENTREGA,
} from '../../content/documentacao'

const SECOES = [
  { id: 'resumo', rotulo: 'Resumo' },
  { id: 'acesso', rotulo: 'Acesso' },
  { id: 'roteiro', rotulo: 'Homologação' },
  { id: 'telas', rotulo: 'Telas' },
  { id: 'reserva', rotulo: 'A reserva' },
  { id: 'sistema', rotulo: 'O sistema' },
  { id: 'pendencias', rotulo: 'O que falta' },
  { id: 'proximo', rotulo: 'Próximo passo' },
]

export default function DocCliente() {
  return (
    <DocShell
      publico="cliente"
      titulo="O novo site da Locafácil"
      resumo="O que já está no ar, como conferir tela a tela, e o que ainda falta para receber reserva de verdade."
      secoes={SECOES}
      pdf={SITE.pdfCliente}
    >
      {/* ---------------------------------------------------------- resumo -- */}
      <Secao
        id="resumo"
        numero={1}
        titulo="Em uma página"
        resumo="O site está pronto e no ar. O que ainda não é real são os preços e a disponibilidade."
      >
        <p className="type-body text-text-dark mb-4 max-w-2xl">
          Todas as telas estão prontas e o fluxo de reserva funciona do começo ao
          fim: o cliente escolhe local e data, vê os grupos de carro com preço,
          escolhe a proteção, preenche os dados, revisa e confirma.
        </p>
        <p className="type-body text-text-dark mb-6 max-w-2xl">
          Os preços e a disponibilidade vêm do sistema de locação da JCompany, o
          SGLOC, e a conta da Locafácil ainda não foi liberada por eles. Enquanto
          isso, o site mostra dados de exemplo — os sete grupos reais da loja,
          com os preços de tabela que ela pratica, mas fixos, sem consultar a
          agenda.
        </p>

        <Aviso titulo="O ponto que trava tudo">
          <p>
            Falta a JCompany entregar as credenciais de acesso da Locafácil. São
            duas linhas de configuração. No dia em que chegarem, o site passa a
            mostrar preço e disponibilidade reais{' '}
            <strong>sem nenhuma alteração de código</strong> — é ligar uma chave.
          </p>
        </Aviso>

        <h3 className="type-subtitle text-text-dark mt-10 mb-3">Estado por bloco</h3>
        <Tabela colunas={['Bloco', 'Situação', 'Status']}>
          {BLOCOS.map((bloco) => (
            <tr key={bloco.nome} className="border-b border-line-soft">
              <td className="type-body text-text-dark py-3 pr-4 align-top">{bloco.nome}</td>
              <td className="type-body text-text-muted py-3 pr-4 align-top">{bloco.situacao}</td>
              <td className="py-3 align-top"><Selo estado={bloco.estado} /></td>
            </tr>
          ))}
        </Tabela>
      </Secao>

      {/* ---------------------------------------------------------- acesso -- */}
      <Secao id="acesso" numero={2} titulo="Onde acessar">
        <a
          href={SITE.url}
          target="_blank"
          rel="noopener noreferrer"
          className="type-title text-brand-accent hover:text-brand-glow transition-colors break-all inline-block min-h-11"
        >
          {SITE.rotulo}
        </a>

        <p className="type-body text-text-dark mt-4 max-w-2xl">
          Abre em qualquer navegador, no computador ou no celular. Não precisa de
          senha. O endereço é temporário: quando o domínio da Locafácil for
          apontado, o site passa a responder nele sem mudar nada do que está aqui.
        </p>

        <Aviso titulo="Pode clicar à vontade">
          <p>
            Nada do que você fizer nesse endereço vira reserva de verdade. O site
            ainda não está ligado ao sistema da loja — os carros, os preços e o
            localizador que aparece no fim são de exemplo. Ninguém do balcão vai
            receber nada.
          </p>
        </Aviso>

        <h3 className="type-subtitle text-text-dark mt-10 mb-3">
          O que muda quando as credenciais chegarem
        </h3>
        <p className="type-body text-text-dark max-w-2xl">
          O mesmo site, o mesmo endereço, as mesmas telas. A diferença é que os
          grupos de carro passam a vir da agenda real da loja: some o grupo que
          não tem carro livre no período, o preço passa a ser o daquela data, e a
          confirmação passa a criar uma reserva de verdade no SGLOC, com
          localizador válido.
        </p>
        <p className="type-body text-text-dark mt-3 max-w-2xl">
          Por isso a homologação de agora vale: o que você está conferindo é o
          comportamento, o texto e a navegação — e isso não muda depois.
        </p>
      </Secao>

      {/* --------------------------------------------------------- roteiro -- */}
      <Secao
        id="roteiro"
        numero={3}
        titulo="Roteiro de homologação"
        resumo="Leva cerca de dez minutos. Faça uma vez no computador e uma vez no celular — as duas versões são diferentes de propósito. Marque o que conferiu e escreva as observações aqui mesmo; no fim, um botão monta o retorno para me mandar."
      >
        <Checklist publico="cliente" />

        <Aviso titulo="O que não adianta anotar ainda">
          <p>
            Disponibilidade e preço por data: estão fixos porque o site ainda não
            consulta o sistema da loja. O que vale conferir é se os{' '}
            <strong>sete grupos e os valores de tabela</strong> estão certos —
            esses vieram da operação real e devem bater.
          </p>
        </Aviso>
      </Secao>

      {/* ----------------------------------------------------------- telas -- */}
      <Secao
        id="telas"
        numero={4}
        titulo="As telas"
        resumo={`Capturas do site no ar, em ${SITE.atualizado}. Clique para ampliar.`}
      >
        <Galeria />
      </Secao>

      {/* --------------------------------------------------------- reserva -- */}
      <Secao
        id="reserva"
        numero={5}
        titulo="Como funciona a reserva"
        resumo="São cinco telas até o localizador."
      >
        <Aviso titulo="A regra que mais importa">
          <p>
            A reserva só nasce quando o cliente clica em{' '}
            <strong>“Confirmar reserva”</strong>, na tela de revisão. Antes disso
            nada é enviado à loja — o cliente pode voltar, trocar de carro,
            corrigir o CPF, fechar a aba.
          </p>
        </Aviso>

        <Tabela colunas={['Etapa', 'O que acontece', 'Cria reserva?']}>
          {ETAPAS.map((etapa) => (
            <tr key={etapa.etapa} className="border-b border-line-soft">
              <td className="type-body text-text-dark py-3 pr-4 align-top font-semibold">{etapa.etapa}</td>
              <td className="type-body text-text-muted py-3 pr-4 align-top">{etapa.oQue}</td>
              <td className="type-body py-3 align-top">
                {etapa.cria === null ? (
                  <span className="text-text-muted">—</span>
                ) : etapa.cria ? (
                  <span className="text-state-error font-semibold">Sim, ao confirmar</span>
                ) : (
                  <span className="text-text-muted">Não</span>
                )}
              </td>
            </tr>
          ))}
        </Tabela>

        <h3 className="type-subtitle text-text-dark mt-10 mb-1">Os grupos e os preços de hoje</h3>
        <p className="type-meta text-text-muted mb-3">
          Valores de exemplo, para duas diárias. Vieram da tabela real da loja.
        </p>
        <Tabela colunas={['Grupo', 'Perfil', 'Câmbio', '2 diárias']}>
          {GRUPOS.map((grupo) => (
            <tr key={grupo.codigo} className="border-b border-line-soft">
              <td className="type-body text-text-dark py-3 pr-4 align-top font-semibold whitespace-nowrap">{grupo.codigo}</td>
              <td className="type-body text-text-muted py-3 pr-4 align-top">{grupo.perfil}</td>
              <td className="type-body text-text-muted py-3 pr-4 align-top whitespace-nowrap">{grupo.cambio}</td>
              <td className="py-3 align-top"><Price value={grupo.total} size="sm" className="text-text-dark" /></td>
            </tr>
          ))}
        </Tabela>

        <p className="type-meta text-text-muted mt-3">
          Todos com quilometragem controlada de 200 km, cinco lugares, quatro
          portas, ar condicionado, ABS e airbag.
        </p>

        <h3 className="type-subtitle text-text-dark mt-10 mb-3">As proteções</h3>
        <Tabela colunas={['Proteção', 'O que cobre', 'Por dia']}>
          {PROTECOES.map((protecao) => (
            <tr key={protecao.nome} className="border-b border-line-soft">
              <td className="type-body text-text-dark py-3 pr-4 align-top font-semibold">{protecao.nome}</td>
              <td className="type-body text-text-muted py-3 pr-4 align-top">{protecao.cobre}</td>
              <td className="py-3 align-top"><Price value={protecao.diaria} size="sm" className="text-text-dark" /></td>
            </tr>
          ))}
        </Tabela>

        <h3 className="type-subtitle text-text-dark mt-10 mb-3">As regras que o site respeita</h3>
        <ul className="space-y-3">
          {REGRAS.map((item) => (
            <li key={item.regra} className="border-l-0 pl-0">
              <p className="type-body text-text-dark font-semibold">{item.regra}</p>
              <p className="type-body text-text-muted">{item.detalhe}</p>
            </li>
          ))}
        </ul>

        <Aviso titulo="Atenção, operação">
          <p>
            Essa grade de horário não foi inventada nem combinada: foi levantada
            testando o próprio sistema da JCompany, que recusa qualquer reserva
            fora dela.{' '}
            <strong>
              Se a loja atende em outro horário, quem precisa ser corrigido
              primeiro é o cadastro no SGLOC
            </strong>{' '}
            — enquanto ele disser outra coisa, a reserva será recusada por mais
            que o site prometa.
          </p>
        </Aviso>
      </Secao>

      {/* --------------------------------------------------------- sistema -- */}
      <Secao
        id="sistema"
        numero={6}
        titulo="O que o sistema da JCompany entrega"
        resumo="O site não tem cadastro próprio de carros nem de reservas. Ele conversa com o SGLOC e mostra o que vem de lá."
      >
        <Tabela colunas={['Informação', 'Observação']}>
          {API_ENTREGA.map((linha) => (
            <tr key={linha.item} className="border-b border-line-soft">
              <td className="type-body text-text-dark py-3 pr-4 align-top">{linha.item}</td>
              <td className="type-body text-text-muted py-3 align-top">{linha.nota}</td>
            </tr>
          ))}
        </Tabela>

        <h3 className="type-subtitle text-text-dark mt-10 mb-3">O que ele não entrega</h3>
        <div className="space-y-3">
          {API_NAO_ENTREGA.map((item) => (
            <Cartao
              key={item.id}
              titulo={item.titulo}
              responsavel={item.responsavel}
              linhas={item.linhas}
              recolhivel
            />
          ))}
        </div>
      </Secao>

      {/* ------------------------------------------------------ pendências -- */}
      <Secao
        id="pendencias"
        numero={7}
        titulo="O que falta"
        resumo="Cada item diz quem resolve, por que importa e o que acontece enquanto ninguém resolve."
      >
        <Pendencias publico="cliente" />
      </Secao>

      {/* --------------------------------------------------------- próximo -- */}
      <Secao id="proximo" numero={8} titulo="Próximo passo">
        <ol className="space-y-5">
          <li>
            <p className="type-subtitle text-text-dark">
              Homologação, até {SITE.prazoRotulo}
            </p>
            <p className="type-body text-text-muted mt-1">
              Percorra o roteiro, marque o que conferiu e me mande o retorno pelo
              botão de copiar. Junto com ele, a confirmação do horário de
              funcionamento, dos sete grupos e dos preços de tabela.
            </p>
          </li>
          <li>
            <p className="type-subtitle text-text-dark">Cobrança à JCompany, em paralelo</p>
            <p className="type-body text-text-muted mt-1">
              Pedido formal das credenciais, do horário por sistema e dos links de
              termos. O texto já está pronto e sai junto com este documento.
            </p>
          </li>
          <li>
            <p className="type-subtitle text-text-dark">Publicação no domínio próprio</p>
            <p className="type-body text-text-muted mt-1">
              Assim que os termos existirem e o domínio for apontado. As
              credenciais podem chegar depois: o site vai ao ar mostrando a
              tabela, e liga a disponibilidade real no dia em que elas chegarem.
            </p>
          </li>
        </ol>

        <Aviso titulo="Resumo do que precisamos de você">
          <p>
            Confirmação do horário de funcionamento, dos sete grupos e dos preços
            de tabela; os textos de termos e cláusulas; e a revogação da chave
            antiga no Google AI Studio. As três coisas cabem numa mensagem.
          </p>
        </Aviso>
      </Secao>

      <p className="type-meta text-text-muted">
        {TELAS.length} telas capturadas em {SITE.atualizado}. Para uma versão que
        se imprime, use o botão de PDF no topo.
      </p>
    </DocShell>
  )
}
