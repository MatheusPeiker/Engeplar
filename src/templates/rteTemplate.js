import {
  esc, logoImgHtml, marcaAguaHtml, rodapeHtml, cabecalhoHtml,
  criarNumerador, secaoHtml, campoHtml, documentoHTML,
} from './documentoBase.js';

/**
 * Template HTML/CSS do RTE — Relatório Técnico de Execução Engeplar
 *
 * Estrutura baseada nos RTEs analisados: RTE-0019.12.25 (Veolia),
 * RTE-0016.10.25 (BRF Fortaleza), RTE-0015.10.25 (BRF Tatuí),
 * RTE-0027.05.24 (Toyo Setal).
 *
 * Seções: CAPA · AGRADECIMENTOS · INTRODUÇÃO · DESCRIÇÃO · ESTRUTURA
 *          PROCEDIMENTO · ENSAIOS · GARANTIA · IMAGENS FINAIS · PEDIDO
 *          PROPOSTA · CONTATOS
 *
 * As seções fotográficas (estrutura, procedimento, imagens finais) só entram no
 * documento quando há imagem anexada — nada de quadros "inserir imagem" vazios.
 * Por isso a numeração é sequencial em tempo de geração (`numSecao`), sem furos.
 *
 * A estrutura de página (capa, cabeçalho, faixa, rodapé, marca d'água) vem de
 * ./documentoBase — a mesma usada pela PTC, para os dois documentos terem
 * exatamente a mesma aparência.
 *
 * @param {Object} obra       Dados da obra (com campos RTE)
 * @param {Object} empresa    Dados da empresa
 * @param {Array}  cronograma Etapas do cronograma
 * @param {Object} proposta   Proposta principal vinculada à obra
 * @param {Array}  tecnicos   Funcionários alocados na obra
 * @param {Object} fotos      Imagens por seção: { estrutura, 'proc-<i>', procedimento,
 *                            ensaios, final } → [{ src, legenda }]. Grupos vazios
 *                            fazem a seção correspondente não ser impressa.
 * @returns {string}          HTML completo pronto para window.open + print
 */
export function gerarHTMLRTE(obra, empresa, cronograma = [], proposta = null, tecnicos = [], fotos = {}) {
  // Remove pontuação final para encaixar o texto dentro de uma frase
  const frase = (s) => esc(String(s || '').trim().replace(/[.;,]+$/, ''));

  /* Acrescenta a unidade só quando o valor digitado ainda não a traz —
     evita saídas como "45 m² m²" quando o usuário informa a unidade no campo. */
  const unid = (v, u) => {
    const s = String(v ?? '').trim();
    if (!s) return '';
    return s.toLowerCase().endsWith(u.toLowerCase()) ? s : `${s} ${u}`;
  };

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
  const local = esc(proposta?.clienteEndereco || obra.endereco || '');

  const d = obra.dadosRte || {};

  const logoImg = (classe) => logoImgHtml(empresa?.logo, classe, nomeEmpresa);

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
    const row = (label, val) => val ? `<tr><th class="k">${esc(label)}</th><td class="v">${esc(val)}</td></tr>` : '';
    const tbl = (rows) => rows ? `<table class="tab-dados">${rows}</table>` : '';

    switch (obra.tipoServico) {
      case 'REVESTIMENTO_PINTURA': {
        const camadas = [1, 2, 3].filter(n => d[`camada_${n}_material`]).map(n => `
          <tr>
            <td class="c-forte">Camada ${n}</td>
            <td>${esc(d[`camada_${n}_material`] || '')}</td>
            <td>${esc(d[`camada_${n}_cor`] || '—')}</td>
            <td class="num">${esc(unid(d[`camada_${n}_esp_umida`], 'µm')) || '—'}</td>
            <td class="num">${esc(unid(d[`camada_${n}_esp_seca`], 'µm')) || '—'}</td>
          </tr>`).join('');
        return `
          ${tbl(row('Produto / Sistema', d.produto_nome) + row('Fabricante', d.fabricante) + row('Preparo de Superfície', d.norma_jato) + row('Sistema de Aplicação', d.sistema_aplicacao))}
          ${camadas ? `
          <p class="rotulo-bloco">Esquema de Pintura</p>
          <table class="tab-grid">
            <thead><tr>
              <th>Camada</th><th>Material</th><th>Cor</th>
              <th class="num">Esp. Úmida</th><th class="num">Esp. Seca</th>
            </tr></thead>
            <tbody>${camadas}</tbody>
          </table>
          ${d.espessura_total ? `<p class="destaque">Espessura Total Seca: <span>${esc(d.espessura_total)} µm</span></p>` : ''}` : ''}`;
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
          row('Áreas Executadas', areas) + row('Área Total', unid(d.area_total_m2, 'm²'))
        );
      }
      case 'INJECAO_QUIMICA':
        return tbl(
          row('Produto Injetado', d.produto_injetado) +
          row('Total de Pontos', d.total_pontos) +
          row('Área Recuperada', unid(d.area_recuperada_m2, 'm²')) +
          row('Áreas Recuperadas', d.descricao_areas)
        );
      case 'SOLDA_PLASTICA':
        return tbl(
          row('Material Base', d.material_base) + row('Tipo de Solda', d.tipo_solda) +
          row('Área Reparada', unid(d.area_reparada_m2, 'm²')) +
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
          `<tr><td>Camada ${n} — ${esc(d[`camada_${n}_material`] || '')}</td><td class="num forte">${esc(d[`camada_${n}_esp_seca`])} µm</td></tr>`).join('');
        return `<p class="texto-justificado">Leitura de espessura de película seca por ultrassom — conforme ficha técnica do fabricante.</p>
          ${medidas ? `<table class="tab-grid estreita">
            <thead><tr><th>Camada</th><th class="num">Espessura Seca</th></tr></thead>
            <tbody>${medidas}</tbody>
          </table>
          ${d.espessura_total ? `<p class="destaque">Total: <span>${esc(d.espessura_total)} µm</span></p>` : ''}` : ''}`;
      }
      case 'REVESTIMENTO_IMPERMEABILIZANTE':
        return `<p class="texto-justificado">Leitura de espessura da camada aplicada interna e externamente.</p>
          <table class="tab-grid estreita">
            <thead><tr><th>Posição</th><th class="num">Espessura (µm)</th></tr></thead>
            <tbody>
              ${d.espessura_interna ? `<tr><td>Interna</td><td class="num forte">${esc(d.espessura_interna)}</td></tr>` : ''}
              ${d.espessura_externa ? `<tr><td>Externa</td><td class="num forte">${esc(d.espessura_externa)}</td></tr>` : ''}
            </tbody>
          </table>`;
      case 'RECUPERACAO_LINER':
        return `<p class="texto-justificado">Ensaio de carregamento hidrostático conforme norma vigente. ${d.area_total_m2 ? `Área total executada: <strong>${esc(d.area_total_m2)} m²</strong>.` : ''}</p>`;
      case 'INJECAO_QUIMICA':
        return `<p class="texto-justificado">Inspeção visual das áreas recuperadas.
          ${d.total_pontos ? `Total de pontos de injeção executados: <strong>${esc(String(d.total_pontos))}</strong>.` : ''}
          ${d.area_recuperada_m2 ? ` Área recuperada: <strong>${esc(d.area_recuperada_m2)} m²</strong>.` : ''}
          ${d.descricao_areas ? `<br/><br/>${esc(d.descricao_areas)}` : ''}</p>`;
      case 'SOLDA_PLASTICA':
        return `<p class="texto-justificado">Ensaio visual e dimensional das soldas realizadas.
          ${d.area_reparada_m2 ? ` Área reparada: <strong>${esc(d.area_reparada_m2)} m²</strong>.` : ''}</p>`;
      case 'CONSTRUCAO':
        return `<p class="texto-justificado">Verificação dimensional e de prumo conforme projeto e norma ${d.norma ? esc(d.norma) : 'aplicável'}.</p>`;
      default:
        return `<p class="texto-justificado">Ensaios e testes realizados conforme especificação técnica.</p>`;
    }
  })();

  // Técnico responsável
  const tecnicoPrincipal = tecnicos[0] || null;
  const tecnicoNome = esc(tecnicoPrincipal?.nome || '');
  const tecnicoCargo = esc(tecnicoPrincipal?.funcao || '');

  // ── Imagens anexadas ──────────────────────────────────────
  const fotosDe = (id) => (Array.isArray(fotos?.[id]) ? fotos[id] : []).filter(f => f && f.src);

  const fEstrutura = fotosDe('estrutura');
  const fEnsaios   = fotosDe('ensaios');
  const fFinal     = fotosDe('final');
  const fProcSolto = fotosDe('procedimento');
  // Apenas etapas que receberam foto entram na seção de procedimento
  const etapasComFoto = cronograma
    .map((e, i) => ({ etapa: e, fotos: fotosDe(`proc-${i}`) }))
    .filter(x => x.fotos.length > 0);
  const temProcedimento = etapasComFoto.length > 0 || fProcSolto.length > 0;

  /* Galeria: linhas de 2 imagens por tabela, com `break-inside: avoid` para que
     uma linha nunca seja cortada ao meio pela quebra de página. Legendas são
     numeradas em sequência ao longo de todo o documento. */
  let figura = 0;
  const galeria = (lista) => {
    if (!lista.length) return '';
    let html = '';
    for (let i = 0; i < lista.length; i += 2) {
      const slot = (idx) => {
        const f = lista[idx];
        if (!f) return '<td></td>';
        const n = ++figura;
        return `
        <td>
          <div class="foto-quadro"><img src="${esc(f.src)}" alt="${esc(f.legenda || `Figura ${n}`)}" /></div>
          <p class="foto-legenda">Figura ${n}${f.legenda ? ' — ' + esc(f.legenda) : ''}</p>
        </td>`;
      };
      html += `<table class="fotos"><tr>${slot(i)}${slot(i + 1)}</tr></table>`;
    }
    return html;
  };

  // Numeração sequencial: a capa é 1 e cada seção emitida pega o próximo número
  const numSecao = criarNumerador(2);

  const secao = (titulo, conteudo, novaPagina = false) =>
    secaoHtml({ num: numSecao(), titulo, conteudo, novaPagina });

  const campo = campoHtml;

  const nota = (txt) => `<p class="nota">${esc(txt)}</p>`;

  // CSS exclusivo do RTE: a grade de fotos. O restante vem de documentoBase.
  const cssFotos = `
/* ── Fotos ── */
table.fotos {
  width: 100%; border-collapse: collapse; margin-bottom: 5mm;
  page-break-inside: avoid; break-inside: avoid;
}
table.fotos td { width: 50%; vertical-align: top; padding: 0; }
table.fotos td:first-child { padding-right: 3mm; }
table.fotos td:last-child { padding-left: 3mm; }
.foto-quadro {
  /* Faixa de altura fixa (86mm) mantém as legendas alinhadas na linha e cabe
     em duas linhas dentro da área útil (~250mm). A faixa é invisível: a borda
     fica na imagem, então foto deitada não deixa moldura vazia em volta. */
  height: 86mm;
  display: flex; align-items: center; justify-content: center;
  overflow: hidden;
}
/* Sem object-fit/dimensões forçadas: a proporção original é preservada */
.foto-quadro img {
  max-width: 100%; max-height: 100%;
  border: 0.5pt solid #cbd5e1; border-radius: 1mm;
}
.foto-legenda {
  font-size: 8pt; font-style: italic; color: #6b7280; text-align: center;
  margin-top: 1.8mm; padding-bottom: 1.2mm;
}
`;

  const conteudo = `

        <!-- ── 1 · CAPA ── -->
        <div class="capa">
          ${logoImg('logo-c', nomeEmpresa)}
          <div class="capa-titulo">Relatório Técnico<br>de Execução</div>
          <div class="capa-sub">${tipoLabel || esc(obra.nome || '')}</div>
          <table class="capa-meta">
            <tr><td class="rot">Nº RTE</td><td>${rteNum}</td></tr>
            <tr><td class="rot">Contratante</td><td>${esc(obra.nome)}</td></tr>
            <tr><td class="rot">Local</td><td>${local}</td></tr>
            <tr><td class="rot">PTC Referência</td><td>${ptcRef}</td></tr>
            <tr><td class="rot">Período de Execução</td><td>${periodoInicio} a ${periodoFim}</td></tr>
            <tr><td class="rot">Data de Emissão</td><td>${hoje}</td></tr>
          </table>
          <div class="capa-emissao">${empresa?.endereco ? esc(empresa.endereco) + ' &middot; ' : ''}Emitido em ${hoje}</div>
        </div>

        <!-- ── AGRADECIMENTOS ── -->
        ${secao('Agradecimentos', `
          <p class="texto-justificado">
            A <strong>${nomeEmpresa}</strong> agradece a confiança depositada e a oportunidade de
            realizar os serviços descritos neste relatório. Expressamos nossa gratidão aos responsáveis
            do contratante pelo acompanhamento e suporte durante toda a execução.
          </p>
          ${obra.responsavelCliente ? `
          <table class="tabela-contatos" style="width:120mm;">
            <thead><tr><th>Responsável Contratante</th><th>Empresa / Unidade</th></tr></thead>
            <tbody>
              <tr><td>${esc(obra.responsavelCliente)}</td><td>${esc(obra.nome || '')}</td></tr>
            </tbody>
          </table>` : ''}`)}

        <!-- ── INTRODUÇÃO ── -->
        ${secao('Introdução', `
          <p class="texto-justificado">
            O presente documento tem por finalidade apresentar os dados capturados na execução dos
            trabalhos de <strong>${frase(obra.descricaoTecnica || tipoLabel || obra.nome || '')}</strong>.
          </p>
          <p class="texto-justificado">
            A execução do trabalho apontado ocorreu em <strong>${local}</strong>.
            ${obra.responsavelCliente ? `As atividades foram acompanhadas pelo(a) Sr(a). <strong>${esc(obra.responsavelCliente)}</strong>.` : ''}
          </p>
          <div style="margin-top:4mm;">
            ${campo('Proposta Técnica Comercial', ptcRef)}
            ${campo('Pedido Nº', esc(obra.pedidoNumero || '___________') + (obra.pedidoData ? `&nbsp;&nbsp;&nbsp;Data: ${fmt(obra.pedidoData)}` : ''))}
            ${campo('ART Nº', esc(obra.artNumero || '___________') + (obra.artData ? `&nbsp;&nbsp;&nbsp;Data: ${fmt(obra.artData)}` : ''))}
            ${campo('Nota Fiscal Nº', esc(obra.nfNumero || '___________') + (obra.nfData ? `&nbsp;&nbsp;&nbsp;Data: ${fmt(obra.nfData)}` : ''))}
            ${tecnicoNome ? campo('Técnico Responsável', `${tecnicoNome}${tecnicoCargo ? ' — ' + tecnicoCargo : ''}`) : ''}
          </div>`)}

        <!-- ── DESCRIÇÃO DA ATIVIDADE ── -->
        ${secao('Descrição da Atividade', `
          <p class="texto-justificado">
            ${esc(obra.descricaoTecnica || `Execução de serviços de ${tipoLabel || 'intervenção técnica'} conforme Proposta Técnica Comercial ${ptcRef}.`)}
          </p>
          ${(obra.materialEquipamento || dim.diametro || dim.altura || dim.area) ? `
          <div class="equip-box">
            <h3>Dados do Equipamento</h3>
            ${obra.materialEquipamento ? campo('Estrutura', esc(obra.materialEquipamento)) : ''}
            ${campo('Identificação', esc(obra.nome || ''))}
            ${local ? campo('Localização', local) : ''}
            ${(dim.diametro || dim.altura || dim.area) ? `
            <div class="equip-dim">
              ${dim.diametro ? `<div>Diâmetro: <span>${esc(dim.diametro)}</span></div>` : ''}
              ${dim.altura ? `<div>Altura: <span>${esc(dim.altura)}</span></div>` : ''}
              ${dim.area ? `<div>Área: <span>${esc(unid(dim.area, 'm²'))}</span></div>` : ''}
            </div>` : ''}
          </div>` : ''}
          ${blocoTecnico}`, true)}

        <!-- ── ESTRUTURA (condição anterior) — só com imagem anexada ── -->
        ${fEstrutura.length ? secao('Estrutura — Condição Anterior à Intervenção', `
          <p class="legenda-secao">Registro fotográfico das condições do equipamento antes do início dos serviços.</p>
          ${galeria(fEstrutura)}`, true) : ''}

        <!-- ── PROCEDIMENTO — só etapas com imagem anexada ── -->
        ${temProcedimento ? secao('Procedimento — Etapas de Execução', `
          <p class="legenda-secao">Registro fotográfico das etapas de execução dos serviços.</p>
          ${etapasComFoto.map(({ etapa, fotos: fs }, i) => `
              <p class="etapa-titulo">${i + 1}. ${esc(etapa.etapa)}</p>
              ${galeria(fs)}`).join('')}
          ${galeria(fProcSolto)}`, true) : ''}

        <!-- ── ENSAIOS — texto sempre; imagens quando houver ── -->
        ${secao('Ensaios e Testes', `
          ${blocoEnsaio}
          ${fEnsaios.length ? `<div style="margin-top:5mm;">${galeria(fEnsaios)}</div>` : ''}`, true)}

        <!-- ── GARANTIA ── -->
        ${secao('Garantia', `
          <div class="garantia-box">
            <p>
              Nossa intervenção deve atender e garantir os requisitos de desempenho do sistema aplicado por
              <strong>${esc(String(obra.garantiaMeses || 36))} MESES</strong> a partir da data de emissão deste relatório.
            </p>
            <p>Este equipamento deverá passar por inspeção periódica a cada <strong>${esc(String(obra.inspecaoMeses || 12))} MESES</strong>.</p>
          </div>`)}

        <!-- ── IMAGENS FINAIS — só com imagem anexada ── -->
        ${fFinal.length ? secao('Imagens do Equipamento — Condição Final', `
          <p class="legenda-secao">Registro fotográfico do equipamento após a conclusão dos serviços.</p>
          ${galeria(fFinal)}`, true) : ''}

        <!-- ── PEDIDO ── -->
        ${secao('Ordem de Compra / Pedido', `
          <div class="ref-box">
            ${campo('Pedido Nº', esc(obra.pedidoNumero || '___________________'))}
            ${campo('Data do Pedido', obra.pedidoData ? fmt(obra.pedidoData) : '___/___/______')}
            ${campo('Contratante', esc(obra.nome || ''))}
          </div>
          ${nota('Cópia do documento de compra original disponível no arquivo da obra.')}`, true)}

        <!-- ── PROPOSTA ── -->
        ${secao('Proposta Técnica Comercial', `
          <div class="ref-box">
            ${campo('PTC Nº', ptcRef)}
            ${proposta?.nome ? campo('Descrição', esc(proposta.nome)) : ''}
          </div>
          ${nota('Proposta técnica comercial conforme arquivo aprovado pelo contratante.')}`)}

        <!-- ── CONTATOS ── -->
        ${secao('Contatos e Corpo Técnico', `
          <table class="tabela-contatos">
            <thead>
              <tr><th>Nome</th><th>Cargo</th><th>E-mail</th><th>Telefone</th></tr>
            </thead>
            <tbody>
              <tr><td>John Clovis Peiker</td><td>Diretor Técnico</td><td>john@engeplar.com.br</td><td>(47) 9 8815-3943</td></tr>
              <tr><td>Edson James Peiker</td><td>Diretor</td><td>james@engeplar.com.br</td><td>(47) 9 8829-3476</td></tr>
              ${tecnicos.filter(t => !/matheus/i.test(t.nome || '')).map(t => `
              <tr><td>${esc(t.nome)}</td><td>${esc(t.funcao || '')}</td><td>—</td><td>—</td></tr>`).join('')}
            </tbody>
          </table>`)}
`;

  return documentoHTML({
    title: rteNum,
    cssExtra: cssFotos,
    marcaAgua: marcaAguaHtml(empresa?.simbolo),
    cabecalho: cabecalhoHtml({
      logoHtml: logoImg('logo-h'),
      titulo: 'Relatório Técnico de Execução',
      metas: [`<strong>Nº ${rteNum}</strong>`, `Data: ${hoje}`],
    }),
    rodape: rodapeHtml({
      idDoc: rteNum,
      nomeEmpresa,
      telefone: empresa?.telefone,
      email: empresa?.email,
      site: empresa?.site,
    }),
    conteudo,
  });
}
