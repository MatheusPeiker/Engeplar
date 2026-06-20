/**
 * Template HTML/CSS da PTC — Proposta Técnica Comercial Engeplar
 *
 * Layout IMUTÁVEL fiel ao documento de referência.
 * Usa position:fixed para header/footer (funciona no Chrome/Edge print-to-PDF,
 * mesmo motor do Puppeteer).
 *
 * @param {Object} ptc      Dados da PTC (shape do AppContext)
 * @param {Object} empresa  Dados da empresa (logo, endereço, cnpj, etc.)
 * @returns {string}        HTML completo pronto para window.open + print
 */
export function gerarHTMLPTC(ptc, empresa) {
  const esc = (s) => s == null ? '' : String(s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#039;');

  const fmt = (v) => new Intl.NumberFormat('pt-BR', {
    style: 'currency', currency: 'BRL', minimumFractionDigits: 2
  }).format(Number(v) || 0);

  const fmtNum = (v) => new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 2, maximumFractionDigits: 2
  }).format(Number(v) || 0);

  const logoUrl = empresa?.logo || '';
  const numCompleto = esc(ptc.numero_completo || 'PTC – ____.__.__ REV00');

  // ── Dados da empresa (fixos Engeplar) ──────────────────────
  const empEndereco = empresa?.endereco || 'Rua Amazonas, 475 - Bairro Cruzeiro';
  const empCidade   = '89121-000 - Rio dos Cedros - SC';
  const empCnpj     = empresa?.cnpj || '04273671/0001-87';
  const empIE       = empresa?.inscricaoEstadual || '254219322';
  const empFone     = empresa?.telefone || '(47) 3386-0000';
  const empEmail    = empresa?.email || 'contato@engeplar.com.br';
  const empSite     = empresa?.site || 'www.engeplar.com.br';

  // ── Revisões na capa ───────────────────────────────────────
  const revisoes = Array.isArray(ptc.revisoes) ? ptc.revisoes : [];
  const revAtual = String(ptc.revisao ?? 0).padStart(2, '0');
  const totalFolhas = calcularFolhas(ptc);

  // ── Sequência de execução ──────────────────────────────────
  const seqExec = Array.isArray(ptc.sequencia_execucao) ? ptc.sequencia_execucao : [];

  // ── Itens de preço ─────────────────────────────────────────
  const itensMat = Array.isArray(ptc.itens_materiais) ? ptc.itens_materiais : [];
  const itensSrv = Array.isArray(ptc.itens_servicos)  ? ptc.itens_servicos  : [];

  const subTotalMat = itensMat.reduce((a, i) => a + (Number(i.qtd) || 0) * (Number(i.valor_unit) || 0), 0);
  const subTotalSrv = itensSrv.reduce((a, i) => a + (Number(i.qtd) || 0) * (Number(i.valor_unit) || 0), 0);
  const freteVal    = Number(ptc.frete_valor) || 0;
  const totalGeral  = subTotalMat + subTotalSrv + freteVal;
  const desconto    = Number(ptc.desconto_valor) || 0;
  const totalComDesc = totalGeral - desconto;

  // ── Seções fixas ───────────────────────────────────────────
  const secResp5 = [
    '5.1 - Mão-de-obra especializada para a execução dos serviços.',
    '5.2 - Ferramentas e equipamentos de aplicação necessários para o serviço.',
    '5.3 - Estadia, alimentação e transportes dos profissionais envolvidos na obra.',
    '5.4 - ART (Anotação de Responsabilidade Técnica).',
    '5.5 - Relatório executivo fotográfico da obra.',
  ];

  const secResp6 = [
    '6.1 - Livre acesso para efetuar o serviço na área da obra.',
    '6.2 - Coleta e destinação final dos resíduos da obra.',
    '6.3 - Fornecimento de energia elétrica monofásica e trifásica 45A, distância máxima de 20mt.',
    '6.4 - Entrega da área liberada e livre para a realização das atividades.',
    '6.5 - Condições de realizar o serviço de forma adequada e favorável aos profissionais.',
    '6.6 - Armazenagem e guarda dos materiais necessários para a realização dos trabalhos.',
    '6.7 - Fornecer sanitários e vestiários para os profissionais.',
    '6.8 - Fornecimento de todo material a ser utilizado na obra (quando aplicável).',
  ];

  const secGarantia = [
    `11.1 - Garantimos pelo prazo de 60 (sessenta) meses a durabilidade dos serviços e produtos, conforme especificação acima, desde que os mesmos sejam aplicados rigorosamente dentro da técnica para o fim a que se destinam.`,
    `11.2 - Ressalvamo-nos de responsabilidade na hipótese de ocorrer danos oriundos de imperícias, imprudências, negligências ou abusos no seu manuseio, instalação e operação, bem como na hipótese de ocorrência de casos fortuitos ou imprevisíveis, que alterem, total ou parcialmente, as condições normais de utilização dos materiais a que se aplica.`,
    `11.3 – Deverá ser solicitada anualmente uma vistoria de avaliação do sistema com emissão de relatório da vistoria.`,
  ];

  // ── Helpers de HTML ────────────────────────────────────────
  const bullet = (arr) => arr.map(t => `<li>${esc(t)}</li>`).join('');

  const rowPreco = (i) => {
    const total = (Number(i.qtd) || 0) * (Number(i.valor_unit) || 0);
    return `<tr>
      <td style="text-align:center">${esc(i.item)}</td>
      <td>${esc(i.descricao)}</td>
      <td style="text-align:center">${esc(i.unidade)}</td>
      <td style="text-align:right">${fmtNum(i.qtd)}</td>
      <td style="text-align:right">${fmt(i.valor_unit)}</td>
      <td style="text-align:right">${fmt(total)}</td>
    </tr>`;
  };

  // ── Capa — tabela de revisões ──────────────────────────────
  const linhasRevCapa = revisoes.length > 0
    ? revisoes.map(r => `<tr>
        <td style="text-align:center">${esc(r.rev ?? '00')}</td>
        <td style="text-align:center">${esc(r.data)}</td>
        <td>${esc(r.descricao)}</td>
        <td>${esc(r.elaboracao)}</td>
        <td>${esc(r.visita)}</td>
        <td>${esc(r.solicitante)}</td>
      </tr>`).join('')
    : `<tr>
        <td style="text-align:center">00</td>
        <td style="text-align:center">${esc(ptc.elaboracao_data || '')}</td>
        <td>Elaboração inicial</td>
        <td>${esc(ptc.elaboracao_nome || '')}</td>
        <td>${esc(ptc.visita_nome || '')}</td>
        <td>${esc(ptc.solicitante_nome || '')}</td>
      </tr>`;

  // ── Histórico de revisões (pág 2) ─────────────────────────
  const linhasRevHist = revisoes.length > 0
    ? revisoes.map(r => `<tr>
        <td style="text-align:center">REV${String(r.rev ?? '00').padStart(2,'0')}</td>
        <td style="text-align:center">${esc(r.data)}</td>
        <td>${esc(r.descricao)}</td>
      </tr>`).join('')
    : `<tr>
        <td style="text-align:center">REV00</td>
        <td style="text-align:center">${esc(ptc.elaboracao_data || '')}</td>
        <td>Elaboração inicial</td>
      </tr>`;

  const dataFormatada = (() => {
    try {
      const d = ptc.data_emissao ? new Date(ptc.data_emissao + 'T12:00:00') : new Date();
      const meses = ['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro'];
      return `Rio dos Cedros SC ${d.getDate()} de ${meses[d.getMonth()]} de ${d.getFullYear()}.`;
    } catch { return ''; }
  })();

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>PTC – ${esc(ptc.numero_completo || '')}</title>
<style>
/* ── Reset ── */
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

/* ── Corpo ── */
body {
  font-family: 'Calibri', 'Arial', sans-serif;
  font-size: 10.5pt;
  color: #000;
  background: #fff;
}

/* ── @page: margens que deixam espaço para header/footer fixos ── */
@page {
  size: A4;
  margin: 82px 42px 72px 20mm;
}

/* ── Header fixo (logo + endereço) ── */
.doc-header {
  position: fixed;
  top: 0; left: 0; right: 0;
  height: 76px;
  background: #fff;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding: 6px 42px 0 20mm;
  border-bottom: 1.5pt solid #1a3a6b;
  z-index: 200;
}
.doc-header .logo-wrap img {
  max-height: 60px;
  max-width: 200px;
  object-fit: contain;
}
.doc-header .empresa-info {
  text-align: right;
  font-size: 8.5pt;
  line-height: 1.55;
  color: #222;
}

/* ── Footer fixo ── */
.doc-footer {
  position: fixed;
  bottom: 0; left: 0; right: 0;
  background: #fff;
  z-index: 200;
}
.doc-footer .footer-id-line {
  display: flex;
  justify-content: space-between;
  padding: 2px 42px 2px 20mm;
  font-size: 8pt;
  color: #333;
  border-top: 0.5pt solid #aaa;
}
.doc-footer .footer-bar {
  background: #1a3a6b;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 4px 42px 4px 20mm;
  font-size: 8.5pt;
}
.doc-footer .footer-bar .footer-brand {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
}
.doc-footer .footer-bar .footer-brand img {
  height: 22px;
  filter: brightness(0) invert(1);
}
.doc-footer .footer-bar .footer-contacts {
  display: flex;
  gap: 18px;
}

/* ── Watermark ── */
.watermark {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 380px;
  height: 380px;
  object-fit: contain;
  opacity: 0.055;
  z-index: 0;
  pointer-events: none;
}

/* ── Conteúdo ── */
.doc-content {
  position: relative;
  z-index: 1;
}

/* ── Quebra de página ── */
.page-break { break-before: page; }

/* ── CAPA ── */
.cover-body {
  min-height: calc(297mm - 82px - 72px);
  display: flex;
  flex-direction: column;
}
.cover-main {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 10mm 0;
}
.cover-titles {
  text-align: center;
}
.cover-titles p {
  font-weight: 700;
  font-style: italic;
  font-size: 13pt;
  line-height: 1.7;
  text-transform: uppercase;
}
.cover-titles p.subtitle {
  font-size: 11pt;
  margin-top: 4px;
}
.cover-titles p.area {
  font-size: 10.5pt;
  font-weight: 400;
  font-style: normal;
  margin-top: 10px;
}
.cover-titles p.city {
  font-size: 10.5pt;
  font-weight: 400;
  font-style: normal;
  margin-top: 4px;
}
.cover-bottom {
  margin-top: 8px;
}
.cover-logos-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 6px;
  padding: 0 20px;
}
.cover-logos-row img {
  max-height: 50px;
  max-width: 160px;
  object-fit: contain;
}

/* ── Tabelas gerais ── */
table.doc-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 9.5pt;
  margin: 6px 0;
}
table.doc-table th {
  background: #d5dff2;
  border: 0.75pt solid #333;
  padding: 4px 6px;
  text-align: center;
  font-weight: 700;
  font-size: 9pt;
}
table.doc-table td {
  border: 0.75pt solid #333;
  padding: 4px 6px;
  vertical-align: top;
}
table.doc-table tr.subtotal td {
  background: #f0f0f0;
  font-weight: 700;
}
table.doc-table tr.total-row td {
  background: #e8edf7;
  font-weight: 700;
  font-size: 10pt;
}

/* ── Tabela capa (info footer da capa) ── */
table.capa-info {
  width: 100%;
  border-collapse: collapse;
  font-size: 9pt;
  margin-top: 4px;
}
table.capa-info td {
  border: 0.75pt solid #333;
  padding: 3px 6px;
  vertical-align: middle;
}
table.capa-info .header-cell {
  background: #d5dff2;
  font-weight: 700;
  text-align: center;
}
table.capa-info .ptc-num {
  background: #ffe090;
  font-weight: 700;
  text-align: center;
  font-size: 10pt;
}

/* ── Seções do corpo ── */
.section {
  margin: 14px 0 6px 0;
}
.section-title {
  font-weight: 700;
  font-size: 11pt;
  margin-bottom: 6px;
  text-transform: uppercase;
}
.section ul {
  list-style: none;
  padding-left: 0;
}
.section ul li {
  padding: 3px 0 3px 2px;
  font-size: 10.5pt;
  line-height: 1.45;
}
.section ul li::before { content: "• "; }
.section p {
  font-size: 10.5pt;
  line-height: 1.45;
  margin-bottom: 4px;
}

/* ── Bloco de endereçamento (pág 2) ── */
.address-block {
  font-size: 10.5pt;
  line-height: 1.7;
  margin: 10px 0 16px 0;
}
.address-block .greeting {
  font-style: italic;
  font-size: 10.5pt;
  margin-bottom: 12px;
}

/* ── Assinatura ── */
.signature-block {
  margin-top: 40px;
  text-align: center;
}
.signature-block .sig-line {
  display: inline-block;
  width: 280px;
  border-top: 1pt solid #000;
  margin: 0 auto;
  padding-top: 4px;
}
.ptc-code {
  font-size: 9pt;
  text-align: right;
  margin-top: 8px;
  color: #444;
}

/* ── Barra lateral ── */
.barra-lateral {
  position: fixed;
  left: 0; top: 0; bottom: 0;
  width: 10mm;
  background: #1a3a6b;
  z-index: 0;
  print-color-adjust: exact;
  -webkit-print-color-adjust: exact;
}

.num-pagina::after {
  content: counter(page);
}

/* ── Print específico ── */
@media print {
  body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .doc-header, .doc-footer { position: fixed; }
  .watermark { position: fixed; }
  .barra-lateral { display: block !important; }
}
</style>
</head>
<body>

<!-- ════════════════════════════════════════════════
     HEADER — repete em todas as páginas
═════════════════════════════════════════════════ -->
<div class="doc-header">
  <div class="logo-wrap">
    ${logoUrl
      ? `<img src="${esc(logoUrl)}" alt="Engeplar" />`
      : `<div style="font-size:14pt;font-weight:700;color:#1a3a6b;line-height:1.2">ENGEPLAR<br><span style="font-size:8pt;font-weight:400">Engenharia de proteção e impermeabilização</span></div>`
    }
  </div>
  <div class="empresa-info">
    ${esc(empEndereco)}<br>
    ${esc(empCidade)}<br>
    <br>
    CNPJ ${esc(empCnpj)}<br>
    <br>
    Insc Est ${esc(empIE)}
  </div>
</div>

<!-- ════════════════════════════════════════════════
     FOOTER — repete em todas as páginas
═════════════════════════════════════════════════ -->
<div class="doc-footer">
  <div class="footer-id-line">
    <span>PROPOSTA TÉCNICA COMERCIAL &nbsp;-----------------------------------&nbsp; ${numCompleto}</span>
    <span>Página <span class="num-pagina"></span></span>
  </div>
  <div class="footer-bar">
    <div class="footer-brand">
      ${logoUrl ? `<img src="${esc(logoUrl)}" alt="" />` : ''}
      <span>Proposta Técnica Comercial</span>
    </div>
    <div class="footer-contacts">
      <span>&#9990; ${esc(empFone)}</span>
      <span>&#9993; ${esc(empEmail)}</span>
      <span>&#127760; ${esc(empSite)}</span>
    </div>
  </div>
</div>

<!-- Watermark -->
${logoUrl ? `<img class="watermark" src="${esc(logoUrl)}" alt="" />` : ''}

<!-- ════════════════════════════════════════════════
     CONTEÚDO DO DOCUMENTO
═════════════════════════════════════════════════ -->
<div class="barra-lateral"></div>
<div class="doc-content">

<!-- ──────────────────────────────────────────────
     PÁGINA 1 — CAPA
─────────────────────────────────────────────── -->
<div class="cover-body">

  <div class="cover-main">
    <div class="cover-titles">
      <p>${esc(ptc.descricao_servico || 'DESCRIÇÃO DO SERVIÇO')}</p>
      ${ptc.subtitulo_servico ? `<p class="subtitle">${esc(ptc.subtitulo_servico)}</p>` : ''}
      ${ptc.area_total ? `<p class="area">${esc(ptc.area_total)}</p>` : ''}
      <p class="city">${esc(ptc.cliente_cidade || '')}${ptc.cliente_estado ? ' - ' + esc(ptc.cliente_estado) : ''}</p>
    </div>
  </div>

  <div class="cover-bottom">
    <!-- Tabela de revisões da capa -->
    <table class="doc-table">
      <thead>
        <tr>
          <th style="width:6%">Rev.</th>
          <th style="width:13%">Data</th>
          <th>Descrição da Revisão</th>
          <th style="width:14%">Elaboração</th>
          <th style="width:12%">Visita</th>
          <th style="width:13%">Solicitante</th>
        </tr>
      </thead>
      <tbody>${linhasRevCapa}</tbody>
    </table>

    <!-- Logos do cliente e da Engeplar -->
    <div class="cover-logos-row">
      <div style="color:#666;font-size:9pt;font-style:italic">
        ${ptc.cliente_nome ? esc(ptc.cliente_nome) : ''}
      </div>
      <div>
        ${logoUrl ? `<img src="${esc(logoUrl)}" style="max-height:44px;max-width:130px;object-fit:contain" alt="Engeplar" />` : ''}
        <span style="font-weight:700;font-size:10pt;margin-left:6px;vertical-align:middle">ENGEPLAR Ind. Com. Ltda.</span>
      </div>
    </div>

    <!-- Tabela de info da capa -->
    <table class="capa-info">
      <tr>
        <td colspan="2" class="header-cell">RESPONSÁVEL TÉCNICO</td>
        <td class="header-cell">DATA</td>
        <td colspan="2" class="ptc-num">${numCompleto}</td>
      </tr>
      <tr>
        <td style="width:13%">ELABORAÇÃO:</td>
        <td>${esc(ptc.elaboracao_nome || '')}</td>
        <td style="width:12%;text-align:center">${esc(ptc.elaboracao_data || '')}</td>
        <td colspan="2" rowspan="3" style="text-align:center;font-weight:700;font-size:10pt;vertical-align:middle">
          ${esc(ptc.descricao_servico || '')}
        </td>
      </tr>
      <tr>
        <td>VISITA:</td>
        <td>${esc(ptc.visita_nome || '')}</td>
        <td></td>
      </tr>
      <tr>
        <td>SOLICITANTE:</td>
        <td>${esc(ptc.solicitante_nome || '')}</td>
        <td style="text-align:center">${esc(ptc.solicitante_data || '')}</td>
      </tr>
      <tr>
        <td colspan="2">Rev. ${revAtual}</td>
        <td colspan="3">No.Fls. ${totalFolhas}</td>
      </tr>
    </table>
  </div>
</div>
<!-- fim capa -->

<!-- ──────────────────────────────────────────────
     PÁGINA 2 — HISTÓRICO DE REVISÕES + CORPO
─────────────────────────────────────────────── -->
<div class="page-break">

  <!-- Histórico de revisões -->
  <div class="section">
    <table class="doc-table">
      <thead>
        <tr>
          <th style="width:18%">Nº da Revisão</th>
          <th style="width:22%">Data de Emissão</th>
          <th>Modificações</th>
        </tr>
      </thead>
      <tbody>${linhasRevHist}</tbody>
    </table>
  </div>

  <p style="text-align:right;font-size:9.5pt;margin:10px 0 16px 0">${dataFormatada}</p>

  <!-- Bloco de endereçamento -->
  <div class="address-block">
    <strong>Para</strong><br>
    <strong>${esc(ptc.cliente_nome || '')}</strong><br>
    ${ptc.cliente_unidade ? esc(ptc.cliente_unidade) + '<br>' : ''}
    ${ptc.cliente_cidade ? esc(ptc.cliente_cidade) + (ptc.cliente_estado ? ' – ' + esc(ptc.cliente_estado) : '') + '<br>' : ''}
    ${ptc.cliente_fone    ? 'FONE: ' + esc(ptc.cliente_fone) + '<br>' : ''}
    ${ptc.cliente_email   ? 'E-mail: <a href="mailto:' + esc(ptc.cliente_email) + '">' + esc(ptc.cliente_email) + '</a><br>' : ''}
    ${ptc.cliente_contato_nome ? 'At. <em>' + esc(ptc.cliente_contato_nome) + '</em><br>' : ''}
  </div>

  <p class="greeting">Conforme atendimentos mantidos, apresentamos <em><strong>PROPOSTA TÉCNICA COMERCIAL</strong></em>, para execução dos serviços em referência, como segue:</p>

  <!-- 1.0 OBJETIVO -->
  <div class="section">
    <p class="section-title">1.0 - OBJETIVO:</p>
    <ul>
      <li>1.1 – ${esc(ptc.texto_objetivo || 'Em atendimento a vossa solicitação e oportunidade, segue nossas indicações e solução para os serviços em referência.')}</li>
      <li>1.2 - Esta proposta será pelo regime de empreitada global, incluindo o fornecimento de mão de obra especializada, materiais e ferramentas necessárias à perfeita execução das atividades apontadas.</li>
    </ul>
  </div>

  <!-- 2.0 ENDEREÇO -->
  <div class="section">
    <p class="section-title">2.0 - ENDEREÇO DA OBRA:</p>
    <ul>
      <li>2.1 – ${esc(ptc.cliente_nome || '')}${ptc.cliente_unidade ? ' — ' + esc(ptc.cliente_unidade) : ''}.<br>
        &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;${esc(ptc.cliente_endereco || '')}<br>
        &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;${esc(ptc.cliente_cidade || '')}${ptc.cliente_estado ? ' – ' + esc(ptc.cliente_estado) : ''}</li>
    </ul>
  </div>

  <!-- 3.0 PRAZO -->
  <div class="section">
    <p class="section-title">3.0 - PRAZO DE EXECUÇÃO:</p>
    <ul>
      <li>3.1 - Estimamos executar todas as atividades conforme descritas em ${esc(String(ptc.prazo_dias || 5))} dias, considerando trabalhos em ${esc(ptc.regime_trabalho || 'regime extraordinário')}.</li>
      <li>3.2 - Esse prazo pode sofrer alteração dependendo da liberação de área e condições climáticas.</li>
    </ul>
  </div>

  <!-- 4.0 SEQUÊNCIA -->
  <div class="section">
    <p class="section-title">4.0 - SEQUÊNCIA DE EXECUÇÃO.</p>
    <ul>
      ${seqExec.length > 0
        ? seqExec.map(s => `<li>${esc(s.numero)} – ${esc(s.texto)}</li>`).join('')
        : '<li>Conforme descrito em proposta específica.</li>'
      }
    </ul>
  </div>

  <!-- 5.0 RESPONSABILIDADES CONTRATADA -->
  <div class="section">
    <p class="section-title">5.0 - RESPONSABILIDADES DA CONTRATADA:</p>
    <ul>${bullet(secResp5)}</ul>
  </div>

  <!-- 6.0 RESPONSABILIDADES CONTRATANTE -->
  <div class="section">
    <p class="section-title">6.0 - RESPONSABILIDADE DO CONTRATANTE:</p>
    <ul>${bullet(secResp6)}</ul>
  </div>

  <!-- 7.0 NOTAS -->
  <div class="section">
    <p class="section-title">7.0 - NOTAS:</p>
    <ul>
      <li>7.1 - O contrato terá validade de 06 meses. O reajuste será anual, onde os valores permanecem para outras unidades, tendo apenas alteração no item de mobilização.</li>
      <li>7.2 - Será emitida nota fiscal de serviço.</li>
      <li>7.3 - Estamos considerando ${esc(String(ptc.num_mobilizacoes || 1))} mobilização/desmobilização e locação de equipamentos para o total da área previsto.</li>
      <li>7.4 - Caso nossa equipe e equipamento fiquem ociosos por motivos alheios à CONTRATADA, será cobrado o valor das diárias improdutivas.</li>
    </ul>
  </div>

  <!-- 8.0 CONDIÇÕES GERAIS -->
  <div class="section">
    <p class="section-title">8.0 - CONDIÇÕES GERAIS</p>
    <ul>
      <li><strong>8.1 - Frete:</strong>&nbsp;&nbsp; Material – ${esc(ptc.frete_material || 'CIF – Obra')}<br>
        &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Mão de Obra – ${esc(ptc.frete_mao_obra || 'CIF – Obra')}.</li>
      <li><strong>8.2 - Validade da proposta:</strong>&nbsp; 15 dias da emissão.</li>
      <li><strong>8.3 - Condições de pagamento:</strong>&nbsp; ${esc(ptc.condicoes_pagamento || '14 dias da emissão da nota')}.</li>
    </ul>
  </div>

  <!-- 9.0 OBSERVAÇÕES -->
  ${ptc.texto_observacoes ? `
  <div class="section">
    <p class="section-title">9.0 – OBSERVAÇÕES IMPORTANTES:</p>
    <ul>
      <li>9.1 – ${esc(ptc.texto_observacoes)}</li>
    </ul>
  </div>` : ''}

  <!-- 10.0 PREÇO -->
  <div class="section page-break">
    <p class="section-title">10.0 – PREÇO UNITÁRIO E TOTAL:</p>
    <p style="margin-bottom:8px">Custo do serviço proposto segue descrito abaixo:</p>

    <!-- Tabela de Materiais -->
    ${itensMat.length > 0 ? `
    <table class="doc-table">
      <thead>
        <tr>
          <th style="width:7%">Item</th>
          <th>Descrição do serviço / MATERIAIS</th>
          <th style="width:9%">Unidade</th>
          <th style="width:9%">Qtd.</th>
          <th style="width:14%">Valor Unit.</th>
          <th style="width:14%">Valor R$:</th>
        </tr>
      </thead>
      <tbody>
        ${itensMat.map(rowPreco).join('')}
        <tr class="subtotal">
          <td colspan="5" style="text-align:right">Sub-total</td>
          <td style="text-align:right">${fmt(subTotalMat)}</td>
        </tr>
      </tbody>
    </table>
    ` : ''}

    <!-- Tabela de Serviços -->
    ${itensSrv.length > 0 ? `
    <table class="doc-table" style="margin-top:12px">
      <thead>
        <tr>
          <th style="width:7%">Item</th>
          <th>Descrição / Serviços</th>
          <th style="width:9%">Unidade</th>
          <th style="width:9%">Qtd.</th>
          <th style="width:14%">Valor Unit.</th>
          <th style="width:14%">Valor R$:</th>
        </tr>
      </thead>
      <tbody>
        ${itensSrv.map(rowPreco).join('')}
        <tr class="subtotal">
          <td colspan="5" style="text-align:right">Sub-total</td>
          <td style="text-align:right">${fmt(subTotalSrv)}</td>
        </tr>
        ${freteVal > 0 ? `<tr class="subtotal">
          <td colspan="5" style="text-align:right">Frete Mat.</td>
          <td style="text-align:right">${fmt(freteVal)}</td>
        </tr>` : ''}
        <tr class="total-row">
          <td colspan="5" style="text-align:right">TOTAL</td>
          <td style="text-align:right">${fmt(totalGeral)}</td>
        </tr>
        ${desconto > 0 ? `<tr class="total-row">
          <td colspan="5" style="text-align:right">${esc(ptc.desconto_descricao || 'Valor com desconto')}</td>
          <td style="text-align:right">${fmt(totalComDesc)}</td>
        </tr>` : ''}
      </tbody>
    </table>
    ` : ''}

    ${(itensMat.length > 0 && itensSrv.length === 0) ? `
    <table class="doc-table" style="margin-top:4px">
      <tbody>
        ${freteVal > 0 ? `<tr class="subtotal">
          <td colspan="5" style="text-align:right">Frete Mat.</td>
          <td style="text-align:right">${fmt(freteVal)}</td>
        </tr>` : ''}
        <tr class="total-row">
          <td colspan="5" style="text-align:right">TOTAL</td>
          <td style="text-align:right">${fmt(totalGeral)}</td>
        </tr>
        ${desconto > 0 ? `<tr class="total-row">
          <td colspan="5" style="text-align:right">${esc(ptc.desconto_descricao || 'Valor com desconto')}</td>
          <td style="text-align:right">${fmt(totalComDesc)}</td>
        </tr>` : ''}
      </tbody>
    </table>
    ` : ''}
  </div>

  <!-- 11.0 GARANTIA -->
  <div class="section">
    <p class="section-title">11.0 - GARANTIA:</p>
    <ul>${bullet(secGarantia)}</ul>
  </div>

  <!-- 12.0 CONTATO E CORPO TÉCNICO -->
  <div class="section page-break">
    <p class="section-title">12.0 - CONTATO E CORPO TÉCNICO:</p>
    <p style="margin-bottom:10px">
      Rua Amazonas, 475.<br>
      Bairro Cruzeiro - CEP 89121-000<br>
      Rio dos Cedros - SC<br>
      Fone: ${esc(empFone)}
    </p>

    <table style="width:100%;border:none;margin-bottom:10px">
      <tr>
        <td style="border:none;width:50%;font-size:10.5pt">
          <strong>Celular</strong> – John Clovis Peiker<br>
          47 9 8815-3943
        </td>
        <td style="border:none;width:50%;font-size:10.5pt">
          <strong>Endereço Eletrônico</strong><br>
          <a href="mailto:john@engeplar.com.br">john@engeplar.com.br</a>
        </td>
      </tr>
      <tr>
        <td style="border:none;font-size:10.5pt;padding-top:6px">
          <strong>Celular</strong> – Edson James Peiker<br>
          47 9 8829-3476
        </td>
        <td style="border:none;font-size:10.5pt;padding-top:6px">
          <strong>Endereço Eletrônico</strong><br>
          <a href="mailto:james@engeplar.com.br">james@engeplar.com.br</a>
        </td>
      </tr>
      <tr>
        <td style="border:none;font-size:10.5pt;padding-top:6px">
          <strong>Celular</strong> – Matheus Peiker<br>
          47 9 99637-0326
        </td>
        <td style="border:none;font-size:10.5pt;padding-top:6px">
          <strong>Endereço Eletrônico</strong><br>
          <a href="mailto:matheus@engeplar.com.br">matheus@engeplar.com.br</a>
        </td>
      </tr>
    </table>

    <p style="margin:12px 0">A Engeplar conta com uma equipe de técnicos, que trabalham em conjunto para complementar as especialidades de projeto e consultoria, bem como uma série de empresas associadas que atuam na execução e em serviços especiais de Engenharia.</p>

    <p style="margin-bottom:4px">Atenciosamente e pronto para atendê-los a qualquer momento,</p>

    <div class="signature-block">
      <div class="sig-line">
        ${esc(ptc.responsavel_nome || 'Matheus Peiker')}<br>
        ${esc(ptc.responsavel_cargo || 'Gerente de fábrica')}
      </div>
    </div>

    <p class="ptc-code">
      ${numCompleto}&nbsp;&nbsp;REV${revAtual}
    </p>
  </div>

</div>
<!-- fim do conteúdo -->
</div>

<script>window.onload = () => window.print();</script>
</body>
</html>`;
}

function calcularFolhas(ptc) {
  let folhas = 2; // capa + histórico/corpo
  if ((ptc.itens_materiais?.length || 0) > 0 || (ptc.itens_servicos?.length || 0) > 0) folhas++;
  folhas++; // contato/assinatura
  return String(folhas).padStart(2, '0');
}
