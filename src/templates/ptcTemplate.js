import {
  esc, logoImgHtml, marcaAguaHtml, rodapeHtml, cabecalhoHtml,
  criarNumerador, secaoHtml, campoHtml, documentoHTML,
} from './documentoBase.js';
import {
  EMPRESA_PTC, BLOCOS_FIXOS, REGIMES, getTipoServico, interpolar,
} from '../lib/ptcTemplates.js';

/**
 * Template HTML/CSS da PTC — Proposta Técnica Comercial Engeplar.
 *
 * Aparência de página idêntica à do RTE: capa, cabeçalho, faixa lateral, rodapé
 * e marca d'água vêm de ./documentoBase, compartilhado pelos dois documentos.
 *
 * O conteúdo segue a biblioteca de templates (src/lib/ptcTemplates.js, espelho
 * de ptc_templates.json / schema_v7_ptc_templates.sql):
 *   • blocos fixos interpolados com os {{placeholders}} da proposta;
 *   • blocos por tipo de serviço (objetivo, sequência, garantia, regime);
 *   • orçamento com os itens da própria proposta.
 *
 * A numeração das seções é gerada na ordem das seções ativas — nunca fixa —
 * porque ela varia entre os documentos históricos e seções opcionais podem
 * ficar de fora (garantia em regime de diária, observações de norma, etc.).
 *
 * @param {Object} ptc      Dados da PTC (shape do AppContext) + tipo_servico_codigo
 * @param {Object} empresa  Dados da empresa (logo, simbolo, endereço, contatos)
 * @returns {string}        HTML completo pronto para window.open + print
 */
export function gerarHTMLPTC(ptc, empresa) {
  const fmtMoeda = (v) => new Intl.NumberFormat('pt-BR', {
    style: 'currency', currency: 'BRL', minimumFractionDigits: 2,
  }).format(Number(v) || 0);

  const fmtNum = (v) => new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 2, maximumFractionDigits: 2,
  }).format(Number(v) || 0);

  const fmtData = (d) => {
    if (!d) return '';
    if (/^\d{4}-\d{2}-\d{2}/.test(String(d))) {
      const dt = new Date(String(d).slice(0, 10) + 'T12:00:00');
      return `${String(dt.getDate()).padStart(2, '0')}/${String(dt.getMonth() + 1).padStart(2, '0')}/${dt.getFullYear()}`;
    }
    return String(d);
  };

  const hoje = fmtData(new Date().toISOString().split('T')[0]);
  const dataEmissao = fmtData(ptc.data_emissao) || hoje;

  const nomeEmpresa = esc(empresa?.nomeFantasia || empresa?.razaoSocial || 'Engeplar');
  const numCompleto = esc(ptc.numero_completo || 'PTC – ____.__.__ REV00');
  const revAtual = String(ptc.revisao ?? 0).padStart(2, '0');
  const logoImg = (classe) => logoImgHtml(empresa?.logo, classe, nomeEmpresa);

  // ── Tipo de serviço: origem dos blocos técnicos ────────────
  const tipo = getTipoServico(ptc.tipo_servico_codigo) || null;
  const regime = tipo?.regime || 'empreitada_global';
  const garantiaMeses = ptc.garantia_meses ?? tipo?.garantia_meses ?? null;

  // ── Placeholders dos blocos fixos ──────────────────────────
  const cidadeEmpresa = ptc.cidade_emissao || 'Rio dos Cedros - SC';
  const vars = {
    cidade_data: `${cidadeEmpresa}, ${dataEmissao}`,
    cliente_nome: ptc.cliente_nome,
    cliente_unidade: ptc.cliente_unidade,
    obra_nome: ptc.descricao_servico || ptc.subtitulo_servico,
    cliente_fone: ptc.cliente_fone,
    cliente_celular: ptc.cliente_celular,
    cliente_email: ptc.cliente_email,
    contato_nome: ptc.cliente_contato_nome,
    solicitante: ptc.solicitante_nome,
    ptc_numero: ptc.numero_completo,
    revisao: revAtual,
    elaboracao: ptc.elaboracao_nome,
    visita: ptc.visita_nome,
    local_obra: ptc.cliente_endereco,
    area_total: ptc.area_total,
    unidade_medida: ptc.unidade_medida || tipo?.unidade_padrao,
    prazo_dias: ptc.prazo_dias,
    garantia_meses: garantiaMeses,
    pagamento_dias: ptc.pagamento_dias,
    validade_dias: ptc.validade_dias,
    frete: ptc.frete,
    mobilizacao_obs: ptc.mobilizacao_obs,
    inicio_obs: ptc.inicio_obs,
    regime_trabalho: ptc.regime_trabalho || REGIMES[regime],
  };

  /** Bloco de texto com quebras de linha preservadas. */
  const blocoTexto = (txt, classe = 'bloco-pre') => {
    const t = interpolar(txt, vars);
    return t ? `<p class="${classe}">${esc(t)}</p>` : '';
  };

  const lista = (itens) => itens?.length
    ? `<ul class="lista-doc">${itens.map(i => `<li>${esc(interpolar(i, vars))}</li>`).join('')}</ul>`
    : '';

  // ── Numeração sequencial das seções ────────────────────────
  const numSecao = criarNumerador(1);
  const secaoNum = (titulo, conteudo, novaPagina = false) =>
    secaoHtml({ num: `${numSecao()}.0`, titulo, conteudo, novaPagina });
  const secaoSemNum = (titulo, conteudo, novaPagina = false) =>
    secaoHtml({ num: '', titulo, conteudo, novaPagina });

  // ── Histórico de revisões ──────────────────────────────────
  const revisoes = Array.isArray(ptc.revisoes) && ptc.revisoes.length > 0
    ? ptc.revisoes
    : [{
        rev: revAtual, data: ptc.elaboracao_data, descricao: 'Elaboração inicial',
        elaboracao: ptc.elaboracao_nome, visita: ptc.visita_nome, solicitante: ptc.solicitante_nome,
      }];

  const tabelaRevisoes = `
          <table class="tab-grid">
            <thead><tr>
              <th>Rev.</th><th>Data</th><th>Descrição</th>
              <th>Elaboração</th><th>Visita</th><th>Solicitante</th>
            </tr></thead>
            <tbody>
              ${revisoes.map(r => `<tr>
                <td>REV${String(r.rev ?? '00').padStart(2, '0')}</td>
                <td>${esc(fmtData(r.data))}</td>
                <td>${esc(r.descricao || '')}</td>
                <td>${esc(r.elaboracao || '')}</td>
                <td>${esc(r.visita || '')}</td>
                <td>${esc(r.solicitante || '')}</td>
              </tr>`).join('')}
            </tbody>
          </table>`;

  // ── Objetivo ───────────────────────────────────────────────
  const objetivoTxt = ptc.texto_objetivo || tipo?.objetivo || '';
  const objetivo = interpolar(objetivoTxt, vars)
    .split('\n').filter(l => l.trim())
    .map(l => `<p class="texto-justificado">${esc(l)}</p>`).join('');

  // ── Informações / dimensão da estrutura ────────────────────
  const especificacoes = tipo?.especificacoes_tecnicas || {};
  const temEspec = Object.keys(especificacoes).length > 0;
  const temDimensao = ptc.cliente_endereco || ptc.area_total || temEspec;
  const dimensaoEstrutura = temDimensao ? `
          <div class="equip-box">
            <h3>Dados da Estrutura</h3>
            ${ptc.cliente_endereco ? campoHtml('Local da obra', esc(ptc.cliente_endereco)) : ''}
            ${ptc.cliente_cidade ? campoHtml('Cidade', esc(ptc.cliente_cidade) + (ptc.cliente_estado ? ' — ' + esc(ptc.cliente_estado) : '')) : ''}
            ${ptc.area_total ? campoHtml('Área total', `${esc(ptc.area_total)} ${esc(ptc.unidade_medida || tipo?.unidade_padrao || '')}`) : ''}
          </div>
          ${temEspec ? `
          <p class="rotulo-bloco">Especificações Técnicas</p>
          <table class="tab-dados">
            ${Object.entries(especificacoes).map(([k, v]) => `<tr><th class="k">${esc(k)}</th><td class="v">${esc(v)}</td></tr>`).join('')}
          </table>` : ''}` : '';

  // ── Sequência de execução ──────────────────────────────────
  const etapas = (Array.isArray(ptc.sequencia_execucao) && ptc.sequencia_execucao.length > 0)
    ? ptc.sequencia_execucao
    : (tipo?.sequencia_execucao || []);
  const sequenciaExecucao = etapas.length > 0
    // `numero` cobre as sequências gravadas pelo formulário antigo
    ? etapas.map((e, i) => `
          <p class="etapa-titulo">${i + 1}. ${esc(e.etapa || e.numero || '')}</p>
          <p class="texto-justificado">${esc(interpolar(e.texto || '', vars))}</p>`).join('')
    : '';

  // ── Observações importantes ────────────────────────────────
  const obsPartes = [
    tipo?.usa_observacoes_rigido ? BLOCOS_FIXOS.observacoes_rigido : '',
    tipo?.observacao_especifica || '',
    ptc.texto_observacoes || '',
  ].filter(t => String(t).trim());
  const observacoes = obsPartes.map(t => blocoTexto(t, 'texto-justificado')).join('');

  // ── Valor do investimento ──────────────────────────────────
  const itensMat = Array.isArray(ptc.itens_materiais) ? ptc.itens_materiais : [];
  const itensSrv = Array.isArray(ptc.itens_servicos) ? ptc.itens_servicos : [];
  const totalDe = (arr) => arr.reduce((a, i) => a + (Number(i.qtd) || 0) * (Number(i.valor_unit) || 0), 0);
  const subMat = totalDe(itensMat);
  const subSrv = totalDe(itensSrv);
  const freteVal = Number(ptc.frete_valor) || 0;
  const desconto = Number(ptc.desconto_valor) || 0;
  const totalGeral = subMat + subSrv + freteVal - desconto;

  const linhaItem = (i, n) => {
    const total = (Number(i.qtd) || 0) * (Number(i.valor_unit) || 0);
    return `<tr>
                <td>${esc(i.item || n)}</td>
                <td>${esc(i.descricao || '')}</td>
                <td>${esc(i.unidade || '')}</td>
                <td class="num">${fmtNum(i.qtd)}</td>
                <td class="num">${fmtMoeda(i.valor_unit)}</td>
                <td class="num">${fmtMoeda(total)}</td>
              </tr>`;
  };

  const grupoItens = (titulo, itens, subtotal) => itens.length === 0 ? '' : `
          <p class="rotulo-bloco">${esc(titulo)}</p>
          <table class="tab-preco">
            <thead><tr>
              <th>Item</th><th>Descrição</th><th>Un.</th>
              <th class="num">Qtd.</th><th class="num">Valor unit.</th><th class="num">Total</th>
            </tr></thead>
            <tbody>${itens.map((i, n) => linhaItem(i, n + 1)).join('')}</tbody>
          </table>
          <p class="subtotal">Subtotal: <span>${fmtMoeda(subtotal)}</span></p>`;

  const valorInvestimento = (itensMat.length + itensSrv.length) === 0
    ? `<p class="nota">Orçamento a ser detalhado — nenhum item lançado nesta proposta.</p>`
    : `
          ${grupoItens('Materiais', itensMat, subMat)}
          ${grupoItens('Serviços', itensSrv, subSrv)}
          <table class="tab-totais">
            ${freteVal ? `<tr><td>Frete</td><td class="num">${fmtMoeda(freteVal)}</td></tr>` : ''}
            ${desconto ? `<tr><td>Desconto${ptc.desconto_descricao ? ' — ' + esc(ptc.desconto_descricao) : ''}</td><td class="num">- ${fmtMoeda(desconto)}</td></tr>` : ''}
            <tr class="total"><td>Total do investimento</td><td class="num">${fmtMoeda(totalGeral)}</td></tr>
          </table>
          ${ptc.condicoes_pagamento ? `<p class="nota">Condições de pagamento: ${esc(ptc.condicoes_pagamento)}</p>` : ''}`;

  // ── Condições gerais ───────────────────────────────────────
  const condicoesBase = regime === 'diaria'
    ? BLOCOS_FIXOS.condicoes_gerais.diaria
    : BLOCOS_FIXOS.condicoes_gerais.empreitada;
  const condicoesGerais = `
          ${blocoTexto(condicoesBase)}
          ${tipo?.condicoes_pagamento_override ? blocoTexto(tipo.condicoes_pagamento_override, 'texto-justificado') : ''}`;

  // ── Contatos e corpo técnico ───────────────────────────────
  const corpoTecnico = EMPRESA_PTC.corpo_tecnico;
  const contatos = `
          <div class="ref-box" style="margin-bottom:5mm;">
            ${campoHtml('Endereço', esc(empresa?.endereco || EMPRESA_PTC.endereco))}
            ${campoHtml('Fone', esc(empresa?.telefone || EMPRESA_PTC.fone))}
            ${campoHtml('E-mail', esc(empresa?.email || 'contato@engeplar.com.br'))}
          </div>
          <table class="tabela-contatos">
            <thead><tr><th>Nome</th><th>Cargo</th><th>E-mail</th><th>Celular</th></tr></thead>
            <tbody>
              ${corpoTecnico.map(c => `<tr>
                <td>${esc(c.nome)}</td><td>${esc(c.cargo)}</td>
                <td>${esc(c.email)}</td><td>${esc(c.celular)}</td>
              </tr>`).join('')}
            </tbody>
          </table>
          <p class="texto-justificado" style="margin-top:5mm;">${esc(EMPRESA_PTC.assinatura_rodape)}</p>
          <p style="margin-bottom:2mm;">${esc(EMPRESA_PTC.despedida)}</p>
          <div class="assinatura">
            <div class="linha">
              ${esc(ptc.responsavel_nome || 'John C. Peiker')}<br>
              ${esc(ptc.responsavel_cargo || 'Diretor Técnico')}
            </div>
          </div>
          <p class="doc-codigo">${numCompleto}&nbsp;&nbsp;REV${revAtual}</p>`;

  // ── CSS exclusivo da PTC (o restante vem de documentoBase) ─
  const cssPtc = `
/* Blocos de texto dos templates: pre-wrap preserva as quebras de linha E o
   espaçamento do original (pre-line colapsaria "FONE: ...   CELULAR: ..."). */
.bloco-pre { white-space: pre-wrap; line-height: 1.55; text-align: left; }

/* Listas de responsabilidades / notas */
.lista-doc { margin: 0 0 0 6mm; }
.lista-doc li { margin-bottom: 1.6mm; line-height: 1.5; text-align: justify; }

/* Tabela de preços: sem break-inside avoid, o thead se repete quando quebra */
.tab-preco { width: 100%; border-collapse: collapse; font-size: 9.5pt; }
.tab-preco thead th {
  background: #1a3a6b; color: #fff;
  font-size: 8.5pt; font-weight: 700; text-align: left;
  padding: 1.8mm 2.5mm;
  -webkit-print-color-adjust: exact; print-color-adjust: exact; color-adjust: exact;
}
.tab-preco td { padding: 1.6mm 2.5mm; border-bottom: 0.4pt solid #e2e8f0; vertical-align: top; }
.tab-preco tbody tr:nth-child(even) { background: #f7f9fc; }
.tab-preco .num { text-align: right; white-space: nowrap; }
.subtotal { text-align: right; font-size: 9.5pt; margin-top: 1.5mm; }
.subtotal span { font-weight: 700; color: #1a3a6b; }

/* Totais */
.tab-totais {
  width: 96mm; margin-left: auto; margin-top: 5mm;
  border-collapse: collapse; font-size: 10pt;
  page-break-inside: avoid; break-inside: avoid;
}
.tab-totais td { padding: 1.8mm 3mm; border-bottom: 0.4pt solid #e2e8f0; }
.tab-totais .num { text-align: right; white-space: nowrap; }
.tab-totais tr.total td {
  background: #1a3a6b; color: #fff; font-weight: 700; border: none;
  -webkit-print-color-adjust: exact; print-color-adjust: exact; color-adjust: exact;
}

/* Assinatura */
.assinatura { margin-top: 14mm; text-align: center; page-break-inside: avoid; break-inside: avoid; }
.assinatura .linha {
  width: 82mm; margin: 0 auto;
  border-top: 0.5pt solid #374151; padding-top: 2mm;
  font-size: 10pt; line-height: 1.4;
}
.doc-codigo { text-align: right; font-size: 9pt; color: #64748b; margin-top: 8mm; }
`;

  // ── Montagem do conteúdo na ordem canônica das seções ──────
  const conteudo = `
        <!-- ── CAPA ── -->
        <div class="capa">
          ${logoImg('logo-c')}
          <div class="capa-titulo">Proposta Técnica<br>Comercial</div>
          <div class="capa-sub">${esc(tipo?.nome || ptc.subtitulo_servico || ptc.descricao_servico || '')}</div>
          <table class="capa-meta">
            <tr><td class="rot">Nº PTC</td><td>${numCompleto}</td></tr>
            <tr><td class="rot">Revisão</td><td>REV${revAtual}</td></tr>
            <tr><td class="rot">Cliente</td><td>${esc(ptc.cliente_nome || '')}</td></tr>
            ${ptc.cliente_unidade ? `<tr><td class="rot">Unidade</td><td>${esc(ptc.cliente_unidade)}</td></tr>` : ''}
            ${ptc.descricao_servico ? `<tr><td class="rot">Obra</td><td>${esc(ptc.descricao_servico)}</td></tr>` : ''}
            ${ptc.cliente_endereco ? `<tr><td class="rot">Local</td><td>${esc(ptc.cliente_endereco)}</td></tr>` : ''}
            ${ptc.area_total ? `<tr><td class="rot">Área total</td><td>${esc(ptc.area_total)} ${esc(ptc.unidade_medida || tipo?.unidade_padrao || '')}</td></tr>` : ''}
            <tr><td class="rot">Data de Emissão</td><td>${dataEmissao}</td></tr>
          </table>
          <div class="capa-emissao">${esc(empresa?.endereco || EMPRESA_PTC.endereco)} &middot; Emitido em ${dataEmissao}</div>
        </div>

        <!-- ── HISTÓRICO DE REVISÕES ── -->
        ${secaoSemNum('Histórico de Revisões', tabelaRevisoes)}

        <!-- ── SAUDAÇÃO / DESTINATÁRIO ── -->
        ${secaoSemNum('Destinatário', blocoTexto(BLOCOS_FIXOS.saudacao))}

        <!-- ── OBJETIVO ── -->
        ${secaoNum('Objetivo', objetivo || '<p class="nota">Objetivo não informado.</p>', true)}

        <!-- ── INFORMAÇÕES / DIMENSÃO DA ESTRUTURA (quando houver dados) ── -->
        ${temDimensao ? secaoNum('Informações / Dimensão da Estrutura', dimensaoEstrutura) : ''}

        <!-- ── SEQUÊNCIA DE EXECUÇÃO (quando o tipo define etapas) ── -->
        ${sequenciaExecucao ? secaoNum('Sequência de Execução', sequenciaExecucao) : ''}

        <!-- ── PRAZO DE EXECUÇÃO ── -->
        ${secaoNum('Prazo de Execução', blocoTexto(tipo?.prazo_execucao_override || BLOCOS_FIXOS.prazo_execucao))}

        <!-- ── GARANTIA (não se aplica a diária/medição) ── -->
        ${garantiaMeses ? secaoNum('Garantia', `<div class="garantia-box">${blocoTexto(BLOCOS_FIXOS.garantia)}</div>`) : ''}

        <!-- ── RESPONSABILIDADES DA CONTRATADA ── -->
        ${secaoNum('Responsabilidades da Contratada', lista(BLOCOS_FIXOS.responsabilidades_contratada))}

        <!-- ── RESPONSABILIDADE DO CONTRATANTE ── -->
        ${secaoNum('Responsabilidade do Contratante', lista(BLOCOS_FIXOS.responsabilidade_contratante))}

        <!-- ── OBSERVAÇÕES IMPORTANTES (norma / específicas do tipo) ── -->
        ${observacoes ? secaoNum('Observações Importantes', observacoes) : ''}

        <!-- ── VALOR DO INVESTIMENTO ──
             Sem quebra forçada: as tabelas já evitam cortes internos e forçar
             página aqui deixava a anterior quase vazia nos regimes curtos. -->
        ${secaoNum('Valor do Investimento', valorInvestimento)}

        <!-- ── NOTAS ── -->
        ${secaoNum('Notas', lista(tipo?.notas_override || BLOCOS_FIXOS.notas))}

        <!-- ── CONDIÇÕES GERAIS ── -->
        ${secaoNum('Condições Gerais', condicoesGerais)}

        <!-- ── CONTATOS E CORPO TÉCNICO ── -->
        ${secaoNum('Contatos e Corpo Técnico', contatos, true)}
`;

  return documentoHTML({
    title: numCompleto,
    cssExtra: cssPtc,
    marcaAgua: marcaAguaHtml(empresa?.simbolo),
    cabecalho: cabecalhoHtml({
      logoHtml: logoImg('logo-h'),
      titulo: 'Proposta Técnica Comercial',
      metas: [`<strong>Nº ${numCompleto}</strong>`, `REV${revAtual} &middot; ${dataEmissao}`],
    }),
    rodape: rodapeHtml({
      idDoc: `${numCompleto}  REV${revAtual}`,
      nomeEmpresa,
      telefone: empresa?.telefone,
      email: empresa?.email,
      site: empresa?.site,
    }),
    conteudo,
  });
}
