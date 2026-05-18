import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { ArrowLeft, Plus, Trash2, MapPin, Calendar, FileText, DollarSign, Users, UserPlus, UserMinus, CheckCircle, AlertCircle } from 'lucide-react';
import InlineEdit from '../components/InlineEdit';
import Modal from '../components/Modal';

export default function ObraDetalhes() {
  const { id } = useParams();
  const navigate = useNavigate();
  const {
    obras, updateObra,
    addGastoDaObra, updateGasto, deleteGasto,
    calcProgressoFinanceiro,
    listaOrcamentos,
    getCronogramaObra, addEtapaCronograma, updateEtapaCronograma, deleteEtapaCronograma,
    getArquivosObra, addArquivo, deleteArquivo,
    getPropostaObra,
    funcionarios, updateFuncionario,
    formatCurrency
  } = useAppContext();

  const obra = obras.find(o => o.id === id);
  const [aba, setAba] = useState('resumo');
  const [isGastoModal, setIsGastoModal] = useState(false);
  const [descGasto, setDescGasto] = useState('');
  const [valorGasto, setValorGasto] = useState('');
  const [dataGasto, setDataGasto] = useState('');

  // Finalizar obra
  const [isFinalizarModal, setIsFinalizarModal] = useState(false);
  const [finGastos, setFinGastos] = useState([{ desc: '', valor: '', data: '' }]);
  const [liberarEquipe, setLiberarEquipe] = useState(true);
  const [finalizando, setFinalizando] = useState(false);

  if (!obra) return <div style={{ padding: 40 }}>Obra não encontrada!</div>;

  const { gasto, progressoPerc, alerta } = calcProgressoFinanceiro(obra);
  const orcamentoRestante = obra.orcamento - gasto;

  const orcamento = listaOrcamentos.find(o => o.obraId === id);
  const orcItens = orcamento?.itens || [];
  const orcMO = orcamento?.extras?.maoDeObra || [];
  const orcMob = orcamento?.extras?.mobilizacao || {};
  const nViagens = parseInt(orcMob.numViagens) || 1;
  const totalItens = orcItens.reduce((a, i) => a + i.quantidade * i.custoUnitario, 0);
  const totalMO = orcMO.reduce((a, m) => a + (m.custoDiaria || 0) * (m.diasPrevistos || 0), 0);
  const totalMob = orcMob.distanciaKm
    ? (parseFloat(orcMob.distanciaKm) * (parseFloat(orcMob.custoPorKm) || 0) * nViagens)
      + ((parseInt(orcMob.numPessoas) || 0) * (parseFloat(orcMob.custoAdicionalPorPessoa) || 0) * nViagens)
    : 0;
  const totalOrc = totalItens + totalMO + totalMob;
  const cronograma = getCronogramaObra(id);
  const arquivos = getArquivosObra(id);
  const propostasDaObra = getPropostaObra(id);
  const propostaPrincipal = propostasDaObra[0] || null;
  const progressoCrono = cronograma.length > 0 ? Math.round(cronograma.reduce((a, e) => a + e.progresso, 0) / cronograma.length) : 0;
  const equipeObra = funcionarios.filter(f => f.obraAtualId === id);
  const funcionariosSemObra = funcionarios.filter(f => !f.obraAtualId || f.obraAtualId !== id);

  const hoje = new Date().toISOString().split('T')[0];

  const abrirFinalizar = () => {
    setFinGastos([{ desc: '', valor: '', data: hoje }]);
    setLiberarEquipe(true);
    setIsFinalizarModal(true);
  };

  const handleFinalizar = async () => {
    setFinalizando(true);
    for (const g of finGastos) {
      if (g.desc.trim() && g.valor) {
        await addGastoDaObra(obra.id, {
          descricao: g.desc.trim(),
          valor: parseFloat(g.valor),
          data: g.data || hoje,
          categoria: 'Conclusão'
        });
      }
    }
    if (liberarEquipe) {
      for (const f of equipeObra) {
        await updateFuncionario(f.id, 'obraAtualId', null);
      }
    }
    await updateObra(id, 'status', 'Concluída');
    setFinalizando(false);
    setIsFinalizarModal(false);
  };

  const handleAddGasto = (e) => {
    e.preventDefault();
    if (!descGasto || !valorGasto) return;
    addGastoDaObra(obra.id, {
      descricao: descGasto,
      valor: parseFloat(valorGasto),
      data: dataGasto || new Date().toISOString().split('T')[0],
      categoria: 'Geral'
    });
    setIsGastoModal(false);
    setDescGasto('');
    setValorGasto('');
    setDataGasto('');
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    addArquivo(obra.id, {
      nome: file.name,
      tipo: file.name.split('.').pop().toLowerCase(),
      tamanho: file.size > 1024 * 1024
        ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
        : `${(file.size / 1024).toFixed(0)} KB`,
      vinculo: 'Upload'
    });
    // Limpa o input para permitir re-upload do mesmo arquivo
    e.target.value = '';
  };

  return (
    <div>
      <div className="flex items-center gap-4 mb-4">
        <button className="icon-btn" onClick={() => navigate('/obras')}><ArrowLeft size={20} /></button>
        <div style={{ flex: 1 }}>
          <h1 className="page-title" style={{ marginBottom: 2 }}>
            <InlineEdit value={obra.nome} onSave={v => updateObra(id, 'nome', v)} />
          </h1>
          <p className="text-secondary flex items-center gap-1">
            <MapPin size={14} />
            <InlineEdit value={obra.endereco} onSave={v => updateObra(id, 'endereco', v)} />
          </p>
        </div>
        {obra.status === 'Concluída' ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 700, color: 'var(--success)', padding: '6px 14px', background: 'rgba(16,185,129,0.1)', borderRadius: 8, border: '1px solid rgba(16,185,129,0.3)' }}>
              <CheckCircle size={15} /> Concluída
            </span>
            <button className="btn btn-secondary btn-sm" onClick={() => updateObra(id, 'status', 'Em andamento')}>
              Reabrir
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <select
              value={obra.status}
              onChange={e => updateObra(id, 'status', e.target.value)}
              style={{ padding: '6px 10px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface)', fontSize: 13, fontWeight: 600, cursor: 'pointer', outline: 'none' }}
            >
              <option value="Planejamento">Planejamento</option>
              <option value="Em andamento">Em andamento</option>
            </select>
            <button
              className="btn btn-primary"
              onClick={abrirFinalizar}
              style={{ background: 'var(--success)', borderColor: 'var(--success)', whiteSpace: 'nowrap', fontWeight: 700, padding: '8px 18px' }}
            >
              <CheckCircle size={16} /> Concluir Obra
            </button>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="tabs-container">
        {['resumo', 'equipe', 'gastos', 'orcamento', 'cronograma', 'arquivos'].map(t => (
          <button key={t} className={`tab-btn ${aba === t ? 'active' : ''}`} onClick={() => setAba(t)} style={{ textTransform: 'capitalize' }}>{t}</button>
        ))}
      </div>

      {/* === RESUMO === */}
      {aba === 'resumo' && (
        <div>
          {/* CTA Finalizar Obra — destaque no topo do resumo */}
          {obra.status !== 'Concluída' && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, padding: '16px 20px', background: 'rgba(16,185,129,0.1)', border: '2px solid rgba(16,185,129,0.4)', borderRadius: 12, marginBottom: 20, flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <CheckCircle size={24} color="var(--success)" />
                <div>
                  <p style={{ fontWeight: 700, fontSize: 15, color: 'var(--success)' }}>Obra finalizada?</p>
                  <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>Clique em Concluir para registrar gastos finais e encerrar a obra.</p>
                </div>
              </div>
              <button
                className="btn btn-primary"
                onClick={abrirFinalizar}
                style={{ background: 'var(--success)', borderColor: 'var(--success)', whiteSpace: 'nowrap', fontWeight: 700, fontSize: 14, padding: '10px 22px' }}
              >
                <CheckCircle size={16} /> Concluir Obra
              </button>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16, marginBottom: 24 }}>
            <div className="card" style={{ background: 'var(--primary)', color: 'white', border: 'none' }}>
              <p style={{ opacity: .8, fontSize: 13, marginBottom: 4 }}>Orçamento</p>
              <h2 style={{ fontSize: 28, fontWeight: 700 }}>
                <InlineEdit value={obra.orcamento} type="currency" onSave={v => updateObra(id, 'orcamento', parseFloat(v))} className="text-white" />
              </h2>
            </div>
            <div className="card">
              <p className="text-secondary" style={{ fontSize: 13, marginBottom: 4 }}>Gasto Realizado</p>
              <h2 style={{ fontSize: 28, fontWeight: 700, color: alerta ? 'var(--danger)' : 'var(--text-primary)' }}>{formatCurrency(gasto)}</h2>
              <p style={{ fontSize: 12, color: alerta ? 'var(--danger)' : 'var(--text-muted)' }}>{progressoPerc}% comprometido</p>
            </div>
            <div className="card">
              <p className="text-secondary" style={{ fontSize: 13, marginBottom: 4 }}>Saldo Restante</p>
              <h2 style={{ fontSize: 28, fontWeight: 700, color: orcamentoRestante < 0 ? 'var(--danger)' : 'var(--success)' }}>{formatCurrency(orcamentoRestante)}</h2>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
            <div className="card" style={{ padding: 16, cursor: 'pointer' }} onClick={() => setAba('orcamento')}>
              <div className="flex items-center gap-2 mb-2"><DollarSign size={16} color="var(--primary)" /><span style={{ fontWeight: 600, fontSize: 14 }}>Orçamento</span></div>
              <p className="text-muted" style={{ fontSize: 12 }}>{orcItens.length} itens · {formatCurrency(totalOrc)}</p>
            </div>
            <div className="card" style={{ padding: 16, cursor: 'pointer' }} onClick={() => setAba('cronograma')}>
              <div className="flex items-center gap-2 mb-2"><Calendar size={16} color="var(--warning)" /><span style={{ fontWeight: 600, fontSize: 14 }}>Cronograma</span></div>
              <p className="text-muted" style={{ fontSize: 12 }}>{cronograma.length} etapas · {progressoCrono}% concluído</p>
            </div>
            <div className="card" style={{ padding: 16, cursor: 'pointer' }} onClick={() => navigate('/proposta')}>
              <div className="flex items-center gap-2 mb-2"><FileText size={16} color="var(--success)" /><span style={{ fontWeight: 600, fontSize: 14 }}>Propostas</span></div>
              <p className="text-muted" style={{ fontSize: 12 }}>{propostasDaObra.length} propostas · {propostaPrincipal ? `Cliente: ${propostaPrincipal.clienteNome || 'A definir'}` : 'Nenhuma'}</p>
            </div>
            <div className="card" style={{ padding: 16, cursor: 'pointer' }} onClick={() => setAba('arquivos')}>
              <div className="flex items-center gap-2 mb-2"><FileText size={16} color="#f97316" /><span style={{ fontWeight: 600, fontSize: 14 }}>Arquivos</span></div>
              <p className="text-muted" style={{ fontSize: 12 }}>{arquivos.length} documentos</p>
            </div>
            <div className="card" style={{ padding: 16, cursor: 'pointer' }} onClick={() => setAba('equipe')}>
              <div className="flex items-center gap-2 mb-2"><Users size={16} color="#06b6d4" /><span style={{ fontWeight: 600, fontSize: 14 }}>Equipe</span></div>
              <p className="text-muted" style={{ fontSize: 12 }}>{equipeObra.length} profissionais alocados</p>
              {equipeObra.length > 0 && (
                <div className="flex gap-1" style={{ marginTop: 8 }}>
                  {equipeObra.slice(0, 5).map(f => (
                    <div key={f.id} title={`${f.nome} — ${f.funcao}`} style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, border: '2px solid white' }}>
                      {f.nome.charAt(0)}
                    </div>
                  ))}
                  {equipeObra.length > 5 && <span className="text-muted" style={{ fontSize: 11, alignSelf: 'center' }}>+{equipeObra.length - 5}</span>}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* === EQUIPE === */}
      {aba === 'equipe' && (
        <div>
          <div className="card mb-6" style={{ padding: 0, overflow: 'hidden' }}>
            <div className="flex justify-between items-center" style={{ padding: 16, borderBottom: '1px solid var(--border)' }}>
              <h3 style={{ fontWeight: 600 }}>Equipe Alocada ({equipeObra.length})</h3>
            </div>
            {equipeObra.length === 0 ? (
              <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-muted)' }}>
                <Users size={32} style={{ marginBottom: 8, opacity: .4 }} />
                <p>Nenhum profissional alocado nesta obra.</p>
                <p style={{ fontSize: 12, marginTop: 4 }}>Use a seção abaixo para alocar membros da equipe.</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 0 }}>
                {equipeObra.map(f => (
                  <div key={f.id} style={{ padding: 16, borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 16, flexShrink: 0 }}>
                      {f.nome.charAt(0)}
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontWeight: 600, fontSize: 14 }}>{f.nome}</p>
                      <p className="text-secondary" style={{ fontSize: 12 }}>{f.funcao} · {formatCurrency(f.custoDiaria)}/dia · {f.diasTrabalhados} dias</p>
                    </div>
                    <button className="btn btn-secondary btn-sm" style={{ color: 'var(--danger)', flexShrink: 0 }}
                      onClick={() => updateFuncionario(f.id, 'obraAtualId', null)}>
                      <UserMinus size={14} /> Remover
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {funcionariosSemObra.length > 0 && (
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <div style={{ padding: 16, borderBottom: '1px solid var(--border)' }}>
                <h3 style={{ fontWeight: 600 }}>Alocar Profissional</h3>
                <p className="text-muted" style={{ fontSize: 12, marginTop: 2 }}>Profissionais disponíveis ou em outras obras</p>
              </div>
              <div>
                {funcionariosSemObra.map(f => {
                  const obraAtual = f.obraAtualId ? obras.find(o => o.id === f.obraAtualId) : null;
                  return (
                    <div key={f.id} style={{ padding: 12, borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--background)', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, fontSize: 14, flexShrink: 0 }}>
                        {f.nome.charAt(0)}
                      </div>
                      <div style={{ flex: 1 }}>
                        <p style={{ fontWeight: 500, fontSize: 14 }}>{f.nome} <span className="text-muted" style={{ fontSize: 12 }}>· {f.funcao}</span></p>
                        {obraAtual && <p style={{ fontSize: 11, color: 'var(--warning-text)' }}>Atualmente em: {obraAtual.nome}</p>}
                        {!f.obraAtualId && <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>Sem alocação</p>}
                      </div>
                      <button className="btn btn-primary btn-sm" onClick={() => updateFuncionario(f.id, 'obraAtualId', id)}>
                        <UserPlus size={14} /> Alocar
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* === GASTOS === */}
      {aba === 'gastos' && (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="flex justify-between items-center" style={{ padding: 16, borderBottom: '1px solid var(--border)' }}>
            <h3 style={{ fontWeight: 600 }}>Gastos e Medições</h3>
            <button className="btn btn-primary btn-sm" onClick={() => setIsGastoModal(true)}><Plus size={14} /> Novo Gasto</button>
          </div>
          <table className="table-editable">
            <thead><tr><th>Descrição</th><th>Data</th><th style={{ textAlign: 'right' }}>Valor</th><th style={{ width: 40 }}></th></tr></thead>
            <tbody>
              {obra.gastosDespesas.length === 0 && <tr><td colSpan="4" style={{ textAlign: 'center', padding: 24, color: 'var(--text-muted)' }}>Nenhum gasto registrado</td></tr>}
              {obra.gastosDespesas.map(g => (
                <tr key={g.id}>
                  <td><InlineEdit value={g.descricao} onSave={v => updateGasto(id, g.id, 'descricao', v)} /></td>
                  <td><InlineEdit value={g.data} onSave={v => updateGasto(id, g.id, 'data', v)} /></td>
                  <td style={{ textAlign: 'right', color: 'var(--danger)', fontWeight: 600 }}>
                    <InlineEdit value={g.valor} type="currency" onSave={v => updateGasto(id, g.id, 'valor', parseFloat(v))} />
                  </td>
                  <td><button className="icon-btn" style={{ color: 'var(--danger)' }} onClick={() => deleteGasto(id, g.id)}><Trash2 size={14} /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* === ORÇAMENTO === */}
      {aba === 'orcamento' && (
        <div>
          {!orcamento ? (
            <div className="card" style={{ padding: 32, textAlign: 'center', color: 'var(--text-muted)' }}>
              <DollarSign size={32} style={{ marginBottom: 8, opacity: .4 }} />
              <p>Nenhum orçamento vinculado a esta obra.</p>
              <p style={{ fontSize: 12, marginTop: 4 }}>Crie um orçamento em{' '}
                <span style={{ color: 'var(--primary)', cursor: 'pointer', fontWeight: 600 }} onClick={() => navigate('/orcamentos')}>Orçamentos</span>
                {' '}e vincule-o aqui.
              </p>
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h3 style={{ fontWeight: 700, fontSize: 16 }}>{orcamento.nome}</h3>
                  <p className="text-muted" style={{ fontSize: 12 }}>
                    Para editar, acesse{' '}
                    <span style={{ color: 'var(--primary)', cursor: 'pointer', fontWeight: 600 }} onClick={() => navigate('/orcamentos')}>Orçamentos</span>
                  </p>
                </div>
                <div className="card" style={{ padding: '8px 20px', background: 'var(--primary)', color: 'white', border: 'none' }}>
                  <p style={{ fontSize: 11, opacity: .8 }}>Total Geral</p>
                  <p style={{ fontSize: 22, fontWeight: 800 }}>{formatCurrency(totalOrc)}</p>
                </div>
              </div>

              {/* Itens */}
              <div className="card" style={{ padding: 0, overflow: 'hidden', marginBottom: 16 }}>
                <div style={{ padding: '10px 16px', borderBottom: '1px solid var(--border)', fontWeight: 600, fontSize: 13 }}>
                  Materiais e Serviços
                </div>
                {orcItens.length === 0 ? (
                  <p style={{ padding: 16, color: 'var(--text-muted)', fontSize: 13 }}>Nenhum item.</p>
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <table className="table-editable">
                      <thead>
                        <tr>
                          <th>Descrição</th>
                          <th style={{ textAlign: 'center' }}>Unid.</th>
                          <th style={{ textAlign: 'right' }}>Qtd.</th>
                          <th style={{ textAlign: 'right' }}>Unitário</th>
                          <th style={{ textAlign: 'right' }}>Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {orcItens.map(item => (
                          <tr key={item.id}>
                            <td>{item.descricao}</td>
                            <td style={{ textAlign: 'center' }}>{item.unidade}</td>
                            <td style={{ textAlign: 'right' }}>{item.quantidade}</td>
                            <td style={{ textAlign: 'right' }}>{formatCurrency(item.custoUnitario)}</td>
                            <td style={{ textAlign: 'right', fontWeight: 600 }}>{formatCurrency(item.quantidade * item.custoUnitario)}</td>
                          </tr>
                        ))}
                        <tr style={{ background: 'var(--background)', fontWeight: 700 }}>
                          <td colSpan="4" style={{ textAlign: 'right', fontSize: 12 }}>Subtotal</td>
                          <td style={{ textAlign: 'right', color: 'var(--primary)' }}>{formatCurrency(totalItens)}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Mão de Obra */}
              {orcMO.length > 0 && (
                <div className="card" style={{ padding: 0, overflow: 'hidden', marginBottom: 16 }}>
                  <div style={{ padding: '10px 16px', borderBottom: '1px solid var(--border)', fontWeight: 600, fontSize: 13, color: '#06b6d4' }}>
                    Mão de Obra
                  </div>
                  <table className="table-editable">
                    <thead>
                      <tr>
                        <th>Profissional</th>
                        <th>Função</th>
                        <th style={{ textAlign: 'center' }}>Dias Previstos</th>
                        <th style={{ textAlign: 'right' }}>Custo/Dia</th>
                        <th style={{ textAlign: 'right' }}>Subtotal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orcMO.map(m => (
                        <tr key={m.funcionarioId}>
                          <td style={{ fontWeight: 500 }}>{m.nome}</td>
                          <td style={{ color: 'var(--text-muted)', fontSize: 12 }}>{m.funcao}</td>
                          <td style={{ textAlign: 'center' }}>{m.diasPrevistos}</td>
                          <td style={{ textAlign: 'right' }}>{formatCurrency(m.custoDiaria)}</td>
                          <td style={{ textAlign: 'right', fontWeight: 600, color: '#06b6d4' }}>{formatCurrency(m.custoDiaria * m.diasPrevistos)}</td>
                        </tr>
                      ))}
                      <tr style={{ background: 'var(--background)', fontWeight: 700 }}>
                        <td colSpan="4" style={{ textAlign: 'right', fontSize: 12 }}>Subtotal</td>
                        <td style={{ textAlign: 'right', color: '#06b6d4' }}>{formatCurrency(totalMO)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}

              {/* Mobilização */}
              {totalMob > 0 && (
                <div className="card" style={{ padding: 0, overflow: 'hidden', marginBottom: 16 }}>
                  <div style={{ padding: '10px 16px', borderBottom: '1px solid var(--border)', fontWeight: 600, fontSize: 13, color: '#f59e0b' }}>
                    Mobilização
                  </div>
                  <div style={{ padding: 16, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, fontSize: 13 }}>
                    {orcMob.veiculo && <div><span style={{ color: 'var(--text-muted)' }}>Veículo: </span><strong>{orcMob.veiculo}</strong></div>}
                    {orcMob.distanciaKm && <div><span style={{ color: 'var(--text-muted)' }}>Distância: </span><strong>{orcMob.distanciaKm} km</strong></div>}
                    {orcMob.custoPorKm && <div><span style={{ color: 'var(--text-muted)' }}>Custo/km: </span><strong>{formatCurrency(orcMob.custoPorKm)}</strong></div>}
                    {orcMob.numViagens && <div><span style={{ color: 'var(--text-muted)' }}>Viagens: </span><strong>{orcMob.numViagens}</strong></div>}
                    {orcMob.numPessoas > 0 && <div><span style={{ color: 'var(--text-muted)' }}>Pessoas: </span><strong>{orcMob.numPessoas}</strong></div>}
                  </div>
                  <div style={{ padding: '8px 16px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end', fontWeight: 700, color: '#f59e0b' }}>
                    Total Mobilização: {formatCurrency(totalMob)}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* === CRONOGRAMA === */}
      {aba === 'cronograma' && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 style={{ fontWeight: 600 }}>Cronograma Físico-Financeiro</h3>
            <button className="btn btn-primary btn-sm" onClick={() => addEtapaCronograma(id, {
              etapa: 'Nova Etapa',
              dataInicio: new Date().toISOString().split('T')[0],
              dataFim: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
              custo: 0, progresso: 0, cor: '#1E3A8A'
            })}><Plus size={14} /> Nova Etapa</button>
          </div>

          <div className="card mb-6" style={{ padding: 20 }}>
            {cronograma.length === 0 ? (
              <p className="text-muted" style={{ textAlign: 'center' }}>Nenhuma etapa cadastrada. Clique em "Nova Etapa" para começar.</p>
            ) : (
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
                    {cronograma.map(e => (
                      <tr key={e.id}>
                        <td><InlineEdit value={e.etapa} onSave={v => updateEtapaCronograma(e.id, 'etapa', v)} /></td>
                        <td><InlineEdit value={e.dataInicio} type="date" onSave={v => updateEtapaCronograma(e.id, 'dataInicio', v)} /></td>
                        <td><InlineEdit value={e.dataFim} type="date" onSave={v => updateEtapaCronograma(e.id, 'dataFim', v)} /></td>
                        <td style={{ textAlign: 'right' }}><InlineEdit value={e.custo} type="currency" onSave={v => updateEtapaCronograma(e.id, 'custo', parseFloat(v))} /></td>
                        <td style={{ textAlign: 'center' }}>
                          <div className="flex items-center gap-2" style={{ justifyContent: 'center' }}>
                            <input type="range" min="0" max="100" value={e.progresso} onChange={v => updateEtapaCronograma(e.id, 'progresso', parseInt(v.target.value))} style={{ width: 60 }} />
                            <span style={{ fontSize: 12, fontWeight: 600 }}>{e.progresso}%</span>
                          </div>
                        </td>
                        <td><button className="icon-btn" style={{ color: 'var(--danger)' }} onClick={() => deleteEtapaCronograma(e.id)}><Trash2 size={14} /></button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* === ARQUIVOS === */}
      {aba === 'arquivos' && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 style={{ fontWeight: 600 }}>Gestão de Documentos</h3>
            <label className="btn btn-primary btn-sm" style={{ cursor: 'pointer' }}>
              <Plus size={14} /> Upload
              <input type="file" style={{ display: 'none' }} onChange={handleFileUpload} />
            </label>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
            {arquivos.length === 0 ? (
              <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
                <FileText size={32} style={{ marginBottom: 8, opacity: .4 }} />
                <p>Sem arquivos vinculados.</p>
                <p style={{ fontSize: 12, marginTop: 4 }}>Clique em "Upload" para adicionar documentos.</p>
              </div>
            ) : arquivos.map(a => (
              <div key={a.id} className="card flex flex-col gap-2" style={{ padding: 12, position: 'relative' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <FileText size={24} color="var(--primary)" />
                  <div style={{ flex: 1, overflow: 'hidden' }}>
                    <p style={{ fontWeight: 600, fontSize: 13, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{a.nome}</p>
                    <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>{a.tipo} · {a.tamanho}</p>
                  </div>
                </div>
                <div className="flex justify-between mt-2" style={{ borderTop: '1px solid var(--border)', paddingTop: 8 }}>
                  <span className="badge badge-primary" style={{ fontSize: 10 }}>{a.vinculo}</span>
                  <button className="icon-btn" style={{ color: 'var(--danger)' }} onClick={() => deleteArquivo(a.id)}><Trash2 size={12} /></button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal: Finalizar Obra */}
      <Modal isOpen={isFinalizarModal} onClose={() => setIsFinalizarModal(false)} title="Finalizar Obra">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Alerta */}
          <div style={{ display: 'flex', gap: 10, padding: '12px 14px', background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 8 }}>
            <AlertCircle size={18} color="#f59e0b" style={{ flexShrink: 0, marginTop: 1 }} />
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Antes de concluir, registre os gastos finais e confirme a equipe que realizou a obra. Após confirmar, o status será alterado para <strong>Concluída</strong>.
            </p>
          </div>

          {/* Gastos finais */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <p style={{ fontWeight: 600, fontSize: 14 }}>Gastos Finais</p>
              <button className="btn btn-secondary btn-sm" onClick={() => setFinGastos(p => [...p, { desc: '', valor: '', data: hoje }])}>
                <Plus size={13} /> Adicionar linha
              </button>
            </div>
            {obra.gastosDespesas.length > 0 && (
              <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 8 }}>
                {obra.gastosDespesas.length} gasto(s) já registrado(s) · Total: {formatCurrency(obra.gastosDespesas.reduce((a, g) => a + g.valor, 0))}
              </p>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {finGastos.map((g, i) => (
                <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 100px 110px 28px', gap: 6, alignItems: 'center' }}>
                  <input
                    type="text" placeholder="Descrição do gasto"
                    value={g.desc}
                    onChange={e => setFinGastos(p => p.map((x, j) => j === i ? { ...x, desc: e.target.value } : x))}
                    style={{ padding: '7px 10px', borderRadius: 6, border: '1px solid var(--border)', fontSize: 13, outline: 'none' }}
                  />
                  <input
                    type="number" placeholder="Valor" step="0.01" min="0"
                    value={g.valor}
                    onChange={e => setFinGastos(p => p.map((x, j) => j === i ? { ...x, valor: e.target.value } : x))}
                    style={{ padding: '7px 10px', borderRadius: 6, border: '1px solid var(--border)', fontSize: 13, outline: 'none' }}
                  />
                  <input
                    type="date"
                    value={g.data}
                    onChange={e => setFinGastos(p => p.map((x, j) => j === i ? { ...x, data: e.target.value } : x))}
                    style={{ padding: '7px 10px', borderRadius: 6, border: '1px solid var(--border)', fontSize: 13, outline: 'none' }}
                  />
                  <button className="icon-btn text-danger" onClick={() => setFinGastos(p => p.filter((_, j) => j !== i))} disabled={finGastos.length === 1}>
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Equipe realizada */}
          <div>
            <p style={{ fontWeight: 600, fontSize: 14, marginBottom: 10 }}>Equipe que Realizou</p>
            {(() => {
              const moList = orcMO.map(m => ({ id: m.funcionarioId, nome: m.nome, funcao: m.funcao, origem: 'orçamento', dias: m.diasPrevistos }));
              const alocList = equipeObra.filter(f => !orcMO.find(m => m.funcionarioId === f.id)).map(f => ({ id: f.id, nome: f.nome, funcao: f.funcao, origem: 'alocado', dias: f.diasTrabalhados }));
              const todos = [...moList, ...alocList];
              if (todos.length === 0) return <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Nenhum profissional associado a esta obra.</p>;
              return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {todos.map(f => (
                    <div key={f.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', background: 'var(--background)', borderRadius: 8 }}>
                      <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, flexShrink: 0 }}>
                        {f.nome.charAt(0)}
                      </div>
                      <div style={{ flex: 1 }}>
                        <p style={{ fontWeight: 600, fontSize: 13 }}>{f.nome}</p>
                        <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>{f.funcao} · {f.dias} dias · via {f.origem}</p>
                      </div>
                      <CheckCircle size={16} color="var(--success)" />
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>

          {/* Opção liberar equipe */}
          {equipeObra.length > 0 && (
            <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: 13 }}>
              <input type="checkbox" checked={liberarEquipe} onChange={e => setLiberarEquipe(e.target.checked)} style={{ width: 16, height: 16, cursor: 'pointer' }} />
              <span>Liberar equipe alocada desta obra após conclusão ({equipeObra.length} profissional{equipeObra.length > 1 ? 'is' : ''})</span>
            </label>
          )}

          {/* Confirmar */}
          <button
            className="btn btn-primary"
            onClick={handleFinalizar}
            disabled={finalizando}
            style={{ width: '100%', background: 'var(--success)', borderColor: 'var(--success)', fontSize: 15, padding: '12px 0' }}
          >
            <CheckCircle size={16} /> {finalizando ? 'Finalizando...' : 'Confirmar e Marcar como Concluída'}
          </button>
        </div>
      </Modal>

      {/* Modal: Novo Gasto */}
      <Modal isOpen={isGastoModal} onClose={() => setIsGastoModal(false)} title="Registrar Gasto">
        <form onSubmit={handleAddGasto} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label className="text-secondary" style={{ display: 'block', fontSize: 13, marginBottom: 4 }}>Descrição</label>
            <input autoFocus required type="text" value={descGasto} onChange={e => setDescGasto(e.target.value)} style={{ width: '100%', padding: 10, borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', outline: 'none' }} />
          </div>
          <div className="flex gap-4">
            <div style={{ flex: 1 }}>
              <label className="text-secondary" style={{ display: 'block', fontSize: 13, marginBottom: 4 }}>Valor (R$)</label>
              <input required type="number" step="0.01" value={valorGasto} onChange={e => setValorGasto(e.target.value)} style={{ width: '100%', padding: 10, borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', outline: 'none' }} />
            </div>
            <div style={{ flex: 1 }}>
              <label className="text-secondary" style={{ display: 'block', fontSize: 13, marginBottom: 4 }}>Data</label>
              <input type="date" value={dataGasto} onChange={e => setDataGasto(e.target.value)} style={{ width: '100%', padding: 10, borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', outline: 'none' }} />
            </div>
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Lançar Gasto</button>
        </form>
      </Modal>
    </div>
  );
}
