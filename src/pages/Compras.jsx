import { useState } from 'react';
import { CheckCircle, Clock, Truck, Plus, Trash2, Search } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import Modal from '../components/Modal';

const STATUS_LABELS = {
  cotacao:           { label: 'Em Cotação',          color: 'var(--warning)',  icon: Clock },
  entrega_pendente:  { label: 'Aguardando Entrega',  color: 'var(--primary)', icon: Truck },
  entregue:          { label: 'Entregue',             color: 'var(--success)', icon: CheckCircle },
};

function StatusBadge({ status }) {
  const s = STATUS_LABELS[status] || { label: status, color: 'var(--text-muted)', icon: Clock };
  const Icon = s.icon;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 8px', borderRadius: 20, fontSize: 12, fontWeight: 500, background: s.color + '20', color: s.color }}>
      <Icon size={13} /> {s.label}
    </span>
  );
}

const inputSt = { width: '100%', padding: 10, borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', outline: 'none', fontSize: 14 };

export default function Compras() {
  const { compras, addCompra, updateCompra, deleteCompra, obras, cronogramas } = useAppContext();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState({
    obraId: '', etapa: '', etapaCustom: '',
    fornecedor: '', cnpjForn: '',
    itens: '', dataPedida: new Date().toISOString().split('T')[0], previsao: '',
  });
  const [loadingCnpj, setLoadingCnpj] = useState(false);

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  // Etapas do cronograma para a obra selecionada
  const etapasDaObra = form.obraId
    ? cronogramas.filter(c => c.obraId === form.obraId).map(c => c.etapa)
    : [];

  const buscarCnpjForn = async () => {
    const clean = (form.cnpjForn || '').replace(/\D/g, '');
    if (clean.length !== 14) { alert('CNPJ inválido.'); return; }
    setLoadingCnpj(true);
    try {
      const r = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${clean}`);
      if (!r.ok) throw new Error('CNPJ não encontrado');
      const d = await r.json();
      set('fornecedor', d.nome_fantasia || d.razao_social);
    } catch (e) { alert(e.message); }
    finally { setLoadingCnpj(false); }
  };

  const handleAdd = (e) => {
    e.preventDefault();
    if (!form.itens) return;
    const etapaFinal = form.etapa === '__custom__' ? form.etapaCustom : form.etapa;
    addCompra({ ...form, etapa: etapaFinal, obraId: form.obraId || null, status: 'cotacao' });
    setIsModalOpen(false);
    setForm({ obraId: '', etapa: '', etapaCustom: '', fornecedor: '', cnpjForn: '', itens: '', dataPedida: new Date().toISOString().split('T')[0], previsao: '' });
  };

  const byStatus = (status) => compras.filter(c => c.status === status);
  const obraName = (obraId) => {
    if (!obraId) return 'Estoque Geral';
    return obras.find(o => o.id === obraId)?.nome || 'Obra removida';
  };

  const columns = [
    { key: 'cotacao',          title: 'Em Cotação' },
    { key: 'entrega_pendente', title: 'Aguardando Entrega' },
    { key: 'entregue',         title: 'Entregue' },
  ];

  return (
    <div className="compras-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Suprimentos e Compras</h1>
          <p className="page-subtitle">Acompanhe requisições de material e gerencie fornecedores</p>
        </div>
        <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
          <Plus size={18} /> Nova Requisição
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20 }}>
        {columns.map(col => (
          <div key={col.key} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: STATUS_LABELS[col.key].color, flexShrink: 0 }} />
              {col.title} ({byStatus(col.key).length})
            </h3>

            {byStatus(col.key).map(item => (
              <div key={item.id} className="card" style={{ padding: 20, opacity: col.key === 'entregue' ? 0.85 : 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                  <span style={{ fontWeight: 600, fontSize: 14 }}>Req. #{String(item.id).slice(-4)}</span>
                  <button className="icon-btn" style={{ color: 'var(--danger)', padding: 2 }} onClick={() => { if (confirm('Excluir requisição?')) deleteCompra(item.id); }}>
                    <Trash2 size={13} />
                  </button>
                </div>

                <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 4 }}>
                  <strong>Obra:</strong> {obraName(item.obraId || item.obra_id)}
                </p>
                {item.etapa && (
                  <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 4 }}>
                    <strong>Etapa:</strong> {item.etapa}
                  </p>
                )}
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 10 }}>
                  <strong>Itens:</strong> {item.itens}
                </p>
                {item.fornecedor && (
                  <p style={{ fontSize: 13, fontWeight: 500, marginBottom: 10 }}>
                    <strong>Fornecedor:</strong> {item.fornecedor}
                  </p>
                )}
                {col.key === 'entrega_pendente' && item.previsao && (
                  <div style={{ background: 'var(--background)', padding: '8px 12px', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, fontSize: 13 }}>
                    <Clock size={14} color="var(--primary)" />
                    <span className="text-secondary">Previsto: </span>
                    <strong>{new Date(item.previsao + 'T12:00:00').toLocaleDateString('pt-BR')}</strong>
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 12, borderTop: '1px solid var(--border)' }}>
                  <StatusBadge status={item.status} />
                  {col.key !== 'entregue' && (
                    <select value={item.status} onChange={e => updateCompra(item.id, 'status', e.target.value)}
                      style={{ fontSize: 11, padding: '3px 6px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--surface)', cursor: 'pointer' }}>
                      <option value="cotacao">Em Cotação</option>
                      <option value="entrega_pendente">Aguardando Entrega</option>
                      <option value="entregue">Entregue</option>
                    </select>
                  )}
                </div>
              </div>
            ))}

            {byStatus(col.key).length === 0 && (
              <div style={{ padding: '24px 16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13, background: 'var(--background)', borderRadius: 12, border: '2px dashed var(--border)' }}>
                Nenhuma requisição aqui
              </div>
            )}
          </div>
        ))}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Nova Requisição de Material">
        <form onSubmit={handleAdd} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* Obra */}
          <div>
            <label style={{ display: 'block', fontSize: 13, marginBottom: 4, color: 'var(--text-secondary)' }}>Obra</label>
            <select value={form.obraId} onChange={e => set('obraId', e.target.value)} style={inputSt}>
              <option value="">Estoque Geral / Todos</option>
              {obras.filter(o => o.status !== 'Concluída').map(o => <option key={o.id} value={o.id}>{o.nome}</option>)}
            </select>
          </div>

          {/* Etapa do cronograma */}
          <div>
            <label style={{ display: 'block', fontSize: 13, marginBottom: 4, color: 'var(--text-secondary)' }}>Etapa do Cronograma</label>
            {etapasDaObra.length > 0 ? (
              <>
                <select value={form.etapa} onChange={e => set('etapa', e.target.value)} style={inputSt}>
                  <option value="">Selecione uma etapa...</option>
                  {etapasDaObra.map((e, i) => <option key={i} value={e}>{e}</option>)}
                  <option value="__custom__">Outra etapa...</option>
                </select>
                {form.etapa === '__custom__' && (
                  <input type="text" placeholder="Descreva a etapa" value={form.etapaCustom}
                    onChange={e => set('etapaCustom', e.target.value)}
                    style={{ ...inputSt, marginTop: 8 }} />
                )}
              </>
            ) : (
              <input type="text" placeholder="Ex: Fundação, Acabamento..." value={form.etapa}
                onChange={e => set('etapa', e.target.value)} style={inputSt} />
            )}
          </div>

          {/* Itens */}
          <div>
            <label style={{ display: 'block', fontSize: 13, marginBottom: 4, color: 'var(--text-secondary)' }}>Itens Solicitados *</label>
            <input required type="text" placeholder="Ex: Cimento CP II 50kg (x10), Ferragens D12..." value={form.itens}
              onChange={e => set('itens', e.target.value)} style={inputSt} />
          </div>

          {/* Fornecedor + CNPJ */}
          <div>
            <label style={{ display: 'block', fontSize: 13, marginBottom: 4, color: 'var(--text-secondary)' }}>Fornecedor</label>
            <input type="text" placeholder="Nome do fornecedor" value={form.fornecedor}
              onChange={e => set('fornecedor', e.target.value)} style={inputSt} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 13, marginBottom: 4, color: 'var(--text-secondary)' }}>CNPJ do Fornecedor <span style={{ fontWeight: 400, color: 'var(--text-muted)' }}>(busca automática)</span></label>
            <div style={{ display: 'flex', gap: 8 }}>
              <input type="text" placeholder="00.000.000/0001-00" value={form.cnpjForn}
                onChange={e => set('cnpjForn', e.target.value)}
                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), buscarCnpjForn())}
                style={{ ...inputSt, flex: 1 }} />
              <button type="button" className="btn btn-primary btn-sm" onClick={buscarCnpjForn} disabled={loadingCnpj}>
                {loadingCnpj ? '...' : <Search size={14} />}
              </button>
            </div>
          </div>

          {/* Datas */}
          <div className="flex gap-4">
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: 13, marginBottom: 4, color: 'var(--text-secondary)' }}>Data do Pedido</label>
              <input type="date" value={form.dataPedida} onChange={e => set('dataPedida', e.target.value)} style={inputSt} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: 13, marginBottom: 4, color: 'var(--text-secondary)' }}>Previsão de Entrega</label>
              <input type="date" value={form.previsao} onChange={e => set('previsao', e.target.value)} style={inputSt} />
            </div>
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: 4 }}>Criar Requisição</button>
        </form>
      </Modal>
    </div>
  );
}
