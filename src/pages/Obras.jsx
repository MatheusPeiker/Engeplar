import React, { useState } from 'react';
import { Plus, Search, MapPin, Trash2, AlertTriangle, CheckCircle, Clock, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import InlineEdit from '../components/InlineEdit';
import Modal from '../components/Modal';

export default function Obras() {
  const navigate = useNavigate();
  const { obras, addObra, deleteObra, updateObra, calcProgressoFinanceiro, funcionarios, formatCurrency } = useAppContext();
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [nome, setNome] = useState('');
  const [endereco, setEndereco] = useState('');
  const [orcamento, setOrcamento] = useState('');

  const getStatusBadge = (status) => {
    if (status === 'Em andamento') return <span className="badge badge-primary"><Clock size={14} style={{ marginRight: 4 }} /> Em Andamento</span>;
    if (status === 'Concluída') return <span className="badge badge-success"><CheckCircle size={14} style={{ marginRight: 4 }} /> Concluída</span>;
    if (status === 'Atrasada') return <span className="badge badge-danger"><AlertTriangle size={14} style={{ marginRight: 4 }} /> Atrasada</span>;
    return <span className="badge">{status}</span>;
  };

  const handleAddObra = (e) => {
    e.preventDefault();
    if (!nome || !orcamento) return;
    addObra({ nome, endereco, orcamento: parseFloat(orcamento), status: 'Em andamento', previsao: 'A definir' });
    setIsAddModalOpen(false); setNome(''); setEndereco(''); setOrcamento('');
  };

  const filteredObras = obras.filter(o => o.nome.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Gestão de Obras</h1>
          <p className="page-subtitle">Clique em qualquer valor para editar diretamente</p>
        </div>
        <button className="btn btn-primary" onClick={() => setIsAddModalOpen(true)}><Plus size={18} /> Nova Obra</button>
      </div>

      <div className="flex gap-4 mb-6" style={{ alignItems: 'center' }}>
        <div className="search-bar flex-1" style={{ maxWidth: 400 }}>
          <Search size={18} className="search-icon" />
          <input type="text" placeholder="Buscar por nome..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20 }}>
        {filteredObras.map(obra => {
          const { gasto, progressoPerc, alerta } = calcProgressoFinanceiro(obra);
          return (
            <div key={obra.id} className="card" style={{ display: 'flex', flexDirection: 'column' }}>
              <div className="flex justify-between items-start mb-2">
                <div style={{ flex: 1 }}>
                  <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 2 }}>
                    <InlineEdit value={obra.nome} onSave={v => updateObra(obra.id, 'nome', v)} />
                  </h3>
                  <p className="text-secondary flex items-center gap-1" style={{ fontSize: 13 }}>
                    <MapPin size={14} /> <InlineEdit value={obra.endereco} onSave={v => updateObra(obra.id, 'endereco', v)} />
                  </p>
                </div>
                <button className="icon-btn" style={{ color: 'var(--danger)' }} onClick={() => { if (confirm('Remover obra?')) deleteObra(obra.id); }}><Trash2 size={16} /></button>
              </div>

              <div className="mb-4 flex gap-2 items-center">
                <InlineEdit value={obra.status} type="select" options={['Em andamento', 'Atrasada', 'Concluída', 'Pausada']} onSave={v => updateObra(obra.id, 'status', v)} />
              </div>

              <div className="mb-4">
                <div className="flex justify-between mb-2">
                  <span className="text-secondary" style={{ fontSize: 13 }}>Progresso Financeiro</span>
                  <span style={{ fontSize: 13, fontWeight: 600 }}>{progressoPerc}%</span>
                </div>
                <div style={{ width: '100%', height: 8, backgroundColor: 'var(--border)', borderRadius: 4, overflow: 'hidden' }}>
                  <div style={{ width: `${progressoPerc}%`, height: '100%', backgroundColor: alerta ? 'var(--danger)' : 'var(--primary)', transition: 'width 0.5s' }}></div>
                </div>
              </div>

              <div className="flex justify-between mb-4 pt-4" style={{ borderTop: '1px solid var(--border)' }}>
                <div>
                  <p className="text-secondary" style={{ fontSize: 12 }}>Gasto</p>
                  <p style={{ fontWeight: 600, fontSize: 14, color: alerta ? 'var(--danger)' : 'inherit' }}>{formatCurrency(gasto)}</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p className="text-secondary" style={{ fontSize: 12 }}>Orçamento</p>
                  <p style={{ fontWeight: 600, fontSize: 14 }}>
                    <InlineEdit value={obra.orcamento} type="currency" onSave={v => updateObra(obra.id, 'orcamento', parseFloat(v))} />
                  </p>
                </div>
              </div>

              {/* Equipe na obra */}
              {(() => {
                const equipe = funcionarios.filter(f => f.obraAtualId === obra.id);
                return equipe.length > 0 ? (
                  <div style={{ borderTop: '1px solid var(--border)', paddingTop: 12, marginBottom: 12 }}>
                    <p className="text-secondary flex items-center gap-1" style={{ fontSize: 12, marginBottom: 8 }}><Users size={13} /> Equipe ({equipe.length})</p>
                    <div className="flex gap-2" style={{ flexWrap: 'wrap' }}>
                      {equipe.map(f => (
                        <div key={f.id} className="flex items-center gap-1" style={{ padding: '3px 8px 3px 3px', borderRadius: 20, background: 'var(--primary-light)', fontSize: 12 }}>
                          <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700 }}>{f.nome.charAt(0)}</div>
                          <span style={{ fontWeight: 500, color: 'var(--primary)' }}>{f.nome.split(' ')[0]}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div style={{ borderTop: '1px solid var(--border)', paddingTop: 12, marginBottom: 12 }}>
                    <p className="text-muted flex items-center gap-1" style={{ fontSize: 12 }}><Users size={13} /> Nenhum profissional alocado</p>
                  </div>
                );
              })()}

              <button className="btn btn-secondary" style={{ width: '100%', marginTop: 'auto' }} onClick={() => navigate(`/obras/${obra.id}`)}>Ver Detalhes</button>
            </div>
          );
        })}
      </div>

      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Nova Obra">
        <form onSubmit={handleAddObra} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label className="text-secondary" style={{ display: 'block', fontSize: 13, marginBottom: 4 }}>Nome da Obra</label>
            <input autoFocus required type="text" value={nome} onChange={e => setNome(e.target.value)} style={{ width: '100%', padding: 10, borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', outline: 'none' }} />
          </div>
          <div>
            <label className="text-secondary" style={{ display: 'block', fontSize: 13, marginBottom: 4 }}>Endereço</label>
            <input type="text" value={endereco} onChange={e => setEndereco(e.target.value)} style={{ width: '100%', padding: 10, borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', outline: 'none' }} />
          </div>
          <div>
            <label className="text-secondary" style={{ display: 'block', fontSize: 13, marginBottom: 4 }}>Orçamento (R$)</label>
            <input required type="number" value={orcamento} onChange={e => setOrcamento(e.target.value)} style={{ width: '100%', padding: 10, borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', outline: 'none' }} />
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Salvar Obra</button>
        </form>
      </Modal>
    </div>
  );
}
