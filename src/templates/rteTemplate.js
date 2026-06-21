/**
 * Template HTML/CSS do RTE — Relatório Técnico de Execução Engeplar
 *
 * Estrutura baseada nos RTEs analisados: RTE-0019.12.25 (Veolia),
 * RTE-0016.10.25 (BRF Fortaleza), RTE-0015.10.25 (BRF Tatuí),
 * RTE-0027.05.24 (Toyo Setal).
 *
 * Seções: 1-CAPA 2-AGRADECIMENTOS 3-INTRODUÇÃO 4-DESCRIÇÃO 5-ESTRUTURA
 *          6-PROCEDIMENTO 7-ENSAIOS 8-GARANTIA 9-IMAGENS 10-PEDIDO
 *          11-PROPOSTA 12-CONTATOS
 *
 * @param {Object} obra       Dados da obra (com campos RTE)
 * @param {Object} empresa    Dados da empresa
 * @param {Array}  cronograma Etapas do cronograma
 * @param {Object} proposta   Proposta principal vinculada à obra
 * @param {Array}  tecnicos   Funcionários alocados na obra
 * @returns {string}          HTML completo pronto para window.open + print
 */
export function gerarHTMLRTE(obra, empresa, cronograma = [], proposta = null, tecnicos = []) {
  const esc = (s) => s == null ? '' : String(s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#039;');

  const fmt = (d) => {
    if (!d) return '___/___/______';
    try {
      const dt = new Date(d + 'T12:00:00');
      return `${String(dt.getDate()).padStart(2,'0')}/${String(dt.getMonth()+1).padStart(2,'0')}/${dt.getFullYear()}`;
    } catch { return String(d); }
  };

  const hoje = fmt(new Date().toISOString().split('T')[0]);

  // Datas período de trabalho via cronograma
  const datasEtapas = cronograma.filter(e => e.dataInicio).map(e => e.dataInicio).sort();
  const datasEtapasFim = cronograma.filter(e => e.dataFim).map(e => e.dataFim).sort();
  const periodoInicio = datasEtapas.length > 0 ? fmt(datasEtapas[0]) : '___/___/______';
  const periodoFim = datasEtapasFim.length > 0 ? fmt(datasEtapasFim[datasEtapasFim.length - 1]) : '___/___/______';

  const dim = obra.dimensoes || {};
  const nomeEmpresa = esc(empresa?.nomeFantasia || empresa?.razaoSocial || 'Engeplar');
  const rteNum = esc(obra.rteNumero || 'RTE – ____.__.__ REV00');
  const ptcRef = esc(proposta?.ptc_numero || proposta?.nome || '___________________');

  const d = obra.dadosRte || {};

  // Tipo de serviço → texto descritivo
  const TIPOS_SERVICO = {
    RECUPERACAO_LINER: 'Recuperação de Liner Interno/Externo (PRFV)',
    REVESTIMENTO_PINTURA: 'Tratamento e Pintura Anticorrosiva',
    REVESTIMENTO_IMPERMEABILIZANTE: 'Revestimento Impermeabilizante',
    INJECAO_QUIMICA: 'Injeção Química em Trincas/Fissuras',
    SOLDA_PLASTICA: 'Solda Plástica por Termofusão (PP/PRFV)',
    CONSTRUCAO: 'Construção de Estrutura Nova',
  };
  const tipoLabel = esc(TIPOS_SERVICO[obra.tipoServico] || obra.tipoServico || '');

  // Bloco técnico específico por tipo (seção 4 do PDF)
  const blocoTecnico = (() => {
    const row = (label, val) => val ? `<tr><td style="font-weight:700;color:#374151;padding:4pt 8pt;border-bottom:0.5pt solid #e5e7eb;white-space:nowrap;font-size:10pt;">${esc(label)}</td><td style="padding:4pt 8pt;border-bottom:0.5pt solid #e5e7eb;font-size:10pt;">${esc(val)}</td></tr>` : '';
    const tbl = (rows) => `<table style="width:100%;border-collapse:collapse;margin-top:6pt;">${rows}</table>`;

    switch (obra.tipoServico) {
      case 'REVESTIMENTO_PINTURA': {
        const camadas = [1, 2, 3].filter(n => d[`camada_${n}_material`]).map(n => `
          <tr>
            <td style="padding:4pt 8pt;border-bottom:0.5pt solid #e5e7eb;font-size:10pt;font-weight:600;">Camada ${n}</td>
            <td style="padding:4pt 8pt;border-bottom:0.5pt solid #e5e7eb;font-size:10pt;">${esc(d[`camada_${n}_material`] || '')}</td>
            <td style="padding:4pt 8pt;border-bottom:0.5pt solid #e5e7eb;font-size:10pt;">${esc(d[`camada_${n}_cor`] || '—')}</td>
            <td style="padding:4pt 8pt;border-bottom:0.5pt solid #e5e7eb;font-size:10pt;text-align:right;">${d[`camada_${n}_esp_umida`] ? d[`camada_${n}_esp_umida`] + ' µm úmida' : '—'}</td>
            <td style="padding:4pt 8pt;border-bottom:0.5pt solid #e5e7eb;font-size:10pt;text-align:right;">${d[`camada_${n}_esp_seca`] ? d[`camada_${n}_esp_seca`] + ' µm seca' : '—'}</td>
          </tr>`).join('');
        return `
          ${tbl(row('Produto / Sistema', d.produto_nome) + row('Fabricante', d.fabricante) + row('Preparo de Superfície', d.norma_jato) + row('Sistema de Aplicação', d.sistema_aplicacao))}
          ${camadas ? `
          <p style="font-weight:700;font-size:10pt;margin:10pt 0 4pt;color:#1E3A8A;">Esquema de Pintura</p>
          <table style="width:100%;border-collapse:collapse;">
            <thead><tr style="background:#1E3A8A;color:#fff;">
              <th style="padding:4pt 8pt;font-size:9pt;text-align:left;">Camada</th>
              <th style="padding:4pt 8pt;font-size:9pt;text-align:left;">Material</th>
              <th style="padding:4pt 8pt;font-size:9pt;text-align:left;">Cor</th>
              <th style="padding:4pt 8pt;font-size:9pt;">Esp. Úmida</th>
              <th style="padding:4pt 8pt;font-size:9pt;">Esp. Seca</th>
            </tr></thead>
            <tbody>${camadas}</tbody>
          </table>
          ${d.espessura_total ? `<p style="font-size:10pt;font-weight:700;margin-top:6pt;">Espessura Total Seca: <span style="color:#1E3A8A;">${esc(d.espessura_total)} µm</span></p>` : ''}` : ''}`;
      }
      case 'REVESTIMENTO_IMPERMEABILIZANTE': {
        return tbl(
          row('Produto / Sistema', d.produto_nome) + row('Fabricante', d.fabricante) +
          row('Sistema de Aplicação', d.sistema_aplicacao) +
          row('Espessura Interna (µm)', d.espessura_interna) +
          row('Espessura Externa (µm)', d.espessura_externa)
        );
      }
      case 'RECUPERACAO_LINER': {
        const areas = [['interno','Liner interno'],['externo','Liner externo'],['estrutural','Reforço estrutural'],['fundo','Fundo do equipamento']].filter(([k]) => d[k]).map(([,l]) => l).join(', ');
        return tbl(
          row('Tipo de Manta', d.tipo_manta) + row('Resina', d.resina) +
          row('Tratamento Químico', d.tratamento_quimico) + row('Acabamento', d.acabamento) +
          row('Áreas Executadas', areas) + row('Área Total', d.area_total_m2 ? d.area_total_m2 + ' m²' : '')
        );
      }
      case 'INJECAO_QUIMICA':
        return tbl(
          row('Produto Injetado', d.produto_injetado) +
          row('Total de Pontos', d.total_pontos) +
          row('Área Recuperada', d.area_recuperada_m2 ? d.area_recuperada_m2 + ' m²' : '') +
          row('Áreas Recuperadas', d.descricao_areas)
        );
      case 'SOLDA_PLASTICA':
        return tbl(
          row('Material Base', d.material_base) + row('Tipo de Solda', d.tipo_solda) +
          row('Área Reparada', d.area_reparada_m2 ? d.area_reparada_m2 + ' m²' : '') +
          row('Descrição', d.descricao)
        );
      case 'CONSTRUCAO':
        return tbl(row('Material', d.material) + row('Norma', d.norma) + row('Estrutura', d.descricao_estrutura));
      default:
        return '';
    }
  })();

  // Ensaio específico por tipo com dados reais
  const blocoEnsaio = (() => {
    switch (obra.tipoServico) {
      case 'REVESTIMENTO_PINTURA': {
        const medidas = [1,2,3].filter(n => d[`camada_${n}_esp_seca`]).map(n =>
          `<tr><td style="padding:4pt 8pt;border-bottom:0.5pt solid #e5e7eb;font-size:10pt;">Camada ${n} — ${esc(d[`camada_${n}_material`] || '')}</td><td style="padding:4pt 8pt;border-bottom:0.5pt solid #e5e7eb;font-size:10pt;text-align:right;font-weight:700;">${esc(d[`camada_${n}_esp_seca`])} µm</td></tr>`).join('');
        return `<p style="margin-bottom:8pt;font-size:10.5pt;">Leitura de espessura de película seca por ultrassom — conforme ficha técnica do fabricante.</p>
          ${medidas ? `<table style="width:100%;border-collapse:collapse;max-width:360pt;">
            <thead><tr style="background:#1E3A8A;color:#fff;"><th style="padding:5pt 8pt;font-size:9pt;text-align:left;">Camada</th><th style="padding:5pt 8pt;font-size:9pt;text-align:right;">Espessura Seca</th></tr></thead>
            <tbody>${medidas}</tbody>
          </table>
          ${d.espessura_total ? `<p style="font-size:10pt;font-weight:700;margin-top:8pt;">Total: ${esc(d.espessura_total)} µm</p>` : ''}` : ''}`;
      }
      case 'REVESTIMENTO_IMPERMEABILIZANTE':
        return `<p style="margin-bottom:8pt;font-size:10.5pt;">Leitura de espessura da camada aplicada interna e externamente.</p>
          <table style="width:100%;border-collapse:collapse;max-width:300pt;">
            <thead><tr style="background:#1E3A8A;color:#fff;"><th style="padding:5pt 8pt;font-size:9pt;text-align:left;">Posição</th><th style="padding:5pt 8pt;font-size:9pt;text-align:right;">Espessura (µm)</th></tr></thead>
            <tbody>
              ${d.espessura_interna ? `<tr><td style="padding:4pt 8pt;border-bottom:0.5pt solid #e5e7eb;font-size:10pt;">Interna</td><td style="padding:4pt 8pt;border-bottom:0.5pt solid #e5e7eb;font-size:10pt;text-align:right;font-weight:700;">${esc(d.espessura_interna)}</td></tr>` : ''}
              ${d.espessura_externa ? `<tr><td style="padding:4pt 8pt;font-size:10pt;">Externa</td><td style="padding:4pt 8pt;font-size:10pt;text-align:right;font-weight:700;">${esc(d.espessura_externa)}</td></tr>` : ''}
            </tbody>
          </table>`;
      case 'RECUPERACAO_LINER':
        return `<p style="font-size:10.5pt;line-height:1.6;">Ensaio de carregamento hidrostático conforme norma vigente. ${d.area_total_m2 ? `Área total executada: <strong>${esc(d.area_total_m2)} m²</strong>.` : ''}</p>`;
      case 'INJECAO_QUIMICA':
        return `<p style="font-size:10.5pt;line-height:1.6;">Inspeção visual das áreas recuperadas.
          ${d.total_pontos ? `Total de pontos de injeção executados: <strong>${esc(String(d.total_pontos))}</strong>.` : ''}
          ${d.area_recuperada_m2 ? ` Área recuperada: <strong>${esc(d.area_recuperada_m2)} m²</strong>.` : ''}
          ${d.descricao_areas ? `<br/><br/>${esc(d.descricao_areas)}` : ''}</p>`;
      case 'SOLDA_PLASTICA':
        return `<p style="font-size:10.5pt;line-height:1.6;">Ensaio visual e dimensional das soldas realizadas.
          ${d.area_reparada_m2 ? ` Área reparada: <strong>${esc(d.area_reparada_m2)} m²</strong>.` : ''}</p>`;
      case 'CONSTRUCAO':
        return `<p style="font-size:10.5pt;">Verificação dimensional e de prumo conforme projeto e norma ${d.norma ? esc(d.norma) : 'aplicável'}.</p>`;
      default:
        return `<p style="font-size:10.5pt;">Ensaios e testes realizados conforme especificação técnica.</p>`;
    }
  })();

  // Técnico responsável
  const tecnicoPrincipal = tecnicos[0] || null;
  const tecnicoNome = esc(tecnicoPrincipal?.nome || '');
  const tecnicoCargo = esc(tecnicoPrincipal?.funcao || '');

  const fotoPlaceholder = (secao, n = 2) => {
    let boxes = '';
    for (let i = 0; i < n; i++) {
      boxes += `
        <div class="foto-box">
          <div class="foto-placeholder">
            <span>📷 Foto ${secao} ${i + 1}</span>
            <p style="font-size:9pt;color:#999;margin-top:4px;">(inserir imagem)</p>
          </div>
          <p class="foto-legenda">Legenda da foto ${i + 1}</p>
        </div>`;
    }
    return `<div class="fotos-grid">${boxes}</div>`;
  };

  const secao = (num, titulo, conteudo) => `
    <div class="secao page-break-inside-avoid">
      <h2 class="secao-titulo"><span class="secao-num">${num}.</span> ${esc(titulo)}</h2>
      ${conteudo}
    </div>`;

  const campo = (label, valor) => `
    <div class="campo-linha">
      <span class="campo-label">${esc(label)}:</span>
      <span class="campo-valor">${valor}</span>
    </div>`;


  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<title>${rteNum}</title>
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
  margin: 85px 40px 60px 40px;
}

/* ── Cabeçalho fixo ── */
.doc-header {
  position: fixed;
  top: 0; left: 0; right: 0;
  background: #fff;
  padding: 4px 40px 0 40px;
  z-index: 200;
}
.header-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 9pt;
}
.header-table td {
  border: 0.75pt solid #1a3a6b;
  padding: 3px 6px;
  vertical-align: middle;
}
.header-table .logo-cell {
  width: 18%;
  text-align: center;
  padding: 4px;
  background: #1a3a6b !important;
  color: #fff;
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
}
.header-table .logo-cell img {
  max-height: 42px;
  max-width: 100%;
  object-fit: contain;
  filter: brightness(0) invert(1);
}
.header-table .logo-cell .emp-nome {
  font-size: 10pt;
  font-weight: 700;
  color: #fff;
}
.header-table .doc-title-cell {
  width: 52%;
  text-align: center;
  font-size: 9.5pt;
  font-weight: 700;
  color: #1a3a6b;
  letter-spacing: 0.02em;
  background: #f0f4ff;
}
.header-table .doc-meta td {
  font-size: 8.5pt;
  padding: 2px 6px;
}

/* ── Watermark removido — não usar ── */

/* ── Rodapé fixo ── */
.doc-footer {
  position: fixed;
  bottom: 0; left: 0; right: 0;
  z-index: 200;
  padding: 0 40px;
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
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

/* ── Conteúdo ── */
.doc-content { position: relative; z-index: 1; margin-top: 14px; }

/* ── Capa ── */
.capa {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-height: 240mm;
  text-align: center;
  flex: 1;
}
.capa-banner {
  width: 100%;
  background: #1a3a6b;
  min-height: 120px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #fff;
  margin-bottom: 28pt;
  align-self: stretch;
}
.capa-banner img {
  max-height: 55px;
  max-width: 200px;
  object-fit: contain;
  filter: brightness(0) invert(1);
  margin-bottom: 8px;
}
.capa-banner-nome {
  font-size: 13pt;
  font-weight: 700;
  color: #fff;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}
.capa-logo img {
  max-height: 70px;
  max-width: 220px;
  object-fit: contain;
  margin-bottom: 20pt;
}
.capa-logo .emp-nome-capa {
  font-size: 20pt;
  font-weight: 900;
  color: #1E3A8A;
  letter-spacing: 0.05em;
  margin-bottom: 20pt;
}
.capa-titulo {
  font-size: 18pt;
  font-weight: 900;
  color: #1E3A8A;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  border-top: 3pt solid #1E3A8A;
  border-bottom: 3pt solid #1E3A8A;
  padding: 10pt 0;
  width: 80%;
  margin: 0 auto 16pt;
}
.capa-subtitulo {
  font-size: 12pt;
  font-weight: 600;
  color: #374151;
  margin-bottom: 28pt;
}
.capa-meta table {
  margin: 0 auto;
  border-collapse: collapse;
  font-size: 10pt;
}
.capa-meta td {
  padding: 4pt 12pt;
  border: 0.5pt solid #999;
  text-align: left;
}
.capa-meta td:first-child {
  font-weight: 700;
  color: #fff;
  background: #1a3a6b;
}

/* ── Seções ── */
.secao {
  margin-bottom: 18pt;
}
.secao-titulo {
  font-size: 11.5pt;
  font-weight: 700;
  color: #1a3a6b;
  border-bottom: 2pt solid #1a3a6b;
  padding-bottom: 3pt;
  margin-bottom: 10pt;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}
.secao-num {
  display: inline-block;
  background: #1E3A8A;
  color: #fff;
  padding: 0 5pt;
  border-radius: 2pt;
  margin-right: 6pt;
  font-size: 10pt;
}

/* ── Campos ── */
.campo-linha {
  display: flex;
  gap: 8pt;
  margin-bottom: 5pt;
  font-size: 10pt;
}
.campo-label {
  font-weight: 700;
  color: #374151;
  white-space: nowrap;
  min-width: 150pt;
}
.campo-valor {
  color: #111;
  flex: 1;
  border-bottom: 0.5pt dotted #aaa;
}

/* ── Equipamento ── */
.equip-box {
  border: 1pt solid #1E3A8A;
  border-radius: 4pt;
  padding: 10pt 14pt;
  margin-bottom: 12pt;
  background: #f8faff;
}
.equip-box h3 {
  font-size: 10pt;
  font-weight: 700;
  color: #1E3A8A;
  text-transform: uppercase;
  margin-bottom: 6pt;
}
.equip-dim {
  display: flex;
  gap: 24pt;
  font-size: 10pt;
  margin-top: 6pt;
}
.equip-dim span { font-weight: 700; }

/* ── Fotos ── */
.fotos-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12pt;
  margin: 8pt 0;
}
.foto-box { text-align: center; }
.foto-placeholder {
  width: 100%;
  height: 120pt;
  background: #f3f4f6;
  border: 1pt dashed #aaa;
  border-radius: 4pt;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  font-size: 11pt;
  color: #9ca3af;
}
.foto-legenda {
  font-size: 8.5pt;
  font-style: italic;
  color: #555;
  margin-top: 4pt;
  text-align: center;
}

/* ── Garantia ── */
.garantia-box {
  background: #fff8f0;
  border-left: 3pt solid #f59e0b;
  padding: 10pt 14pt;
  margin-bottom: 10pt;
  font-size: 10.5pt;
  line-height: 1.6;
}

/* ── Tabela de contatos ── */
.tabela-contatos {
  width: 100%;
  border-collapse: collapse;
  font-size: 10pt;
  margin-top: 8pt;
}
.tabela-contatos th {
  background: #1E3A8A;
  color: #fff;
  padding: 5pt 8pt;
  text-align: left;
  font-size: 9pt;
}
.tabela-contatos td {
  padding: 5pt 8pt;
  border-bottom: 0.5pt solid #e5e7eb;
}

/* ── Referência Proposta / Pedido ── */
.ref-box {
  border: 1pt solid #e5e7eb;
  border-radius: 4pt;
  padding: 12pt 16pt;
  background: #fafafa;
  font-size: 10pt;
  line-height: 1.8;
}

/* ── Misc ── */
.texto-justificado {
  text-align: justify;
  line-height: 1.6;
  font-size: 10.5pt;
}
.page-break { page-break-after: always; }
.page-break-inside-avoid { page-break-inside: avoid; }

@media print {
  .doc-header { display: block !important; }
  body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
}
</style>
</head>
<body>

<!-- Cabeçalho fixo -->
<div class="doc-header">
  <table class="header-table">
    <tr>
      <td rowspan="2" style="background-color:#1a3a6b !important; -webkit-print-color-adjust:exact; print-color-adjust:exact; color:#ffffff; width:110px; text-align:center; padding:6px; vertical-align:middle;">
        ${empresa?.logo
          ? `<img src="${esc(empresa.logo)}" alt="Logo" style="max-height:42px;max-width:100%;object-fit:contain;filter:brightness(0) invert(1);" />`
          : `<span style="color:white;font-weight:bold;font-size:9pt;text-align:center;display:block;">ENGEPLAR</span>`}
      </td>
      <td class="doc-title-cell" rowspan="2">
        RELATÓRIO TÉCNICO DE EXECUÇÃO
      </td>
      <td style="font-size:8.5pt;font-weight:700;">Nº ${rteNum}</td>
    </tr>
    <tr>
      <td style="font-size:8.5pt;">Data: ${hoje}</td>
    </tr>
  </table>
</div>

<!-- Rodapé fixo (repete em todas as páginas) -->
<div class="doc-footer">
  <div class="footer-id-line">
    <span>${rteNum}</span>
    <span>${nomeEmpresa}</span>
  </div>
  <div class="footer-bar">
    <div class="footer-brand">
      ${empresa?.logo ? `<img src="${esc(empresa.logo)}" alt="" />` : ''}
      <span>${nomeEmpresa}</span>
    </div>
    <div class="footer-contacts">
      <span>&#9990; ${esc(empresa?.telefone || '(47) 3386-0000')}</span>
      <span>&#9993; ${esc(empresa?.email || 'contato@engeplar.com.br')}</span>
      ${empresa?.site ? `<span>&#127760; ${esc(empresa.site)}</span>` : ''}
    </div>
  </div>
</div>

<div class="doc-content">

  <!-- PÁGINA 1 — CAPA -->
  <table style="width:100%; min-height:calc(297mm - 85px - 60px); border-collapse:collapse; page-break-after:always; table-layout:fixed;">
    <tr>
      <td style="width:12mm; background-color:#1a3a6b; -webkit-print-color-adjust:exact; print-color-adjust:exact; vertical-align:top;"></td>
      <td style="vertical-align:top; padding:6mm 14mm 14mm 10mm;">
        <div class="capa">
          <div class="capa-banner">
            ${empresa?.logo ? `<img src="${esc(empresa.logo)}" alt="Logo" />` : ''}
            <div class="capa-banner-nome">${nomeEmpresa}</div>
          </div>
          <div class="capa-titulo">Relatório Técnico de Execução</div>
          <div class="capa-subtitulo">${tipoLabel || esc(obra.nome || '')}</div>
          <div class="capa-meta">
            <table>
              <tr><td>Nº RTE</td><td>${rteNum}</td></tr>
              <tr><td>Contratante</td><td>${esc(obra.nome)}</td></tr>
              <tr><td>Local</td><td>${esc(proposta?.clienteEndereco || obra.endereco || '')}</td></tr>
              <tr><td>PTC Referência</td><td>${ptcRef}</td></tr>
              <tr><td>Período</td><td>${periodoInicio} a ${periodoFim}</td></tr>
              <tr><td>Data de Emissão</td><td>${hoje}</td></tr>
            </table>
          </div>
        </div>
      </td>
    </tr>
  </table>

  <!-- PÁGINA 2 — AGRADECIMENTOS + INTRODUÇÃO -->
  <table style="width:100%; min-height:calc(297mm - 85px - 60px); border-collapse:collapse; page-break-after:always; table-layout:fixed;">
    <tr>
      <td style="width:12mm; background-color:#1a3a6b; -webkit-print-color-adjust:exact; print-color-adjust:exact; vertical-align:top;"></td>
      <td style="vertical-align:top; padding:6mm 14mm 14mm 10mm;">
        ${secao(2, 'Agradecimentos', `
          <p class="texto-justificado" style="margin-bottom:10pt;">
            A <strong>${nomeEmpresa}</strong> agradece a confiança depositada e a oportunidade de
            realizar os serviços descritos neste relatório. Expressamos nossa gratidão aos responsáveis
            do contratante pelo acompanhamento e suporte durante toda a execução.
          </p>
          ${obra.responsavelCliente ? `
          <table class="tabela-contatos" style="max-width:420pt;">
            <thead><tr><th>Responsável Contratante</th><th>Empresa / Unidade</th></tr></thead>
            <tbody>
              <tr><td>${esc(obra.responsavelCliente)}</td><td>${esc(obra.nome || '')}</td></tr>
            </tbody>
          </table>` : ''}`)}
        ${secao(3, 'Introdução', `
          <p class="texto-justificado" style="margin-bottom:12pt;">
            O presente documento tem por finalidade apresentar os dados capturados na execução dos
            trabalhos de <strong>${esc(obra.descricaoTecnica || tipoLabel || obra.nome || '')}</strong>.
          </p>
          <p class="texto-justificado" style="margin-bottom:12pt;">
            A execução do trabalho apontado ocorreu em <strong>${esc(proposta?.clienteEndereco || obra.endereco || '')}</strong>.
            ${obra.responsavelCliente ? `As atividades foram acompanhadas pelo(a) Sr(a). <strong>${esc(obra.responsavelCliente)}</strong>.` : ''}
          </p>
          <div style="margin-top:8pt;">
            ${campo('Proposta Técnica Comercial', ptcRef)}
            ${campo('Pedido Nº', esc(obra.pedidoNumero || '___________') + (obra.pedidoData ? `&nbsp;&nbsp;&nbsp;Data: ${fmt(obra.pedidoData)}` : ''))}
            ${campo('ART Nº', esc(obra.artNumero || '___________') + (obra.artData ? `&nbsp;&nbsp;&nbsp;Data: ${fmt(obra.artData)}` : ''))}
            ${campo('Nota Fiscal Nº', esc(obra.nfNumero || '___________') + (obra.nfData ? `&nbsp;&nbsp;&nbsp;Data: ${fmt(obra.nfData)}` : ''))}
            ${tecnicoNome ? campo('Técnico Responsável', `${tecnicoNome}${tecnicoCargo ? ' — ' + tecnicoCargo : ''}`) : ''}
          </div>`)}
      </td>
    </tr>
  </table>

  <!-- PÁGINA 3 — DESCRIÇÃO DA ATIVIDADE -->
  <table style="width:100%; min-height:calc(297mm - 85px - 60px); border-collapse:collapse; page-break-after:always; table-layout:fixed;">
    <tr>
      <td style="width:12mm; background-color:#1a3a6b; -webkit-print-color-adjust:exact; print-color-adjust:exact; vertical-align:top;"></td>
      <td style="vertical-align:top; padding:6mm 14mm 14mm 10mm;">
        ${secao(4, 'Descrição da Atividade', `
          <p class="texto-justificado" style="margin-bottom:12pt;">
            ${esc(obra.descricaoTecnica || `Execução de serviços de ${tipoLabel || 'intervenção técnica'} conforme Proposta Técnica Comercial ${ptcRef}.`)}
          </p>
          ${(obra.materialEquipamento || dim.diametro || dim.altura || dim.area) ? `
          <div class="equip-box">
            <h3>Dados do Equipamento</h3>
            ${campo('Estrutura', esc(obra.materialEquipamento || ''))}
            ${campo('Identificação', esc(obra.nome || ''))}
            ${campo('Localização', esc(proposta?.clienteEndereco || obra.endereco || ''))}
            ${(dim.diametro || dim.altura || dim.area) ? `
            <div class="equip-dim">
              ${dim.diametro ? `<div>Diâmetro: <span>${esc(dim.diametro)}</span></div>` : ''}
              ${dim.altura ? `<div>Altura: <span>${esc(dim.altura)}</span></div>` : ''}
              ${dim.area ? `<div>Área: <span>${esc(dim.area)} m²</span></div>` : ''}
            </div>` : ''}
          </div>` : ''}
          ${blocoTecnico ? `<div style="margin-top:12pt;">${blocoTecnico}</div>` : ''}`)}
      </td>
    </tr>
  </table>

  <!-- PÁGINA 4 — ESTRUTURA (condição anterior) -->
  <table style="width:100%; min-height:calc(297mm - 85px - 60px); border-collapse:collapse; page-break-after:always; table-layout:fixed;">
    <tr>
      <td style="width:12mm; background-color:#1a3a6b; -webkit-print-color-adjust:exact; print-color-adjust:exact; vertical-align:top;"></td>
      <td style="vertical-align:top; padding:6mm 14mm 14mm 10mm;">
        ${secao(5, 'Estrutura — Condição Anterior à Intervenção', `
          <p style="font-size:9.5pt;color:#6b7280;font-style:italic;margin-bottom:8pt;">
            Registro fotográfico das condições do equipamento antes do início dos serviços.
          </p>
          ${fotoPlaceholder('EST', 4)}`)}
      </td>
    </tr>
  </table>

  <!-- PÁGINA 5 — PROCEDIMENTO -->
  <table style="width:100%; min-height:calc(297mm - 85px - 60px); border-collapse:collapse; page-break-after:always; table-layout:fixed;">
    <tr>
      <td style="width:12mm; background-color:#1a3a6b; -webkit-print-color-adjust:exact; print-color-adjust:exact; vertical-align:top;"></td>
      <td style="vertical-align:top; padding:6mm 14mm 14mm 10mm;">
        ${secao(6, 'Procedimento — Etapas de Execução', `
          <p style="font-size:9.5pt;color:#6b7280;font-style:italic;margin-bottom:8pt;">
            Registro fotográfico das etapas de execução dos serviços.
          </p>
          ${cronograma.length > 0
            ? cronograma.map((e, i) => `
              <p style="font-weight:700;font-size:10pt;margin:10pt 0 6pt;color:#1E3A8A;">${i + 1}. ${esc(e.etapa)}</p>
              ${fotoPlaceholder('PROC-' + (i + 1), 2)}`).join('')
            : fotoPlaceholder('PROC', 4)}`)}
      </td>
    </tr>
  </table>

  <!-- PÁGINA 6 — ENSAIOS + GARANTIA -->
  <table style="width:100%; min-height:calc(297mm - 85px - 60px); border-collapse:collapse; page-break-after:always; table-layout:fixed;">
    <tr>
      <td style="width:12mm; background-color:#1a3a6b; -webkit-print-color-adjust:exact; print-color-adjust:exact; vertical-align:top;"></td>
      <td style="vertical-align:top; padding:6mm 14mm 14mm 10mm;">
        ${secao(7, 'Ensaios e Testes', `
          <div style="margin-bottom:12pt;">${blocoEnsaio}</div>
          ${fotoPlaceholder('ENS', 2)}`)}
        ${secao(8, 'Garantia', `
          <div class="garantia-box">
            <p style="margin-bottom:8pt;">
              Nossa intervenção deve atender e garantir os requisitos de desempenho do sistema aplicado por
              <strong>${obra.garantiaMeses || 36} MESES</strong> a partir da data de emissão deste relatório.
            </p>
            <p>Este equipamento deverá passar por inspeção periódica a cada <strong>${obra.inspecaoMeses || 12} MESES</strong>.</p>
          </div>`)}
      </td>
    </tr>
  </table>

  <!-- PÁGINA 7 — IMAGENS FINAL + PEDIDO + PROPOSTA + CONTATOS -->
  <table style="width:100%; min-height:calc(297mm - 85px - 60px); border-collapse:collapse; page-break-after:always; table-layout:fixed;">
    <tr>
      <td style="width:12mm; background-color:#1a3a6b; -webkit-print-color-adjust:exact; print-color-adjust:exact; vertical-align:top;"></td>
      <td style="vertical-align:top; padding:6mm 14mm 14mm 10mm;">
        ${secao(9, 'Imagens do Equipamento — Condição Final', `
          <p style="font-size:9.5pt;color:#6b7280;font-style:italic;margin-bottom:8pt;">
            Registro fotográfico do equipamento após a conclusão dos serviços.
          </p>
          ${fotoPlaceholder('FINAL', 4)}`)}
        ${secao(10, 'Ordem de Compra / Pedido', `
          <div class="ref-box">
            ${campo('Pedido Nº', esc(obra.pedidoNumero || '___________________'))}
            ${campo('Data do Pedido', obra.pedidoData ? fmt(obra.pedidoData) : '___/___/______')}
            ${campo('Contratante', esc(obra.nome || ''))}
          </div>
          <p style="font-size:9pt;color:#6b7280;font-style:italic;margin-top:8pt;">
            Cópia do documento de compra original disponível no arquivo da obra.
          </p>`)}
        ${secao(11, 'Proposta Técnica Comercial', `
          <div class="ref-box">
            ${campo('PTC Nº', ptcRef)}
            ${proposta?.nome ? campo('Descrição', esc(proposta.nome)) : ''}
          </div>
          <p style="font-size:9pt;color:#6b7280;font-style:italic;margin-top:8pt;">
            Proposta técnica comercial conforme arquivo aprovado pelo contratante.
          </p>`)}
        ${secao(12, 'Contatos e Corpo Técnico', `
          <table class="tabela-contatos">
            <thead>
              <tr><th>Nome</th><th>Cargo</th><th>E-mail</th><th>Telefone</th></tr>
            </thead>
            <tbody>
              <tr><td>John Clovis Peiker</td><td>Diretor Técnico</td><td>john@engeplar.com.br</td><td>(47) 9 8815-3943</td></tr>
              <tr><td>Edson James Peiker</td><td>Diretor</td><td>james@engeplar.com.br</td><td>(47) 9 8829-3476</td></tr>
              <tr><td>Matheus Peiker</td><td>Gerente de Fábrica</td><td>matheus@engeplar.com.br</td><td>(47) 9 9637-0326</td></tr>
              ${tecnicos.map(t => t.nome !== 'Matheus Peiker' ? `
              <tr><td>${esc(t.nome)}</td><td>${esc(t.funcao || '')}</td><td>—</td><td>—</td></tr>` : '').join('')}
            </tbody>
          </table>`)}
      </td>
    </tr>
  </table>

</div>

<script>window.onload = () => window.print();</script>
</body>
</html>`;
}
