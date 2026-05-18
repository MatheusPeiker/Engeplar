import React from 'react';
import { TrendingUp, TrendingDown, DollarSign, AlertCircle, HardHat, Activity, CheckCircle, Circle, Building2, Users, FileText, ShoppingBag, ChevronRight } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useAppContext } from '../context/AppContext';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const { obras, notificacoes, calcProgressoFinanceiro, funcionarios, cronogramas, historico, formatCurrency, empresa, clientes, listaOrcamentos } = useAppContext();
  const navigate = useNavigate();

  // ── Onboarding journey ───────────────────────────────────
  const steps = [
    { done: !!(empresa?.razaoSocial || empresa?.nomeFantasia), label: 'Cadastrar sua empresa', desc: 'Preencha os dados da sua empresa no Perfil', link: '/perfil', icon: Building2 },
    { done: funcionarios.length > 0, label: 'Cadastrar sua equipe', desc: 'Adicione seus profissionais e colaboradores', link: '/perfil', icon: Users },
    { done: clientes.length > 0, label: 'Cadastrar clientes', desc: 'Registre seus primeiros clientes', link: '/clientes', icon: ShoppingBag },
    { done: listaOrcamentos.length > 0, label: 'Criar um orçamento', desc: 'Monte materiais, mão de obra e mobilização', link: '/orcamentos', icon: FileText },
    { done: obras.length > 0, label: 'Iniciar uma obra', desc: 'Crie sua primeira obra e acompanhe o progresso', link: '/obras', icon: HardHat },
  ];
  const completedCount = steps.filter(s => s.done).length;
  const showJourney = completedCount < steps.length;

  const orcamentoGlobal = obras.reduce((acc, curr) => acc + curr.orcamento, 0);
  const gastoGlobal = obras.reduce((acc, curr) => acc + calcProgressoFinanceiro(curr).gasto, 0);
  const saldo = orcamentoGlobal - gastoGlobal;
  const custoFunc = funcionarios.reduce((a, f) => a + f.custoDiaria * f.diasTrabalhados, 0);

  const progressoObras = obras.map(o => {
    const etapas = cronogramas.filter(c => c.obraId === o.id);
    const prog = etapas.length > 0 ? Math.round(etapas.reduce((a, e) => a + e.progresso, 0) / etapas.length) : 0;
    return { name: o.nome.substring(0, 15), progresso: prog, orcamento: o.orcamento / 1000 };
  });

  const chartData = [
    { name: 'Jan', receitas: 40000, despesas: 24000 },
    { name: 'Fev', receitas: 30000, despesas: 13980 },
    { name: 'Mar', receitas: 20000, despesas: 38000 },
    { name: 'Abr', receitas: 27800, despesas: 39080 },
    { name: 'Mai', receitas: 68900, despesas: 48000 },
    { name: 'Jun', receitas: 93900, despesas: 38000 },
  ];

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Visão Geral</h1>
          <p className="page-subtitle">Dados em tempo real — qualquer edição no sistema atualiza aqui</p>
        </div>
        <div className="flex gap-2">
          <button className="btn btn-secondary" onClick={() => navigate('/historico')}>
            <Activity size={16} /> {historico.length} alterações
          </button>
          <button className="btn btn-primary" onClick={() => navigate('/obras')}>
            <HardHat size={18} /> Ir para Obras
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 24 }}>
        <div className="card" style={{ borderLeft: '4px solid var(--primary)' }}>
          <div className="flex justify-between items-center mb-4">
            <span className="text-secondary" style={{ fontSize: 13, fontWeight: 500 }}>Orçamento Global</span>
            <div className="icon-btn" style={{ backgroundColor: 'var(--primary-light)', color: 'var(--primary)' }}><DollarSign size={18} /></div>
          </div>
          <h3 style={{ fontSize: 26, fontWeight: 700 }}>{formatCurrency(orcamentoGlobal)}</h3>
          <p className="text-muted" style={{ fontSize: 13, marginTop: 4 }}>{obras.length} obras ativas</p>
        </div>

        <div className="card">
          <div className="flex justify-between items-center mb-4">
            <span className="text-secondary" style={{ fontSize: 13, fontWeight: 500 }}>Saldo Disponível</span>
            <div className="icon-btn" style={{ backgroundColor: 'var(--success-bg)', color: 'var(--success)' }}><TrendingUp size={18} /></div>
          </div>
          <h3 style={{ fontSize: 26, fontWeight: 700, color: saldo >= 0 ? 'var(--success)' : 'var(--danger)' }}>{formatCurrency(saldo)}</h3>
          <p className="text-muted" style={{ fontSize: 13, marginTop: 4 }}>{saldo >= 0 ? 'Dentro do orçamento' : 'Acima do orçamento!'}</p>
        </div>

        <div className="card">
          <div className="flex justify-between items-center mb-4">
            <span className="text-secondary" style={{ fontSize: 13, fontWeight: 500 }}>Gasto Realizado</span>
            <div className="icon-btn" style={{ backgroundColor: 'var(--danger-bg)', color: 'var(--danger)' }}><TrendingDown size={18} /></div>
          </div>
          <h3 style={{ fontSize: 26, fontWeight: 700 }}>{formatCurrency(gastoGlobal)}</h3>
          <p className="text-danger flex items-center gap-1" style={{ fontSize: 13, fontWeight: 500 }}>
            <AlertCircle size={14} /> {orcamentoGlobal > 0 ? Math.round((gastoGlobal / orcamentoGlobal) * 100) : 0}% comprometido
          </p>
        </div>

        <div className="card">
          <div className="flex justify-between items-center mb-4">
            <span className="text-secondary" style={{ fontSize: 13, fontWeight: 500 }}>Custo Mão de Obra</span>
            <div className="icon-btn" style={{ backgroundColor: 'var(--warning-bg)', color: 'var(--warning)' }}><HardHat size={18} /></div>
          </div>
          <h3 style={{ fontSize: 26, fontWeight: 700 }}>{formatCurrency(custoFunc)}</h3>
          <p className="text-muted" style={{ fontSize: 13, marginTop: 4 }}>{funcionarios.length} profissionais</p>
        </div>
      </div>

      {/* ── Jornada de configuração ── */}
      {showJourney && (
        <div className="card" style={{ marginBottom: 24, padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div>
              <h3 style={{ fontWeight: 700, fontSize: 16 }}>Primeiros Passos</h3>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 2 }}>Complete sua configuração para começar a usar o sistema</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontSize: 22, fontWeight: 800, color: 'var(--primary)' }}>{completedCount}/{steps.length}</p>
              <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>concluídos</p>
            </div>
          </div>
          {/* Barra de progresso */}
          <div style={{ height: 6, background: 'var(--border)', borderRadius: 4, overflow: 'hidden', marginBottom: 16 }}>
            <div style={{ width: `${(completedCount / steps.length) * 100}%`, height: '100%', background: 'var(--primary)', borderRadius: 4, transition: 'width .5s' }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {steps.map((s, i) => {
              const Icon = s.icon;
              return (
                <div
                  key={i}
                  onClick={() => !s.done && navigate(s.link)}
                  style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderRadius: 10, background: s.done ? 'rgba(16,185,129,0.06)' : 'var(--background)', border: `1px solid ${s.done ? 'rgba(16,185,129,0.2)' : 'var(--border)'}`, cursor: s.done ? 'default' : 'pointer', transition: 'opacity .2s' }}
                >
                  {s.done
                    ? <CheckCircle size={20} color="var(--success)" style={{ flexShrink: 0 }} />
                    : <Circle size={20} color="var(--border)" style={{ flexShrink: 0 }} />
                  }
                  <div style={{ flex: 1 }}>
                    <p style={{ fontWeight: 600, fontSize: 14, color: s.done ? 'var(--text-muted)' : 'var(--text-primary)', textDecoration: s.done ? 'line-through' : 'none' }}>{s.label}</p>
                    {!s.done && <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>{s.desc}</p>}
                  </div>
                  {!s.done && <ChevronRight size={16} color="var(--text-muted)" />}
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="flex gap-6" style={{ flexWrap: 'wrap' }}>
        {/* Gráfico */}
        <div className="card flex-1" style={{ minWidth: 300 }}>
          <h3 style={{ fontWeight: 600, marginBottom: 20 }}>Fluxo Financeiro (6 meses)</h3>
          <div style={{ height: 280, width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRe" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--success)" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="var(--success)" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorDes" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--danger)" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="var(--danger)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)' }} />
                <Tooltip contentStyle={{ borderRadius: 8, border: 'none', boxShadow: 'var(--shadow-md)' }} />
                <Area type="monotone" dataKey="receitas" stroke="var(--success)" fillOpacity={1} fill="url(#colorRe)" name="Receitas" />
                <Area type="monotone" dataKey="despesas" stroke="var(--danger)" fillOpacity={1} fill="url(#colorDes)" name="Despesas" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Alertas + Progresso */}
        <div style={{ width: '100%', maxWidth: 360, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="card">
            <div className="flex justify-between items-center mb-4">
              <h3 style={{ fontWeight: 600 }}>Alertas</h3>
              <span className="badge badge-warning">{notificacoes.filter(n => !n.lida).length} Novos</span>
            </div>
            {notificacoes.slice(0, 3).map(n => (
              <div key={n.id} className="flex gap-3 items-start" style={{ padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                <AlertCircle size={16} color={n.lida ? 'var(--text-muted)' : 'var(--danger)'} style={{ marginTop: 2 }} />
                <div>
                  <p style={{ fontWeight: 500, fontSize: 13, color: n.lida ? 'var(--text-muted)' : 'var(--text-primary)' }}>{n.titulo}</p>
                  <p className="text-secondary" style={{ fontSize: 12 }}>{n.descricao}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="card">
            <h3 style={{ fontWeight: 600, marginBottom: 16 }}>Progresso Obras</h3>
            {progressoObras.map(o => (
              <div key={o.name} style={{ marginBottom: 12 }}>
                <div className="flex justify-between" style={{ fontSize: 13, marginBottom: 4 }}>
                  <span style={{ fontWeight: 500 }}>{o.name}</span>
                  <span style={{ fontWeight: 600 }}>{o.progresso}%</span>
                </div>
                <div style={{ height: 6, background: 'var(--border)', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ width: `${o.progresso}%`, height: '100%', background: 'var(--primary)', borderRadius: 3, transition: 'width 0.5s' }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
