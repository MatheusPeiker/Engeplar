import React, { useState } from 'react';
import { Clock, RotateCcw, Filter, FileText, DollarSign, Calendar, Users, Building2, ShoppingBag, Package, CheckCircle } from 'lucide-react';
import { useAppContext } from '../context/AppContext';

const MODULO_META = {
  'Obras':        { icon: Building2,   color: '#8b5cf6' },
  'Gastos':       { icon: DollarSign,  color: 'var(--danger)' },
  'Orçamento':    { icon: DollarSign,  color: 'var(--primary)' },
  'Proposta':     { icon: FileText,    color: 'var(--success)' },
  'Cronograma':   { icon: Calendar,    color: 'var(--warning)' },
  'Funcionários': { icon: Users,       color: '#06b6d4' },
  'Financeiro':   { icon: DollarSign,  color: 'var(--danger)' },
  'Catálogo':     { icon: Package,     color: 'var(--text-muted)' },
  'Arquivos':     { icon: FileText,    color: '#f97316' },
  'Compras':      { icon: ShoppingBag, color: '#10b981' },
  'Empresa':      { icon: Building2,   color: '#6366f1' },
};

const canRevert = (alt) => !alt.desfeito && alt.anterior !== null && alt.entityType;

export default function Historico() {
  const { historico, reverterAlteracao, obras } = useAppContext();
  const [filtroModulo, setFiltroModulo] = useState('Todos');
  const [reverting, setReverting] = useState(null);

  const modulos = ['Todos', ...new Set(historico.map(h => h.modulo))];
  const filtrado = filtroModulo === 'Todos' ? historico : historico.filter(h => h.modulo === filtroModulo);

  const formatDate = (iso) => {
    if (!iso) return '-';
    const d = new Date(iso);
    return d.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' });
  };

  const getObraNome = (id) => obras.find(o => o.id === id)?.nome || '';

  const handleReverter = async (altId) => {
    setReverting(altId);
    await reverterAlteracao(altId);
    setReverting(null);
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Histórico de Alterações</h1>
          <p className="page-subtitle">{historico.length} alterações registradas — salvas permanentemente na conta</p>
        </div>
      </div>

      {/* Filtros por módulo */}
      <div className="flex gap-2 mb-6" style={{ flexWrap: 'wrap' }}>
        {modulos.map(m => {
          const meta = MODULO_META[m];
          return (
            <button
              key={m}
              onClick={() => setFiltroModulo(m)}
              style={{
                padding: '6px 14px', borderRadius: 20, fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5,
                background: filtroModulo === m ? (meta?.color || 'var(--primary)') : 'var(--surface)',
                color: filtroModulo === m ? 'white' : 'var(--text-secondary)',
                border: filtroModulo === m ? 'none' : '1px solid var(--border)',
              }}
            >
              {m}
            </button>
          );
        })}
      </div>

      <div className="card" style={{ padding: 0 }}>
        {filtrado.length === 0 ? (
          <div style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)' }}>
            <Clock size={36} style={{ marginBottom: 10, opacity: .4 }} />
            <p style={{ fontWeight: 600 }}>Nenhuma alteração ainda</p>
            <p style={{ fontSize: 13, marginTop: 4 }}>Edite qualquer dado no sistema e ele aparecerá aqui.</p>
          </div>
        ) : (
          <div style={{ padding: '8px 20px' }}>
            {filtrado.slice(0, 100).map(alt => {
              const meta = MODULO_META[alt.modulo] || { icon: Clock, color: 'var(--primary)' };
              const Icon = meta.icon;
              const podeReverter = canRevert(alt);

              return (
                <div
                  key={alt.id}
                  className="history-item"
                  style={{ opacity: alt.desfeito ? 0.45 : 1, transition: 'opacity .3s' }}
                >
                  <div
                    className="history-dot"
                    style={{ background: alt.desfeito ? 'var(--text-muted)' : meta.color }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="flex items-center gap-2 mb-1" style={{ flexWrap: 'wrap' }}>
                      <span
                        style={{
                          fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 20,
                          display: 'inline-flex', alignItems: 'center', gap: 4,
                          background: `${alt.desfeito ? '#888' : meta.color}20`,
                          color: alt.desfeito ? 'var(--text-muted)' : meta.color,
                        }}
                      >
                        <Icon size={11} /> {alt.modulo}
                      </span>
                      {alt.obraId && (
                        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                          · {getObraNome(alt.obraId)}
                        </span>
                      )}
                      <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 'auto' }}>
                        {formatDate(alt.timestamp)}
                      </span>
                    </div>

                    <p style={{ fontSize: 14, fontWeight: 600, color: alt.desfeito ? 'var(--text-muted)' : 'var(--text-primary)' }}>
                      {alt.campo}
                    </p>

                    <div className="flex gap-2 items-center" style={{ marginTop: 4, fontSize: 12, flexWrap: 'wrap' }}>
                      {alt.anterior !== null && alt.anterior !== undefined && (
                        <span style={{ color: 'var(--danger)', background: 'rgba(239,68,68,.08)', padding: '1px 6px', borderRadius: 4, textDecoration: alt.desfeito ? 'none' : 'line-through', maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {String(alt.anterior).substring(0, 60)}
                        </span>
                      )}
                      {alt.anterior !== null && alt.novo !== null && (
                        <span style={{ color: 'var(--text-muted)' }}>→</span>
                      )}
                      {alt.novo !== null && alt.novo !== undefined && (
                        <span style={{ color: 'var(--success)', fontWeight: 600, background: 'rgba(16,185,129,.08)', padding: '1px 6px', borderRadius: 4, maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {String(alt.novo).substring(0, 60)}
                        </span>
                      )}
                    </div>
                  </div>

                  {alt.desfeito ? (
                    <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 6, background: 'var(--background)', flexShrink: 0 }}>
                      <CheckCircle size={12} /> Revertido
                    </span>
                  ) : podeReverter ? (
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => handleReverter(alt.id)}
                      disabled={reverting === alt.id}
                      style={{ flexShrink: 0, whiteSpace: 'nowrap' }}
                      title="Reverter para o valor anterior"
                    >
                      <RotateCcw size={13} />
                      {reverting === alt.id ? 'Revertendo...' : 'Reverter'}
                    </button>
                  ) : (
                    <span style={{ fontSize: 11, color: 'var(--text-muted)', padding: '4px 10px', flexShrink: 0 }}>
                      —
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
