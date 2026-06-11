import React, { useState, useMemo } from 'react';
import {
  FilePlus, FileText, Search, ChevronLeft, Trash2, Eye, Save,
  Plus, Minus, Copy, CheckCircle, Clock, Edit3, Download
} from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { gerarHTMLPTC } from '../templates/ptcTemplate';

const esc = (s) => s == null ? '' : String(s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const STATUS = {
  rascunho: { label: 'Rascunho', color: 'var(--text-muted)',   bg: 'var(--background)' },
  emitido:  { label: 'Emitido',  color: 'var(--success)',      bg: 'rgba(16,185,129,0.1)' },
};

const TIPOS_SERVICO_PADRAO = [
  { id: '_imp_prfv',     nome: 'Revestimento impermeabilizante com PRFV (liner éster vinílica Derakane)' },
  { id: '_rev_tanque',   nome: 'Revestimento de tanques com liner éster vinílica' },
  { id: '_rec_estrut',   nome: 'Recuperação de manifestações patológicas estruturais em concreto' },
  { id: '_rev_uretano',  nome: 'Revestimento protetivo argamassado uretano' },
  { id: '_pecas_prfv',   nome: 'Desenvolvimento de peças em fibra de vidro (PRFV)' },
  { id: '_proj_material',nome: 'Revestimento com projeção de material' },
  { id: '_polipropileno',nome: 'Revestimento com polipropileno (PP)' },
  { id: '_manta',        nome: 'Impermeabilização com manta' },
];

function fmt(v) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(v) || 0);
}

function calcTotal(ptc) {
  const mat = (ptc.itens_materiais || []).reduce((a, i) => a + (Number(i.qtd)||0)*(Number(i.valor_unit)||0), 0);
  const srv = (ptc.itens_servicos  || []).reduce((a, i) => a + (Number(i.qtd)||0)*(Number(i.valor_unit)||0), 0);
  return mat + srv + (Number(ptc.frete_valor) || 0);
}

// ─────────────────────────────────────────────────────────────────────────────
export default function DocumentosPTC() {
  const { ptcs, addPTC, updatePTC, deletePTC, tiposServico, obras, empresa, formatDate } = useAppContext();
  const [view, setView]           = useState('list');   // 'list' | 'form'
  const [currentId, setCurrentId] = useState(null);
  const [search, setSearch]       = useState('');
  const [activeTab, setActiveTab] = useState('identificacao');
  const [isDeleting, setIsDeleting] = useState(false);

  const ptc = useMemo(() => ptcs.find(p => p.id === currentId) || null, [ptcs, currentId]);

  const allTipos = [...(tiposServico || []), ...TIPOS_SERVICO_PADRAO.filter(
    p => !(tiposServico || []).some(t => t.nome === p.nome)
  )];

  const filtered = ptcs.filter(p =>
    (p.numero_completo + ' ' + p.cliente_nome + ' ' + p.descricao_servico)
      .toLowerCase().includes(search.toLowerCase())
  );

  // ── Criar nova PTC ──────────────────────────────────────────
  const handleNova = async () => {
    const id = await addPTC({
      numero_completo: '',
      status: 'rascunho',
      cliente_nome: '',
      descricao_servico: '',
      elaboracao_nome: '',
      elaboracao_data: new Date().toLocaleDateString('pt-BR'),
      itens_materiais: [],
      itens_servicos: [],
      sequencia_execucao: [],
      revisoes: [],
      prazo_dias: 5,
      num_mobilizacoes: 1,
      frete_valor: 0,
    });
    if (id) { setCurrentId(id); setView('form'); setActiveTab('identificacao'); }
  };

  // ── Abrir PTC existente ─────────────────────────────────────
  const handleOpen = (id) => { setCurrentId(id); setView('form'); setActiveTab('identificacao'); };

  // ── Salvar campo ────────────────────────────────────────────
  const set = (campo, valor) => {
    if (!currentId) return;
    updatePTC(currentId, campo, valor);
  };

  // ── Gerar PDF ───────────────────────────────────────────────
  const handleGerarPDF = () => {
    if (!ptc) return;
    const html = gerarHTMLPTC(ptc, empresa);
    const win = window.open('', '_blank');
    if (win) { win.document.write(html); win.document.close(); }
  };

  // ── Deletar ─────────────────────────────────────────────────
  const handleDeletar = async () => {
    if (!currentId) return;
    if (!window.confirm('Excluir esta PTC? Não é possível desfazer.')) return;
    setIsDeleting(true);
    await deletePTC(currentId);
    setIsDeleting(false);
    setCurrentId(null);
    setView('list');
  };

  // ── Gerador automático de número ────────────────────────────
  const gerarNumero = () => {
    const hoje = new Date();
    const mm   = String(hoje.getMonth() + 1).padStart(2, '0');
    const aa   = String(hoje.getFullYear()).slice(-2);
    const maxNum = ptcs.reduce((max, p) => {
      const m = p.numero_completo?.match(/PTC-(\d+)/);
      return m ? Math.max(max, parseInt(m[1])) : max;
    }, 0);
    const seq  = String(maxNum + 1).padStart(4, '0');
    const rev  = String(ptc?.revisao || 0).padStart(2, '0');
    const numCompleto = `PTC-${seq}.${mm}.${aa} REV${rev}`;
    set('numero', seq);
    set('numero_completo', numCompleto);
    set('data_emissao', hoje.toISOString().split('T')[0]);
  };

  // ── Helpers para JSONB arrays ───────────────────────────────
  const addSeqItem = () => {
    const seq = [...(ptc?.sequencia_execucao || [])];
    const num = seq.length + 1;
    seq.push({ numero: `4.${num}`, texto: '' });
    set('sequencia_execucao', seq);
  };

  const updateSeq = (idx, campo, val) => {
    const seq = [...(ptc?.sequencia_execucao || [])];
    seq[idx] = { ...seq[idx], [campo]: val };
    set('sequencia_execucao', seq);
  };

  const removeSeq = (idx) => {
    const seq = [...(ptc?.sequencia_execucao || [])];
    seq.splice(idx, 1);
    set('sequencia_execucao', seq.map((s, i) => ({ ...s, numero: `4.${i + 1}` })));
  };

  const addMaterial = () => {
    const items = [...(ptc?.itens_materiais || [])];
    items.push({ item: String(items.length + 1), descricao: '', unidade: 'un', qtd: 1, valor_unit: 0 });
    set('itens_materiais', items);
  };

  const updateMat = (idx, campo, val) => {
    const items = [...(ptc?.itens_materiais || [])];
    items[idx] = { ...items[idx], [campo]: campo === 'qtd' || campo === 'valor_unit' ? parseFloat(val) || 0 : val };
    set('itens_materiais', items);
  };

  const removeMat = (idx) => {
    const items = [...(ptc?.itens_materiais || [])];
    items.splice(idx, 1);
    set('itens_materiais', items);
  };

  const addServico = () => {
    const items = [...(ptc?.itens_servicos || [])];
    items.push({ item: String(items.length + 1), descricao: '', unidade: 'm²', qtd: 1, valor_unit: 0 });
    set('itens_servicos', items);
  };

  const updateSrv = (idx, campo, val) => {
    const items = [...(ptc?.itens_servicos || [])];
    items[idx] = { ...items[idx], [campo]: campo === 'qtd' || campo === 'valor_unit' ? parseFloat(val) || 0 : val };
    set('itens_servicos', items);
  };

  const removeSrv = (idx) => {
    const items = [...(ptc?.itens_servicos || [])];
    items.splice(idx, 1);
    set('itens_servicos', items);
  };

  // ── Aplicar tipo de serviço ─────────────────────────────────
  const aplicarTipoServico = (tipoId) => {
    const tipo = [...(tiposServico || []), ...TIPOS_SERVICO_PADRAO].find(t => t.id === tipoId);
    if (!tipo) return;
    if (tipo.texto_objetivo)   set('texto_objetivo',   tipo.texto_objetivo);
    if (tipo.texto_observacoes) set('texto_observacoes', tipo.texto_observacoes);
    if (tipo.sequencia_padrao && tipo.sequencia_padrao.length > 0)
      set('sequencia_execucao', tipo.sequencia_padrao);
    set('tipo_servico_id', tipoId);
  };

  if (view === 'list') return <ListView filtered={filtered} search={search} setSearch={setSearch} onNova={handleNova} onOpen={handleOpen} />;

  if (!ptc) return null;

  const tabs = ['identificacao','conteudo','precos','assinatura'];
  const tabLabels = { identificacao: 'Identificação', conteudo: 'Conteúdo', precos: 'Preços', assinatura: 'Assinatura' };

  const totalGeral = calcTotal(ptc);

  return (
    <div style={{ maxWidth: 920, margin: '0 auto' }}>
      {/* Topbar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button className="btn" onClick={() => { setView('list'); setCurrentId(null); }}>
            <ChevronLeft size={16} /> Lista
          </button>
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 700 }}>
              {ptc.numero_completo || 'Nova PTC'}
            </h2>
            <span style={{
              fontSize: 11, padding: '2px 8px', borderRadius: 20, marginTop: 2, display: 'inline-block',
              color: STATUS[ptc.status]?.color, background: STATUS[ptc.status]?.bg
            }}>
              {STATUS[ptc.status]?.label || ptc.status}
            </span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn" onClick={handleGerarPDF}
            style={{ background: 'var(--primary)', color: 'white' }}>
            <Eye size={15} /> Visualizar PDF
          </button>
          <button className="btn" onClick={handleDeletar} disabled={isDeleting}
            style={{ color: 'var(--danger)' }}>
            <Trash2 size={15} />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 2, marginBottom: 20, borderBottom: '1px solid var(--border)', paddingBottom: 0 }}>
        {tabs.map(t => (
          <button key={t} onClick={() => setActiveTab(t)}
            style={{
              padding: '8px 16px', border: 'none', background: 'transparent', cursor: 'pointer',
              borderBottom: activeTab === t ? '2px solid var(--primary)' : '2px solid transparent',
              color: activeTab === t ? 'var(--primary)' : 'var(--text-secondary)',
              fontWeight: activeTab === t ? 700 : 400, fontSize: 13
            }}>
            {tabLabels[t]}
          </button>
        ))}
      </div>

      {/* TAB: Identificação */}
      {activeTab === 'identificacao' && (
        <div className="card" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Número */}
          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
            <div style={{ flex: 1 }}>
              <label style={lbl}>Número da PTC</label>
              <input style={inp} value={ptc.numero_completo || ''} readOnly
                placeholder="Ex: PTC-0220.07.24 REV00" />
            </div>
            <button className="btn" onClick={gerarNumero} style={{ background: 'var(--primary-light)', color: 'var(--primary)' }}>
              Gerar Número
            </button>
          </div>

          <Row2>
            <Field label="Status">
              <select style={inp} value={ptc.status || 'rascunho'} onChange={e => set('status', e.target.value)}>
                <option value="rascunho">Rascunho</option>
                <option value="emitido">Emitido</option>
              </select>
            </Field>
            <Field label="Data de Emissão">
              <input type="date" style={inp} value={ptc.data_emissao || ''} onChange={e => set('data_emissao', e.target.value)} />
            </Field>
          </Row2>

          {/* Tipo de serviço */}
          <Field label="Tipo de Serviço">
            <select style={inp} value={ptc.tipo_servico_id || ''}
              onChange={e => aplicarTipoServico(e.target.value)}>
              <option value="">Selecionar tipo de serviço...</option>
              {allTipos.map(t => <option key={t.id} value={t.id}>{t.nome}</option>)}
            </select>
          </Field>

          {/* Obra vinculada */}
          <Field label="Obra Vinculada (opcional)">
            <select style={inp} value={ptc.obra_id || ''}
              onChange={e => set('obra_id', e.target.value || null)}>
              <option value="">Nenhuma</option>
              {obras.map(o => <option key={o.id} value={o.id}>{o.nome}</option>)}
            </select>
          </Field>

          <Divider label="Cliente" />

          <Row2>
            <Field label="Razão Social / Nome do Cliente">
              <input style={inp} value={ptc.cliente_nome || ''} onChange={e => set('cliente_nome', e.target.value)} />
            </Field>
            <Field label="CNPJ">
              <input style={inp} value={ptc.cliente_cnpj || ''} onChange={e => set('cliente_cnpj', e.target.value)} />
            </Field>
          </Row2>
          <Field label="Unidade / Obra">
            <input style={inp} value={ptc.cliente_unidade || ''} onChange={e => set('cliente_unidade', e.target.value)}
              placeholder="Ex: COAMO Cândido de Abreu" />
          </Field>
          <Field label="Endereço Completo">
            <input style={inp} value={ptc.cliente_endereco || ''} onChange={e => set('cliente_endereco', e.target.value)} />
          </Field>
          <Row2>
            <Field label="Cidade">
              <input style={inp} value={ptc.cliente_cidade || ''} onChange={e => set('cliente_cidade', e.target.value)} />
            </Field>
            <Field label="Estado (UF)">
              <input style={inp} value={ptc.cliente_estado || ''} onChange={e => set('cliente_estado', e.target.value)} maxLength={2} />
            </Field>
          </Row2>
          <Row2>
            <Field label="Telefone">
              <input style={inp} value={ptc.cliente_fone || ''} onChange={e => set('cliente_fone', e.target.value)} />
            </Field>
            <Field label="E-mail">
              <input style={inp} value={ptc.cliente_email || ''} onChange={e => set('cliente_email', e.target.value)} />
            </Field>
          </Row2>
          <Field label="Contato (Nome)">
            <input style={inp} value={ptc.cliente_contato_nome || ''} onChange={e => set('cliente_contato_nome', e.target.value)} />
          </Field>

          <Divider label="Capa" />

          <Field label="Descrição do Serviço (título em destaque na capa)">
            <textarea style={{ ...inp, minHeight: 56 }} value={ptc.descricao_servico || ''}
              onChange={e => set('descricao_servico', e.target.value)}
              placeholder="Ex: RECUPERAÇÃO DAS MANIFESTAÇÕES PATOLÓGICAS ESTRUTURAIS" />
          </Field>
          <Field label="Subtítulo (linha abaixo do título)">
            <input style={inp} value={ptc.subtitulo_servico || ''} onChange={e => set('subtitulo_servico', e.target.value)}
              placeholder="Ex: REVESTIMENTO PROTETIVO ARGAMASSADO URETANO COM 12mm ESPESSURA MÉDIA" />
          </Field>
          <Field label="Área Total">
            <input style={inp} value={ptc.area_total || ''} onChange={e => set('area_total', e.target.value)}
              placeholder="Ex: Área superior: 96,00m²" />
          </Field>

          <Divider label="Informações de Elaboração" />
          <Row2>
            <Field label="Elaboração — Nome">
              <input style={inp} value={ptc.elaboracao_nome || ''} onChange={e => set('elaboracao_nome', e.target.value)} />
            </Field>
            <Field label="Elaboração — Data">
              <input style={inp} value={ptc.elaboracao_data || ''} onChange={e => set('elaboracao_data', e.target.value)}
                placeholder="DD/MM/AA" />
            </Field>
          </Row2>
          <Row2>
            <Field label="Visita — Nome">
              <input style={inp} value={ptc.visita_nome || ''} onChange={e => set('visita_nome', e.target.value)} />
            </Field>
            <Field label="Solicitante — Nome">
              <input style={inp} value={ptc.solicitante_nome || ''} onChange={e => set('solicitante_nome', e.target.value)} />
            </Field>
          </Row2>
          <Field label="Solicitante — Data">
            <input style={inp} value={ptc.solicitante_data || ''} onChange={e => set('solicitante_data', e.target.value)}
              placeholder="DD/MM/AA" />
          </Field>
        </div>
      )}

      {/* TAB: Conteúdo */}
      {activeTab === 'conteudo' && (
        <div className="card" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>

          <Divider label="1.0 Objetivo" />
          <Field label="Texto do Objetivo (seção 1.1)">
            <textarea style={{ ...inp, minHeight: 90 }} value={ptc.texto_objetivo || ''}
              onChange={e => set('texto_objetivo', e.target.value)}
              placeholder="Em atendimento a vossa solicitação e oportunidade..." />
          </Field>

          <Divider label="3.0 Prazo de Execução" />
          <Row2>
            <Field label="Prazo (dias)">
              <input type="number" style={inp} value={ptc.prazo_dias || 5}
                onChange={e => set('prazo_dias', parseInt(e.target.value) || 5)} />
            </Field>
            <Field label="Regime de trabalho">
              <input style={inp} value={ptc.regime_trabalho || 'regime extraordinário'}
                onChange={e => set('regime_trabalho', e.target.value)} />
            </Field>
          </Row2>

          <Divider label="4.0 Sequência de Execução" />
          {(ptc.sequencia_execucao || []).map((s, i) => (
            <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <input style={{ ...inp, width: 70 }} value={s.numero || ''} onChange={e => updateSeq(i, 'numero', e.target.value)} />
              <input style={{ ...inp, flex: 1 }} value={s.texto || ''} onChange={e => updateSeq(i, 'texto', e.target.value)}
                placeholder="Descrição da etapa..." />
              <button onClick={() => removeSeq(i)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger)' }}>
                <Minus size={15} />
              </button>
            </div>
          ))}
          <button className="btn" onClick={addSeqItem} style={{ alignSelf: 'flex-start' }}>
            <Plus size={14} /> Adicionar Etapa
          </button>

          <Divider label="7.0 Notas" />
          <Field label="Número de mobilizações">
            <input type="number" style={inp} value={ptc.num_mobilizacoes || 1}
              onChange={e => set('num_mobilizacoes', parseInt(e.target.value) || 1)} />
          </Field>

          <Divider label="8.0 Condições Gerais" />
          <Row2>
            <Field label="Frete — Material">
              <input style={inp} value={ptc.frete_material || 'CIF – Obra'} onChange={e => set('frete_material', e.target.value)} />
            </Field>
            <Field label="Frete — Mão de Obra">
              <input style={inp} value={ptc.frete_mao_obra || 'CIF – Obra'} onChange={e => set('frete_mao_obra', e.target.value)} />
            </Field>
          </Row2>
          <Field label="Condições de Pagamento">
            <input style={inp} value={ptc.condicoes_pagamento || '14 dias da emissão da nota'}
              onChange={e => set('condicoes_pagamento', e.target.value)} />
          </Field>

          <Divider label="9.0 Observações Importantes" />
          <Field label="Texto de observações técnicas">
            <textarea style={{ ...inp, minHeight: 90 }} value={ptc.texto_observacoes || ''}
              onChange={e => set('texto_observacoes', e.target.value)}
              placeholder="Por se tratar de um sistema de proteção..." />
          </Field>
        </div>
      )}

      {/* TAB: Preços */}
      {activeTab === 'precos' && (
        <div className="card" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>

          <Divider label="Materiais" />
          {(ptc.itens_materiais || []).map((item, i) => (
            <div key={i} style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
              <input style={{ ...inp, width: 50 }} value={item.item || ''} onChange={e => updateMat(i, 'item', e.target.value)} placeholder="#" />
              <input style={{ ...inp, flex: 2, minWidth: 180 }} value={item.descricao || ''} onChange={e => updateMat(i, 'descricao', e.target.value)} placeholder="Descrição" />
              <input style={{ ...inp, width: 70 }} value={item.unidade || ''} onChange={e => updateMat(i, 'unidade', e.target.value)} placeholder="Un." />
              <input type="number" style={{ ...inp, width: 90 }} value={item.qtd || ''} onChange={e => updateMat(i, 'qtd', e.target.value)} placeholder="Qtd" />
              <input type="number" style={{ ...inp, width: 110 }} value={item.valor_unit || ''} onChange={e => updateMat(i, 'valor_unit', e.target.value)} placeholder="Valor unit." />
              <span style={{ fontSize: 12, color: 'var(--text-muted)', minWidth: 90, textAlign: 'right' }}>
                {fmt((Number(item.qtd)||0) * (Number(item.valor_unit)||0))}
              </span>
              <button onClick={() => removeMat(i)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger)' }}>
                <Minus size={14} />
              </button>
            </div>
          ))}
          <button className="btn" onClick={addMaterial} style={{ alignSelf: 'flex-start' }}>
            <Plus size={14} /> Adicionar Material
          </button>

          <Divider label="Serviços" />
          {(ptc.itens_servicos || []).map((item, i) => (
            <div key={i} style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
              <input style={{ ...inp, width: 50 }} value={item.item || ''} onChange={e => updateSrv(i, 'item', e.target.value)} placeholder="#" />
              <input style={{ ...inp, flex: 2, minWidth: 180 }} value={item.descricao || ''} onChange={e => updateSrv(i, 'descricao', e.target.value)} placeholder="Descrição" />
              <input style={{ ...inp, width: 70 }} value={item.unidade || ''} onChange={e => updateSrv(i, 'unidade', e.target.value)} placeholder="Un." />
              <input type="number" style={{ ...inp, width: 90 }} value={item.qtd || ''} onChange={e => updateSrv(i, 'qtd', e.target.value)} placeholder="Qtd" />
              <input type="number" style={{ ...inp, width: 110 }} value={item.valor_unit || ''} onChange={e => updateSrv(i, 'valor_unit', e.target.value)} placeholder="Valor unit." />
              <span style={{ fontSize: 12, color: 'var(--text-muted)', minWidth: 90, textAlign: 'right' }}>
                {fmt((Number(item.qtd)||0) * (Number(item.valor_unit)||0))}
              </span>
              <button onClick={() => removeSrv(i)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger)' }}>
                <Minus size={14} />
              </button>
            </div>
          ))}
          <button className="btn" onClick={addServico} style={{ alignSelf: 'flex-start' }}>
            <Plus size={14} /> Adicionar Serviço
          </button>

          <Divider label="Totais" />
          <Row2>
            <Field label="Frete de Material (R$)">
              <input type="number" style={inp} value={ptc.frete_valor || 0}
                onChange={e => set('frete_valor', parseFloat(e.target.value) || 0)} />
            </Field>
            <Field label="Desconto (R$)">
              <input type="number" style={inp} value={ptc.desconto_valor || 0}
                onChange={e => set('desconto_valor', parseFloat(e.target.value) || 0)} />
            </Field>
          </Row2>
          {Number(ptc.desconto_valor) > 0 && (
            <Field label="Descrição do Desconto">
              <input style={inp} value={ptc.desconto_descricao || ''} onChange={e => set('desconto_descricao', e.target.value)}
                placeholder="Ex: Valor total com desconto" />
            </Field>
          )}

          <div style={{ background: 'var(--primary-light)', borderRadius: 8, padding: '12px 16px', marginTop: 4 }}>
            <p style={{ color: 'var(--primary)', fontWeight: 700, fontSize: 15 }}>
              Total: {fmt(totalGeral)}
            </p>
            {Number(ptc.desconto_valor) > 0 && (
              <p style={{ color: 'var(--success)', fontWeight: 700, fontSize: 13, marginTop: 4 }}>
                Com desconto: {fmt(totalGeral - (Number(ptc.desconto_valor) || 0))}
              </p>
            )}
          </div>
        </div>
      )}

      {/* TAB: Assinatura */}
      {activeTab === 'assinatura' && (
        <div className="card" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Row2>
            <Field label="Nome do Responsável pela Proposta">
              <input style={inp} value={ptc.responsavel_nome || ''} onChange={e => set('responsavel_nome', e.target.value)}
                placeholder="Ex: Matheus Peiker" />
            </Field>
            <Field label="Cargo">
              <input style={inp} value={ptc.responsavel_cargo || ''} onChange={e => set('responsavel_cargo', e.target.value)}
                placeholder="Ex: Gerente de fábrica" />
            </Field>
          </Row2>

          <Divider label="Histórico de Revisões" />
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: -8 }}>
            As revisões aparecem na capa e na página 2 do documento.
          </p>
          {(ptc.revisoes || []).map((r, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '60px 110px 1fr 120px 100px 120px auto', gap: 6, alignItems: 'center' }}>
              <input style={{ ...inp, textAlign: 'center' }} value={r.rev ?? i} onChange={e => {
                const revs = [...(ptc.revisoes || [])]; revs[i] = { ...revs[i], rev: e.target.value }; set('revisoes', revs);
              }} placeholder="Rev" />
              <input style={inp} value={r.data || ''} onChange={e => {
                const revs = [...(ptc.revisoes || [])]; revs[i] = { ...revs[i], data: e.target.value }; set('revisoes', revs);
              }} placeholder="DD/MM/AA" />
              <input style={inp} value={r.descricao || ''} onChange={e => {
                const revs = [...(ptc.revisoes || [])]; revs[i] = { ...revs[i], descricao: e.target.value }; set('revisoes', revs);
              }} placeholder="Descrição" />
              <input style={inp} value={r.elaboracao || ''} onChange={e => {
                const revs = [...(ptc.revisoes || [])]; revs[i] = { ...revs[i], elaboracao: e.target.value }; set('revisoes', revs);
              }} placeholder="Elaboração" />
              <input style={inp} value={r.visita || ''} onChange={e => {
                const revs = [...(ptc.revisoes || [])]; revs[i] = { ...revs[i], visita: e.target.value }; set('revisoes', revs);
              }} placeholder="Visita" />
              <input style={inp} value={r.solicitante || ''} onChange={e => {
                const revs = [...(ptc.revisoes || [])]; revs[i] = { ...revs[i], solicitante: e.target.value }; set('revisoes', revs);
              }} placeholder="Solicitante" />
              <button onClick={() => { const revs = [...(ptc.revisoes || [])]; revs.splice(i, 1); set('revisoes', revs); }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger)' }}>
                <Minus size={14} />
              </button>
            </div>
          ))}
          <button className="btn" onClick={() => {
            const revs = [...(ptc.revisoes || [])];
            const hoje = new Date().toLocaleDateString('pt-BR');
            revs.push({ rev: String(revs.length).padStart(2,'0'), data: hoje, descricao: '', elaboracao: ptc.elaboracao_nome || '', visita: ptc.visita_nome || '', solicitante: ptc.solicitante_nome || '' });
            set('revisoes', revs);
          }} style={{ alignSelf: 'flex-start' }}>
            <Plus size={14} /> Adicionar Revisão
          </button>

          <div style={{ marginTop: 16, padding: 16, borderRadius: 8, border: '1px dashed var(--border)', textAlign: 'center' }}>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12 }}>
              Prévia da assinatura — aparece na seção 12.0 do documento
            </p>
            <div style={{ display: 'inline-block', textAlign: 'center' }}>
              <div style={{ width: 260, borderTop: '1px solid var(--text-secondary)', paddingTop: 8 }}>
                <p style={{ fontWeight: 600 }}>{ptc.responsavel_nome || 'Matheus Peiker'}</p>
                <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{ptc.responsavel_cargo || 'Gerente de fábrica'}</p>
              </div>
            </div>
          </div>

          <div style={{ marginTop: 8 }}>
            <button className="btn"
              style={{ width: '100%', background: 'var(--primary)', color: 'white', padding: 12, fontSize: 14 }}
              onClick={handleGerarPDF}>
              <Eye size={16} /> Gerar e Visualizar PDF
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Lista ─────────────────────────────────────────────────────
function ListView({ filtered, search, setSearch, onNova, onOpen }) {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700 }}>PTCs</h1>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>
            Propostas Técnicas Comerciais
          </p>
        </div>
        <button className="btn btn-primary" onClick={onNova}>
          <FilePlus size={16} /> Nova PTC
        </button>
      </div>

      <div style={{ position: 'relative', marginBottom: 16 }}>
        <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
        <input style={{ ...inp, paddingLeft: 36 }} value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Buscar por número, cliente ou serviço..." />
      </div>

      {filtered.length === 0 ? (
        <div className="card" style={{ padding: 40, textAlign: 'center' }}>
          <FileText size={40} style={{ color: 'var(--text-muted)', margin: '0 auto 12px' }} />
          <p style={{ color: 'var(--text-muted)' }}>Nenhuma PTC encontrada. Crie a primeira!</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {filtered.map(p => (
            <div key={p.id} className="card hover-effect" onClick={() => onOpen(p.id)}
              style={{ padding: '12px 16px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p style={{ fontWeight: 700, fontSize: 14 }}>
                  {p.numero_completo || 'Sem número'}
                </p>
                <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
                  {p.cliente_nome || 'Cliente não informado'}
                  {p.descricao_servico ? ' · ' + p.descricao_servico.slice(0, 60) : ''}
                </p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{
                  fontSize: 11, padding: '3px 10px', borderRadius: 20,
                  color: STATUS[p.status]?.color, background: STATUS[p.status]?.bg
                }}>
                  {STATUS[p.status]?.label || p.status}
                </span>
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  {fmt(calcTotal(p))}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Helpers de UI ─────────────────────────────────────────────
const inp = {
  width: '100%', padding: '8px 10px', borderRadius: 6,
  border: '1px solid var(--border)', background: 'var(--card)',
  color: 'var(--text-primary)', fontSize: 13, outline: 'none',
};
const lbl = { fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 4, textTransform: 'uppercase' };

function Field({ label, children }) {
  return (
    <div style={{ flex: 1 }}>
      {label && <label style={lbl}>{label}</label>}
      {children}
    </div>
  );
}

function Row2({ children }) {
  return <div style={{ display: 'flex', gap: 12 }}>{children}</div>;
}

function Divider({ label }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '6px 0 2px' }}>
      <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{label}</span>
      <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
    </div>
  );
}
