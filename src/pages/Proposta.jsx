import React, { useState } from 'react';
import { FileText, Download, Save, Plus, Search, ArrowLeft, Trash2, ChevronRight, Building2 } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import InlineEdit from '../components/InlineEdit';
import Modal from '../components/Modal';

export default function Proposta() {
  const { propostas, listaOrcamentos, addObra, updateProposta, addProposta, deleteProposta, getTotalOrcamento, formatCurrency, salvarVersao } = useAppContext();
  
  const [view, setView] = useState('list'); // 'list' ou 'detail'
  const [currentPId, setCurrentPId] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newPName, setNewPName] = useState('');
  const [isLoadingCnpj, setIsLoadingCnpj] = useState(false);
  const [obraGerada, setObraGerada] = useState(null);

  const proposta = propostas.find(p => p.id === currentPId);
  const custoReal = proposta?.orcamentoId ? getTotalOrcamento(proposta.orcamentoId) : 0;
  const margem = proposta?.margemLucro || 0;
  const impostos = proposta?.impostos || 0;
  
  const valorComMargem = custoReal * (1 + margem / 100);
  const valorComImpostos = valorComMargem * (1 + impostos / 100);
  const valorProposto = proposta?.valorProposto || valorComImpostos;
  const lucroEstimado = valorProposto - custoReal;
  const dPerc = custoReal > 0 ? ((valorProposto - custoReal) / custoReal * 100).toFixed(1) : 0;

  const handleCreateProposta = async (e) => {
    e.preventDefault();
    const id = await addProposta(newPName);
    setIsModalOpen(false);
    setNewPName('');
    if (id) { setCurrentPId(id); setView('detail'); }
  };

  const handleGerarObra = async () => {
    if (!proposta) return;
    if (!confirm(`Criar obra "${proposta.nome}" a partir desta proposta?`)) return;
    const obraId = await addObra({
      nome: proposta.nome,
      endereco: proposta.clienteEndereco || '',
      status: 'Em andamento',
      previsao: '',
      orcamento: valorProposto,
    });
    if (obraId) {
      setObraGerada(proposta.nome);
      updateProposta(currentPId, 'obraId', obraId);
    }
  };

  const handleUpdate = (campo, valor) => {
    if (!currentPId) return;
    updateProposta(currentPId, campo, valor);
  };

  const handleCnpjSearch = async (cnpj) => {
    const cleanCnpj = cnpj.replace(/\D/g, '');
    if (cleanCnpj.length !== 14) return;
    setIsLoadingCnpj(true);
    try {
      const response = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cleanCnpj}`);
      if (!response.ok) throw new Error('CNPJ não encontrado');
      const data = await response.json();
      const endereco = `${data.logradouro}, ${data.numero} ${data.complemento ? '- ' + data.complemento : ''} - ${data.bairro} - ${data.municipio}/${data.uf}`;
      handleUpdate('clienteNome', data.razao_social);
      handleUpdate('clienteEndereco', endereco);
    } catch (err) {
      alert('Erro ao buscar: ' + err.message);
    } finally {
      setIsLoadingCnpj(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Propostas Comerciais</h1>
          <p className="page-subtitle">Gerencie orçamentos e propostas independentes para seus clientes</p>
        </div>
        {view === 'list' ? (
          <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}><Plus size={18} /> Nova Proposta</button>
        ) : (
          <button className="btn btn-secondary" onClick={() => setView('list')}><ArrowLeft size={18} /> Voltar à Lista</button>
        )}
      </div>

      {view === 'list' && (
        <div className="grid-3" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
          {propostas.map(p => {
            const custo = p.orcamentoId ? getTotalOrcamento(p.orcamentoId) : 0;
            const vProposto = p.valorProposto || (custo * (1 + p.margemLucro/100) * (1 + p.impostos/100));
            const orc = p.orcamentoId ? listaOrcamentos.find(o => o.id === p.orcamentoId) : null;
            return (
              <div key={p.id} className="card hover-effect" style={{ cursor: 'pointer' }} onClick={() => { setCurrentPId(p.id); setObraGerada(null); setView('detail'); }}>
                <div className="flex justify-between items-start mb-4">
                  <div className="logo-icon" style={{ background: 'var(--success-light)', color: 'var(--success)', width: 40, height: 40, borderRadius: 8 }}>
                    <FileText size={20} />
                  </div>
                  <button className="icon-btn text-danger" onClick={(e) => { e.stopPropagation(); if(confirm('Excluir?')) deleteProposta(p.id); }}>
                    <Trash2 size={16} />
                  </button>
                </div>
                <h3 style={{ fontWeight: 700, fontSize: 17, marginBottom: 4 }}>{p.nome}</h3>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 8 }}>{p.clienteNome || 'Cliente não definido'}</p>
                {orc && <p style={{ fontSize: 11, color: 'var(--primary)', marginBottom: 12, fontWeight: 600 }}>Orçamento: {orc.nome}</p>}
                {p.obraId && <p style={{ fontSize: 11, color: 'var(--success)', marginBottom: 8, fontWeight: 600 }}>Obra gerada</p>}
                <div className="flex justify-between items-end" style={{ borderTop: '1px solid var(--border)', paddingTop: 12 }}>
                  <div>
                    <p style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Valor Proposto</p>
                    <p style={{ fontSize: 18, fontWeight: 700, color: 'var(--success)' }}>{formatCurrency(vProposto)}</p>
                  </div>
                  <ChevronRight size={16} color="var(--text-muted)" />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {view === 'detail' && proposta && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 24 }}>
            <div className="card" style={{ borderLeft: '4px solid var(--primary)' }}>
              <p className="text-secondary" style={{ fontSize: 12, marginBottom: 4 }}>Custo Real (Base)</p>
              <h3 style={{ fontSize: 24, fontWeight: 700 }}>{formatCurrency(custoReal)}</h3>
            </div>
            <div className="card" style={{ borderLeft: '4px solid var(--success)' }}>
              <p className="text-secondary" style={{ fontSize: 12, marginBottom: 4 }}>Valor Sugerido</p>
              <h3 style={{ fontSize: 24, fontWeight: 700, color: 'var(--success)' }}>{formatCurrency(valorComImpostos)}</h3>
            </div>
            <div className="card" style={{ borderLeft: '4px solid var(--warning)' }}>
              <p className="text-secondary" style={{ fontSize: 12, marginBottom: 4 }}>Margem Estimada</p>
              <h3 style={{ fontSize: 24, fontWeight: 700 }}>{dPerc}%</h3>
            </div>
          </div>

          <div className="flex gap-6" style={{ flexWrap: 'wrap' }}>
            <div className="card flex-1" style={{ minWidth: '55%' }}>
              <div className="flex justify-between items-center mb-6">
                <h3 style={{ fontWeight: 700, fontSize: 18 }}>
                   <InlineEdit value={proposta.nome} onSave={v => handleUpdate('nome', v)} />
                </h3>
                <div className="flex gap-2">
                   <button className="btn btn-secondary btn-sm" onClick={() => salvarVersao('proposta', proposta.id, proposta, null)}><Save size={14} /> Salvar Versão</button>
                   <button className="btn btn-secondary btn-sm"><Download size={14} /> PDF</button>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                {/* Botão Gerar Obra */}
                <div style={{ gridColumn: 'span 2' }}>
                  {proposta.obraId || obraGerada ? (
                    <div style={{ padding: '10px 14px', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 8, fontSize: 13, color: 'var(--success)', fontWeight: 600 }}>
                      Obra "{obraGerada || proposta.nome}" criada com sucesso.
                    </div>
                  ) : (
                    <button className="btn btn-primary" style={{ width: '100%' }} onClick={handleGerarObra}>
                      <Building2 size={16} /> Gerar Obra a partir desta Proposta
                    </button>
                  )}
                </div>

                <div style={{ gridColumn: 'span 2' }}>
                  <label className="text-secondary" style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>Orçamento de Referência</label>
                  <select value={proposta.orcamentoId || ''} onChange={e => handleUpdate('orcamentoId', e.target.value || null)} style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid var(--border)' }}>
                    <option value="">Selecione um orçamento...</option>
                    {listaOrcamentos.map(o => <option key={o.id} value={o.id}>{o.nome} ({formatCurrency(getTotalOrcamento(o.id))})</option>)}
                  </select>
                </div>

                <div>
                  <label className="text-secondary" style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>CNPJ do Cliente</label>
                  <div className="flex gap-2">
                    <input type="text" value={proposta.clienteCnpj} onChange={e => handleUpdate('clienteCnpj', e.target.value)} placeholder="00.000.000/0001-00" style={{ flex: 1, padding: 8, borderRadius: 6, border: '1px solid var(--border)' }} />
                    <button className="btn btn-primary btn-sm" onClick={() => handleCnpjSearch(proposta.clienteCnpj)} disabled={isLoadingCnpj}>{isLoadingCnpj ? '...' : <Search size={14} />}</button>
                  </div>
                </div>

                <div>
                  <label className="text-secondary" style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>Cliente / Razão Social</label>
                  <InlineEdit value={proposta.clienteNome} onSave={v => handleUpdate('clienteNome', v)} placeholder="Nome do cliente" />
                </div>

                <div style={{ gridColumn: 'span 2' }}>
                  <label className="text-secondary" style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>Endereço de Entrega/Faturamento</label>
                  <InlineEdit value={proposta.clienteEndereco} onSave={v => handleUpdate('clienteEndereco', v)} placeholder="Endereço completo" />
                </div>

                <div>
                  <label className="text-secondary" style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>Margem de Lucro (%)</label>
                  <InlineEdit value={proposta.margemLucro} type="number" onSave={v => handleUpdate('margemLucro', parseFloat(v))} suffix="%" />
                </div>

                <div>
                  <label className="text-secondary" style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>Impostos (%)</label>
                  <InlineEdit value={proposta.impostos} type="number" onSave={v => handleUpdate('impostos', parseFloat(v))} suffix="%" />
                </div>

                <div>
                  <label className="text-secondary" style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>Condições de Pagamento</label>
                  <InlineEdit value={proposta.condicoesPagamento} onSave={v => handleUpdate('condicoesPagamento', v)} />
                </div>

                <div>
                  <label className="text-secondary" style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>Valor Final (Manual)</label>
                  <InlineEdit value={valorProposto} type="currency" onSave={v => handleUpdate('valorProposto', parseFloat(v))} />
                </div>
              </div>
            </div>

            <div style={{ width: '100%', maxWidth: 320, display: 'flex', flexDirection: 'column', gap: 16 }}>
               <div className="card" style={{ background: 'var(--success)', color: 'white', border: 'none' }}>
                 <p style={{ opacity: .8, fontSize: 12, marginBottom: 4 }}>Total da Proposta</p>
                 <h2 style={{ fontSize: 32, fontWeight: 800 }}>{formatCurrency(valorProposto)}</h2>
                 <div style={{ marginTop: 16, borderTop: '1px solid rgba(255,255,255,0.2)', paddingTop: 12, fontSize: 12 }}>
                   <p className="flex justify-between"><span>Custo base:</span> <span>{formatCurrency(custoReal)}</span></p>
                   <p className="flex justify-between" style={{ marginTop: 4 }}><span>Lucro bruto:</span> <span>{formatCurrency(lucroEstimado)}</span></p>
                 </div>
               </div>
               <div className="card">
                 <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>Observações Internas</h4>
                 <textarea value={proposta.observacoes} onChange={e => handleUpdate('observacoes', e.target.value)} style={{ width: '100%', minHeight: 100, padding: 8, borderRadius: 8, border: '1px solid var(--border)', fontSize: 13, outline: 'none' }} placeholder="Notas sobre a negociação..." />
               </div>
            </div>
          </div>
        </>
      )}

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Nova Proposta Comercial">
        <form onSubmit={handleCreateProposta} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label className="text-secondary" style={{ display: 'block', fontSize: 13, marginBottom: 4 }}>Nome da Proposta</label>
            <input required type="text" autoFocus value={newPName} onChange={e => setNewPName(e.target.value)} placeholder="Ex: Proposta Casa de Campo Rev.0" style={{ width: '100%', padding: 10, borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', outline: 'none' }} />
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Criar Proposta</button>
        </form>
      </Modal>
    </div>
  );
}
