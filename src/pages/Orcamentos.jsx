import { useState, useEffect } from 'react';
import { Plus, Trash2, FileText, Download, ChevronRight, ArrowLeft, Users, Truck, RefreshCw, Search, UserCircle } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import InlineEdit from '../components/InlineEdit';
import Modal from '../components/Modal';

function SecaoHeader({ titulo, icone: Icon, cor }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 16px', borderTop: '1px solid var(--border)', background: 'var(--surface)' }}>
      <Icon size={15} color={cor} />
      <span style={{ fontWeight: 600, fontSize: 13, color: cor }}>{titulo}</span>
    </div>
  );
}

const inputSt = { padding: '7px 10px', borderRadius: 6, border: '1px solid var(--border)', fontSize: 13, outline: 'none', width: '100%', background: 'var(--input-bg, #fff)', color: 'var(--text-primary)' };

export default function Orcamentos() {
  const {
    obras, listaOrcamentos, funcionarios, empresa,
    addOrcamento, updateOrcamento, deleteOrcamento,
    addOrcamentoItem, updateOrcamentoItem, deleteOrcamentoItem,
    updateOrcamentoExtras,
    formatCurrency,
  } = useAppContext();

  const [view, setView] = useState('list');
  const [currentOrcId, setCurrentOrcId] = useState(null);
  const [isNewOrcModal, setIsNewOrcModal] = useState(false);
  const [newOrcName, setNewOrcName] = useState('');

  // Mão de obra
  const [addingMO, setAddingMO] = useState(false);
  const [moFuncId, setMoFuncId] = useState('');
  const [moDias, setMoDias] = useState(1);

  // Mobilização (estado local, salvo no blur)
  const [mob, setMob] = useState({});
  const [calcLoading, setCalcLoading] = useState(false);

  // Cliente do orçamento
  const [cli, setCli] = useState({});
  const [isLoadingCnpjOrc, setIsLoadingCnpjOrc] = useState(false);

  const currentOrc = listaOrcamentos.find(o => o.id === currentOrcId);
  const extras = currentOrc?.extras || {};
  const maoDeObra = extras.maoDeObra || [];

  useEffect(() => {
    setMob(currentOrc?.extras?.mobilizacao || {});
    setCli(currentOrc?.extras?.cliente || {});
    setAddingMO(false);
  }, [currentOrcId]);

  const items = currentOrc?.itens || [];

  const totalItens = items.reduce((a, b) => a + (b.quantidade * b.custoUnitario), 0);
  const totalMO = maoDeObra.reduce((a, m) => a + ((m.custoDiaria || 0) * (m.diasPrevistos || 0)), 0);
  const nViagens = parseInt(mob.numViagens) || 1;
  const totalMob = mob.distanciaKm
    ? ((parseFloat(mob.distanciaKm) || 0) * (parseFloat(mob.custoPorKm) || 0) * nViagens)
      + ((parseInt(mob.numPessoas) || 0) * (parseFloat(mob.custoAdicionalPorPessoa) || 0) * nViagens)
    : 0;
  const grandTotal = totalItens + totalMO + totalMob;

  const updateExtras = (newExtras) => updateOrcamentoExtras(currentOrcId, newExtras);

  const saveMob = (newMob) => {
    const parsed = {
      ...newMob,
      custoPorKm: parseFloat(newMob.custoPorKm) || 0,
      numViagens: parseInt(newMob.numViagens) || 1,
      numPessoas: parseInt(newMob.numPessoas) || 0,
      custoAdicionalPorPessoa: parseFloat(newMob.custoAdicionalPorPessoa) || 0,
      distanciaKm: parseFloat(newMob.distanciaKm) || 0,
    };
    setMob(parsed);
    updateExtras({ ...extras, mobilizacao: parsed });
  };

  const handleAddMO = () => {
    if (!moFuncId) return;
    const func = funcionarios.find(f => f.id === moFuncId);
    if (!func) return;
    if (maoDeObra.find(m => m.funcionarioId === moFuncId)) { alert('Funcionário já adicionado.'); return; }
    const newList = [...maoDeObra, { funcionarioId: moFuncId, nome: func.nome, funcao: func.funcao, diasPrevistos: parseFloat(moDias) || 1, custoDiaria: func.custoDiaria }];
    updateExtras({ ...extras, maoDeObra: newList });
    setAddingMO(false); setMoFuncId(''); setMoDias(1);
  };

  const handleRemoveMO = (fId) => updateExtras({ ...extras, maoDeObra: maoDeObra.filter(m => m.funcionarioId !== fId) });

  const handleMODiasBlur = (fId, val) => {
    const newList = maoDeObra.map(m => m.funcionarioId === fId ? { ...m, diasPrevistos: parseFloat(val) || 0 } : m);
    updateExtras({ ...extras, maoDeObra: newList });
  };

  const calcularDistancia = async () => {
    setCalcLoading(true);
    try {
      if (!empresa?.endereco) throw new Error('Configure o endereço da empresa no Perfil primeiro.');
      if (!mob.enderecoDestino) throw new Error('Informe o endereço de destino.');
      const [r1, r2] = await Promise.all([
        fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(empresa.endereco)}&format=json&limit=1`).then(r => r.json()),
        fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(mob.enderecoDestino)}&format=json&limit=1`).then(r => r.json()),
      ]);
      if (!r1.length) throw new Error('Endereço da empresa não encontrado.');
      if (!r2.length) throw new Error('Endereço de destino não encontrado.');
      const [lat1, lon1] = [parseFloat(r1[0].lat), parseFloat(r1[0].lon)];
      const [lat2, lon2] = [parseFloat(r2[0].lat), parseFloat(r2[0].lon)];
      const R = 6371;
      const dLat = (lat2 - lat1) * Math.PI / 180;
      const dLon = (lon2 - lon1) * Math.PI / 180;
      const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
      const distKm = Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)) * 1.3 * 10) / 10;
      const newMob = { ...mob, distanciaKm: distKm };
      setMob(newMob);
      updateExtras({ ...extras, mobilizacao: newMob });
    } catch (e) { alert(e.message); }
    finally { setCalcLoading(false); }
  };

  const saveCli = (newCli) => {
    setCli(newCli);
    updateExtras({ ...extras, cliente: newCli });
  };

  const handleCnpjSearchOrc = async (cnpj) => {
    const clean = cnpj.replace(/\D/g, '');
    if (clean.length !== 14) return;
    setIsLoadingCnpjOrc(true);
    try {
      const response = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${clean}`);
      if (!response.ok) throw new Error('CNPJ não encontrado');
      const data = await response.json();
      const endereco = `${data.logradouro}, ${data.numero}${data.complemento ? ' - ' + data.complemento : ''} - ${data.bairro} - ${data.municipio}/${data.uf}`;
      const novo = { ...cli, cnpj, nome: data.razao_social, endereco };
      saveCli(novo);
    } catch (err) {
      alert('Erro ao buscar: ' + err.message);
    } finally {
      setIsLoadingCnpjOrc(false);
    }
  };

  const handleCreateOrc = async (e) => {
    e.preventDefault();
    const id = await addOrcamento(newOrcName);
    setIsNewOrcModal(false); setNewOrcName('');
    if (id) { setCurrentOrcId(id); setView('detail'); }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Gestão de Orçamentos</h1>
          <p className="page-subtitle">Materiais, mão de obra e mobilização em um único orçamento</p>
        </div>
        {view === 'list'
          ? <button className="btn btn-primary" onClick={() => setIsNewOrcModal(true)}><Plus size={18} /> Novo Orçamento</button>
          : <button className="btn btn-secondary" onClick={() => setView('list')}><ArrowLeft size={18} /> Voltar à Lista</button>}
      </div>

      {/* ── LISTA ── */}
      {view === 'list' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
          {listaOrcamentos.map(orc => {
            const obra = obras.find(o => o.id === orc.obraId);
            const moTotal = (orc.extras?.maoDeObra || []).reduce((a, m) => a + (m.custoDiaria || 0) * (m.diasPrevistos || 0), 0);
            const mob_ = orc.extras?.mobilizacao || {};
            const mobTotal = mob_.distanciaKm
              ? (mob_.distanciaKm * (mob_.custoPorKm || 0) * (mob_.numViagens || 1)) + ((mob_.numPessoas || 0) * (mob_.custoAdicionalPorPessoa || 0) * (mob_.numViagens || 1))
              : 0;
            const totalOrc = orc.itens.reduce((a, b) => a + b.quantidade * b.custoUnitario, 0) + moTotal + mobTotal;
            return (
              <div key={orc.id} className="card hover-effect" style={{ cursor: 'pointer' }} onClick={() => { setCurrentOrcId(orc.id); setView('detail'); }}>
                <div className="flex justify-between items-start mb-4">
                  <div className="logo-icon" style={{ background: 'var(--primary-light)', color: 'var(--primary)', width: 40, height: 40, borderRadius: 8 }}>
                    <FileText size={20} />
                  </div>
                  <button className="icon-btn text-danger" onClick={e => { e.stopPropagation(); if (confirm('Excluir?')) deleteOrcamento(orc.id); }}>
                    <Trash2 size={16} />
                  </button>
                </div>
                <h3 style={{ fontWeight: 700, fontSize: 18, marginBottom: 8 }}>{orc.nome}</h3>
                <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>
                  {obra ? `Vinculado a: ${obra.nome}` : 'Não vinculado a obra'}
                </p>
                <div className="flex justify-between items-end">
                  <div>
                    <p style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Total Geral</p>
                    <p style={{ fontSize: 20, fontWeight: 700, color: 'var(--primary)' }}>{formatCurrency(totalOrc)}</p>
                  </div>
                  <span className="text-primary" style={{ fontSize: 12, fontWeight: 600 }}>{orc.itens.length} itens <ChevronRight size={14} /></span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── DETALHE ── */}
      {view === 'detail' && currentOrc && (
        <div className="flex gap-6" style={{ flexWrap: 'wrap' }}>
          {/* Coluna principal */}
          <div className="card flex-1" style={{ minWidth: '60%', padding: 0, overflow: 'hidden' }}>

            {/* Header */}
            <div style={{ padding: 16, borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h2 style={{ fontSize: 20, fontWeight: 700 }}>
                  <InlineEdit value={currentOrc.nome} onSave={v => updateOrcamento(currentOrc.id, 'nome', v)} />
                </h2>
                <select
                  value={currentOrc.obraId || ''}
                  onChange={e => updateOrcamento(currentOrc.id, 'obraId', e.target.value || null)}
                  style={{ border: 'none', background: 'none', color: 'var(--text-muted)', fontSize: 12, outline: 'none', cursor: 'pointer' }}
                >
                  <option value="">Vincular a uma obra...</option>
                  {obras.map(o => <option key={o.id} value={o.id}>{o.nome}</option>)}
                </select>
              </div>
              <button className="btn btn-primary btn-sm" onClick={() => addOrcamentoItem(currentOrcId, { descricao: 'Novo Item', categoria: 'Geral', unidade: 'un', quantidade: 1, custoUnitario: 0 })}>
                <Plus size={14} /> Adicionar Item
              </button>
            </div>

            {/* Tabela de itens */}
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
                  {items.length === 0 && (
                    <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 20, fontSize: 13 }}>Nenhum item adicionado.</td></tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* ── MÃO DE OBRA ── */}
            <SecaoHeader titulo={`Mão de Obra${maoDeObra.length ? ` (${maoDeObra.length})` : ''}`} icone={Users} cor="#06b6d4" />
            <div style={{ padding: 16 }}>
              {maoDeObra.length > 0 && (
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, marginBottom: 12 }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border)' }}>
                      <th style={{ textAlign: 'left', padding: '4px 8px', fontWeight: 600, color: 'var(--text-secondary)' }}>Profissional</th>
                      <th style={{ textAlign: 'left', padding: '4px 8px', fontWeight: 600, color: 'var(--text-secondary)' }}>Função</th>
                      <th style={{ textAlign: 'center', padding: '4px 8px', fontWeight: 600, color: 'var(--text-secondary)' }}>Dias Previstos</th>
                      <th style={{ textAlign: 'right', padding: '4px 8px', fontWeight: 600, color: 'var(--text-secondary)' }}>Custo/Dia</th>
                      <th style={{ textAlign: 'right', padding: '4px 8px', fontWeight: 600, color: 'var(--text-secondary)' }}>Subtotal</th>
                      <th style={{ width: 36 }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {maoDeObra.map(m => (
                      <tr key={m.funcionarioId} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={{ padding: '8px 8px', fontWeight: 500 }}>{m.nome}</td>
                        <td style={{ padding: '8px 8px', color: 'var(--text-muted)', fontSize: 12 }}>{m.funcao}</td>
                        <td style={{ padding: '8px 8px', textAlign: 'center' }}>
                          <input
                            type="number" min="0" step="0.5"
                            defaultValue={m.diasPrevistos}
                            onBlur={e => handleMODiasBlur(m.funcionarioId, e.target.value)}
                            style={{ ...inputSt, width: 70, textAlign: 'center' }}
                          />
                        </td>
                        <td style={{ padding: '8px 8px', textAlign: 'right' }}>{formatCurrency(m.custoDiaria)}</td>
                        <td style={{ padding: '8px 8px', textAlign: 'right', fontWeight: 600, color: '#06b6d4' }}>{formatCurrency(m.custoDiaria * m.diasPrevistos)}</td>
                        <td><button className="icon-btn text-danger" onClick={() => handleRemoveMO(m.funcionarioId)}><Trash2 size={14} /></button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {addingMO ? (
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                  <select value={moFuncId} onChange={e => setMoFuncId(e.target.value)} style={{ ...inputSt, flex: 1, minWidth: 200 }}>
                    <option value="">Selecione o profissional...</option>
                    {funcionarios.filter(f => !maoDeObra.find(m => m.funcionarioId === f.id)).map(f => (
                      <option key={f.id} value={f.id}>{f.nome} — {f.funcao} ({formatCurrency(f.custoDiaria)}/dia)</option>
                    ))}
                  </select>
                  <input type="number" min="1" step="0.5" placeholder="Dias" value={moDias} onChange={e => setMoDias(e.target.value)} style={{ ...inputSt, width: 80 }} />
                  <button className="btn btn-primary btn-sm" onClick={handleAddMO}>Adicionar</button>
                  <button className="btn btn-secondary btn-sm" onClick={() => { setAddingMO(false); setMoFuncId(''); setMoDias(1); }}>Cancelar</button>
                </div>
              ) : (
                <button className="btn btn-secondary btn-sm" onClick={() => setAddingMO(true)} style={{ marginTop: maoDeObra.length ? 0 : 0 }}>
                  <Plus size={14} /> Adicionar Profissional
                </button>
              )}
            </div>

            {/* ── MOBILIZAÇÃO ── */}
            <SecaoHeader titulo="Mobilização" icone={Truck} cor="#f59e0b" />
            <div style={{ padding: 16 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(175px, 1fr))', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Veículo</label>
                  <input type="text" placeholder="Ex: Hilux, Van..." value={mob.veiculo || ''}
                    onChange={e => setMob(p => ({ ...p, veiculo: e.target.value }))}
                    onBlur={() => updateExtras({ ...extras, mobilizacao: mob })}
                    style={inputSt} />
                </div>
                <div>
                  <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Custo por km (R$)</label>
                  <input type="number" min="0" step="0.01" placeholder="0,00" value={mob.custoPorKm ?? ''}
                    onChange={e => setMob(p => ({ ...p, custoPorKm: e.target.value }))}
                    onBlur={e => saveMob({ ...mob, custoPorKm: e.target.value })}
                    style={inputSt} />
                </div>
                <div>
                  <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Nº de Viagens</label>
                  <input type="number" min="1" step="1" placeholder="1" value={mob.numViagens ?? ''}
                    onChange={e => setMob(p => ({ ...p, numViagens: e.target.value }))}
                    onBlur={e => saveMob({ ...mob, numViagens: e.target.value })}
                    style={inputSt} />
                </div>
                <div>
                  <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Nº de Pessoas</label>
                  <input type="number" min="0" step="1" placeholder="0" value={mob.numPessoas ?? ''}
                    onChange={e => setMob(p => ({ ...p, numPessoas: e.target.value }))}
                    onBlur={e => saveMob({ ...mob, numPessoas: e.target.value })}
                    style={inputSt} />
                </div>
                <div>
                  <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Adicional por Pessoa/Viagem (R$)</label>
                  <input type="number" min="0" step="0.01" placeholder="0,00" value={mob.custoAdicionalPorPessoa ?? ''}
                    onChange={e => setMob(p => ({ ...p, custoAdicionalPorPessoa: e.target.value }))}
                    onBlur={e => saveMob({ ...mob, custoAdicionalPorPessoa: e.target.value })}
                    style={inputSt} />
                </div>
                <div style={{ gridColumn: 'span 2' }}>
                  <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Endereço de Destino</label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input type="text" placeholder="Rua, Cidade, Estado..." value={mob.enderecoDestino || ''}
                      onChange={e => setMob(p => ({ ...p, enderecoDestino: e.target.value }))}
                      onBlur={() => updateExtras({ ...extras, mobilizacao: mob })}
                      style={{ ...inputSt, flex: 1 }} />
                    <button className="btn btn-primary btn-sm" onClick={calcularDistancia} disabled={calcLoading} style={{ whiteSpace: 'nowrap' }}>
                      <RefreshCw size={13} /> {calcLoading ? '...' : 'Calcular'}
                    </button>
                  </div>
                </div>
                <div>
                  <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Distância estimada (km)</label>
                  <input type="number" min="0" step="0.1" value={mob.distanciaKm ?? ''}
                    onChange={e => setMob(p => ({ ...p, distanciaKm: e.target.value }))}
                    onBlur={e => saveMob({ ...mob, distanciaKm: e.target.value })}
                    style={inputSt} />
                </div>
              </div>

              {totalMob > 0 && (
                <div style={{ marginTop: 12, padding: '10px 14px', background: 'rgba(245,158,11,0.08)', borderRadius: 8, border: '1px solid rgba(245,158,11,0.25)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13 }}>
                  <div style={{ color: 'var(--text-muted)' }}>
                    Veículo: <strong style={{ color: 'var(--text-primary)' }}>{formatCurrency((parseFloat(mob.distanciaKm) || 0) * (parseFloat(mob.custoPorKm) || 0) * nViagens)}</strong>
                    {(parseInt(mob.numPessoas) || 0) > 0 && <>
                      {' · '}Pessoal: <strong style={{ color: 'var(--text-primary)' }}>{formatCurrency((parseInt(mob.numPessoas) || 0) * (parseFloat(mob.custoAdicionalPorPessoa) || 0) * nViagens)}</strong>
                    </>}
                    {' · '}{mob.distanciaKm} km × {mob.numViagens || 1} {(mob.numViagens || 1) > 1 ? 'viagens' : 'viagem'}
                  </div>
                  <strong style={{ color: '#f59e0b', fontSize: 15 }}>{formatCurrency(totalMob)}</strong>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div style={{ width: '100%', maxWidth: 300, display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* ── Cliente ── */}
            <div className="card" style={{ padding: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <UserCircle size={15} color="var(--primary)" />
                <span style={{ fontWeight: 600, fontSize: 13, color: 'var(--primary)' }}>Cliente</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div>
                  <label style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginBottom: 3 }}>CNPJ</label>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <input
                      type="text" placeholder="00.000.000/0001-00"
                      value={cli.cnpj || ''}
                      onChange={e => setCli(p => ({ ...p, cnpj: e.target.value }))}
                      onBlur={() => saveCli(cli)}
                      style={{ ...inputSt, flex: 1 }}
                    />
                    <button className="btn btn-primary btn-sm" onClick={() => handleCnpjSearchOrc(cli.cnpj || '')} disabled={isLoadingCnpjOrc}>
                      {isLoadingCnpjOrc ? '...' : <Search size={13} />}
                    </button>
                  </div>
                </div>
                <div>
                  <label style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginBottom: 3 }}>Razão Social</label>
                  <input
                    type="text" placeholder="Nome do cliente"
                    value={cli.nome || ''}
                    onChange={e => setCli(p => ({ ...p, nome: e.target.value }))}
                    onBlur={() => saveCli(cli)}
                    style={inputSt}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginBottom: 3 }}>Endereço</label>
                  <input
                    type="text" placeholder="Endereço completo"
                    value={cli.endereco || ''}
                    onChange={e => setCli(p => ({ ...p, endereco: e.target.value }))}
                    onBlur={() => saveCli({ ...cli, endereco: cli.endereco })}
                    style={inputSt}
                  />
                </div>
              </div>
            </div>

            <div className="card" style={{ background: 'var(--primary)', color: 'white', border: 'none' }}>
              <p style={{ opacity: .8, fontSize: 13, marginBottom: 4 }}>Total Geral</p>
              <h2 style={{ fontSize: 32, fontWeight: 800 }}>{formatCurrency(grandTotal)}</h2>
              <div style={{ marginTop: 16, borderTop: '1px solid rgba(255,255,255,0.2)', paddingTop: 12, fontSize: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ opacity: .8 }}>Materiais / Serviços</span>
                  <span>{formatCurrency(totalItens)}</span>
                </div>
                {totalMO > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ opacity: .8 }}>Mão de Obra ({maoDeObra.length} prof.)</span>
                    <span>{formatCurrency(totalMO)}</span>
                  </div>
                )}
                {totalMob > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ opacity: .8 }}>Mobilização</span>
                    <span>{formatCurrency(totalMob)}</span>
                  </div>
                )}
              </div>
            </div>
            <button className="btn btn-secondary" style={{ width: '100%' }}>
              <Download size={16} /> Exportar PDF
            </button>
          </div>
        </div>
      )}

      <Modal isOpen={isNewOrcModal} onClose={() => setIsNewOrcModal(false)} title="Novo Orçamento">
        <form onSubmit={handleCreateOrc} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ display: 'block', fontSize: 13, color: 'var(--text-secondary)', marginBottom: 4 }}>Nome do Orçamento</label>
            <input required autoFocus type="text" value={newOrcName} onChange={e => setNewOrcName(e.target.value)}
              style={{ ...inputSt }} />
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Criar Orçamento</button>
        </form>
      </Modal>
    </div>
  );
}
