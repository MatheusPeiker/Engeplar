import { useState } from 'react';
import { ArrowUpRight, ArrowDownRight, Plus, Trash2, TrendingUp } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import { useAppContext } from '../context/AppContext';
import InlineEdit from '../components/InlineEdit';
import Modal from '../components/Modal';

const MESES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
const CORES = ['#1E3A8A', '#06b6d4', '#f59e0b', '#10b981', '#f97316', '#8b5cf6', '#ec4899', '#14b8a6'];

const formatMes = (m) => {
  const [ano, mes] = m.split('-');
  return `${MESES[parseInt(mes) - 1]}/${ano.slice(2)}`;
};

const fmtK = (v) => {
  if (v >= 1000) return `R$${(v / 1000).toFixed(0)}k`;
  return `R$${v.toFixed(0)}`;
};

const TooltipCustom = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 14px', fontSize: 12 }}>
      <p style={{ fontWeight: 700, marginBottom: 6 }}>{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }}>
          {p.name}: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(p.value)}
        </p>
      ))}
    </div>
  );
};

export default function Financeiro() {
  const { transacoes, addTransacao, updateTransacao, deleteTransacao, obras, formatCurrency } = useAppContext();
  const [abaAtiva, setAbaAtiva] = useState('todas');
  const [isModal, setIsModal] = useState(false);
  const [novaDesc, setNovaDesc] = useState('');
  const [novoValor, setNovoValor] = useState('');
  const [novoTipo, setNovoTipo] = useState('saida');
  const [novaObra, setNovaObra] = useState('');
  const [novaData, setNovaData] = useState(new Date().toISOString().split('T')[0]);

  // helper — transacoes podem vir com obra_id (Supabase) ou obraId (temp otimista)
  const getObraId = (t) => t.obraId || t.obra_id || null;

  const entradas = transacoes.filter(t => t.tipo === 'entrada').reduce((a, t) => a + (t.valor || 0), 0);
  const saidas   = transacoes.filter(t => t.tipo === 'saida').reduce((a, t) => a + (t.valor || 0), 0);
  const pendente = transacoes.filter(t => t.status === 'pendente').reduce((a, t) => a + (t.valor || 0), 0);
  const saldo    = entradas - saidas;

  // ── Fluxo mensal (últimos 12 meses) ──────────────────────────
  const porMes = {};
  transacoes.forEach(t => {
    if (!t.data) return;
    const mes = String(t.data).substring(0, 7);
    if (!porMes[mes]) porMes[mes] = { mes, Entradas: 0, Saídas: 0 };
    if (t.tipo === 'entrada') porMes[mes].Entradas += t.valor || 0;
    else porMes[mes].Saídas += t.valor || 0;
  });
  const dadosMensal = Object.values(porMes)
    .sort((a, b) => a.mes.localeCompare(b.mes))
    .slice(-12)
    .map(d => ({ ...d, mes: formatMes(d.mes) }));

  // ── Gastos por obra ───────────────────────────────────────────
  const porObra = {};
  transacoes.filter(t => t.tipo === 'saida').forEach(t => {
    const obraId = getObraId(t);
    const nome = obraId ? (obras.find(o => o.id === obraId)?.nome || 'Outros') : 'Geral';
    porObra[nome] = (porObra[nome] || 0) + (t.valor || 0);
  });
  const dadosObras = Object.entries(porObra)
    .map(([nome, valor]) => ({ nome, valor }))
    .sort((a, b) => b.valor - a.valor)
    .slice(0, 7);

  // ── Pie: status ───────────────────────────────────────────────
  const pago    = transacoes.filter(t => t.status === 'pago').reduce((a, t) => a + (t.valor || 0), 0);
  const dadosPie = [
    { name: 'Pago', value: pago },
    { name: 'Pendente', value: pendente },
  ].filter(d => d.value > 0);

  // ── Tabela filtrada ───────────────────────────────────────────
  const filtradas = transacoes.filter(t => {
    if (abaAtiva === 'entradas') return t.tipo === 'entrada';
    if (abaAtiva === 'saidas') return t.tipo === 'saida';
    if (abaAtiva === 'pendentes') return t.status === 'pendente';
    return true;
  });

  const handleAdd = (e) => {
    e.preventDefault();
    if (!novaDesc || !novoValor) return;
    addTransacao({
      descricao: novaDesc,
      valor: parseFloat(novoValor),
      tipo: novoTipo,
      status: 'pendente',
      data: novaData || new Date().toISOString().split('T')[0],
      obraId: novaObra || null,
    });
    setIsModal(false);
    setNovaDesc(''); setNovoValor(''); setNovaObra('');
    setNovaData(new Date().toISOString().split('T')[0]);
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Controle Financeiro</h1>
          <p className="page-subtitle">Fluxo de caixa em tempo real</p>
        </div>
        <div className="flex gap-2">
          <button className="btn btn-secondary" style={{ color: 'var(--danger)' }} onClick={() => { setNovoTipo('saida'); setIsModal(true); }}>
            <ArrowDownRight size={16} /> Despesa
          </button>
          <button className="btn btn-primary" onClick={() => { setNovoTipo('entrada'); setIsModal(true); }}>
            <ArrowUpRight size={16} /> Receita
          </button>
        </div>
      </div>

      {/* ── Cards resumo ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 24 }}>
        <div className="card" style={{ borderLeft: '4px solid var(--success)' }}>
          <p className="text-secondary" style={{ fontSize: 12 }}>Total Entradas</p>
          <h3 style={{ fontSize: 24, fontWeight: 700, color: 'var(--success)' }}>{formatCurrency(entradas)}</h3>
          <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>{transacoes.filter(t => t.tipo === 'entrada').length} transações</p>
        </div>
        <div className="card" style={{ borderLeft: '4px solid var(--danger)' }}>
          <p className="text-secondary" style={{ fontSize: 12 }}>Total Saídas</p>
          <h3 style={{ fontSize: 24, fontWeight: 700, color: 'var(--danger)' }}>{formatCurrency(saidas)}</h3>
          <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>{transacoes.filter(t => t.tipo === 'saida').length} transações</p>
        </div>
        <div className="card" style={{ borderLeft: `4px solid ${saldo >= 0 ? 'var(--success)' : 'var(--danger)'}` }}>
          <p className="text-secondary" style={{ fontSize: 12 }}>Saldo</p>
          <h3 style={{ fontSize: 24, fontWeight: 700, color: saldo >= 0 ? 'var(--success)' : 'var(--danger)' }}>{formatCurrency(saldo)}</h3>
          <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>{saldo >= 0 ? 'Positivo' : 'Negativo'}</p>
        </div>
        <div className="card" style={{ borderLeft: '4px solid var(--warning)' }}>
          <p className="text-secondary" style={{ fontSize: 12 }}>A Receber/Pagar</p>
          <h3 style={{ fontSize: 24, fontWeight: 700 }}>{formatCurrency(pendente)}</h3>
          <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>{transacoes.filter(t => t.status === 'pendente').length} pendentes</p>
        </div>
      </div>

      {/* ── Gráficos ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 20, marginBottom: 24 }}>

        {/* Fluxo mensal */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <TrendingUp size={16} color="var(--primary)" />
            <h4 style={{ fontWeight: 600, fontSize: 14 }}>Fluxo de Caixa Mensal</h4>
          </div>
          {dadosMensal.length === 0 ? (
            <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
              Sem transações cadastradas
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={dadosMensal} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
                <YAxis tickFormatter={fmtK} tick={{ fontSize: 11 }} width={48} />
                <Tooltip content={<TooltipCustom />} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="Entradas" fill="#10b981" radius={[3, 3, 0, 0]} />
                <Bar dataKey="Saídas" fill="#ef4444" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Gastos por obra */}
        <div className="card">
          <h4 style={{ fontWeight: 600, fontSize: 14, marginBottom: 16 }}>Despesas por Obra</h4>
          {dadosObras.length === 0 ? (
            <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
              Sem despesas registradas
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={dadosObras} layout="vertical" margin={{ top: 0, right: 16, left: 4, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                <XAxis type="number" tickFormatter={fmtK} tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="nome" tick={{ fontSize: 11 }} width={90} />
                <Tooltip content={<TooltipCustom />} formatter={(v) => [formatCurrency(v), 'Despesa']} />
                <Bar dataKey="valor" name="Despesa" radius={[0, 3, 3, 0]}>
                  {dadosObras.map((_, i) => <Cell key={i} fill={CORES[i % CORES.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Status pie */}
        {dadosPie.length > 0 && (
          <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <h4 style={{ fontWeight: 600, fontSize: 14, marginBottom: 12, alignSelf: 'flex-start' }}>Status dos Pagamentos</h4>
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={dadosPie} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                  <Cell fill="#10b981" />
                  <Cell fill="#f59e0b" />
                </Pie>
                <Tooltip formatter={(v) => formatCurrency(v)} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* ── Tabela ── */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="flex justify-between items-center" style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', flexWrap: 'wrap', gap: 8 }}>
          <div className="flex gap-2">
            {['todas', 'entradas', 'saidas', 'pendentes'].map(aba => (
              <button key={aba} onClick={() => setAbaAtiva(aba)} style={{
                padding: '6px 14px', borderRadius: 20, fontSize: 13, fontWeight: 600,
                backgroundColor: abaAtiva === aba ? 'var(--primary)' : 'transparent',
                color: abaAtiva === aba ? 'white' : 'var(--text-secondary)',
                border: abaAtiva === aba ? 'none' : '1px solid var(--border)',
                textTransform: 'capitalize', cursor: 'pointer'
              }}>{aba}</button>
            ))}
          </div>
          <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>{filtradas.length} transações</p>
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
              {filtradas.length === 0 && (
                <tr><td colSpan={6} style={{ textAlign: 'center', padding: 24, color: 'var(--text-muted)' }}>Nenhuma transação encontrada.</td></tr>
              )}
              {filtradas.map(t => {
                const obraId = getObraId(t);
                return (
                  <tr key={t.id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <div style={{ backgroundColor: t.tipo === 'entrada' ? 'var(--success-bg, rgba(16,185,129,.12))' : 'var(--danger-bg, rgba(239,68,68,.12))', color: t.tipo === 'entrada' ? 'var(--success)' : 'var(--danger)', borderRadius: '50%', padding: 6, flexShrink: 0 }}>
                          {t.tipo === 'entrada' ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                        </div>
                        <InlineEdit value={t.descricao} onSave={v => updateTransacao(t.id, 'descricao', v)} />
                      </div>
                    </td>
                    <td className="text-secondary" style={{ fontSize: 13 }}>
                      {obraId ? (obras.find(o => o.id === obraId)?.nome || '-') : 'Geral'}
                    </td>
                    <td><InlineEdit value={t.data} type="date" onSave={v => updateTransacao(t.id, 'data', v)} /></td>
                    <td>
                      <InlineEdit value={t.status} type="select" options={['pago', 'pendente']} onSave={v => updateTransacao(t.id, 'status', v)} />
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 600, color: t.tipo === 'entrada' ? 'var(--success)' : 'var(--text-primary)' }}>
                      <InlineEdit value={t.valor} type="currency" onSave={v => updateTransacao(t.id, 'valor', v)} />
                    </td>
                    <td>
                      <button className="icon-btn" style={{ color: 'var(--danger)' }} onClick={() => deleteTransacao(t.id)}>
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Modal nova transação ── */}
      <Modal isOpen={isModal} onClose={() => setIsModal(false)} title={novoTipo === 'entrada' ? 'Nova Receita' : 'Nova Despesa'}>
        <form onSubmit={handleAdd} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ display: 'block', fontSize: 13, color: 'var(--text-secondary)', marginBottom: 4 }}>Descrição</label>
            <input autoFocus required value={novaDesc} onChange={e => setNovaDesc(e.target.value)}
              style={{ width: '100%', padding: 10, borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', outline: 'none' }} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ display: 'block', fontSize: 13, color: 'var(--text-secondary)', marginBottom: 4 }}>Valor (R$)</label>
              <input required type="number" step="0.01" value={novoValor} onChange={e => setNovoValor(e.target.value)}
                style={{ width: '100%', padding: 10, borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', outline: 'none' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 13, color: 'var(--text-secondary)', marginBottom: 4 }}>Data</label>
              <input type="date" value={novaData} onChange={e => setNovaData(e.target.value)}
                style={{ width: '100%', padding: 10, borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', outline: 'none' }} />
            </div>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 13, color: 'var(--text-secondary)', marginBottom: 4 }}>Vincular à Obra (opcional)</label>
            <select value={novaObra} onChange={e => setNovaObra(e.target.value)}
              style={{ width: '100%', padding: 10, borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', outline: 'none' }}>
              <option value="">— Sem obra —</option>
              {obras.map(o => <option key={o.id} value={o.id}>{o.nome}</option>)}
            </select>
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: 4 }}>Salvar</button>
        </form>
      </Modal>
    </div>
  );
}
