import React, { useState } from 'react';
import { ArrowUpRight, ArrowDownRight, Filter, Download, Plus, Trash2 } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import InlineEdit from '../components/InlineEdit';
import Modal from '../components/Modal';

export default function Financeiro() {
  const { transacoes, addTransacao, updateTransacao, deleteTransacao, obras, formatCurrency } = useAppContext();
  const [abaAtiva, setAbaAtiva] = useState('todas');
  const [isModal, setIsModal] = useState(false);
  const [novaDesc, setNovaDesc] = useState('');
  const [novoValor, setNovoValor] = useState('');
  const [novoTipo, setNovoTipo] = useState('saida');

  const filtrar = () => {
    if (abaAtiva === 'entradas') return transacoes.filter(t => t.tipo === 'entrada');
    if (abaAtiva === 'saidas') return transacoes.filter(t => t.tipo === 'saida');
    if (abaAtiva === 'pendentes') return transacoes.filter(t => t.status === 'pendente');
    return transacoes;
  };

  const entradas = transacoes.filter(t => t.tipo === 'entrada').reduce((a, t) => a + t.valor, 0);
  const saidas = transacoes.filter(t => t.tipo === 'saida').reduce((a, t) => a + t.valor, 0);

  const handleAdd = (e) => {
    e.preventDefault();
    if (!novaDesc || !novoValor) return;
    addTransacao({ descricao: novaDesc, valor: parseFloat(novoValor), tipo: novoTipo, status: 'pendente', data: new Date().toISOString().split('T')[0], obraId: null });
    setIsModal(false); setNovaDesc(''); setNovoValor('');
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Controle Financeiro</h1>
          <p className="page-subtitle">Edite qualquer transação clicando diretamente nos valores</p>
        </div>
        <div className="flex gap-2">
          <button className="btn btn-secondary" style={{ color: 'var(--danger)' }} onClick={() => { setNovoTipo('saida'); setIsModal(true); }}><ArrowDownRight size={16} /> Despesa</button>
          <button className="btn btn-primary" onClick={() => { setNovoTipo('entrada'); setIsModal(true); }}><ArrowUpRight size={16} /> Receita</button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
        <div className="card" style={{ padding: 16 }}>
          <p className="text-secondary" style={{ fontSize: 13 }}>Total Entradas</p>
          <h3 style={{ fontSize: 24, fontWeight: 700, color: 'var(--success)' }}>{formatCurrency(entradas)}</h3>
        </div>
        <div className="card" style={{ padding: 16 }}>
          <p className="text-secondary" style={{ fontSize: 13 }}>Total Saídas</p>
          <h3 style={{ fontSize: 24, fontWeight: 700, color: 'var(--danger)' }}>{formatCurrency(saidas)}</h3>
        </div>
        <div className="card" style={{ padding: 16 }}>
          <p className="text-secondary" style={{ fontSize: 13 }}>Saldo</p>
          <h3 style={{ fontSize: 24, fontWeight: 700, color: entradas - saidas >= 0 ? 'var(--success)' : 'var(--danger)' }}>{formatCurrency(entradas - saidas)}</h3>
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="flex justify-between items-center" style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', flexWrap: 'wrap', gap: 8 }}>
          <div className="flex gap-2">
            {['todas', 'entradas', 'saidas', 'pendentes'].map(aba => (
              <button key={aba} onClick={() => setAbaAtiva(aba)} style={{
                padding: '6px 14px', borderRadius: 20, fontSize: 13, fontWeight: 600,
                backgroundColor: abaAtiva === aba ? 'var(--primary)' : 'transparent',
                color: abaAtiva === aba ? 'white' : 'var(--text-secondary)',
                border: abaAtiva === aba ? 'none' : '1px solid var(--border)', textTransform: 'capitalize'
              }}>{aba}</button>
            ))}
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="table-editable">
            <thead>
              <tr>
                <th>Descrição</th>
                <th>Obra</th>
                <th>Data</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Valor</th>
                <th style={{ width: 40 }}></th>
              </tr>
            </thead>
            <tbody>
              {filtrar().map(t => (
                <tr key={t.id}>
                  <td>
                    <div className="flex items-center gap-3">
                      <div style={{ backgroundColor: t.tipo === 'entrada' ? 'var(--success-bg)' : 'var(--danger-bg)', color: t.tipo === 'entrada' ? 'var(--success)' : 'var(--danger)', borderRadius: '50%', padding: 6, flexShrink: 0 }}>
                        {t.tipo === 'entrada' ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                      </div>
                      <InlineEdit value={t.descricao} onSave={v => updateTransacao(t.id, 'descricao', v)} />
                    </div>
                  </td>
                  <td className="text-secondary" style={{ fontSize: 13 }}>{t.obraId ? (obras.find(o => o.id === t.obraId)?.nome || '-') : 'Geral'}</td>
                  <td><InlineEdit value={t.data} type="date" onSave={v => updateTransacao(t.id, 'data', v)} /></td>
                  <td>
                    <InlineEdit value={t.status} type="select" options={['pago', 'pendente']} onSave={v => updateTransacao(t.id, 'status', v)} />
                  </td>
                  <td style={{ textAlign: 'right', fontWeight: 600, color: t.tipo === 'entrada' ? 'var(--success)' : 'var(--text-primary)' }}>
                    <InlineEdit value={t.valor} type="currency" onSave={v => updateTransacao(t.id, 'valor', v)} />
                  </td>
                  <td><button className="icon-btn" style={{ color: 'var(--danger)' }} onClick={() => deleteTransacao(t.id)}><Trash2 size={14} /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={isModal} onClose={() => setIsModal(false)} title={novoTipo === 'entrada' ? 'Nova Receita' : 'Nova Despesa'}>
        <form onSubmit={handleAdd} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label className="text-secondary" style={{ display: 'block', fontSize: 13, marginBottom: 4 }}>Descrição</label>
            <input autoFocus required value={novaDesc} onChange={e => setNovaDesc(e.target.value)} style={{ width: '100%', padding: 10, borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', outline: 'none' }} />
          </div>
          <div>
            <label className="text-secondary" style={{ display: 'block', fontSize: 13, marginBottom: 4 }}>Valor (R$)</label>
            <input required type="number" step="0.01" value={novoValor} onChange={e => setNovoValor(e.target.value)} style={{ width: '100%', padding: 10, borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', outline: 'none' }} />
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Salvar</button>
        </form>
      </Modal>
    </div>
  );
}
