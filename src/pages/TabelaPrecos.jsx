import React, { useState } from 'react';
import { Plus, Tag, Trash2 } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import InlineEdit from '../components/InlineEdit';
import Modal from '../components/Modal';

export default function TabelaPrecos() {
  const { catalogo, addCatalogoItem, updateCatalogoItem, deleteCatalogoItem, formatCurrency } = useAppContext();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [nome, setNome] = useState('');
  const [tipo, setTipo] = useState('Fixo');
  const [custo, setCusto] = useState('');

  const handleAddItem = (e) => {
    e.preventDefault();
    if (!nome || !custo) return;
    addCatalogoItem({ nome, tipo, custo: parseFloat(custo) });
    setIsModalOpen(false); setNome(''); setCusto(''); setTipo('Fixo');
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Catálogo de Insumos</h1>
          <p className="page-subtitle">Edite preços e descrições clicando diretamente nos valores</p>
        </div>
        <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}><Plus size={18} /> Novo Item</button>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table className="table-editable">
            <thead>
              <tr>
                <th>Descrição do Insumo</th>
                <th>Classificação</th>
                <th style={{ textAlign: 'right' }}>Custo Base (R$)</th>
                <th style={{ width: 40 }}></th>
              </tr>
            </thead>
            <tbody>
              {catalogo.map(item => (
                <tr key={item.id}>
                  <td>
                    <div className="flex items-center gap-2">
                      <Tag size={16} color="var(--primary)" />
                      <InlineEdit value={item.nome} onSave={v => updateCatalogoItem(item.id, 'nome', v)} />
                    </div>
                  </td>
                  <td>
                    <InlineEdit value={item.tipo} type="select" options={['Fixo', 'Esporádico']} onSave={v => updateCatalogoItem(item.id, 'tipo', v)} />
                  </td>
                  <td style={{ textAlign: 'right', fontWeight: 600 }}>
                    <InlineEdit value={item.custo} type="currency" onSave={v => updateCatalogoItem(item.id, 'custo', v)} />
                  </td>
                  <td>
                    <button className="icon-btn" style={{ color: 'var(--danger)' }} onClick={() => deleteCatalogoItem(item.id)}><Trash2 size={15} /></button>
                  </td>
                </tr>
              ))}
              {catalogo.length === 0 && (
                <tr><td colSpan="4" style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)' }}>Catálogo vazio.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Novo Item">
        <form onSubmit={handleAddItem} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label className="text-secondary" style={{ display: 'block', fontSize: 13, marginBottom: 4 }}>Nome / Descrição</label>
            <input autoFocus required type="text" value={nome} onChange={e => setNome(e.target.value)} style={{ width: '100%', padding: 10, borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', outline: 'none' }} />
          </div>
          <div className="flex gap-4">
            <div style={{ flex: 1 }}>
              <label className="text-secondary" style={{ display: 'block', fontSize: 13, marginBottom: 4 }}>Tipo</label>
              <select value={tipo} onChange={e => setTipo(e.target.value)} style={{ width: '100%', padding: 10, borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', outline: 'none' }}>
                <option value="Fixo">Custo Fixo</option>
                <option value="Esporádico">Esporádico</option>
              </select>
            </div>
            <div style={{ flex: 1 }}>
              <label className="text-secondary" style={{ display: 'block', fontSize: 13, marginBottom: 4 }}>Custo (R$)</label>
              <input required type="number" step="0.01" value={custo} onChange={e => setCusto(e.target.value)} style={{ width: '100%', padding: 10, borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', outline: 'none' }} />
            </div>
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Inserir</button>
        </form>
      </Modal>
    </div>
  );
}
