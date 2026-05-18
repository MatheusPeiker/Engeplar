import { useState } from 'react';
import { Plus, Trash2, FileText, Download, ChevronRight, ArrowLeft } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import InlineEdit from '../components/InlineEdit';
import Modal from '../components/Modal';

export default function Orcamentos() {
  const { obras, listaOrcamentos, funcionarios, addOrcamento, updateOrcamento, deleteOrcamento, addOrcamentoItem, updateOrcamentoItem, deleteOrcamentoItem, formatCurrency } = useAppContext();
  
  const [view, setView] = useState('list'); // 'list' ou 'detail'
  const [currentOrcId, setCurrentOrcId] = useState(null);
  const [isNewOrcModal, setIsNewOrcModal] = useState(false);
  const [newOrcName, setNewOrcName] = useState('');

  const currentOrc = listaOrcamentos.find(o => o.id === currentOrcId);
  const items = currentOrc ? currentOrc.itens : [];
  const total = currentOrc ? items.reduce((a, b) => a + (b.quantidade * b.custoUnitario), 0) : 0;

  const handleCreateOrc = (e) => {
    e.preventDefault();
    const id = addOrcamento(newOrcName);
    setIsNewOrcModal(false);
    setNewOrcName('');
    setCurrentOrcId(id);
    setView('detail');
  };

  const handleAddItem = () => {
    if (!currentOrcId) return;
    addOrcamentoItem(currentOrcId, { descricao: 'Novo Item', categoria: 'Geral', unidade: 'un', quantidade: 1, custoUnitario: 0 });
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Gestão de Orçamentos</h1>
          <p className="page-subtitle">Crie orçamentos independentes para compor propostas e vincular a obras</p>
        </div>
        {view === 'list' ? (
          <button className="btn btn-primary" onClick={() => setIsNewOrcModal(true)}><Plus size={18} /> Novo Orçamento</button>
        ) : (
          <button className="btn btn-secondary" onClick={() => setView('list')}><ArrowLeft size={18} /> Voltar à Lista</button>
        )}
      </div>

      {view === 'list' && (
        <div className="grid-3" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
          {listaOrcamentos.map(orc => {
            const obra = obras.find(o => o.id === orc.obraId);
            const totalOrc = orc.itens.reduce((a, b) => a + (b.quantidade * b.custoUnitario), 0);
            return (
              <div key={orc.id} className="card hover-effect" style={{ cursor: 'pointer' }} onClick={() => { setCurrentOrcId(orc.id); setView('detail'); }}>
                <div className="flex justify-between items-start mb-4">
                  <div className="logo-icon" style={{ background: 'var(--primary-light)', color: 'var(--primary)', width: 40, height: 40, borderRadius: 8 }}>
                    <FileText size={20} />
                  </div>
                  <button className="icon-btn text-danger" onClick={(e) => { e.stopPropagation(); if(confirm('Excluir?')) deleteOrcamento(orc.id); }}>
                    <Trash2 size={16} />
                  </button>
                </div>
                <h3 style={{ fontWeight: 700, fontSize: 18, marginBottom: 8 }}>{orc.nome}</h3>
                <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>
                  {obra ? `Vinculado a: ${obra.nome}` : 'Não vinculado a obra'}
                </p>
                <div className="flex justify-between items-end">
                  <div>
                    <p style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Total</p>
                    <p style={{ fontSize: 20, fontWeight: 700, color: 'var(--primary)' }}>{formatCurrency(totalOrc)}</p>
                  </div>
                  <span className="text-primary" style={{ fontSize: 12, fontWeight: 600 }}>{orc.itens.length} itens <ChevronRight size={14} /></span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {view === 'detail' && currentOrc && (
        <div className="flex gap-6" style={{ flexWrap: 'wrap' }}>
          <div className="card flex-1" style={{ minWidth: '60%', padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: 16, borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h2 style={{ fontSize: 20, fontWeight: 700 }}>
                  <InlineEdit value={currentOrc.nome} onSave={v => updateOrcamento(currentOrc.id, 'nome', v)} />
                </h2>
                <select 
                  value={currentOrc.obraId || ''} 
                  onChange={e => updateOrcamento(currentOrc.id, 'obraId', e.target.value ? parseInt(e.target.value) : null)}
                  style={{ border: 'none', background: 'none', color: 'var(--text-muted)', fontSize: 12, outline: 'none', cursor: 'pointer' }}
                >
                  <option value="">Vincular a uma obra...</option>
                  {obras.map(o => <option key={o.id} value={o.id}>{o.nome}</option>)}
                </select>
              </div>
              <button className="btn btn-primary btn-sm" onClick={handleAddItem}><Plus size={14} /> Adicionar Item</button>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table className="table-editable">
                <thead>
                  <tr>
                    <th>Descrição</th>
                    <th>Unid.</th>
                    <th style={{ textAlign: 'center' }}>Qtd</th>
                    <th style={{ textAlign: 'right' }}>Vlr. Unitário</th>
                    <th style={{ textAlign: 'right' }}>Total</th>
                    <th style={{ width: 40 }}></th>
                  </tr>
                </thead>
                <tbody>
                  {items.map(item => (
                    <tr key={item.id}>
                      <td><InlineEdit value={item.descricao} onSave={v => updateOrcamentoItem(currentOrc.id, item.id, 'descricao', v)} /></td>
                      <td><InlineEdit value={item.unidade} onSave={v => updateOrcamentoItem(currentOrc.id, item.id, 'unidade', v)} /></td>
                      <td style={{ textAlign: 'center' }}><InlineEdit value={item.quantidade} type="number" onSave={v => updateOrcamentoItem(currentOrc.id, item.id, 'quantidade', v)} /></td>
                      <td style={{ textAlign: 'right' }}><InlineEdit value={item.custoUnitario} type="currency" onSave={v => updateOrcamentoItem(currentOrc.id, item.id, 'custoUnitario', v)} /></td>
                      <td style={{ textAlign: 'right', fontWeight: 600 }}>{formatCurrency(item.quantidade * item.custoUnitario)}</td>
                      <td><button className="icon-btn text-danger" onClick={() => deleteOrcamentoItem(currentOrc.id, item.id)}><Trash2 size={14} /></button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div style={{ width: '100%', maxWidth: 300, display: 'flex', flexDirection: 'column', gap: 16 }}>
             <div className="card" style={{ background: 'var(--primary)', color: 'white', border: 'none' }}>
               <p style={{ opacity: .8, fontSize: 13, marginBottom: 4 }}>Resumo do Orçamento</p>
               <h2 style={{ fontSize: 32, fontWeight: 800 }}>{formatCurrency(total)}</h2>
               <p style={{ fontSize: 12, marginTop: 16 }}>{items.length} itens no total</p>
             </div>

             {currentOrc?.obraId && (
               <div className="card" style={{ borderLeft: '4px solid #06b6d4' }}>
                 <h4 style={{ fontWeight: 600, fontSize: 14, marginBottom: 12 }}>Equipe Alocada</h4>
                 {funcionarios.filter(f => f.obraAtualId === currentOrc.obraId).map(f => (
                   <div key={f.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: 12 }}>
                     <span>{f.nome}</span>
                     <span style={{ fontWeight: 600 }}>{formatCurrency(f.custoDiaria)}/dia</span>
                   </div>
                 ))}
                 <button 
                   className="btn btn-secondary btn-sm w-full mt-4" 
                   onClick={() => {
                     const totalDiaria = funcionarios.filter(f => f.obraAtualId === currentOrc.obraId).reduce((a, b) => a + b.custoDiaria, 0);
                     addOrcamentoItem(currentOrc.id, { descricao: 'Mão de Obra (Equipe Alocada)', categoria: 'Mão de Obra', unidade: 'dia', quantidade: 20, custoUnitario: totalDiaria });
                   }}
                 >
                   Incluir Mão de Obra
                 </button>
               </div>
             )}

             <button className="btn btn-secondary" style={{ width: '100%' }}>
               <Download size={16} /> Exportar PDF
             </button>
          </div>
        </div>
      )}

      <Modal isOpen={isNewOrcModal} onClose={() => setIsNewOrcModal(false)} title="Novo Orçamento">
        <form onSubmit={handleCreateOrc} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label className="text-secondary" style={{ display: 'block', fontSize: 13, marginBottom: 4 }}>Nome do Orçamento</label>
            <input required type="text" autoFocus value={newOrcName} onChange={e => setNewOrcName(e.target.value)} style={{ width: '100%', padding: 10, borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', outline: 'none' }} />
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Criar Orçamento</button>
        </form>
      </Modal>
    </div>
  );
}


