import React, { useState } from 'react';
import { Plus, Search, MapPin, Trash2, AlertTriangle, CheckCircle, Clock, Users, Pause } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import InlineEdit from '../components/InlineEdit';
import Modal from '../components/Modal';

const STATUS_ICON = {
  'Em andamento': <Clock size={13} />,
  'Atrasada':     <AlertTriangle size={13} />,
  'Concluída':    <CheckCircle size={13} />,
  'Pausada':      <Pause size={13} />,
};
const STATUS_COLOR = {
  'Em andamento': 'var(--primary)',
  'Atrasada':     'var(--danger)',
  'Concluída':    'var(--success)',
  'Pausada':      'var(--text-muted)',
};

export default function Obras() {
  const navigate = useNavigate();
  const { obras, addObra, deleteObra, updateObra, calcProgressoFinanceiro, funcionarios, formatCurrency } = useAppContext();
  const [searchTerm, setSearchTerm] = useState('');
  const [tab, setTab] = useState('ativas');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [nome, setNome] = useState('');
  const [endereco, setEndereco] = useState('');
  const [orcamento, setOrcamento] = useState('');

  const handleAddObra = (e) => {
    e.preventDefault();
    if (!nome || !orcamento) return;
    addObra({ nome, endereco, orcamento: parseFloat(orcamento), status: 'Em andamento', previsao: 'A definir' });
    setIsAddModalOpen(false); setNome(''); setEndereco(''); setOrcamento('');
  };

  const ativas     = obras.filter(o => o.status !== 'Concluída');
  const concluidas = obras.filter(o => o.status === 'Concluída');
  const lista      = (tab === 'ativas' ? ativas : concluidas)
    .filter(o => o.nome.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Gestão de Obras</h1>
          <p className="page-subtitle">Clique em qualquer valor para editar diretamente</p>
        </div>
        <button className="btn btn-primary" onClick={() => setIsAddModalOpen(true)}><Plus size={18} /> Nova Obra</button>
      </div>

      {/* Tabs Em Andamento / Concluídas */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        <button
          onClick={() => setTab('ativas')}
          style={{
            padding: '8px 20px', borderRadius: 8, border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 14,
            background: tab === 'ativas' ? 'var(--primary)' : 'var(--surface)',
            color:      tab === 'ativas' ? 'white'          : 'var(--text-secondary)',
            boxShadow:  tab === 'ativas' ? '0 2px 8px rgba(37,99,235,0.25)' : 'none',
          }}
        >
          <Clock size={14} style={{ marginRight: 6, verticalAlign: 'middle' }} />
          Em Andamento
          <span style={{ marginLeft: 8, padding: '1px 8px', borderRadius: 20, background: tab === 'ativas' ? 'rgba(255,255,255,0.25)' : 'var(--border)', fontSize: 12 }}>
            {ativas.length}
          </span>
        </button>
        <button
          onClick={() => setTab('concluidas')}
          style={{
            padding: '8px 20px', borderRadius: 8, border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 14,
            background: tab === 'concluidas' ? 'var(--success)'  : 'var(--surface)',
            color:      tab === 'concluidas' ? 'white'           : 'var(--text-secondary)',
            boxShadow:  tab === 'concluidas' ? '0 2px 8px rgba(16,185,129,0.25)' : 'none',
          }}
        >
          <CheckCircle size={14} style={{ marginRight: 6, verticalAlign: 'middle' }} />
          Concluídas
          <span style={{ marginLeft: 8, padding: '1px 8px', borderRadius: 20, background: tab === 'concluidas' ? 'rgba(255,255,255,0.25)' : 'var(--border)', fontSize: 12 }}>
            {concluidas.length}
          </span>
        </button>

        <div className="search-bar" style={{ marginLeft: 'auto', maxWidth: 320, flex: 1 }}>
          <Search size={16} className="search-icon" />
          <input type="text" placeholder="Buscar por nome..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
        </div>
      </div>

      {lista.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
          {tab === 'ativas'
            ? <><Clock size={40} style={{ opacity: .3, marginBottom: 12 }} /><p style={{ fontWeight: 600 }}>Nenhuma obra em andamento</p><p style={{ fontSize: 13, marginTop: 4 }}>Crie uma nova obra para começar.</p></>
            : <><CheckCircle size={40} style={{ opacity: .3, marginBottom: 12 }} /><p style={{ fontWeight: 600 }}>Nenhuma obra concluída ainda</p><p style={{ fontSize: 13, marginTop: 4 }}>As obras finalizadas aparecerão aqui.</p></>
          }
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20 }}>
        {lista.map(obra => {
          const { gasto, progressoPerc, alerta } = calcProgressoFinanceiro(obra);
          const equipe = funcionarios.filter(f => f.obraAtualId === obra.id);
          const concluida = obra.status === 'Concluída';

          return (
            <div key={obra.id} className="card" style={{ display: 'flex', flexDirection: 'column', borderTop: `3px solid ${STATUS_COLOR[obra.status] || 'var(--border)'}` }}>
              <div className="flex justify-between items-start mb-2">
                <div style={{ flex: 1 }}>
                  <h3 style={{ fontSize: 17, fontWeight: 700, marginBottom: 2 }}>
                    {concluida
                      ? obra.nome
                      : <InlineEdit value={obra.nome} onSave={v => updateObra(obra.id, 'nome', v)} />
                    }
                  </h3>
                  <p className="text-secondary flex items-center gap-1" style={{ fontSize: 13 }}>
                    <MapPin size={13} />
                    {concluida
                      ? obra.endereco
                      : <InlineEdit value={obra.endereco} onSave={v => updateObra(obra.id, 'endereco', v)} />
                    }
                  </p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 600, color: STATUS_COLOR[obra.status], background: `${STATUS_COLOR[obra.status]}18`, padding: '3px 10px', borderRadius: 20 }}>
                    {STATUS_ICON[obra.status]} {obra.status}
                  </span>
                  {!concluida && (
                    <button className="icon-btn" style={{ color: 'var(--danger)' }} onClick={() => { if (confirm('Remover obra?')) deleteObra(obra.id); }}>
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>
              </div>

              {/* Progresso financeiro */}
              <div style={{ marginBottom: 12 }}>
                <div className="flex justify-between mb-1">
                  <span className="text-secondary" style={{ fontSize: 12 }}>Progresso financeiro</span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: alerta ? 'var(--danger)' : 'inherit' }}>{progressoPerc}%</span>
                </div>
                <div style={{ width: '100%', height: 6, background: 'var(--border)', borderRadius: 4, overflow: 'hidden' }}>
                  <div style={{ width: `${progressoPerc}%`, height: '100%', background: concluida ? 'var(--success)' : alerta ? 'var(--danger)' : 'var(--primary)', transition: 'width .5s' }} />
                </div>
              </div>

              <div className="flex justify-between mb-3 pt-3" style={{ borderTop: '1px solid var(--border)' }}>
                <div>
                  <p className="text-secondary" style={{ fontSize: 11 }}>Gasto realizado</p>
                  <p style={{ fontWeight: 700, fontSize: 15, color: alerta ? 'var(--danger)' : 'inherit' }}>{formatCurrency(gasto)}</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p className="text-secondary" style={{ fontSize: 11 }}>Orçamento</p>
                  <p style={{ fontWeight: 700, fontSize: 15 }}>
                    {concluida
                      ? formatCurrency(obra.orcamento)
                      : <InlineEdit value={obra.orcamento} type="currency" onSave={v => updateObra(obra.id, 'orcamento', parseFloat(v))} />
                    }
                  </p>
                </div>
                {concluida && (
                  <div style={{ textAlign: 'right' }}>
                    <p className="text-secondary" style={{ fontSize: 11 }}>Resultado</p>
                    <p style={{ fontWeight: 700, fontSize: 15, color: obra.orcamento - gasto >= 0 ? 'var(--success)' : 'var(--danger)' }}>
                      {formatCurrency(obra.orcamento - gasto)}
                    </p>
                  </div>
                )}
              </div>

              {/* Equipe */}
              {equipe.length > 0 && (
                <div style={{ borderTop: '1px solid var(--border)', paddingTop: 10, marginBottom: 10 }}>
                  <p className="text-secondary flex items-center gap-1" style={{ fontSize: 12, marginBottom: 6 }}><Users size={12} /> Equipe ({equipe.length})</p>
                  <div className="flex gap-1" style={{ flexWrap: 'wrap' }}>
                    {equipe.map(f => (
                      <div key={f.id} className="flex items-center gap-1" style={{ padding: '2px 8px 2px 3px', borderRadius: 20, background: 'var(--primary-light)', fontSize: 12 }}>
                        <div style={{ width: 20, height: 20, borderRadius: '50%', background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 700 }}>{f.nome.charAt(0)}</div>
                        <span style={{ fontWeight: 500, color: 'var(--primary)' }}>{f.nome.split(' ')[0]}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <button className="btn btn-secondary" style={{ width: '100%', marginTop: 'auto' }} onClick={() => navigate(`/obras/${obra.id}`)}>
                Ver Detalhes
              </button>
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
