import { useState } from 'react';
import { Plus, Trash2, MapPin, Briefcase } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import InlineEdit from '../components/InlineEdit';
import Modal from '../components/Modal';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet default marker icons broken by Vite asset handling
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

function EquipeMap({ obras, funcionarios }) {
  const obrasComFuncionarios = obras.filter(o =>
    funcionarios.some(f => f.obraAtualId === o.id)
  );

  const center = obrasComFuncionarios.length > 0
    ? obrasComFuncionarios[0].location
    : [-23.5505, -46.6333];

  return (
    <MapContainer
      center={center}
      zoom={13}
      style={{ height: 300, width: '100%', borderRadius: 12, zIndex: 0 }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {obrasComFuncionarios.map(obra => {
        const equipe = funcionarios.filter(f => f.obraAtualId === obra.id);
        return (
          <Marker key={obra.id} position={obra.location}>
            <Popup>
              <div style={{ minWidth: 160 }}>
                <strong style={{ fontSize: 13 }}>{obra.nome}</strong>
                <p style={{ fontSize: 11, color: '#666', margin: '4px 0 6px' }}>{obra.endereco}</p>
                <div style={{ borderTop: '1px solid #eee', paddingTop: 6 }}>
                  {equipe.map(f => (
                    <div key={f.id} style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 4, marginBottom: 3 }}>
                      <span style={{ width: 22, height: 22, borderRadius: '50%', background: '#EFF6FF', color: '#1D4ED8', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, flexShrink: 0 }}>
                        {f.nome.charAt(0)}
                      </span>
                      <span>{f.nome}</span>
                      <span style={{ color: '#999', fontSize: 10 }}>— {f.funcao}</span>
                    </div>
                  ))}
                </div>
              </div>
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
}

export default function Funcionarios() {
  const {
    funcionarios, addFuncionario, updateFuncionario, deleteFuncionario,
    registrosDesempenho, addRegistroDesempenho,
    obras, listaOrcamentos, getTotalOrcamento, propostas, formatCurrency
  } = useAppContext();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isRecordModal, setIsRecordModal] = useState(false);
  const [selectedFuncId, setSelectedFuncId] = useState(null);

  const [nome, setNome] = useState('');
  const [funcao, setFuncao] = useState('');
  const [custoDiaria, setCustoDiaria] = useState('');

  const [mesReg, setMesReg] = useState('Janeiro');
  const [perfReg, setPerfReg] = useState(100);
  const [valorReg, setValorReg] = useState('');
  const [obraReg, setObraReg] = useState('');

  // Obras concluídas (qualquer status que indique conclusão)
  const obrasConcluidas = obras.filter(o =>
    o.status === 'Concluída' || o.status === 'Concluido' || o.status === 'Finalizada'
  );

  const calcValorGerado = (obraId, funcId) => {
    if (!obraId || !funcId) return null;
    const obra = obras.find(o => o.id === obraId);
    const orc = listaOrcamentos.find(lo => lo.obraId === obraId);
    if (!obra) return null;
    // Revenue: prefer proposta value, fallback to obra budget
    const proposta = propostas.find(p => p.obraId === obraId);
    const receita = proposta?.valorProposto || obra.orcamento || 0;
    if (!orc) return receita > 0 ? null : 0; // no orçamento → can't split, let user enter manually
    const empMO = (orc.extras?.maoDeObra || []).find(m => m.funcionarioId === funcId);
    const empCusto = empMO ? (empMO.diasPrevistos * empMO.custoDiaria) : 0;
    const totalCusto = getTotalOrcamento(orc.id);
    if (totalCusto === 0 || receita === 0) return 0;
    return Math.round((empCusto / totalCusto) * receita * 100) / 100;
  };

  const handleObraRegChange = (obraId) => {
    setObraReg(obraId);
    const calc = calcValorGerado(obraId, selectedFuncId);
    if (calc !== null) setValorReg(String(calc));
  };

  const handleAddFuncionario = (e) => {
    e.preventDefault();
    if (!nome || !custoDiaria) return;
    addFuncionario({ nome, funcao: funcao || 'Sem função', custoDiaria: parseFloat(custoDiaria), diasTrabalhados: 0, obraAtualId: null, desempenho: 'Avaliando' });
    setIsModalOpen(false);
    setNome(''); setFuncao(''); setCustoDiaria('');
  };

  const handleAddRecord = (e) => {
    e.preventDefault();
    addRegistroDesempenho({ funcionarioId: selectedFuncId, mes: mesReg, ano: new Date().getFullYear(), performance: parseInt(perfReg), valorGerado: parseFloat(valorReg) });
    setIsRecordModal(false);
  };

  const alocados = funcionarios.filter(f => f.obraAtualId).length;
  const disponiveis = funcionarios.length - alocados;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Equipes e Profissionais</h1>
          <p className="page-subtitle">Acompanhe quem são e onde estão alocados em tempo real</p>
        </div>
        <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
          <Plus size={18} /> Novo Profissional
        </button>
      </div>

      {/* Mapa de localização das equipes */}
      <div className="card" style={{ marginBottom: 24, padding: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <MapPin size={18} color="var(--primary)" />
            <h3 style={{ fontWeight: 600, fontSize: 15, margin: 0 }}>Localização das Equipes</h3>
          </div>
          <div style={{ display: 'flex', gap: 12, fontSize: 12, color: 'var(--text-secondary)' }}>
            <span><strong style={{ color: 'var(--primary)' }}>{alocados}</strong> alocados</span>
            <span><strong style={{ color: 'var(--success)' }}>{disponiveis}</strong> disponíveis</span>
          </div>
        </div>
        <EquipeMap obras={obras} funcionarios={funcionarios} />
      </div>

      {/* Cards dos funcionários */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20 }}>
        {funcionarios.map(f => {
          const obra = f.obraAtualId ? obras.find(o => o.id === f.obraAtualId) : null;
          return (
            <div key={f.id} className="card hover-effect">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 700 }}>
                    {f.nome.charAt(0)}
                  </div>
                  <div>
                    <h3 style={{ fontWeight: 700, fontSize: 16 }}>
                      <InlineEdit value={f.nome} onSave={v => updateFuncionario(f.id, 'nome', v)} />
                    </h3>
                    <p className="text-secondary" style={{ fontSize: 13, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Briefcase size={12} />
                      <InlineEdit value={f.funcao} onSave={v => updateFuncionario(f.id, 'funcao', v)} />
                    </p>
                  </div>
                </div>
                <button className="icon-btn text-danger" onClick={() => { if (confirm('Excluir?')) deleteFuncionario(f.id); }}>
                  <Trash2 size={16} />
                </button>
              </div>

              <div style={{ background: 'var(--background)', borderRadius: 12, padding: 12, marginBottom: 16 }}>
                <div className="flex items-center justify-between mb-2">
                  <span style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Alocação Atual</span>
                  <span className={`badge ${obra ? 'badge-primary' : 'badge-danger'}`} style={{ fontSize: 10 }}>{obra ? 'Alocado' : 'Disponível'}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600, fontSize: 14 }}>
                  <MapPin size={14} color={obra ? 'var(--primary)' : 'var(--danger)'} />
                  <InlineEdit
                    value={obra ? obra.nome : 'Sem alocação'}
                    type="select"
                    options={[{ value: '', label: 'Sem alocação' }, ...obras.map(o => ({ value: String(o.id), label: o.nome }))]}
                    onSave={v => updateFuncionario(f.id, 'obraAtualId', v || null)}
                  />
                </div>
              </div>

              <div style={{ marginBottom: 16 }}>
                <div className="flex justify-between items-center mb-2">
                  <span style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Desempenho Mensal</span>
                  <button className="text-primary" style={{ fontSize: 11, background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }} onClick={() => { setSelectedFuncId(f.id); setObraReg(''); setValorReg(''); setIsRecordModal(true); }}>
                    + Registrar Mês
                  </button>
                </div>
                <div style={{ display: 'flex', gap: 4, overflowX: 'auto', paddingBottom: 4 }}>
                  {registrosDesempenho.filter(r => r.funcionarioId === f.id).map(r => (
                    <div key={r.id} className="card" style={{ padding: '6px 10px', minWidth: 80, flexShrink: 0, background: 'var(--background)' }}>
                      <p style={{ fontSize: 10, fontWeight: 700, marginBottom: 2 }}>{r.mes}</p>
                      <p style={{ fontSize: 12, fontWeight: 700, color: r.performance > 80 ? 'var(--success)' : 'var(--warning)' }}>{r.performance}%</p>
                      <p style={{ fontSize: 9, color: 'var(--text-muted)' }}>{formatCurrency(r.valorGerado)}</p>
                    </div>
                  ))}
                  {registrosDesempenho.filter(r => r.funcionarioId === f.id).length === 0 && (
                    <p className="text-muted" style={{ fontSize: 11 }}>Nenhum registro</p>
                  )}
                </div>
              </div>

              <div className="flex justify-between items-center">
                <div>
                  <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>Custo Diária</p>
                  <p style={{ fontWeight: 700, color: 'var(--success)' }}>
                    <InlineEdit value={f.custoDiaria} type="currency" onSave={v => updateFuncionario(f.id, 'custoDiaria', v)} />
                  </p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>Desempenho</p>
                  <InlineEdit
                    value={f.desempenho}
                    type="select"
                    options={['Excelente', 'Bom', 'Precisa Melhorar', 'Avaliando']}
                    onSave={v => updateFuncionario(f.id, 'desempenho', v)}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Novo Profissional">
        <form onSubmit={handleAddFuncionario} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label className="text-secondary" style={{ display: 'block', fontSize: 13, marginBottom: 4 }}>Nome Completo</label>
            <input autoFocus required type="text" value={nome} onChange={e => setNome(e.target.value)} style={{ width: '100%', padding: 10, borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', outline: 'none' }} />
          </div>
          <div className="flex gap-4">
            <div style={{ flex: 1 }}>
              <label className="text-secondary" style={{ display: 'block', fontSize: 13, marginBottom: 4 }}>Função / Cargo</label>
              <input type="text" value={funcao} onChange={e => setFuncao(e.target.value)} style={{ width: '100%', padding: 10, borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', outline: 'none' }} />
            </div>
            <div style={{ flex: 1 }}>
              <label className="text-secondary" style={{ display: 'block', fontSize: 13, marginBottom: 4 }}>Diária (R$)</label>
              <input required type="number" value={custoDiaria} onChange={e => setCustoDiaria(e.target.value)} style={{ width: '100%', padding: 10, borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', outline: 'none' }} />
            </div>
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Cadastrar Profissional</button>
        </form>
      </Modal>

      <Modal isOpen={isRecordModal} onClose={() => setIsRecordModal(false)} title="Novo Registro Mensal">
        <form onSubmit={handleAddRecord} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="flex gap-4">
            <div style={{ flex: 1 }}>
              <label className="text-secondary" style={{ display: 'block', fontSize: 13, marginBottom: 4 }}>Mês</label>
              <select value={mesReg} onChange={e => setMesReg(e.target.value)} style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid var(--border)' }}>
                {['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'].map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
            <div style={{ flex: 1 }}>
              <label className="text-secondary" style={{ display: 'block', fontSize: 13, marginBottom: 4 }}>Performance (%)</label>
              <input type="number" min="0" max="100" value={perfReg} onChange={e => setPerfReg(e.target.value)} style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid var(--border)' }} />
            </div>
          </div>

          <div>
            <label className="text-secondary" style={{ display: 'block', fontSize: 13, marginBottom: 4 }}>Obra Concluída (opcional)</label>
            <select value={obraReg} onChange={e => handleObraRegChange(e.target.value)} style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid var(--border)' }}>
              <option value="">Selecionar obra para calcular valor...</option>
              {obrasConcluidas.map(o => <option key={o.id} value={o.id}>{o.nome}</option>)}
            </select>
            {obraReg && (() => {
              const orc = listaOrcamentos.find(lo => lo.obraId === obraReg);
              const empMO = orc?.extras?.maoDeObra?.find(m => m.funcionarioId === selectedFuncId);
              const obra = obras.find(o => o.id === obraReg);
              const proposta = propostas.find(p => p.obraId === obraReg);
              const receita = proposta?.valorProposto || obra?.orcamento || 0;
              const totalCusto = orc ? getTotalOrcamento(orc.id) : 0;
              const empCusto = empMO ? empMO.diasPrevistos * empMO.custoDiaria : 0;
              const perc = totalCusto > 0 ? ((empCusto / totalCusto) * 100).toFixed(1) : 0;
              return (
                <div style={{ marginTop: 8, padding: '10px 12px', background: 'var(--primary-light, rgba(37,99,235,0.08))', borderRadius: 8, fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.7 }}>
                  {empMO
                    ? <><strong>{empMO.diasPrevistos} dias</strong> × {formatCurrency(empMO.custoDiaria)}/dia = <strong>{formatCurrency(empCusto)}</strong> de custo<br />
                       Representa <strong>{perc}%</strong> do custo total da obra ({formatCurrency(totalCusto)})<br />
                       Receita da obra: <strong>{formatCurrency(receita)}</strong> → Valor gerado: <strong style={{ color: 'var(--success)' }}>{formatCurrency(parseFloat(valorReg) || 0)}</strong></>
                    : <span style={{ color: 'var(--warning)' }}>Funcionário não encontrado no orçamento desta obra. Insira o valor manualmente.</span>
                  }
                </div>
              );
            })()}
          </div>

          <div>
            <label className="text-secondary" style={{ display: 'block', fontSize: 13, marginBottom: 4 }}>
              Valor Gerado (R$)
              {obraReg && calcValorGerado(obraReg, selectedFuncId) !== null && (
                <span style={{ marginLeft: 8, fontSize: 11, color: 'var(--primary)', fontWeight: 400 }}>calculado automaticamente</span>
              )}
            </label>
            <input required type="number" step="0.01" value={valorReg} onChange={e => setValorReg(e.target.value)} style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid var(--border)' }} placeholder="0.00" />
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Salvar Registro</button>
        </form>
      </Modal>
    </div>
  );
}
