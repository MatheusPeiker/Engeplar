import React, { useState } from 'react';
import { Plus, Trash2, Calendar, Clock } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import InlineEdit from '../components/InlineEdit';

export default function Cronograma() {
  const { obras, getCronogramaObra, addEtapaCronograma, updateEtapaCronograma, deleteEtapaCronograma, formatCurrency } = useAppContext();
  const [obraSelecionada, setObraSelecionada] = useState(obras[0]?.id || '');

  const etapas = getCronogramaObra(obraSelecionada);
  const custoTotal = etapas.reduce((a, e) => a + e.custo, 0);
  const progressoGeral = etapas.length > 0 ? Math.round(etapas.reduce((a, e) => a + e.progresso, 0) / etapas.length) : 0;

  const handleAddEtapa = () => {
    if (!obraSelecionada) return;
    addEtapaCronograma(obraSelecionada, {
      etapa: 'Nova Etapa', dataInicio: new Date().toISOString().split('T')[0],
      dataFim: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
      custo: 0, progresso: 0, cor: '#1E3A8A'
    });
  };

  const getDuration = (start, end) => {
    const s = new Date(start); const e = new Date(end);
    return Math.max(1, Math.ceil((e - s) / 86400000));
  };

  const minDate = etapas.length > 0 ? new Date(Math.min(...etapas.map(e => new Date(e.dataInicio)))) : new Date();
  const maxDate = etapas.length > 0 ? new Date(Math.max(...etapas.map(e => new Date(e.dataFim)))) : new Date();
  const totalDays = Math.max(1, Math.ceil((maxDate - minDate) / 86400000));

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Cronograma Físico-Financeiro</h1>
          <p className="page-subtitle">Edite datas, custos e progresso de cada etapa</p>
        </div>
        <div className="flex gap-2">
          <select value={obraSelecionada} onChange={e => setObraSelecionada(parseInt(e.target.value))} style={{ padding: '10px 14px', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', fontWeight: 600, fontSize: 14 }}>
            {obras.map(o => <option key={o.id} value={o.id}>{o.nome}</option>)}
          </select>
          <button className="btn btn-primary btn-sm" onClick={handleAddEtapa}><Plus size={14} /> Nova Etapa</button>
        </div>
      </div>

      {/* Resumo */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
        <div className="card" style={{ padding: 16 }}>
          <p className="text-secondary" style={{ fontSize: 12 }}>Progresso Geral</p>
          <h3 style={{ fontSize: 28, fontWeight: 700, color: 'var(--primary)' }}>{progressoGeral}%</h3>
          <div style={{ height: 6, background: 'var(--border)', borderRadius: 3, marginTop: 8, overflow: 'hidden' }}>
            <div style={{ width: `${progressoGeral}%`, height: '100%', background: 'var(--primary)', borderRadius: 3, transition: 'width 0.5s' }}></div>
          </div>
        </div>
        <div className="card" style={{ padding: 16 }}>
          <p className="text-secondary" style={{ fontSize: 12 }}>Custo Total Etapas</p>
          <h3 style={{ fontSize: 28, fontWeight: 700 }}>{formatCurrency(custoTotal)}</h3>
        </div>
        <div className="card" style={{ padding: 16 }}>
          <p className="text-secondary" style={{ fontSize: 12 }}>Etapas</p>
          <h3 style={{ fontSize: 28, fontWeight: 700 }}>{etapas.length}</h3>
        </div>
      </div>

      {/* Gantt Visual */}
      <div className="card mb-6" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
          <h3 style={{ fontWeight: 600, fontSize: 16 }}>Timeline Visual</h3>
        </div>
        <div style={{ padding: 20, overflowX: 'auto' }}>
          {etapas.length === 0 && <p className="text-muted" style={{ textAlign: 'center', padding: 24 }}>Nenhuma etapa cadastrada</p>}
          {etapas.map(etapa => {
            const startOffset = Math.ceil((new Date(etapa.dataInicio) - minDate) / 86400000);
            const duration = getDuration(etapa.dataInicio, etapa.dataFim);
            const leftPerc = (startOffset / totalDays) * 100;
            const widthPerc = Math.max(5, (duration / totalDays) * 100);

            return (
              <div key={etapa.id} style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 12 }}>
                <div style={{ width: 140, flexShrink: 0, fontSize: 13, fontWeight: 600 }}>{etapa.etapa}</div>
                <div style={{ flex: 1, position: 'relative', height: 36, background: 'var(--background)', borderRadius: 6 }}>
                  <div className="gantt-bar" style={{
                    position: 'absolute', left: `${leftPerc}%`, width: `${widthPerc}%`,
                    background: etapa.cor || 'var(--primary)', height: 32, top: 2
                  }}>
                    <div className="gantt-progress" style={{ width: `${etapa.progresso}%` }}></div>
                    <span style={{ position: 'relative', zIndex: 1, fontSize: 11 }}>{etapa.progresso}%</span>
                  </div>
                </div>
                <div style={{ width: 80, textAlign: 'right', fontSize: 12, color: 'var(--text-secondary)' }}>{getDuration(etapa.dataInicio, etapa.dataFim)}d</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Tabela Editável */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
          <h3 style={{ fontWeight: 600, fontSize: 16 }}>Detalhes das Etapas</h3>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table className="table-editable">
            <thead>
              <tr>
                <th>Etapa</th>
                <th>Início</th>
                <th>Fim</th>
                <th style={{ textAlign: 'right' }}>Custo</th>
                <th style={{ textAlign: 'center' }}>Progresso</th>
                <th style={{ width: 40 }}></th>
              </tr>
            </thead>
            <tbody>
              {etapas.map(etapa => (
                <tr key={etapa.id}>
                  <td><InlineEdit value={etapa.etapa} onSave={v => updateEtapaCronograma(etapa.id, 'etapa', v)} /></td>
                  <td><InlineEdit value={etapa.dataInicio} type="date" onSave={v => updateEtapaCronograma(etapa.id, 'dataInicio', v)} /></td>
                  <td><InlineEdit value={etapa.dataFim} type="date" onSave={v => updateEtapaCronograma(etapa.id, 'dataFim', v)} /></td>
                  <td style={{ textAlign: 'right' }}><InlineEdit value={etapa.custo} type="currency" onSave={v => updateEtapaCronograma(etapa.id, 'custo', v)} /></td>
                  <td style={{ textAlign: 'center' }}>
                    <div className="flex items-center gap-2" style={{ justifyContent: 'center' }}>
                      <input type="range" className="progress-slider" min="0" max="100" value={etapa.progresso}
                        onChange={e => updateEtapaCronograma(etapa.id, 'progresso', parseInt(e.target.value))}
                        style={{ width: 80 }} />
                      <span style={{ fontSize: 13, fontWeight: 600, minWidth: 36 }}>{etapa.progresso}%</span>
                    </div>
                  </td>
                  <td><button className="icon-btn" style={{ color: 'var(--danger)' }} onClick={() => deleteEtapaCronograma(etapa.id)}><Trash2 size={15} /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
