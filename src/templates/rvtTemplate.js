/**
 * Template HTML/CSS do RVT — Relatório de Vistoria Técnica Engeplar
 *
 * Layout baseado no documento de referência RVT-0006.04.26 REV00.
 * Cabeçalho em tabela com bordas (padrão diferente da PTC).
 *
 * @param {Object} rvt      Dados do RVT
 * @param {Object} empresa  Dados da empresa
 * @returns {string}        HTML completo pronto para window.open + print
 */
export function gerarHTMLRVT(rvt, empresa) {
  const esc = (s) => s == null ? '' : String(s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#039;');

  const logoUrl    = empresa?.logo || '';
  const numCompleto = esc(rvt.numero_completo || 'RVT – ____.__.__ REV00');
  const empFone    = empresa?.telefone || '(47) 3386-0000';
  const empEmail   = empresa?.email    || 'contato@engeplar.com.br';
  const empSite    = empresa?.site     || 'www.engeplar.com.br';

  const dataFormatada = (() => {
    try {
      const d = rvt.data_emissao ? new Date(rvt.data_emissao + 'T12:00:00') : new Date();
      return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`;
    } catch { return ''; }
  })();

  const totalPaginas = calcularPaginasRVT(rvt);

  // Contatos do cliente (agradecimentos)
  const contatos = Array.isArray(rvt.contatos_cliente) ? rvt.contatos_cliente : [];

  // Fotos
  const fotos = Array.isArray(rvt.fotos) ? rvt.fotos : [];
  const gruposFotos = agruparFotos(fotos);

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<title>RVT – ${esc(rvt.numero_completo || '')}</title>
<style>
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

body {
  font-family: 'Calibri', 'Arial', sans-serif;
  font-size: 10.5pt;
  color: #000;
  background: #fff;
}

@page {
  size: A4;
  margin: 90px 40px 60px 40px;
}

/* ── Header — tabela com bordas (diferente da PTC) ── */
.doc-header {
  position: fixed;
  top: 0; left: 0; right: 0;
  background: #fff;
  z-index: 200;
  padding: 4px 40px 0 40px;
}
.header-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 9.5pt;
}
.header-table td {
  border: 0.75pt solid #333;
  padding: 3px 6px;
  vertical-align: middle;
}
.header-table .logo-cell {
  width: 18%;
  text-align: center;
  padding: 4px;
  vertical-align: middle;
  row-span: 2;
}
.header-table .logo-cell img {
  max-height: 50px;
  max-width: 110px;
  object-fit: contain;
}
.header-table .title-cell {
  text-align: center;
  font-weight: 700;
  font-size: 11pt;
  text-decoration: underline;
}
.header-table .num-cell {
  text-align: right;
  font-weight: 700;
  width: 28%;
}
.header-table .sub-cell {
  text-align: center;
  font-size: 9pt;
}
.header-table .cliente-cell {
  font-weight: 700;
  font-size: 9pt;
}
.header-table .descricao-cell {
  font-size: 9pt;
}
.header-table .data-cell {
  text-align: right;
  font-size: 9pt;
}

/* ── Footer ── */
.doc-footer {
  position: fixed;
  bottom: 0; left: 0; right: 0;
  background: #fff;
  z-index: 200;
  padding: 0 40px;
}
.footer-id-line {
  display: flex;
  justify-content: space-between;
  padding: 2px 0;
  font-size: 8pt;
  color: #444;
  border-top: 0.5pt solid #888;
}
.footer-bar {
  background: #1a3a6b;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 4px 6px;
  font-size: 8.5pt;
}
.footer-bar .footer-brand {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
}
.footer-bar .footer-brand img {
  height: 20px;
  filter: brightness(0) invert(1);
}
.footer-bar .footer-contacts {
  display: flex;
  gap: 16px;
}

/* ── Watermark ── */
.watermark {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 360px;
  height: 360px;
  object-fit: contain;
  opacity: 0.05;
  z-index: 0;
  pointer-events: none;
}

/* ── Conteúdo ── */
.doc-content { position: relative; z-index: 1; }

.page-break { break-before: page; }

/* ── Capa do RVT ── */
.cover-body {
  min-height: calc(297mm - 90px - 60px);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
}
.cover-body p.doc-type {
  font-weight: 700;
  font-style: italic;
  font-size: 14pt;
  margin-bottom: 6px;
  text-transform: uppercase;
}
.cover-body p.doc-subtitle {
  font-weight: 700;
  font-style: italic;
  font-size: 12pt;
  margin-bottom: 20px;
  text-transform: uppercase;
}
.cover-body p.client-name {
  font-weight: 700;
  font-size: 13pt;
  margin-bottom: 4px;
}
.cover-body p.unit-name {
  font-size: 11pt;
  margin-bottom: 2px;
}
.cover-body p.assunto {
  font-weight: 700;
  font-style: italic;
  font-size: 11pt;
  margin-top: 16px;
  text-transform: uppercase;
}

/* ── Seções ── */
.section { margin: 14px 0 6px 0; }
.section-title {
  font-weight: 700;
  font-size: 11pt;
  margin-bottom: 8px;
  text-transform: uppercase;
}
.section p {
  font-size: 10.5pt;
  line-height: 1.5;
  margin-bottom: 6px;
}
.section ul { list-style: none; padding-left: 0; }
.section ul li {
  padding: 2px 0;
  font-size: 10.5pt;
}
.section ul li::before { content: "• "; }

/* ── Tabelas ── */
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
}
table.doc-table td {
  border: 0.75pt solid #333;
  padding: 4px 6px;
  vertical-align: top;
}

/* ── Grade de fotos ── */
.fotos-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin: 10px 0;
}
.foto-item {
  width: calc(50% - 5px);
  break-inside: avoid;
}
.foto-item img {
  width: 100%;
  max-height: 200px;
  object-fit: cover;
  border: 0.5pt solid #ccc;
}
.foto-item .foto-caption {
  font-size: 8.5pt;
  color: #555;
  text-align: center;
  margin-top: 3px;
}

/* ── Assinatura ── */
.signature-block {
  margin-top: 40px;
  text-align: center;
}
.sig-line {
  display: inline-block;
  width: 260px;
  border-top: 1pt solid #000;
  padding-top: 4px;
  font-size: 10pt;
  line-height: 1.5;
}

@media print {
  body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
}
</style>
</head>
<body>

<!-- HEADER TABELA (repete em todas as páginas) -->
<div class="doc-header">
  <table class="header-table">
    <tr>
      <td class="logo-cell" rowspan="2">
        ${logoUrl
          ? `<img src="${esc(logoUrl)}" alt="Engeplar" />`
          : `<strong style="font-size:11pt;color:#1a3a6b">ENGEPLAR</strong>`
        }
      </td>
      <td class="title-cell">RELATÓRIO DE VISTORIA TÉCNICA</td>
      <td class="num-cell">Nº<br>${numCompleto}</td>
    </tr>
    <tr>
      <td class="sub-cell">${esc(rvt.subtipo_relatorio || 'ESTRUTURAL')}</td>
      <td class="data-cell">&nbsp;</td>
    </tr>
    <tr>
      <td class="cliente-cell">${esc(rvt.cliente_nome || '')}</td>
      <td class="descricao-cell">${esc(rvt.descricao_assunto || '')}</td>
      <td class="data-cell">Data: ${dataFormatada}</td>
    </tr>
    <tr>
      <td class="cliente-cell">${rvt.unidade ? 'UNIDADE: ' + esc(rvt.unidade) : '&nbsp;'}</td>
      <td class="descricao-cell">&nbsp;</td>
      <td class="data-cell">Página 1 de ${totalPaginas}</td>
    </tr>
  </table>
</div>

<!-- FOOTER -->
<div class="doc-footer">
  <div class="footer-id-line">
    <span>${numCompleto}</span>
  </div>
  <div class="footer-bar">
    <div class="footer-brand">
      ${logoUrl ? `<img src="${esc(logoUrl)}" alt="" />` : ''}
      <span>${esc(rvt.tipo_relatorio || 'Relatório de Vistoria Técnica')}</span>
    </div>
    <div class="footer-contacts">
      <span>&#9990; ${esc(empFone)}</span>
      <span>&#9993; ${esc(empEmail)}</span>
      <span>&#127760; ${esc(empSite)}</span>
    </div>
  </div>
</div>

${logoUrl ? `<img class="watermark" src="${esc(logoUrl)}" alt="" />` : ''}

<div class="doc-content">

<!-- ── CAPA ── -->
<div class="cover-body">
  <p class="doc-type">${esc(rvt.tipo_relatorio || 'RELATÓRIO DE VISTÓRIA TÉCNICA.')}</p>
  <p class="doc-subtitle">${esc(rvt.subtipo_relatorio || 'ESTRUTURAL')}</p>
  <p class="client-name">${esc(rvt.cliente_nome || '')}</p>
  ${rvt.unidade ? `<p class="unit-name">UNIDADE: ${esc(rvt.unidade)}</p>` : ''}
  ${rvt.descricao_assunto ? `<p class="assunto">${esc(rvt.descricao_assunto)}</p>` : ''}
</div>

<!-- ── AGRADECIMENTOS ── -->
<div class="page-break">
  <div class="section">
    <p class="section-title">AGRADECIMENTOS</p>
    ${contatos.length > 0
      ? contatos.map(c => `
          <p style="margin-bottom:2px">
            <strong>${esc(c.nome || '')}</strong>
            ${c.cargo ? ` — ${esc(c.cargo)}` : ''}<br>
            ${c.email ? `<a href="mailto:${esc(c.email)}">${esc(c.email)}</a><br>` : ''}
            ${c.telefone ? esc(c.telefone) : ''}
          </p>`).join('<br>')
      : `<p>${esc(rvt.cliente_nome || '')}</p>`
    }
  </div>
</div>

<!-- ── INTRODUÇÃO ── -->
${rvt.texto_introducao ? `
<div class="section" style="margin-top:16px">
  <p class="section-title">INTRODUÇÃO</p>
  <p>${esc(rvt.texto_introducao)}</p>
</div>` : ''}

<!-- ── FOTOS ── -->
${fotos.length > 0
  ? Object.entries(gruposFotos).map(([etapa, fts]) => `
      <div class="section">
        ${etapa !== '_sem_etapa' ? `<p class="section-title">${esc(etapa)}</p>` : ''}
        <div class="fotos-grid">
          ${fts.map(f => `
            <div class="foto-item">
              <img src="${esc(f.url)}" alt="${esc(f.descricao || '')}" />
              ${f.descricao ? `<p class="foto-caption">${esc(f.descricao)}</p>` : ''}
            </div>`).join('')}
        </div>
      </div>`).join('')
  : ''
}

<!-- ── PATOLOGIA / CONCLUSÃO ── -->
${rvt.texto_patologia ? `
<div class="section">
  <p class="section-title">PATOLOGIA IDENTIFICADA</p>
  <p>${esc(rvt.texto_patologia)}</p>
</div>` : ''}

<!-- ── CONTATOS E CORPO TÉCNICO ── -->
<div class="section">
  <p class="section-title">CONTATOS E CORPO TÉCNICO:</p>
  <p>A Engeplar conta com uma equipe de técnicos, que trabalham em conjunto para complementar as especialidades de projeto, consultoria, execução e acompanhamento dos serviços ofertados, e pode ser contatada através dos seguintes meios:</p>

  <p style="margin-top:10px"><strong>Endereços e Telefones</strong><br>
  Rua Amazonas, 475<br>
  Bairro Cruzeiro - CEP 89121-000<br>
  Rio dos Cedros - SC<br>
  Fone: ${esc(empFone)}</p>

  <table style="width:100%;border:none;margin-top:10px">
    <tr>
      <td style="border:none;width:50%;font-size:10.5pt">
        <strong>Celular</strong> – John Clovis Peiker<br>47 9 8815-3943
      </td>
      <td style="border:none;width:50%;font-size:10.5pt">
        <strong>Endereço Eletrônico</strong><br>
        <a href="mailto:john@engeplar.com.br">john@engeplar.com.br</a>
      </td>
    </tr>
    <tr>
      <td style="border:none;font-size:10.5pt;padding-top:6px">
        <strong>Celular</strong> – Edson James Peiker<br>47 9 8829-3476
      </td>
      <td style="border:none;font-size:10.5pt;padding-top:6px">
        <strong>Endereço Eletrônico</strong><br>
        <a href="mailto:james@engeplar.com.br">james@engeplar.com.br</a>
      </td>
    </tr>
  </table>

  <p style="margin-top:12px">Atenciosamente e pronto para atendê-los a qualquer momento.</p>

  <div class="signature-block">
    <div class="sig-line">
      ${esc(rvt.responsavel_nome || 'John C. Peiker')}<br>
      ${esc(rvt.responsavel_cargo || 'Diretor Técnico')}
    </div>
  </div>
</div>

</div><!-- doc-content -->

<script>window.onload = () => window.print();</script>
</body>
</html>`;
}

function calcularPaginasRVT(rvt) {
  let p = 2; // capa + agradecimentos
  if (rvt.texto_introducao) p++;
  const fotos = Array.isArray(rvt.fotos) ? rvt.fotos : [];
  if (fotos.length > 0) p += Math.ceil(fotos.length / 4);
  if (rvt.texto_patologia) p++;
  p++; // contatos
  return String(p).padStart(2, '0');
}

function agruparFotos(fotos) {
  return fotos.reduce((acc, f) => {
    const key = f.etapa || '_sem_etapa';
    if (!acc[key]) acc[key] = [];
    acc[key].push(f);
    return acc;
  }, {});
}
