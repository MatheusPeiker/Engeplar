import React, { useState, useMemo } from 'react';
import { FilePlus, FileText, Search, ChevronLeft, Trash2, Eye, Plus, Minus } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { gerarHTMLRVT } from '../templates/rvtTemplate';

const STATUS = {
  rascunho: { label: 'Rascunho', color: 'var(--text-muted)',   bg: 'var(--background)' },
  emitido:  { label: 'Emitido',  color: 'var(--success)',      bg: 'rgba(16,185,129,0.1)' },
};

// ─────────────────────────────────────────────────────────────────────────────
export default function DocumentosRVT() {
  const { rvts, addRVT, updateRVT, deleteRVT, obras, empresa } = useAppContext();
  const [view, setView]           = useState('list');
  const [currentId, setCurrentId] = useState(null);
  const [search, setSearch]       = useState('');
  const [activeTab, setActiveTab] = useState('identificacao');

  const rvt = useMemo(() => rvts.find(r => r.id === currentId) || null, [rvts, currentId]);

  const filtered = rvts.filter(r =>
    (r.numero_completo + ' ' + r.cliente_nome + ' ' + r.descricao_assunto)
      .toLowerCase().includes(search.toLowerCase())
  );

  const handleNovo = async () => {
    const id = await addRVT({
      numero_completo: '',
      status: 'rascunho',
      tipo_relatorio: 'VISTORIA TÉCNICA',
      subtipo_relatorio: 'ESTRUTURAL',
      cliente_nome: '',
      descricao_assunto: '',
      texto_introducao: '',
      texto_patologia: '',
      contatos_cliente: [],
      fotos: [],
      revisoes: [],
      responsavel_nome: 'John C. Peiker',
      responsavel_cargo: 'Diretor Técnico',
    });
    if (id) { setCurrentId(id); setView('form'); setActiveTab('identificacao'); }
  };

  const handleOpen = (id) => { setCurrentId(id); setView('form'); setActiveTab('identificacao'); };

  const set = (campo, valor) => { if (currentId) updateRVT(currentId, campo, valor); };

  const handleGerarPDF = () => {
    if (!rvt) return;
    const html = gerarHTMLRVT(rvt, empresa);
    const win = window.open('', '_blank');
    if (win) { win.document.write(html); win.document.close(); }
  };

  const handleDeletar = async () => {
    if (!currentId) return;
    if (!window.confirm('Excluir este RVT?')) return;
    await deleteRVT(currentId);
    setCurrentId(null);
    setView('list');
  };

  const gerarNumero = () => {
    const hoje = new Date();
    const mm   = String(hoje.getMonth() + 1).padStart(2, '0');
    const aa   = String(hoje.getFullYear()).slice(-2);
    const maxNum = rvts.reduce((max, r) => {
      const m = r.numero_completo?.match(/RVT-(\d+)/);
      return m ? Math.max(max, parseInt(m[1])) : max;
    }, 0);
    const seq = String(maxNum + 1).padStart(4, '0');
    const rev = String(rvt?.revisao || 0).padStart(2, '0');
    set('numero', seq);
    set('numero_completo', `RVT-${seq}.${mm}.${aa} REV${rev}`);
    set('data_emissao', hoje.toISOString().split('T')[0]);
  };

  // Contatos do cliente
  const addContato = () => {
    const lista = [...(rvt?.contatos_cliente || [])];
    lista.push({ nome: '', cargo: '', email: '', telefone: '' });
    set('contatos_cliente', lista);
  };

  const updateContato = (i, campo, val) => {
    const lista = [...(rvt?.contatos_cliente || [])];
    lista[i] = { ...lista[i], [campo]: val };
    set('contatos_cliente', lista);
  };

  const removeContato = (i) => {
    const lista = [...(rvt?.contatos_cliente || [])];
    lista.splice(i, 1);
    set('contatos_cliente', lista);
  };

  // Fotos
  const addFoto = () => {
    const fotos = [...(rvt?.fotos || [])];
    fotos.push({ url: '', etapa: '', descricao: '', ordem: fotos.length + 1 });
    set('fotos', fotos);
  };

  const updateFoto = (i, campo, val) => {
    const fotos = [...(rvt?.fotos || [])];
    fotos[i] = { ...fotos[i], [campo]: val };
    set('fotos', fotos);
  };

  const removeFoto = (i) => {
    const fotos = [...(rvt?.fotos || [])];
    fotos.splice(i, 1);
    set('fotos', fotos);
  };

  if (view === 'list') return <ListView filtered={filtered} search={search} setSearch={setSearch} onNovo={handleNovo} onOpen={handleOpen} />;

  if (!rvt) return null;

  const tabs = ['identificacao', 'conteudo', 'fotos', 'assinatura'];
  const tabLabels = { identificacao: 'Identificação', conteudo: 'Conteúdo', fotos: 'Fotos', assinatura: 'Assinatura' };

  return (
    <div style={{ maxWidth: 900, margin: '0 auto' }}>
      {/* Topbar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button className="btn" onClick={() => { setView('list'); setCurrentId(null); }}>
            <ChevronLeft size={16} /> Lista
          </button>
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 700 }}>{rvt.numero_completo || 'Novo RVT'}</h2>
            <span style={{
              fontSize: 11, padding: '2px 8px', borderRadius: 20, display: 'inline-block', marginTop: 2,
              color: STATUS[rvt.status]?.color, background: STATUS[rvt.status]?.bg
            }}>
              {STATUS[rvt.status]?.label || rvt.status}
            </span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn" onClick={handleGerarPDF} style={{ background: 'var(--primary)', color: 'white' }}>
            <Eye size={15} /> Visualizar PDF
          </button>
          <button className="btn" onClick={handleDeletar} style={{ color: 'var(--danger)' }}>
            <Trash2 size={15} />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 2, marginBottom: 20, borderBottom: '1px solid var(--border)' }}>
        {tabs.map(t => (
          <button key={t} onClick={() => setActiveTab(t)}
            style={{
              padding: '8px 16px', border: 'none', background: 'transparent', cursor: 'pointer',
              borderBottom: activeTab === t ? '2px solid var(--primary)' : '2px solid transparent',
              color: activeTab === t ? 'var(--primary)' : 'var(--text-secondary)',
              fontWeight: activeTab === t ? 700 : 400, fontSize: 13,
            }}>
            {tabLabels[t]}
          </button>
        ))}
      </div>

      {/* TAB: Identificação */}
      {activeTab === 'identificacao' && (
        <div className="card" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
            <div style={{ flex: 1 }}>
              <label style={lbl}>Número do RVT</label>
              <input style={inp} value={rvt.numero_completo || ''} readOnly placeholder="Ex: RVT-0006.04.26 REV00" />
            </div>
            <button className="btn" onClick={gerarNumero} style={{ background: 'var(--primary-light)', color: 'var(--primary)' }}>
              Gerar Número
            </button>
          </div>

          <Row2>
            <Field label="Status">
              <select style={inp} value={rvt.status || 'rascunho'} onChange={e => set('status', e.target.value)}>
                <option value="rascunho">Rascunho</option>
                <option value="emitido">Emitido</option>
              </select>
            </Field>
            <Field label="Data de Emissão">
              <input type="date" style={inp} value={rvt.data_emissao || ''} onChange={e => set('data_emissao', e.target.value)} />
            </Field>
          </Row2>

          <Row2>
            <Field label="Tipo do Relatório (cabeçalho)">
              <input style={inp} value={rvt.tipo_relatorio || 'VISTORIA TÉCNICA'}
                onChange={e => set('tipo_relatorio', e.target.value)} />
            </Field>
            <Field label="Subtipo (ex: ESTRUTURAL)">
              <input style={inp} value={rvt.subtipo_relatorio || 'ESTRUTURAL'}
                onChange={e => set('subtipo_relatorio', e.target.value)} />
            </Field>
          </Row2>

          <Field label="Obra Vinculada (opcional)">
            <select style={inp} value={rvt.obra_id || ''} onChange={e => set('obra_id', e.target.value || null)}>
              <option value="">Nenhuma</option>
              {obras.map(o => <option key={o.id} value={o.id}>{o.nome}</option>)}
            </select>
          </Field>

          <Divider label="Cliente / Unidade" />
          <Row2>
            <Field label="Nome do Cliente">
              <input style={inp} value={rvt.cliente_nome || ''} onChange={e => set('cliente_nome', e.target.value)} />
            </Field>
            <Field label="Unidade">
              <input style={inp} value={rvt.unidade || ''} onChange={e => set('unidade', e.target.value)}
                placeholder="Ex: UNIDADE: BLUMENAU. SC" />
            </Field>
          </Row2>
          <Field label="Descrição do Assunto (cabeçalho e capa)">
            <textarea style={{ ...inp, minHeight: 56 }} value={rvt.descricao_assunto || ''}
              onChange={e => set('descricao_assunto', e.target.value)}
              placeholder="Ex: SINISTRO NA VIGA DE CONCRETO DE ESTRUTURA PRE-MOLDADA." />
          </Field>

          <Divider label="Agradecimentos — Contatos do Cliente" />
          {(rvt.contatos_cliente || []).map((c, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr auto', gap: 6 }}>
              <input style={inp} value={c.nome || ''} onChange={e => updateContato(i, 'nome', e.target.value)} placeholder="Nome" />
              <input style={inp} value={c.cargo || ''} onChange={e => updateContato(i, 'cargo', e.target.value)} placeholder="Cargo" />
              <input style={inp} value={c.email || ''} onChange={e => updateContato(i, 'email', e.target.value)} placeholder="E-mail" />
              <input style={inp} value={c.telefone || ''} onChange={e => updateContato(i, 'telefone', e.target.value)} placeholder="Telefone" />
              <button onClick={() => removeContato(i)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger)' }}>
                <Minus size={14} />
              </button>
            </div>
          ))}
          <button className="btn" onClick={addContato} style={{ alignSelf: 'flex-start' }}>
            <Plus size={14} /> Adicionar Contato
          </button>
        </div>
      )}

      {/* TAB: Conteúdo */}
      {activeTab === 'conteudo' && (
        <div className="card" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Field label="Introdução">
            <textarea style={{ ...inp, minHeight: 110 }} value={rvt.texto_introducao || ''}
              onChange={e => set('texto_introducao', e.target.value)}
              placeholder="O presente documento visa descrever de forma objetiva e registrar a inspeção de vistoria técnica realizada..." />
          </Field>
          <Field label="Patologia Identificada / Conclusão">
            <textarea style={{ ...inp, minHeight: 130 }} value={rvt.texto_patologia || ''}
              onChange={e => set('texto_patologia', e.target.value)}
              placeholder="Descreva as patologias identificadas, análise e recomendações..." />
          </Field>
        </div>
      )}

      {/* TAB: Fotos */}
      {activeTab === 'fotos' && (
        <div className="card" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            Informe URLs públicas das fotos. As fotos serão agrupadas por etapa na impressão.
          </p>
          {(rvt.fotos || []).map((f, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 150px 1fr auto', gap: 6, alignItems: 'center' }}>
              <input style={inp} value={f.url || ''} onChange={e => updateFoto(i, 'url', e.target.value)} placeholder="URL da foto" />
              <input style={inp} value={f.etapa || ''} onChange={e => updateFoto(i, 'etapa', e.target.value)} placeholder="Etapa (opcional)" />
              <input style={inp} value={f.descricao || ''} onChange={e => updateFoto(i, 'descricao', e.target.value)} placeholder="Legenda" />
              <button onClick={() => removeFoto(i)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger)' }}>
                <Minus size={14} />
              </button>
            </div>
          ))}
          <button className="btn" onClick={addFoto} style={{ alignSelf: 'flex-start' }}>
            <Plus size={14} /> Adicionar Foto
          </button>

          {/* Preview das fotos */}
          {(rvt.fotos || []).filter(f => f.url).length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
              {(rvt.fotos || []).filter(f => f.url).map((f, i) => (
                <div key={i} style={{ width: 'calc(25% - 6px)', textAlign: 'center' }}>
                  <img src={f.url} alt={f.descricao || ''} style={{ width: '100%', height: 100, objectFit: 'cover', borderRadius: 4, border: '1px solid var(--border)' }}
                    onError={e => { e.target.style.display = 'none'; }} />
                  {f.descricao && <p style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>{f.descricao}</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB: Assinatura */}
      {activeTab === 'assinatura' && (
        <div className="card" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Row2>
            <Field label="Nome do Responsável">
              <input style={inp} value={rvt.responsavel_nome || ''} onChange={e => set('responsavel_nome', e.target.value)}
                placeholder="Ex: John C. Peiker" />
            </Field>
            <Field label="Cargo">
              <input style={inp} value={rvt.responsavel_cargo || ''} onChange={e => set('responsavel_cargo', e.target.value)}
                placeholder="Ex: Diretor Técnico" />
            </Field>
          </Row2>

          <div style={{ marginTop: 16, padding: 16, borderRadius: 8, border: '1px dashed var(--border)', textAlign: 'center' }}>
            <div style={{ display: 'inline-block', textAlign: 'center' }}>
              <div style={{ width: 260, borderTop: '1px solid var(--text-secondary)', paddingTop: 8 }}>
                <p style={{ fontWeight: 600 }}>{rvt.responsavel_nome || 'John C. Peiker'}</p>
                <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{rvt.responsavel_cargo || 'Diretor Técnico'}</p>
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
function ListView({ filtered, search, setSearch, onNovo, onOpen }) {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700 }}>RVTs</h1>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>Relatórios de Vistoria Técnica</p>
        </div>
        <button className="btn btn-primary" onClick={onNovo}>
          <FilePlus size={16} /> Novo RVT
        </button>
      </div>

      <div style={{ position: 'relative', marginBottom: 16 }}>
        <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
        <input style={{ ...inp, paddingLeft: 36 }} value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Buscar por número, cliente ou assunto..." />
      </div>

      {filtered.length === 0 ? (
        <div className="card" style={{ padding: 40, textAlign: 'center' }}>
          <FileText size={40} style={{ color: 'var(--text-muted)', margin: '0 auto 12px' }} />
          <p style={{ color: 'var(--text-muted)' }}>Nenhum RVT encontrado. Crie o primeiro!</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {filtered.map(r => (
            <div key={r.id} className="card hover-effect" onClick={() => onOpen(r.id)}
              style={{ padding: '12px 16px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p style={{ fontWeight: 700, fontSize: 14 }}>{r.numero_completo || 'Sem número'}</p>
                <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
                  {r.cliente_nome || 'Cliente não informado'}
                  {r.descricao_assunto ? ' · ' + r.descricao_assunto.slice(0, 60) : ''}
                </p>
              </div>
              <span style={{
                fontSize: 11, padding: '3px 10px', borderRadius: 20,
                color: STATUS[r.status]?.color, background: STATUS[r.status]?.bg
              }}>
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
