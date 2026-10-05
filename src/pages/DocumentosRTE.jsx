import { useState, useMemo } from 'react';
import { FilePlus, ClipboardList, Search, ChevronLeft, Trash2 } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { gerarHTMLRTE } from '../templates/rteTemplate';
import { empresaParaImpressao } from '../lib/logo';
import ModalFotosRelatorio from '../components/ModalFotosRelatorio';

const STATUS = {
  rascunho: { label: 'Rascunho', color: 'var(--text-muted)', bg: 'var(--background)' },
  emitido:  { label: 'Emitido',  color: 'var(--success)',    bg: 'rgba(16,185,129,0.1)' },
};

const TIPOS_SERVICO = [
  { value: 'RECUPERACAO_LINER',              label: 'Recuperação de Liner Interno/Externo (PRFV)' },
  { value: 'REVESTIMENTO_PINTURA',           label: 'Tratamento e Pintura Anticorrosiva' },
  { value: 'REVESTIMENTO_IMPERMEABILIZANTE', label: 'Revestimento Impermeabilizante' },
  { value: 'INJECAO_QUIMICA',                label: 'Injeção Química em Trincas/Fissuras' },
  { value: 'SOLDA_PLASTICA',                 label: 'Solda Plástica por Termofusão (PP/PRFV)' },
  { value: 'CONSTRUCAO',                     label: 'Construção de Estrutura Nova' },
];

const SIST_APL   = ['Airless', 'Broxa', 'Rolo', 'Pistola convencional', 'Rolo de lã'];
const NORMA_JATO = ['Sa 2½ ISO 8501-1', 'Sa 3 ISO 8501-1', 'St 3 SSPC-SP 3', 'SP 6 SSPC-SP 6'];

// Colunas DATE do banco não aceitam '' — campo limpo vira null
const CAMPOS_DATA = new Set(['data_emissao', 'periodo_inicio', 'periodo_fim', 'pedido_data', 'art_data', 'nf_data']);

/* Converte o registro do RTE no formato que o template espera (o mesmo da obra,
   de quando o RTE vivia dentro dela). Sem obra vinculada, contratante e local
   vêm do que foi digitado no RTE. */
const montarDocRTE = (rte, obra) => ({
  nome: rte.cliente_nome || obra?.nome || '',
  endereco: rte.local || obra?.endereco || '',
  rteNumero: rte.numero_completo,
  dataEmissao: rte.data_emissao,
  periodoInicio: rte.periodo_inicio,
  periodoFim: rte.periodo_fim,
  tipoServico: rte.tipo_servico,
  dadosRte: rte.dados_rte || {},
  pedidoNumero: rte.pedido_numero, pedidoData: rte.pedido_data,
  artNumero: rte.art_numero, artData: rte.art_data,
  nfNumero: rte.nf_numero, nfData: rte.nf_data,
  materialEquipamento: rte.material_equipamento,
  dimensoes: rte.dimensoes || {},
  garantiaMeses: rte.garantia_meses,
  inspecaoMeses: rte.inspecao_meses,
  responsavelCliente: rte.responsavel_cliente,
  descricaoTecnica: rte.descricao_tecnica,
});

// ─────────────────────────────────────────────────────────────────────────────
export default function DocumentosRTE() {
  const { rtes, rteDisponivel, addRTE, updateRTE, deleteRTE, obras, ptcs, funcionarios, getCronogramaObra, empresa } = useAppContext();
  const [view, setView]           = useState('list');
  const [currentId, setCurrentId] = useState(null);
  const [search, setSearch]       = useState('');

  // Imagens do RTE — anexadas na hora de gerar, não persistidas no banco
  const [isFotosModal, setIsFotosModal] = useState(false);
  const [fotos, setFotos]               = useState({});

  const rte = useMemo(() => rtes.find(r => r.id === currentId) || null, [rtes, currentId]);

  const filtered = rtes.filter(r =>
    `${r.numero_completo || ''} ${r.cliente_nome || ''} ${r.descricao_tecnica || ''}`
      .toLowerCase().includes(search.toLowerCase())
  );

  const handleNovo = async () => {
    const id = await addRTE({
      numero_completo: '',
      status: 'rascunho',
      data_emissao: new Date().toISOString().split('T')[0],
      dados_rte: {},
      dimensoes: { diametro: '', altura: '', area: '' },
      garantia_meses: 36,
      inspecao_meses: 12,
    });
    if (id) abrir(id);
    else window.alert('Não foi possível criar o RTE. Execute supabase/schema_v9_rte_avulso.sql no SQL Editor do Supabase.');
  };

  const abrir = (id) => { setCurrentId(id); setFotos({}); setView('form'); };

  const set = (campo, valor) => {
    if (!currentId) return;
    updateRTE(currentId, campo, CAMPOS_DATA.has(campo) && !valor ? null : valor);
  };

  if (!rteDisponivel) return <AvisoMigracao />;
  if (view === 'list') return <ListView filtered={filtered} search={search} setSearch={setSearch} onNovo={handleNovo} onOpen={abrir} />;
  if (!rte) return null;

  // ── Dados vindos da obra (quando vinculada) ──
  const obra       = rte.obra_id ? obras.find(o => o.id === rte.obra_id) : null;
  const cronograma = obra ? getCronogramaObra(obra.id) : [];
  const equipe     = obra ? funcionarios.filter(f => f.obraAtualId === obra.id) : [];
  const ptc        = rte.ptc_id ? ptcs.find(p => p.id === rte.ptc_id) : null;
  // Técnico digitado no RTE vem primeiro; a equipe da obra completa a lista
  const tecnicos = rte.tecnico_nome
    ? [{ nome: rte.tecnico_nome, funcao: rte.tecnico_cargo }, ...equipe.filter(f => f.nome !== rte.tecnico_nome)]
    : equipe;

  const vincularObra = (obraId) => {
    set('obra_id', obraId || null);
    const o = obras.find(x => x.id === obraId);
    if (!o) return;
    // Preenche só o que ainda está vazio, para não apagar o que já foi digitado
    if (!rte.cliente_nome) set('cliente_nome', o.nome || '');
    if (!rte.local) set('local', o.endereco || '');
    const ptcDaObra = ptcs.find(p => p.obra_id === o.id);
    if (!rte.ptc_id && ptcDaObra) set('ptc_id', ptcDaObra.id);
  };

  const gerarNumero = () => {
    const hoje = new Date();
    const mm = String(hoje.getMonth() + 1).padStart(2, '0');
    const aa = String(hoje.getFullYear()).slice(-2);
    const maxNum = rtes.reduce((max, r) => {
      const m = r.numero_completo?.match(/RTE-(\d+)/);
      return m ? Math.max(max, parseInt(m[1])) : max;
    }, 0);
    set('numero_completo', `RTE-${String(maxNum + 1).padStart(4, '0')}.${mm}.${aa} REV00`);
  };

  const handleDeletar = async () => {
    if (!window.confirm('Excluir este RTE?')) return;
    await deleteRTE(currentId);
    setCurrentId(null);
    setView('list');
  };

  /* Seções fotográficas do RTE. Grupos sem imagem não são impressos —
     por isso o anexo é pedido antes de gerar o documento. */
  const gruposFotos = [
    { id: 'estrutura', titulo: 'Estrutura — condição anterior à intervenção', dica: 'Fotos do equipamento antes do início dos serviços' },
    ...(cronograma.length > 0
      ? cronograma.map((e, i) => ({
          id: `proc-${i}`,
          titulo: `Procedimento — etapa ${i + 1}: ${e.etapa || 'sem nome'}`,
          dica: 'Fotos da execução desta etapa',
        }))
      : [{ id: 'procedimento', titulo: 'Procedimento — etapas de execução', dica: 'Fotos da execução dos serviços' }]),
    { id: 'ensaios', titulo: 'Ensaios e testes', dica: 'Fotos dos ensaios e medições realizados' },
    { id: 'final', titulo: 'Imagens do equipamento — condição final', dica: 'Fotos após a conclusão dos serviços' },
  ];

  const gerarRTE = async () => {
    // Abre a janela no clique (evita bloqueio de pop-up) e só depois valida a logo
    const w = window.open('', '_blank');
    const html = gerarHTMLRTE(montarDocRTE(rte, obra), await empresaParaImpressao(empresa), cronograma, ptc, tecnicos, fotos);
    if (w) { w.document.write(html); w.document.close(); }
  };

  const dim = rte.dimensoes || {};
  const dados = rte.dados_rte || {};
  const setDim = (k, v) => set('dimensoes', { ...dim, [k]: v });
  const setDado = (k, v) => set('dados_rte', { ...dados, [k]: v });

  return (
    <div style={{ maxWidth: 960, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Topbar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button className="btn" onClick={() => { setView('list'); setCurrentId(null); }}>
            <ChevronLeft size={16} /> Lista
          </button>
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 700 }}>{rte.numero_completo || 'Novo RTE'}</h2>
            <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 20, display: 'inline-block', marginTop: 2,
              color: STATUS[rte.status]?.color, background: STATUS[rte.status]?.bg }}>
              {STATUS[rte.status]?.label || rte.status}
            </span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-primary" onClick={() => setIsFotosModal(true)} style={{ whiteSpace: 'nowrap' }}>
            <ClipboardList size={15} /> Gerar RTE (PDF)
          </button>
          <button className="btn" onClick={handleDeletar} style={{ color: 'var(--danger)' }}>
            <Trash2 size={15} />
          </button>
        </div>
      </div>
      <p className="text-muted" style={{ fontSize: 12, marginTop: -10 }}>
        Ao gerar, o sistema pede as imagens de cada seção. Seções sem imagem não entram no documento.
      </p>

      <ModalFotosRelatorio
        isOpen={isFotosModal}
        onClose={() => setIsFotosModal(false)}
        titulo="Imagens do RTE"
        rotuloGerar="Gerar RTE (PDF)"
        grupos={gruposFotos}
        fotos={fotos}
        setFotos={setFotos}
        onGerar={() => { setIsFotosModal(false); gerarRTE(); }}
      />

      {/* Identificação */}
      <Bloco titulo="Identificação do Documento">
        <Grid>
          <Field label="Nº RTE">
            <div style={{ display: 'flex', gap: 6 }}>
              <input style={inp} placeholder="RTE-0000.MM.AA REV00" value={rte.numero_completo || ''}
                onChange={e => set('numero_completo', e.target.value)} />
              <button className="btn" onClick={gerarNumero} style={{ whiteSpace: 'nowrap', background: 'var(--primary-light)', color: 'var(--primary)' }}>
                Gerar
              </button>
            </div>
          </Field>
          <Field label="Status">
            <select style={inp} value={rte.status || 'rascunho'} onChange={e => set('status', e.target.value)}>
              <option value="rascunho">Rascunho</option>
              <option value="emitido">Emitido</option>
            </select>
          </Field>
          <Field label="Data de Emissão">
            <input type="date" style={inp} value={rte.data_emissao || ''} onChange={e => set('data_emissao', e.target.value)} />
          </Field>
          <Field label="Tipo de Serviço">
            <select style={inp} value={rte.tipo_servico || ''} onChange={e => set('tipo_servico', e.target.value)}>
              <option value="">— Selecionar —</option>
              {TIPOS_SERVICO.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </Field>
        </Grid>
      </Bloco>

      {/* Contratante */}
      <Bloco titulo="Contratante e Execução">
        <Grid>
          <Field label="Obra Vinculada (opcional)">
            <select style={inp} value={rte.obra_id || ''} onChange={e => vincularObra(e.target.value)}>
              <option value="">Nenhuma</option>
              {obras.map(o => <option key={o.id} value={o.id}>{o.nome}</option>)}
            </select>
          </Field>
          <Field label="PTC Referência (opcional)">
            <select style={inp} value={rte.ptc_id || ''} onChange={e => set('ptc_id', e.target.value || null)}>
              <option value="">Nenhuma</option>
              {ptcs.map(p => <option key={p.id} value={p.id}>{p.numero_completo || 'PTC sem número'}{p.cliente_nome ? ` · ${p.cliente_nome}` : ''}</option>)}
            </select>
          </Field>
          <Field label="Contratante">
            <input style={inp} value={rte.cliente_nome || ''} onChange={e => set('cliente_nome', e.target.value)} placeholder="Nome do cliente / unidade" />
          </Field>
          <Field label="Local da Execução">
            <input style={inp} value={rte.local || ''} onChange={e => set('local', e.target.value)} placeholder="Endereço ou cidade" />
          </Field>
          <Field label="Responsável do Cliente (acompanhante)">
            <input style={inp} value={rte.responsavel_cliente || ''} onChange={e => set('responsavel_cliente', e.target.value)} placeholder="Nome e cargo" />
          </Field>
          <Field label="Início da Execução">
            <input type="date" style={inp} value={rte.periodo_inicio || ''} onChange={e => set('periodo_inicio', e.target.value)} />
          </Field>
          <Field label="Fim da Execução">
            <input type="date" style={inp} value={rte.periodo_fim || ''} onChange={e => set('periodo_fim', e.target.value)} />
          </Field>
          <Field label="Técnico Responsável">
            <input style={inp} value={rte.tecnico_nome || ''} onChange={e => set('tecnico_nome', e.target.value)} placeholder={equipe[0]?.nome || 'Nome'} />
          </Field>
          <Field label="Cargo do Técnico">
            <input style={inp} value={rte.tecnico_cargo || ''} onChange={e => set('tecnico_cargo', e.target.value)} placeholder={equipe[0]?.funcao || 'Cargo'} />
          </Field>
        </Grid>
        {obra && (
          <p className="text-muted" style={{ fontSize: 12, marginTop: 12 }}>
            Período em branco usa o cronograma da obra ({cronograma.length} etapa{cronograma.length === 1 ? '' : 's'});
            técnico em branco usa a equipe alocada ({equipe.length} profissional{equipe.length === 1 ? '' : 'is'}).
          </p>
        )}
      </Bloco>

      {/* Dados técnicos dinâmicos por tipo de serviço */}
      <CamposTipo tipo={rte.tipo_servico} dados={dados} setDado={setDado} />

      {/* Dados Fiscais */}
      <Bloco titulo="Dados Fiscais">
        <Grid>
          <Field label="Pedido Nº"><input style={inp} value={rte.pedido_numero || ''} onChange={e => set('pedido_numero', e.target.value)} /></Field>
          <Field label="Data do Pedido"><input type="date" style={inp} value={rte.pedido_data || ''} onChange={e => set('pedido_data', e.target.value)} /></Field>
          <Field label="ART Nº"><input style={inp} value={rte.art_numero || ''} onChange={e => set('art_numero', e.target.value)} /></Field>
          <Field label="Data da ART"><input type="date" style={inp} value={rte.art_data || ''} onChange={e => set('art_data', e.target.value)} /></Field>
          <Field label="Nota Fiscal Nº"><input style={inp} value={rte.nf_numero || ''} onChange={e => set('nf_numero', e.target.value)} /></Field>
          <Field label="Data da NF"><input type="date" style={inp} value={rte.nf_data || ''} onChange={e => set('nf_data', e.target.value)} /></Field>
        </Grid>
      </Bloco>

      {/* Equipamento */}
      <Bloco titulo="Equipamento">
        <Grid>
          <div style={{ gridColumn: '1 / -1' }}>
            <Field label="Material / Tipo do Equipamento">
              <input style={inp} placeholder="Ex: AÇO CARBONO, PRFV, CONCRETO" value={rte.material_equipamento || ''} onChange={e => set('material_equipamento', e.target.value)} />
            </Field>
          </div>
          <Field label="Diâmetro"><input style={inp} placeholder="Ex: 3.000 mm" value={dim.diametro || ''} onChange={e => setDim('diametro', e.target.value)} /></Field>
          <Field label="Altura"><input style={inp} placeholder="Ex: 8.500 mm" value={dim.altura || ''} onChange={e => setDim('altura', e.target.value)} /></Field>
          <Field label="Área (m²)"><input style={inp} placeholder="Ex: 85,00" value={dim.area || ''} onChange={e => setDim('area', e.target.value)} /></Field>
        </Grid>
      </Bloco>

      {/* Garantia e Descrição */}
      <Bloco titulo="Garantia e Descrição Técnica">
        <Grid>
          <Field label="Prazo de Garantia (meses)">
            <input type="number" min="1" style={inp} value={rte.garantia_meses ?? 36} onChange={e => set('garantia_meses', parseInt(e.target.value) || 36)} />
          </Field>
          <Field label="Periodicidade de Inspeção (meses)">
            <input type="number" min="1" style={inp} value={rte.inspecao_meses ?? 12} onChange={e => set('inspecao_meses', parseInt(e.target.value) || 12)} />
          </Field>
          <div style={{ gridColumn: '1 / -1' }}>
            <Field label="Descrição Técnica do Serviço (texto da Introdução)">
              <textarea rows={4} style={{ ...inp, resize: 'vertical', lineHeight: 1.5 }}
                placeholder="Descreva o serviço executado..."
                value={rte.descricao_tecnica || ''} onChange={e => set('descricao_tecnica', e.target.value)} />
            </Field>
          </div>
        </Grid>
      </Bloco>
    </div>
  );
}

// ── Campos técnicos por tipo de serviço ──────────────────────
function CamposTipo({ tipo, dados, setDado }) {
  if (!tipo) return null;
  const tipoLabel = TIPOS_SERVICO.find(t => t.value === tipo)?.label || tipo;

  const txt = (key, placeholder = '') => (
    <input style={inp} placeholder={placeholder} value={dados[key] || ''} onChange={e => setDado(key, e.target.value)} />
  );
  const num = (key) => (
    <input type="number" style={inp} value={dados[key] || ''} onChange={e => setDado(key, e.target.value)} />
  );
  const ta = (key) => (
    <textarea rows={3} style={{ ...inp, resize: 'vertical', lineHeight: 1.5 }} value={dados[key] || ''} onChange={e => setDado(key, e.target.value)} />
  );
  const sel = (key, options) => (
    <SelectOther value={dados[key] || ''} onChange={v => setDado(key, v)} options={options} />
  );
  const chk = (key, label) => (
    <label key={key} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer' }}>
      <input type="checkbox" checked={!!dados[key]} onChange={e => setDado(key, e.target.checked)} style={{ width: 15, height: 15 }} />
      {label}
    </label>
  );

  let corpo;
  switch (tipo) {
    case 'REVESTIMENTO_PINTURA':
      corpo = (
        <>
          <Grid>
            <Field label="Produto / Sistema">{txt('produto_nome')}</Field>
            <Field label="Fabricante">{txt('fabricante')}</Field>
            <Field label="Norma de Preparo de Superfície">{sel('norma_jato', NORMA_JATO)}</Field>
            <Field label="Sistema de Aplicação">{sel('sistema_aplicacao', SIST_APL)}</Field>
          </Grid>
          <p style={{ ...lbl, marginTop: 16, marginBottom: 10 }}>Camadas de Tinta</p>
          {[1, 2, 3].map(n => (
            <div key={n} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: 12, marginBottom: 8, padding: '10px 12px', background: 'var(--background)', borderRadius: 8 }}>
              <Field label={`Camada ${n} — Material/Produto`}>{txt(`camada_${n}_material`)}</Field>
              <Field label="Cor">{txt(`camada_${n}_cor`)}</Field>
              <Field label="Esp. Úmida (µm)">{num(`camada_${n}_esp_umida`)}</Field>
              <Field label="Esp. Seca (µm)">{num(`camada_${n}_esp_seca`)}</Field>
            </div>
          ))}
          <div style={{ marginTop: 8, maxWidth: 220 }}>
            <Field label="Espessura Total Seca (µm)">{num('espessura_total')}</Field>
          </div>
        </>
      );
      break;
    case 'REVESTIMENTO_IMPERMEABILIZANTE':
      corpo = (
        <Grid>
          <Field label="Produto / Sistema">{txt('produto_nome')}</Field>
          <Field label="Fabricante">{txt('fabricante')}</Field>
          <Field label="Sistema de Aplicação">{sel('sistema_aplicacao', SIST_APL)}</Field>
          <Field label="Espessura Interna (µm)">{num('espessura_interna')}</Field>
          <Field label="Espessura Externa (µm)">{num('espessura_externa')}</Field>
        </Grid>
      );
      break;
    case 'RECUPERACAO_LINER':
      corpo = (
        <>
          <Grid>
            <Field label="Tipo de Manta">{sel('tipo_manta', ['Fibra de vidro 300 g/m²', 'Fibra de vidro 450 g/m²', 'Fibra de vidro 600 g/m²', 'Mat de fibra de vidro', 'Woven roving'])}</Field>
            <Field label="Resina">{sel('resina', ['Derakane 411-350', 'Derakane 510C-350', 'Éster vinílico', 'Epóxi', 'Poliéster'])}</Field>
            <Field label="Tratamento Químico">{txt('tratamento_quimico')}</Field>
            <Field label="Acabamento">{sel('acabamento', ['Gel coat', 'Véu de superfície C', 'Lixado', 'Polido'])}</Field>
            <Field label="Área Total (m²)">{txt('area_total_m2')}</Field>
          </Grid>
          <p style={{ ...lbl, marginTop: 14, marginBottom: 8 }}>Áreas Executadas</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 20 }}>
            {[['interno', 'Liner interno'], ['externo', 'Liner externo'], ['estrutural', 'Reforço estrutural'], ['fundo', 'Fundo do equipamento']].map(([k, l]) => chk(k, l))}
          </div>
        </>
      );
      break;
    case 'INJECAO_QUIMICA':
      corpo = (
        <>
          <Grid>
            <Field label="Produto Injetado">{sel('produto_injetado', ['Poliuretano flexível', 'Poliuretano rígido', 'Epóxi bicomponente', 'Acrílico expansivo'])}</Field>
            <Field label="Total de Pontos de Injeção">{num('total_pontos')}</Field>
            <Field label="Área Recuperada (m²)">{txt('area_recuperada_m2')}</Field>
          </Grid>
          <div style={{ marginTop: 8 }}><Field label="Descrição das Áreas Recuperadas">{ta('descricao_areas')}</Field></div>
        </>
      );
      break;
    case 'SOLDA_PLASTICA':
      corpo = (
        <>
          <Grid>
            <Field label="Material Base">{sel('material_base', ['PP', 'PRFV', 'PEAD', 'PVC', 'ABS'])}</Field>
            <Field label="Tipo de Solda">{sel('tipo_solda', ['Termofusão', 'Extrusão', 'Topo quente', 'Eletrofusão'])}</Field>
            <Field label="Área Reparada (m²)">{txt('area_reparada_m2')}</Field>
          </Grid>
          <div style={{ marginTop: 8 }}><Field label="Descrição dos Reparos">{ta('descricao')}</Field></div>
        </>
      );
      break;
    case 'CONSTRUCAO':
      corpo = (
        <>
          <Grid>
            <Field label="Material">{txt('material')}</Field>
            <Field label="Norma Aplicável">{txt('norma', 'NBR XXXX')}</Field>
          </Grid>
          <div style={{ marginTop: 8 }}><Field label="Descrição da Estrutura">{ta('descricao_estrutura')}</Field></div>
        </>
      );
      break;
    default:
      return null;
  }

  return <Bloco titulo={`Dados Técnicos — ${tipoLabel}`}>{corpo}</Bloco>;
}

// Select com opção "Outro..." que abre um campo livre
function SelectOther({ value, onChange, options }) {
  const [showInput, setShowInput] = useState(() => !!(value && !options.includes(value)));
  const isCustom = showInput || !!(value && !options.includes(value));
  const handleSelect = (e) => {
    if (e.target.value === '__outro__') { setShowInput(true); onChange(''); }
    else { setShowInput(false); onChange(e.target.value); }
  };
  return (
    <div>
      <select style={inp} value={isCustom ? '__outro__' : (value || '')} onChange={handleSelect}>
        <option value="">— Selecionar —</option>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
        <option value="__outro__">Outro...</option>
      </select>
      {isCustom && (
        <input style={{ ...inp, marginTop: 6 }} placeholder="Especificar..." value={value || ''} onChange={e => onChange(e.target.value)} />
      )}
    </div>
  );
}

// Mostrado enquanto a tabela rte não existe no Supabase
function AvisoMigracao() {
  return (
    <div className="card" style={{ maxWidth: 640, margin: '40px auto', padding: 28, border: '1px solid rgba(245,158,11,0.4)' }}>
      <h2 style={{ fontSize: 17, fontWeight: 700, marginBottom: 8 }}>RTE precisa de uma atualização no banco</h2>
      <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
        Abra o Supabase → <strong>SQL Editor</strong> → <strong>New query</strong>, cole o conteúdo do arquivo
        <code style={{ margin: '0 4px' }}>supabase/schema_v9_rte_avulso.sql</code> e clique em <strong>Run</strong>.
        Os RTEs que já estavam preenchidos dentro das obras são copiados para cá automaticamente.
        Depois, recarregue esta página.
      </p>
    </div>
  );
}

// ── Lista ─────────────────────────────────────────────────────
function ListView({ filtered, search, setSearch, onNovo, onOpen }) {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700 }}>RTEs</h1>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>Relatórios Técnicos de Execução</p>
        </div>
        <button className="btn btn-primary" onClick={onNovo}>
          <FilePlus size={16} /> Novo RTE
        </button>
      </div>

      <div style={{ position: 'relative', marginBottom: 16 }}>
        <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
        <input style={{ ...inp, paddingLeft: 36 }} value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Buscar por número, contratante ou descrição..." />
      </div>

      {filtered.length === 0 ? (
        <div className="card" style={{ padding: 40, textAlign: 'center' }}>
          <ClipboardList size={40} style={{ color: 'var(--text-muted)', margin: '0 auto 12px' }} />
          <p style={{ color: 'var(--text-muted)' }}>Nenhum RTE encontrado. Crie o primeiro!</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {filtered.map(r => (
            <div key={r.id} className="card hover-effect" onClick={() => onOpen(r.id)}
              style={{ padding: '12px 16px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p style={{ fontWeight: 700, fontSize: 14 }}>{r.numero_completo || 'Sem número'}</p>
                <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
                  {r.cliente_nome || 'Contratante não informado'}
                  {r.tipo_servico ? ' · ' + (TIPOS_SERVICO.find(t => t.value === r.tipo_servico)?.label || r.tipo_servico) : ''}
                </p>
              </div>
              <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 20, color: STATUS[r.status]?.color, background: STATUS[r.status]?.bg }}>
                {STATUS[r.status]?.label || r.status}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const inp = {
  width: '100%', padding: '8px 10px', borderRadius: 8,
  border: '1px solid var(--border)', background: 'var(--surface)',
  color: 'var(--text-primary)', fontSize: 13, outline: 'none',
};
const lbl = { display: 'block', fontSize: 12, color: 'var(--text-muted)', marginBottom: 4, fontWeight: 600 };

function Bloco({ titulo, children }) {
  return (
    <div className="card">
      <p style={{ fontWeight: 700, fontSize: 12, textTransform: 'uppercase', letterSpacing: '.05em', color: 'var(--text-muted)', marginBottom: 16 }}>{titulo}</p>
      {children}
    </div>
  );
}

function Grid({ children }) {
  return <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>{children}</div>;
}

function Field({ label, children }) {
  return (
    <div>
      {label && <label style={lbl}>{label}</label>}
      {children}
    </div>
  );
}
