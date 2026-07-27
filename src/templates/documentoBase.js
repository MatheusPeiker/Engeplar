/**
 * Base visual compartilhada dos documentos impressos (RTE e PTC).
 *
 * Os dois documentos usam exatamente o mesmo layout de página: mesma capa,
 * mesmo cabeçalho, mesma faixa lateral, mesmo rodapé e mesma marca d'água.
 * Tudo isso vive aqui para que uma mudança de aparência valha para os dois.
 *
 * ── Arquitetura de impressão (A4) ────────────────────────────────────────
 * O documento é uma única tabela mestre (table.doc):
 *   • <thead>  cabeçalho — o Chrome repete E reserva o espaço em toda página;
 *   • <tfoot>  espaçador invisível — reserva a altura do rodapé em toda página;
 *   • <tbody>  todo o conteúdo, que flui naturalmente entre as páginas.
 * O rodapé visual, a faixa lateral e a marca d'água são `position: fixed` (o
 * Chrome repete elementos fixos em todas as páginas), ancorados em
 * top/bottom/left 0 com `@page { margin: 0 }` — sem deslocamentos negativos,
 * que o Chrome não posiciona de forma confiável na área de margem.
 *
 * Atenção ao editar o CSS abaixo: ele mora dentro de um template literal, então
 * comentários não podem conter acento grave.
 */

export const esc = (s) => s == null ? '' : String(s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;').replace(/'/g, '&#039;');

/** CSS comum aos documentos. Cada template acrescenta o seu em `cssExtra`. */
export const CSS_DOCUMENTO = `
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

@page { size: A4; margin: 0; }

/* O branco fica só no html: um background no body pintaria uma camada opaca
   por cima da marca d'água (que usa z-index negativo) e a esconderia. */
html {
  background: #fff;
}
html, body {
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
  color-adjust: exact;
}
body {
  font-family: 'Calibri', 'Segoe UI', 'Arial', sans-serif;
  font-size: 10.5pt;
  line-height: 1.5;
  color: #111827;
}
img { max-width: 100%; }

/* ── Marca d'água: símbolo Engeplar ao fundo de todas as páginas ──
   Medidas espelhadas do RTE-0009.05.26: quadrado de 150mm centralizado na
   horizontal (left 30mm) com o centro em y≈143,5mm (top 68,5mm).
   z-index negativo põe a marca abaixo do texto e acima do fundo da página;
   sem transform, que o Chrome não reposiciona de forma confiável a cada
   página em elementos fixos. */
.marca-agua {
  position: fixed;
  left: 30mm; top: 68.5mm;
  width: 150mm; height: 150mm;
  z-index: -1;
  opacity: 0.16;   /* presença próxima à do RTE-0009 sem competir com o texto */
  -webkit-print-color-adjust: exact; print-color-adjust: exact; color-adjust: exact;
}
.marca-agua img { width: 100%; height: 100%; object-fit: contain; }

/* ── Faixa lateral (fixa, repete em todas as páginas) ── */
.faixa-lateral {
  position: fixed;
  top: 0; bottom: 0; left: 0;
  width: 10mm;
  background: #1a3a6b;
  -webkit-print-color-adjust: exact; print-color-adjust: exact; color-adjust: exact;
}

/* ── Rodapé visual (fixo, ancorado no fim físico da página) ── */
.doc-footer { position: fixed; bottom: 0; left: 0; right: 0; }
.footer-id {
  display: flex; justify-content: space-between; align-items: baseline;
  padding: 1.4mm 14mm 1.4mm 18mm;
  font-size: 7.5pt; color: #64748b;
  background: #fff;
  border-top: 0.4pt solid #cbd5e1;
}
.footer-bar {
  background: #1a3a6b; color: #fff;
  display: flex; align-items: center; justify-content: space-between;
  padding: 2.4mm 14mm 2.4mm 18mm;
  font-size: 8pt;
  -webkit-print-color-adjust: exact; print-color-adjust: exact; color-adjust: exact;
}
.footer-bar .marca { font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; }
.footer-bar .contatos { display: flex; gap: 6mm; }

/* ── Tabela mestre: thead repete/reserva topo, tfoot reserva rodapé ── */
table.doc { width: 100%; border-collapse: collapse; }
/* O padding-bottom do thead define a folga entre cabeçalho e conteúdo em
   TODAS as páginas (padding no tbody valeria só na primeira). */
td.header-cell { padding: 7mm 14mm 7mm 18mm; border: none; }
td.content-cell { padding: 0 14mm 0 18mm; border: none; vertical-align: top; }
td.footer-spacer { height: 20mm; border: none; }

/* ── Cabeçalho ── */
.header-table { width: 100%; border-collapse: collapse; }
.header-table td { border: 0.75pt solid #1a3a6b; padding: 1.4mm 2.6mm; vertical-align: middle; }
.header-table .cel-logo { width: 44mm; background: #fff; text-align: center; padding: 1.8mm 2mm; }
.header-table .cel-logo .logo-h { display: block; margin: 0 auto; max-height: 12mm; max-width: 38mm; object-fit: contain; }
.header-table .cel-logo .logo-h-txt { font-size: 11.5pt; font-weight: 800; color: #1a3a6b; letter-spacing: 0.06em; text-transform: uppercase; }
.header-table .cel-titulo {
  background: #eef2fb; color: #1a3a6b;
  text-align: center; font-size: 10pt; font-weight: 700;
  letter-spacing: 0.05em; text-transform: uppercase;
  -webkit-print-color-adjust: exact; print-color-adjust: exact; color-adjust: exact;
}
.header-table .cel-meta { width: 48mm; font-size: 8.5pt; white-space: nowrap; }
.header-table .cel-meta strong { color: #1a3a6b; }

/* ── Capa ── */
.capa {
  /* Menor que a área útil (~250mm) para a capa não transbordar e gerar
     uma página em branco — era o que acontecia no layout anterior. */
  height: 236mm;
  display: flex; flex-direction: column;
  align-items: center; justify-content: center;
  text-align: center;
  page-break-after: always; break-after: page;
}
.capa .logo-c { max-width: 76mm; max-height: 24mm; object-fit: contain; margin-bottom: 14mm; }
.capa .logo-c-txt { font-size: 26pt; font-weight: 900; color: #1a3a6b; letter-spacing: 0.09em; text-transform: uppercase; margin-bottom: 14mm; }
.capa-titulo {
  width: 100%;
  font-size: 19pt; font-weight: 800; color: #1a3a6b;
  text-transform: uppercase; letter-spacing: 0.09em; line-height: 1.25;
  border-top: 2.5pt solid #1a3a6b; border-bottom: 2.5pt solid #1a3a6b;
  padding: 5mm 0; margin-bottom: 7mm;
}
.capa-sub { font-size: 12.5pt; font-weight: 600; color: #374151; margin-bottom: 13mm; }
.capa-meta { width: 152mm; border-collapse: collapse; font-size: 10pt; }
.capa-meta td { border: 0.5pt solid #b6c2d9; padding: 2.5mm 4mm; text-align: left; }
.capa-meta td.rot {
  width: 46mm; white-space: nowrap;
  background: #1a3a6b; color: #fff; font-weight: 700;
  -webkit-print-color-adjust: exact; print-color-adjust: exact; color-adjust: exact;
}
.capa-emissao { margin-top: 13mm; font-size: 9.5pt; color: #64748b; }

/* ── Seções ── */
.secao { margin-bottom: 9mm; }
.nova-pagina { page-break-before: always; break-before: page; }
.secao-titulo {
  display: flex; align-items: center; gap: 3mm;
  font-size: 11pt; font-weight: 700; color: #1a3a6b;
  text-transform: uppercase; letter-spacing: 0.04em;
  border-bottom: 1.6pt solid #1a3a6b;
  padding-bottom: 1.6mm; margin-bottom: 4.5mm;
  page-break-after: avoid; break-after: avoid;
}
.secao-num {
  background: #1a3a6b; color: #fff;
  font-size: 9pt; line-height: 1;
  padding: 1.3mm 2mm; border-radius: 1mm;
  -webkit-print-color-adjust: exact; print-color-adjust: exact; color-adjust: exact;
}

/* ── Texto ── */
.texto-justificado { text-align: justify; line-height: 1.6; margin-bottom: 4mm; }
.nota { font-size: 8.5pt; color: #6b7280; font-style: italic; margin-top: 2.5mm; }
.legenda-secao { font-size: 9pt; color: #6b7280; font-style: italic; margin-bottom: 4mm; }
.rotulo-bloco { font-weight: 700; font-size: 10pt; color: #1a3a6b; margin: 5mm 0 2mm; page-break-after: avoid; break-after: avoid; }
.destaque { font-size: 10pt; font-weight: 700; margin-top: 3mm; }
.destaque span { color: #1a3a6b; }
.etapa-titulo { font-weight: 700; font-size: 10pt; color: #1a3a6b; margin: 5mm 0 2.5mm; page-break-after: avoid; break-after: avoid; }

/* ── Campos ── */
.campo-linha { display: flex; gap: 3mm; margin-bottom: 1.8mm; font-size: 10pt; align-items: baseline; }
.campo-label { font-weight: 700; color: #374151; white-space: nowrap; min-width: 52mm; }
.campo-label::after { content: ':'; }
.campo-valor { flex: 1; border-bottom: 0.4pt dotted #9ca3af; }

/* ── Caixas ── */
.equip-box, .ref-box, .garantia-box { page-break-inside: avoid; break-inside: avoid; }
.equip-box {
  border: 0.8pt solid #1a3a6b; border-radius: 1.5mm;
  padding: 4mm 5mm; margin-bottom: 5mm; background: #f7f9fc;
}
.equip-box h3 { font-size: 9.5pt; font-weight: 700; color: #1a3a6b; text-transform: uppercase; letter-spacing: 0.04em; margin-bottom: 2.5mm; }
.equip-dim { display: flex; gap: 10mm; font-size: 10pt; margin-top: 2.5mm; }
.equip-dim span { font-weight: 700; color: #1a3a6b; }
.garantia-box {
  background: #fffaf0; border-left: 2.5pt solid #d97706;
  padding: 4mm 5mm; line-height: 1.6;
}
.garantia-box p + p { margin-top: 2.5mm; }
.ref-box { border: 0.5pt solid #d8dee9; border-radius: 1.5mm; padding: 4mm 5mm; background: #fafbfd; }

/* ── Tabelas de dados ── */
.tab-dados, .tab-grid, .tabela-contatos {
  width: 100%; border-collapse: collapse; font-size: 10pt;
  page-break-inside: avoid; break-inside: avoid;
}
.tab-grid.estreita { width: 96mm; }
.tab-dados th.k {
  text-align: left; font-weight: 700; color: #374151;
  padding: 1.6mm 3mm; border-bottom: 0.4pt solid #e2e8f0;
  white-space: nowrap; width: 52mm; vertical-align: top;
}
.tab-dados td.v { padding: 1.6mm 3mm; border-bottom: 0.4pt solid #e2e8f0; }
.tab-grid thead th, .tabela-contatos thead th {
  background: #1a3a6b; color: #fff;
  font-size: 9pt; font-weight: 700; text-align: left;
  padding: 2mm 3mm;
  -webkit-print-color-adjust: exact; print-color-adjust: exact; color-adjust: exact;
}
.tab-grid td, .tabela-contatos td { padding: 1.7mm 3mm; border-bottom: 0.4pt solid #e2e8f0; }
.tab-grid tbody tr:nth-child(even), .tabela-contatos tbody tr:nth-child(even) { background: #f7f9fc; }
.tab-grid .num, .tabela-contatos .num { text-align: right; }
.tab-grid .c-forte { font-weight: 600; }
.tab-grid .forte { font-weight: 700; }
`;

/**
 * Logo em cores naturais sobre fundo branco, com texto de reserva.
 * Nunca aplicar filtros de brilho/inversão: a marca é azul sobre branco e
 * brightness(0) invert(1) a transformaria em um retângulo branco sólido.
 */
export function logoImgHtml(src, classe, nomeEmpresa) {
  const nome = esc(nomeEmpresa);
  return src
    ? `<img class="${classe}" src="${esc(src)}" alt="${nome}" onerror="this.style.display='none';this.nextElementSibling.style.display='block';" /><span class="${classe}-txt" style="display:none">${nome}</span>`
    : `<span class="${classe}-txt">${nome}</span>`;
}

export function marcaAguaHtml(src) {
  return src ? `<div class="marca-agua"><img src="${esc(src)}" alt="" /></div>` : '';
}

/** Rodapé fixo: linha de identificação + barra com marca e contatos. */
export function rodapeHtml({ idDoc, nomeEmpresa, telefone, email, site }) {
  return `<div class="doc-footer">
  <div class="footer-id">
    <span>${esc(idDoc)}</span>
    <span>${esc(nomeEmpresa)}</span>
  </div>
  <div class="footer-bar">
    <span class="marca">${esc(nomeEmpresa)}</span>
    <span class="contatos">
      <span>&#9990; ${esc(telefone || '(47) 3386-0000')}</span>
      <span>&#9993; ${esc(email || 'contato@engeplar.com.br')}</span>
      ${site ? `<span>&#127760; ${esc(site)}</span>` : ''}
    </span>
  </div>
</div>`;
}

/**
 * Cabeçalho repetido: célula da logo, título do documento e linhas de metadados
 * (cada string de `metas` vira uma linha na coluna da direita).
 */
export function cabecalhoHtml({ logoHtml, titulo, metas = [] }) {
  const linhas = metas.length > 0 ? metas : ['&nbsp;'];
  const span = linhas.length > 1 ? ` rowspan="${linhas.length}"` : '';
  const primeira = `
          <tr>
            <td class="cel-logo"${span}>${logoHtml}</td>
            <td class="cel-titulo"${span}>${esc(titulo)}</td>
            <td class="cel-meta">${linhas[0]}</td>
          </tr>`;
  const resto = linhas.slice(1).map(m => `
          <tr>
            <td class="cel-meta">${m}</td>
          </tr>`).join('');
  return `<table class="header-table">${primeira}${resto}
        </table>`;
}

/** Numerador sequencial de seções: a numeração nunca é fixa no template. */
export function criarNumerador(inicio = 1) {
  let n = inicio - 1;
  return () => ++n;
}

/** Seção com título numerado. `num` vazio gera seção sem número. */
export function secaoHtml({ num, titulo, conteudo, novaPagina = false }) {
  const marcador = num == null || num === '' ? '' : `<span class="secao-num">${esc(num)}</span>`;
  return `
    <div class="secao${novaPagina ? ' nova-pagina' : ''}">
      <h2 class="secao-titulo">${marcador}${esc(titulo)}</h2>
      ${conteudo}
    </div>`;
}

export function campoHtml(label, valor) {
  return `
    <div class="campo-linha">
      <span class="campo-label">${esc(label)}</span>
      <span class="campo-valor">${valor}</span>
    </div>`;
}

/** Monta o documento completo com a estrutura de impressão compartilhada. */
export function documentoHTML({ title, cssExtra = '', marcaAgua = '', cabecalho, rodape, conteudo }) {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<title>${esc(title)}</title>
<style>${CSS_DOCUMENTO}${cssExtra}
</style>
</head>
<body>

<!-- Marca d'água, faixa lateral e rodapé: fixos, repetem em todas as páginas -->
${marcaAgua}
<div class="faixa-lateral"></div>
${rodape}

<table class="doc">
  <thead>
    <tr>
      <td class="header-cell">
        ${cabecalho}
      </td>
    </tr>
  </thead>

  <tfoot>
    <tr><td class="footer-spacer"></td></tr>
  </tfoot>

  <tbody>
    <tr>
      <td class="content-cell">
${conteudo}
      </td>
    </tr>
  </tbody>
</table>

<script>window.onload = () => window.print();</script>
</body>
</html>`;
}
