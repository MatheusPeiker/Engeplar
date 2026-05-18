import React, { useState } from 'react';
import { Clock, Undo2, Filter, FileText, DollarSign, Calendar, Users } from 'lucide-react';
import { useAppContext } from '../context/AppContext';

const moduloIcons = {
  'Orçamento': <DollarSign size={14} />,
  'Proposta': <FileText size={14} />,
  'Cronograma': <Calendar size={14} />,
  'Obras': <FileText size={14} />,
  'Gastos': <DollarSign size={14} />,
  'Funcionários': <Users size={14} />,
  'Financeiro': <DollarSign size={14} />,
  'Catálogo': <FileText size={14} />,
  'Arquivos': <FileText size={14} />
};

const moduloCores = {
  'Orçamento': 'var(--primary)',
  'Proposta': 'var(--success)',
  'Cronograma': 'var(--warning)',
  'Obras': '#8b5cf6',
  'Gastos': 'var(--danger)',
  'Funcionários': '#06b6d4',
  'Financeiro': 'var(--danger)',
  'Catálogo': 'var(--text-muted)',
  'Arquivos': '#f97316'
};

export default function Historico() {
  const { historico, desfazerAlteracao, obras, versoes } = useAppContext();
  const [filtroModulo, setFiltroModulo] = useState('Todos');
  const [aba, setAba] = useState('alteracoes');

  const modulos = ['Todos', ...new Set(historico.map(h => h.modulo))];
  const filtrado = filtroModulo === 'Todos' ? historico : historico.filter(h => h.modulo === filtroModulo);

  const formatDate = (iso) => {
    const d = new Date(iso);
    return d.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' });
  };

  const getObraNome = (id) => {
    const obra = obras.find(o => o.id === id);
    return obra ? obra.nome : '';
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Histórico de Alterações</h1>
          <p className="page-subtitle">Rastreie todas as mudanças feitas no sistema</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs-container">
        <button className={`tab-btn ${aba === 'alteracoes' ? 'active' : ''}`} onClick={() => setAba('alteracoes')}>Alterações ({historico.length})</button>
        <button className={`tab-btn ${aba === 'versoes' ? 'active' : ''}`} onClick={() => setAba('versoes')}>Versões Salvas ({versoes.length})</button>
      </div>

      {aba === 'alteracoes' && (
        <>
          {/* Filtros */}
          <div className="flex gap-2 mb-6" style={{ flexWrap: 'wrap' }}>
            {modulos.map(m => (
              <button key={m} onClick={() => setFiltroModulo(m)}
                style={{
                  padding: '6px 14px', borderRadius: 20, fontSize: 13, fontWeight: 600, cursor: 'pointer',
                  background: filtroModulo === m ? 'var(--primary)' : 'var(--surface)',
                  color: filtroModulo === m ? 'white' : 'var(--text-secondary)',
                  border: filtroModulo === m ? 'none' : '1px solid var(--border)'
                }}>
                {m}
              </button>
            ))}
          </div>

          {/* Timeline */}
          <div className="card" style={{ padding: 0 }}>
            {filtrado.length === 0 ? (
              <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
                <Clock size={32} style={{ marginBottom: 8, opacity: .5 }} />
                <p>Nenhuma alteração registrada ainda. Edite qualquer dado no sistema para vê-lo aqui.</p>
              </div>
            ) : (
              <div style={{ padding: '8px 20px' }}>
                {filtrado.slice(0, 50).map(alt => (
                  <div key={alt.id} className="history-item" style={{ opacity: alt.desfeito ? 0.4 : 1 }}>
                    <div className={`history-dot ${alt.desfeito ? 'undone' : ''}`} style={{ background: moduloCores[alt.modulo] || 'var(--primary)' }}></div>
                    <div style={{ flex: 1 }}>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="badge badge-primary" style={{ fontSize: 11, gap: 4, display: 'inline-flex', alignItems: 'center' }}>
                          {moduloIcons[alt.modulo]} {alt.modulo}
                        </span>
                        {alt.obraId && <span className="text-muted" style={{ fontSize: 11 }}>· {getObraNome(alt.obraId)}</span>}
                        <span className="text-muted" style={{ fontSize: 11, marginLeft: 'auto' }}>{formatDate(alt.timestamp)}</span>
                      </div>
                      <p style={{ fontSize: 14, fontWeight: 500 }}>{alt.campo}</p>
                      <div className="flex gap-2 items-center" style={{ marginTop: 4, fontSize: 12 }}>
                        {alt.anterior !== null && alt.anterior !== undefined && (
                          <span style={{ color: 'var(--danger)', textDecoration: alt.desfeito ? 'none' : 'line-through' }}>
                            {String(alt.anterior).substring(0, 50)}
                          </span>
                        )}
                        {alt.anterior !== null && alt.novo !== null && <span className="text-muted">→</span>}
                        {alt.novo !== null && alt.novo !== undefined && (
                          <span style={{ color: 'var(--success)', fontWeight: 600 }}>
                            {String(alt.novo).substring(0, 50)}
                          </span>
                        )}
                      </div>
                    </div>
                    {!alt.desfeito && (
                      <button className="btn btn-secondary btn-sm" onClick={() => desfazerAlteracao(alt.id)} title="Marcar como desfeito">
                        <Undo2 size={14} /> Desfazer
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {aba === 'versoes' && (
        <div className="card" style={{ padding: 0 }}>
          {versoes.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
              <FileText size={32} style={{ marginBottom: 8, opacity: .5 }} />
              <p>Nenhuma versão salva. Use "Salvar Versão" no Orçamento ou Proposta.</p>
            </div>
          ) : (
            <div style={{ padding: '8px 20px' }}>
              {versoes.map(v => (
                <div key={v.id} className="history-item">
                  <div className="history-dot" style={{ background: v.tipo === 'orcamento' ? 'var(--primary)' : 'var(--success)' }}></div>
                  <div style={{ flex: 1 }}>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="badge" style={{ background: v.tipo === 'orcamento' ? 'var(--primary-light)' : 'var(--success-bg)', color: v.tipo === 'orcamento' ? 'var(--primary)' : 'var(--success)', fontSize: 11 }}>
                        {v.tipo === 'orcamento' ? 'Orçamento' : 'Proposta'}
                      </span>
                      <span className="text-muted" style={{ fontSize: 11 }}>· {getObraNome(v.obraId)}</span>
                      <span className="text-muted" style={{ fontSize: 11, marginLeft: 'auto' }}>{formatDate(v.timestamp)}</span>
                    </div>
                    <p style={{ fontSize: 14, fontWeight: 600 }}>{v.nome}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
