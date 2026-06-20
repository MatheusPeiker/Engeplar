export function gerarPTC(proposta, obra, _clienteObj, orcamento, itens, empresa) {
  const html = buildHtml(proposta, obra, orcamento, itens, empresa);
  const w = window.open('', '_blank');
  if (w) { w.document.write(html); w.document.close(); }
}

function buildHtml(proposta, obra, orcamento, itens, empresa) {
  const esc = (s) => s == null ? '' : String(s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#039;');

  const fmt = (v) => new Intl.NumberFormat('pt-BR', {
    style: 'currency', currency: 'BRL', minimumFractionDigits: 2,
  }).format(Number(v) || 0);

  // Empresa
  const logo     = empresa?.logo || '';
  const empNome  = esc(empresa?.nomeFantasia || empresa?.razaoSocial || 'ENGEPLAR');
  const empEnd   = esc(empresa?.endereco || '');
  const empCnpj  = esc(empresa?.cnpj || '');
  const empIE    = esc(empresa?.inscricaoEstadual || '');
  const empFone  = esc(empresa?.telefone || '');
  const empEmail = esc(empresa?.email || '');
  const empSite  = esc(empresa?.site || '');

  // Proposta
  const ptcNum   = esc(proposta.ptcNumero || '');
  const rev      = esc(proposta.revisao || 'REV00');
  const elab     = esc(proposta.elaboracao || '');
  const visit    = esc(proposta.visita || '');
  const objetivo = esc(proposta.objetivo || 'Em atendimento a vossa solicitação e oportunidade, segue nossas indicações e solução para os serviços em referência.');
  const prazo    = esc(proposta.prazoExecucao || '');
  const naoInc   = esc(proposta.naoIncluso || '');
  const obs      = esc(proposta.observacoes || '');
  const notas    = esc(proposta.notas || '');
  const pagDias  = proposta.pagamentoDias ?? 14;
  const valDias  = proposta.validadeDias ?? 15;
  const frete    = esc(proposta.frete || 'CIF');
  const mobObs   = esc(proposta.mobilizacaoObs || 'A combinar');

  // Cliente (vem da proposta ou da obra)
  const clienteNome = esc(proposta.clienteNome || obra?.nome || '');
  const clienteEnd  = esc(proposta.clienteEndereco || obra?.endereco || '');
  const clienteCnpj = esc(proposta.clienteCnpj || '');

  // Data
  const hoje = new Date();
  const meses = ['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro'];
  const dataExtenso = `${hoje.getDate()} de ${meses[hoje.getMonth()]} de ${hoje.getFullYear()}`;
  const dataHoje = hoje.toLocaleDateString('pt-BR');

  // Totais financeiros
  const orcMO  = orcamento?.extras?.maoDeObra || [];
  const orcMob = orcamento?.extras?.mobilizacao || {};
  const nViagens = parseInt(orcMob.numViagens) || 1;

  const totalMat = (itens || []).reduce((a, i) => a + (i.quantidade || 0) * (i.custoUnitario || 0), 0);
  const totalMO  = orcMO.reduce((a, m) => a + (m.custoDiaria || 0) * (m.diasPrevistos || 0), 0);
  const totalMob = orcMob.distanciaKm
    ? (parseFloat(orcMob.distanciaKm) * (parseFloat(orcMob.custoPorKm) || 0) * nViagens)
      + ((parseInt(orcMob.numPessoas) || 0) * (parseFloat(orcMob.custoAdicionalPorPessoa) || 0) * nViagens)
    : 0;
  const totalBase = totalMat + totalMO + totalMob;
  const margem    = parseFloat(proposta.margemLucro) || 0;
  const impostos  = parseFloat(proposta.impostos) || 0;
  const base      = proposta.valorProposto || totalBase;
  const comMargem = base * (1 + margem / 100);
  const valorFinal = comMargem * (1 + impostos / 100);

  // Linhas da tabela de preço
  const linhasMat = (itens || []).map((i, idx) => {
    const tot = (i.quantidade || 0) * (i.custoUnitario || 0);
    return `<tr>
      <td style="text-align:center">${idx + 1}</td>
      <td>${esc(i.descricao)}</td>
      <td style="text-align:center">${esc(i.unidade || 'vb')}</td>
      <td style="text-align:right">${i.quantidade || 0}</td>
      <td style="text-align:right">${fmt(i.custoUnitario || 0)}</td>
      <td style="text-align:right">${fmt(tot)}</td>
    </tr>`;
  }).join('');

  const linhasMO = orcMO.map((m, idx) => {
    const tot = (m.custoDiaria || 0) * (m.diasPrevistos || 0);
    return `<tr>
      <td style="text-align:center">MO${idx + 1}</td>
      <td>${esc(m.nome || '')} — ${esc(m.funcao || '')}</td>
      <td style="text-align:center">vb</td>
      <td style="text-align:right">${m.diasPrevistos || 0} dias</td>
      <td style="text-align:right">${fmt(m.custoDiaria || 0)}/dia</td>
      <td style="text-align:right">${fmt(tot)}</td>
    </tr>`;
  }).join('');

  const linhaMob = totalMob > 0 ? `<tr>
    <td style="text-align:center">MOB</td>
    <td>Mobilização/Desmobilização${orcMob.veiculo ? ' — ' + esc(orcMob.veiculo) : ''}</td>
    <td style="text-align:center">vb</td>
    <td style="text-align:right">${nViagens} viagem(ns)</td>
    <td style="text-align:right">—</td>
    <td style="text-align:right">${fmt(totalMob)}</td>
  </tr>` : '';

  const linhasMargem = margem > 0 ? `<tr class="sub">
    <td colspan="5" style="text-align:right">Margem de lucro (${margem}%)</td>
    <td style="text-align:right">+ ${fmt(base * margem / 100)}</td>
  </tr>` : '';
  const linhasImpostos = impostos > 0 ? `<tr class="sub">
    <td colspan="5" style="text-align:right">Impostos (${impostos}%)</td>
    <td style="text-align:right">+ ${fmt(comMargem * impostos / 100)}</td>
  </tr>` : '';

  // Seções fixas
  const resp5 = [
    'Mão-de-obra especializada para a execução dos serviços.',
    'Ferramentas e equipamentos de aplicação necessários para o serviço.',
    'Estadia, alimentação e transportes dos profissionais envolvidos na obra.',
    'ART (Anotação de Responsabilidade Técnica).',
    'Relatório executivo fotográfico da obra.',
  ];
  const resp6 = [
    'Livre acesso para efetuar o serviço na área da obra.',
    'Coleta e destinação final dos resíduos da obra.',
    'Fornecimento de energia elétrica monofásica e trifásica 45A, distância máxima de 20mt.',
    'Entrega da área liberada e livre para a realização das atividades.',
    'Condições de realizar o serviço de forma adequada e favorável aos profissionais.',
    'Armazenagem e guarda dos materiais necessários para a realização dos trabalhos.',
    'Fornecer sanitários e vestiários para os profissionais.',
  ];
  const li = (prefix, arr) => arr.map((t, i) => `<li>${prefix}${i + 1} - ${t}</li>`).join('');

  const logoHtml = logo
    ? `<img src="${esc(logo)}" alt="${empNome}" style="max-height:60px;max-width:200px;object-fit:contain" />`
    : `<div style="font-size:14pt;font-weight:700;color:#1a3a6b;line-height:1.2">${empNome}<br><span style="font-size:8pt;font-weight:400">Engenharia de proteção e impermeabilização</span></div>`;

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<title>PTC – ${ptcNum || proposta.nome || 'Proposta'}</title>
<style>
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
body{font-family:'Calibri','Arial',sans-serif;font-size:10.5pt;color:#000;background:#fff;}
@page{size:A4;margin:82px 42px 72px 42px;}
.doc-header{position:fixed;top:0;left:0;right:0;height:76px;background:#fff;display:flex;align-items:flex-start;justify-content:space-between;padding:6px 42px 0 42px;border-bottom:1.5pt solid #1a3a6b;z-index:200;}
.emp-info{text-align:right;font-size:8.5pt;line-height:1.55;color:#222;}
.doc-footer{position:fixed;bottom:0;left:0;right:0;background:#fff;z-index:200;}
.footer-id{display:flex;justify-content:space-between;padding:2px 42px;font-size:8pt;color:#333;border-top:0.5pt solid #aaa;}
.footer-bar{background:#1a3a6b;color:#fff;display:flex;align-items:center;justify-content:space-between;padding:4px 42px;font-size:8.5pt;}
.footer-brand{display:flex;align-items:center;gap:8px;font-weight:600;}
.footer-contacts{display:flex;gap:18px;}
.watermark{position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);width:380px;height:380px;object-fit:contain;opacity:0.055;z-index:0;pointer-events:none;}
.doc-content{position:relative;z-index:1;}
.page-break{break-before:page;}
.cover-body{min-height:calc(297mm - 82px - 72px);display:flex;flex-direction:column;}
.cover-main{flex:1;display:flex;align-items:center;justify-content:center;padding:10mm 0;}
.cover-titles{text-align:center;}
.cover-titles p{font-weight:700;font-style:italic;font-size:13pt;line-height:1.7;text-transform:uppercase;}
.cover-titles p.sub{font-size:11pt;margin-top:4px;}
.cover-titles p.loc{font-size:10.5pt;font-weight:400;font-style:normal;margin-top:10px;}
table.dt{width:100%;border-collapse:collapse;font-size:9.5pt;margin:6px 0;}
table.dt th{background:#d5dff2;border:0.75pt solid #333;padding:4px 6px;text-align:center;font-weight:700;font-size:9pt;}
table.dt td{border:0.75pt solid #333;padding:4px 6px;vertical-align:top;}
table.dt tr.sub td{background:#f0f0f0;font-weight:700;}
table.dt tr.tot td{background:#e8edf7;font-weight:700;font-size:10pt;}
table.capa-info{width:100%;border-collapse:collapse;font-size:9pt;margin-top:4px;}
table.capa-info td{border:0.75pt solid #333;padding:3px 6px;vertical-align:middle;}
table.capa-info .hc{background:#d5dff2;font-weight:700;text-align:center;}
table.capa-info .ptcn{background:#ffe090;font-weight:700;text-align:center;font-size:10pt;}
.logos-row{display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;padding:0 20px;}
.section{margin:14px 0 6px 0;}
.section-title{font-weight:700;font-size:11pt;margin-bottom:6px;text-transform:uppercase;}
.section ul{list-style:none;padding-left:0;}
.section ul li{padding:3px 0 3px 2px;font-size:10.5pt;line-height:1.45;}
.section ul li::before{content:"• ";}
.section p{font-size:10.5pt;line-height:1.45;margin-bottom:4px;}
.addr{font-size:10.5pt;line-height:1.7;margin:10px 0 16px 0;}
.greeting{font-style:italic;font-size:10.5pt;margin-bottom:12px;}
.sig-block{margin-top:40px;text-align:center;}
.sig-line{display:inline-block;width:280px;border-top:1pt solid #000;margin:0 auto;padding-top:4px;}
.ptc-code{font-size:9pt;text-align:right;margin-top:8px;color:#444;}
@media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact;}.doc-header,.doc-footer,.watermark{position:fixed;}}
</style>
</head>
<body>

<div class="doc-header">
  <div>${logoHtml}</div>
  <div class="emp-info">
    ${empEnd}<br>
    ${empCnpj ? 'CNPJ ' + empCnpj + '<br>' : ''}
    ${empIE ? 'Insc Est ' + empIE : ''}
  </div>
</div>

<div class="doc-footer">
  <div class="footer-id">
    <span>PROPOSTA TÉCNICA COMERCIAL &nbsp;—&nbsp; ${ptcNum || proposta.nome || ''}</span>
    <span>${dataHoje}</span>
  </div>
  <div class="footer-bar">
    <div class="footer-brand">
      ${logo ? `<img src="${esc(logo)}" alt="" style="height:22px;filter:brightness(0) invert(1)" />` : ''}
      ${empNome}
    </div>
    <div class="footer-contacts">
      ${empFone  ? `<span>&#9990; ${empFone}</span>`  : ''}
      ${empEmail ? `<span>&#9993; ${empEmail}</span>` : ''}
      ${empSite  ? `<span>&#127760; ${empSite}</span>` : ''}
    </div>
  </div>
</div>

${logo ? `<img class="watermark" src="${esc(logo)}" alt="" />` : ''}

<div class="doc-content">

<!-- PÁGINA 1 — CAPA -->
<div class="cover-body">
  <div class="cover-main">
    <div class="cover-titles">
      <p>${esc(obra?.nome || proposta.nome || 'SERVIÇOS DE ENGENHARIA')}</p>
      ${clienteNome ? `<p class="sub">${clienteNome}</p>` : ''}
      ${clienteEnd  ? `<p class="loc">${clienteEnd}</p>`  : ''}
    </div>
  </div>
  <div>
    <table class="dt">
      <thead>
        <tr>
          <th style="width:6%">Rev.</th>
          <th style="width:13%">Data</th>
          <th>Descrição da Revisão</th>
          <th style="width:16%">Elaboração</th>
          <th style="width:14%">Visita</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td style="text-align:center">00</td>
          <td style="text-align:center">${dataHoje}</td>
          <td>Elaboração inicial</td>
          <td>${elab}</td>
          <td>${visit}</td>
        </tr>
      </tbody>
    </table>

    <div class="logos-row">
      <div style="color:#666;font-size:9pt;font-style:italic">${clienteNome}</div>
      <div>
        ${logo ? `<img src="${esc(logo)}" style="max-height:44px;max-width:130px;object-fit:contain" alt="${empNome}" />` : ''}
        <span style="font-weight:700;font-size:10pt;margin-left:6px;vertical-align:middle">${empNome}</span>
      </div>
    </div>

    <table class="capa-info">
      <tr>
        <td colspan="2" class="hc">RESPONSÁVEL TÉCNICO</td>
        <td class="hc">DATA</td>
        <td colspan="2" class="ptcn">${ptcNum || '—'}</td>
      </tr>
      <tr>
        <td style="width:13%">ELABORAÇÃO:</td>
        <td>${elab}</td>
        <td style="width:12%;text-align:center">${dataHoje}</td>
        <td colspan="2" rowspan="3" style="text-align:center;font-weight:700;font-size:10pt;vertical-align:middle">
          ${esc(obra?.nome || proposta.nome || '')}
        </td>
      </tr>
      <tr>
        <td>VISITA:</td>
        <td>${visit}</td>
        <td></td>
      </tr>
      <tr>
        <td>SOLICITANTE:</td>
        <td>${clienteNome}</td>
        <td style="text-align:center">${dataHoje}</td>
      </tr>
      <tr>
        <td colspan="2">${rev}</td>
        <td colspan="3">No.Fls. 04</td>
      </tr>
    </table>
  </div>
</div>

<!-- PÁGINA 2+ — CORPO -->
<div class="page-break">

  <div class="section">
    <table class="dt">
      <thead>
        <tr>
          <th style="width:18%">Nº da Revisão</th>
          <th style="width:22%">Data de Emissão</th>
          <th>Modificações</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td style="text-align:center">${rev}</td>
          <td style="text-align:center">${dataHoje}</td>
          <td>Elaboração inicial</td>
        </tr>
      </tbody>
    </table>
  </div>

  <p style="text-align:right;font-size:9.5pt;margin:10px 0 16px 0">${dataExtenso}.</p>

  <div class="addr">
    <strong>Para</strong><br>
    <strong>${clienteNome}</strong><br>
    ${clienteEnd  ? clienteEnd + '<br>'          : ''}
    ${clienteCnpj ? 'CNPJ: ' + clienteCnpj + '<br>' : ''}
  </div>

  <p class="greeting">Conforme atendimentos mantidos, apresentamos <em><strong>PROPOSTA TÉCNICA COMERCIAL</strong></em>, para execução dos serviços em referência, como segue:</p>

  <div class="section">
    <p class="section-title">1.0 - OBJETIVO:</p>
    <ul>
      <li>1.1 – ${objetivo}</li>
      <li>1.2 - Esta proposta será pelo regime de empreitada global, incluindo o fornecimento de mão de obra especializada, materiais e ferramentas necessárias à perfeita execução das atividades apontadas.</li>
    </ul>
  </div>

  <div class="section">
    <p class="section-title">2.0 - ESCOPO DOS SERVIÇOS:</p>
    <ul>
      ${prazo  ? `<li>2.1 – ${prazo}</li>` : ''}
      ${naoInc ? `<li>2.2 – <strong>Não incluso no escopo:</strong> ${naoInc}</li>` : ''}
    </ul>
  </div>

  <div class="section page-break">
    <p class="section-title">3.0 – PREÇO UNITÁRIO E TOTAL:</p>
    <table class="dt">
      <thead>
        <tr>
          <th style="width:7%">Item</th>
          <th>Descrição</th>
          <th style="width:9%">Un.</th>
          <th style="width:11%">Qtd.</th>
          <th style="width:13%">Unit.</th>
          <th style="width:13%">Total R$</th>
        </tr>
      </thead>
      <tbody>
        ${linhasMat}
        ${linhasMO}
        ${linhaMob}
        <tr class="sub">
          <td colspan="5" style="text-align:right">Sub-total</td>
          <td style="text-align:right">${fmt(totalBase)}</td>
        </tr>
        ${linhasMargem}
        ${linhasImpostos}
        <tr class="tot">
          <td colspan="5" style="text-align:right">TOTAL</td>
          <td style="text-align:right">${fmt(valorFinal)}</td>
        </tr>
      </tbody>
    </table>
  </div>

  ${obs ? `<div class="section">
    <p class="section-title">4.0 – OBSERVAÇÕES IMPORTANTES:</p>
    <ul><li>4.1 – ${obs}</li></ul>
  </div>` : ''}

  <div class="section">
    <p class="section-title">5.0 - RESPONSABILIDADES DA CONTRATADA:</p>
    <ul>${li('5.', resp5)}</ul>
  </div>

  <div class="section">
    <p class="section-title">6.0 - RESPONSABILIDADE DO CONTRATANTE:</p>
    <ul>${li('6.', resp6)}</ul>
  </div>

  ${notas ? `<div class="section">
    <p class="section-title">7.0 - NOTAS:</p>
    <ul><li>7.1 – ${notas}</li></ul>
  </div>` : ''}

  <div class="section">
    <p class="section-title">8.0 - CONDIÇÕES GERAIS</p>
    <ul>
      <li><strong>8.1 - Condições de pagamento:</strong> ${pagDias} dias da emissão da nota fiscal.</li>
      <li><strong>8.2 - Validade da proposta:</strong> ${valDias} dias da emissão.</li>
      <li><strong>8.3 - Frete:</strong> ${frete}.</li>
      <li><strong>8.4 - Mobilização:</strong> ${mobObs}.</li>
    </ul>
  </div>

  <div class="section">
    <p class="section-title">9.0 - GARANTIA:</p>
    <ul>
      <li>9.1 - Garantimos pelo prazo de 60 (sessenta) meses a durabilidade dos serviços e produtos, conforme especificação acima, desde que os mesmos sejam aplicados rigorosamente dentro da técnica para o fim a que se destinam.</li>
      <li>9.2 - Ressalvamo-nos de responsabilidade na hipótese de ocorrer danos oriundos de imperícias, imprudências, negligências ou abusos no seu manuseio, instalação e operação, bem como na hipótese de ocorrência de casos fortuitos ou imprevisíveis.</li>
      <li>9.3 – Deverá ser solicitada anualmente uma vistoria de avaliação do sistema com emissão de relatório da vistoria.</li>
    </ul>
  </div>

  <div class="section page-break">
    <p class="section-title">10.0 - CONTATO E CORPO TÉCNICO:</p>
    <p style="margin-bottom:10px">${empEnd}<br>Fone: ${empFone}</p>
    <p style="margin-bottom:4px">Atenciosamente e pronto para atendê-los a qualquer momento,</p>
    <div class="sig-block">
      <div class="sig-line">
        ${elab || empNome}<br>
        Engenharia / Comercial
      </div>
    </div>
    <p class="ptc-code">${ptcNum}&nbsp;&nbsp;${rev}</p>
  </div>

</div>
</div>

<script>window.onload = () => window.print();</script>
</body>
</html>`;
}
