import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RTooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Download, Filter, TrendingUp, TrendingDown } from 'lucide-react';
import { useAppContext } from '../context/AppContext';

const COLORS = ['#1E3A8A', '#F59E0B', '#EF4444', '#10B981', '#8b5cf6', '#06b6d4'];

export default function Relatorios() {
  const { obras, funcionarios, calcProgressoFinanceiro, cronogramas, getTotalOrcamento, getPropostaObra, historico, registrosDesempenho, getTopClientes, getTopFornecedores, formatCurrency } = useAppContext();
  const [visorModo, setVisorModo] = useState('Geral');

  const topClientes = getTopClientes();
  const topFornecedores = getTopFornecedores();

  const dataObraLucro = obras.map(o => ({
    name: o.nome.substring(0, 18), planejado: o.orcamento, realizado: calcProgressoFinanceiro(o).gasto
  }));

  const custoFunc = funcionarios.reduce((a, f) => a + (f.custoDiaria * f.diasTrabalhados), 0);
  const custoMat = obras.reduce((a, o) => a + calcProgressoFinanceiro(o).gasto, 0);
  const dataDespesas = [{ name: 'Mão de Obra', value: custoFunc || 1 }, { name: 'Materiais', value: custoMat || 1 }];

  const dataLucro = obras.map(o => {
    const custo = getTotalOrcamento(o.id);
    const propList = getPropostaObra(o.id);
    const prop = propList[0] || null;
    const margem = prop?.margemLucro || 20;
    const valorProposto = prop?.valorProposto || custo * (1 + margem / 100);
    return { name: o.nome.substring(0, 15), custo, proposto: valorProposto, lucro: valorProposto - custo };
  });

  const desempenhoStats = { 'Excelente': 0, 'Bom': 0, 'Precisa Melhorar': 0 };
  funcionarios.forEach(f => { desempenhoStats[f.desempenho] = (desempenhoStats[f.desempenho] || 0) + 1; });
  const dataDesempenho = Object.keys(desempenhoStats).map(k => ({ name: k, value: desempenhoStats[k] }));

  const diasObras = obras.map(o => ({
    name: o.nome.substring(0, 18),
    diasTotais: funcionarios.filter(f => f.obraAtualId === o.id).reduce((a, c) => a + c.diasTrabalhados, 0)
  }));

  const alteracoesRecentes = historico.slice(0, 5);

  return (
    <div>
      <div className="page-header" style={{ marginBottom: 0 }}>
        <div>
          <h1 className="page-title">Relatórios em Tempo Real</h1>
          <p className="page-subtitle">Dados atualizados automaticamente com qualquer alteração no sistema</p>
        </div>
        <div className="flex gap-2">
          <div style={{ position: 'relative' }}>
            <Filter size={16} style={{ position: 'absolute', left: 12, top: 12, color: 'var(--text-muted)' }} />
            <select value={visorModo} onChange={e => setVisorModo(e.target.value)} className="card" style={{ padding: '10px 10px 10px 36px', height: 40, fontWeight: 600, color: 'var(--primary)', cursor: 'pointer', outline: 'none' }}>
              <option value="Geral">Visão Geral</option>
              <option value="Lucro">Análise de Lucro</option>
              <option value="Obras">Desempenho Obras</option>
               <option value="Funcionarios">Equipe / RH</option>
              <option value="Clientes">Clientes (Top Compras)</option>
              <option value="Fornecedores">Fornecedores (Top Vendas)</option>
            </select>
          </div>
          <button className="btn btn-secondary"><Download size={16} /> Exportar</button>
        </div>
      </div>

      <div className="mt-8">
        {visorModo === 'Geral' && (
          <div className="flex gap-6" style={{ flexWrap: 'wrap' }}>
            <div className="card flex-1" style={{ minWidth: 340 }}>
              <h3 style={{ fontWeight: 600, marginBottom: 24 }}>Orçamento vs Gasto Real</h3>
              <div style={{ height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dataObraLucro}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 12 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 12 }} />
                    <RTooltip contentStyle={{ borderRadius: 8, border: 'none', boxShadow: 'var(--shadow-md)' }} />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: 13 }} />
                    <Bar dataKey="planejado" name="Orçamento" fill="var(--primary-light)" radius={[4,4,0,0]} />
                    <Bar dataKey="realizado" name="Gasto Real" fill="var(--primary)" radius={[4,4,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="card" style={{ width: '100%', maxWidth: 380 }}>
              <h3 style={{ fontWeight: 600, marginBottom: 24 }}>Rateio de Capital</h3>
              <div style={{ height: 300, display: 'flex', justifyContent: 'center' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart><Pie data={dataDespesas} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value">
                    {dataDespesas.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                  </Pie><RTooltip /><Legend iconType="circle" wrapperStyle={{ fontSize: 13 }} /></PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {visorModo === 'Lucro' && (
          <div className="flex gap-6" style={{ flexWrap: 'wrap' }}>
            <div className="card flex-1" style={{ minWidth: 340 }}>
              <h3 style={{ fontWeight: 600, marginBottom: 24 }}>Custo Real vs Valor Proposto</h3>
              <div style={{ height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dataLucro}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 12 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 12 }} />
                    <RTooltip contentStyle={{ borderRadius: 8, border: 'none', boxShadow: 'var(--shadow-md)' }} />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: 13 }} />
                    <Bar dataKey="custo" name="Custo Real" fill="var(--danger)" radius={[4,4,0,0]} />
                    <Bar dataKey="proposto" name="Valor Proposto" fill="var(--success)" radius={[4,4,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="card" style={{ width: '100%', maxWidth: 340 }}>
              <h3 style={{ fontWeight: 600, marginBottom: 16 }}>Lucro por Obra</h3>
              {dataLucro.map(d => (
                <div key={d.name} style={{ padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                  <div className="flex justify-between" style={{ fontSize: 13, marginBottom: 4 }}>
                    <span style={{ fontWeight: 500 }}>{d.name}</span>
                    <span style={{ fontWeight: 700, color: d.lucro >= 0 ? 'var(--success)' : 'var(--danger)' }}>{formatCurrency(d.lucro)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {visorModo === 'Obras' && (
          <div className="card" style={{ minWidth: 340 }}>
            <h3 style={{ fontWeight: 600, marginBottom: 24 }}>Esforço Homem-Dia por Obra</h3>
            <div style={{ height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={diasObras} layout="vertical"><CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--border)" />
                  <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)' }} />
                  <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-primary)', fontSize: 12, fontWeight: 500 }} width={140} />
                  <RTooltip /><Bar dataKey="diasTotais" name="Diárias" fill="var(--warning)" radius={[0,4,4,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {visorModo === 'Funcionarios' && (
          <div className="flex gap-6" style={{ flexWrap: 'wrap' }}>
            <div className="card flex-1" style={{ minWidth: 340 }}>
              <h3 style={{ fontWeight: 600, marginBottom: 16 }}>Desempenho e Geração de Valor (Ano)</h3>
              <table className="table-editable">
                <thead>
                  <tr><th>Colaborador</th><th style={{ textAlign: 'center' }}>Média Performance</th><th style={{ textAlign: 'right' }}>Valor Gerado (Ano)</th></tr>
                </thead>
                <tbody>
                  {funcionarios.map(f => {
                    const registros = registrosDesempenho.filter(r => r.funcionarioId === f.id);
                    const mediaPerf = registros.length > 0 ? Math.round(registros.reduce((a, b) => a + b.performance, 0) / registros.length) : 0;
                    const totalGerado = registros.reduce((a, b) => a + b.valorGerado, 0);
                    return (
                      <tr key={f.id}>
                        <td><span style={{ fontWeight: 600 }}>{f.nome}</span> <span className="text-muted" style={{ fontSize: 11 }}>({f.funcao})</span></td>
                        <td style={{ textAlign: 'center' }}>
                          <div className="flex items-center gap-2" style={{ justifyContent: 'center' }}>
                            <div style={{ flex: 1, height: 6, background: 'var(--border)', borderRadius: 3, overflow: 'hidden', minWidth: 60 }}>
                              <div style={{ width: `${mediaPerf}%`, height: '100%', background: mediaPerf > 80 ? 'var(--success)' : 'var(--warning)' }}></div>
                            </div>
                            <span style={{ fontWeight: 700, fontSize: 13 }}>{mediaPerf}%</span>
                          </div>
                        </td>
                        <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--primary)' }}>{formatCurrency(totalGerado)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {visorModo === 'Clientes' && (
          <div className="card">
            <h3 style={{ fontWeight: 600, marginBottom: 20 }}>Top Clientes (Volume de Compras/Propostas)</h3>
            <div style={{ height: 350 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topClientes} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--border)" />
                  <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)' }} />
                  <YAxis dataKey="nome" type="category" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-primary)', fontSize: 12, fontWeight: 500 }} width={160} />
                  <RTooltip formatter={(val) => formatCurrency(val)} />
                  <Bar dataKey="total" name="Total Proposto" fill="var(--success)" radius={[0,4,4,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {visorModo === 'Fornecedores' && (
          <div className="card">
            <h3 style={{ fontWeight: 600, marginBottom: 20 }}>Top Fornecedores (Volume de Vendas)</h3>
            <div style={{ height: 350 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topFornecedores} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--border)" />
                  <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)' }} />
                  <YAxis dataKey="nome" type="category" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-primary)', fontSize: 12, fontWeight: 500 }} width={160} />
                  <RTooltip formatter={(val) => formatCurrency(val)} />
                  <Bar dataKey="total" name="Total Comprado" fill="var(--warning)" radius={[0,4,4,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Alterações Recentes */}
        {alteracoesRecentes.length > 0 && (
          <div className="card mt-6">
            <h3 style={{ fontWeight: 600, marginBottom: 12 }}>Últimas Alterações</h3>
            {alteracoesRecentes.map(a => (
              <div key={a.id} className="flex items-center gap-3" style={{ padding: '8px 0', borderBottom: '1px solid var(--border)', fontSize: 13 }}>
                <span className="badge badge-primary" style={{ fontSize: 10 }}>{a.modulo}</span>
                <span style={{ fontWeight: 500 }}>{a.campo}</span>
                {a.anterior !== null && <span style={{ color: 'var(--danger)', textDecoration: 'line-through' }}>{String(a.anterior).substring(0, 30)}</span>}
                {a.novo !== null && <span style={{ color: 'var(--success)', fontWeight: 600 }}>{String(a.novo).substring(0, 30)}</span>}
                <span className="text-muted" style={{ marginLeft: 'auto', fontSize: 11 }}>{new Date(a.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
