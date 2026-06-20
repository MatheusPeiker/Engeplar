import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { ArrowLeft, Plus, Trash2, MapPin, Calendar, FileText, DollarSign, Users, UserPlus, UserMinus, CheckCircle, AlertCircle, Download, ExternalLink, ClipboardList } from 'lucide-react';
import InlineEdit from '../components/InlineEdit';
import Modal from '../components/Modal';
import { gerarHTMLRTE } from '../templates/rteTemplate';
import { gerarPTC } from '../lib/gerarPTC';

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
    getPropostaObra, updateProposta,
    clientes,
    funcionarios, updateFuncionario,
    formatCurrency, empresa
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

  // Sanitize user content before injecting into HTML strings (XSS prevention)
  const esc = (s) => s == null ? '' : String(s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#039;');

  const STATUS_PROPOSTA = {
    rascunho: { label: 'Rascunho',  color: 'var(--text-muted)',  bg: 'var(--background)' },
    enviada:  { label: 'Enviada',   color: 'var(--primary)',     bg: 'var(--primary-light)' },
    aprovada: { label: 'Aprovada',  color: 'var(--success)',     bg: 'rgba(16,185,129,0.1)' },
    recusada: { label: 'Recusada',  color: 'var(--danger)',      bg: 'rgba(239,68,68,0.08)' },
  };

  const exportarPropostaDaObraPDF = () => {
    if (!propostaPrincipal) return;
    const p = propostaPrincipal;
    const margem = parseFloat(p.margemLucro) || 0;
    const impostos = parseFloat(p.impostos) || 0;
    const base = p.valorProposto || totalOrc;
    const valorComMargem = base * (1 + margem / 100);
    const valorFinal = valorComMargem * (1 + impostos / 100);
    const fmt = (v) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    const linhasItens = orcItens.map(i => `
      <tr>
        <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;">${esc(i.descricao)}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;text-align:center;">${esc(i.unidade)}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;text-align:right;">${i.quantidade}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;text-align:right;">${fmt(i.custoUnitario)}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;text-align:right;font-weight:600;">${fmt(i.quantidade * i.custoUnitario)}</td>
      </tr>`).join('');
    const linhasMO = orcMO.map(m => `
      <tr>
        <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;">${esc(m.nome)}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;">${esc(m.funcao)}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;text-align:center;">${m.diasPrevistos} dias</td>
        <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;text-align:right;">${fmt(m.custoDiaria)}/dia</td>
        <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;text-align:right;font-weight:600;">${fmt(m.custoDiaria * m.diasPrevistos)}</td>
      </tr>`).join('');
    const html = `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"/>
      <title>Proposta — ${esc(p.nome)}</title>
      <style>
        *{box-sizing:border-box;margin:0;padding:0;}
        body{font-family:'Segoe UI',Arial,sans-serif;font-size:13px;color:#1f2937;background:#fff;padding:40px;}
        .header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:32px;padding-bottom:24px;border-bottom:3px solid #1E3A8A;}
        .logo-area h1{font-size:22px;font-weight:800;color:#1E3A8A;letter-spacing:-0.5px;}
        .logo-area p{font-size:11px;color:#6b7280;margin-top:2px;}
        .proposta-info{text-align:right;}
        .proposta-info h2{font-size:18px;font-weight:700;color:#1E3A8A;}
        .proposta-info p{font-size:11px;color:#6b7280;margin-top:2px;}
        .cliente-box{background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:16px 20px;margin-bottom:24px;}
        .cliente-box h3{font-size:11px;text-transform:uppercase;letter-spacing:.05em;color:#6b7280;margin-bottom:8px;}
        .cliente-box p{font-size:14px;font-weight:600;color:#111827;}
        .cliente-box span{font-size:12px;color:#6b7280;}
        section{margin-bottom:24px;}
        section h3{font-size:12px;text-transform:uppercase;letter-spacing:.05em;color:#6b7280;margin-bottom:8px;font-weight:600;}
        table{width:100%;border-collapse:collapse;}
        thead tr{background:#1E3A8A;color:#fff;}
        thead th{padding:9px 12px;text-align:left;font-size:12px;font-weight:600;}
        thead th:last-child{text-align:right;}
        thead th:nth-child(3),thead th:nth-child(4){text-align:right;}
        .totals{background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:16px 20px;margin-bottom:24px;}
        .totals-row{display:flex;justify-content:space-between;padding:4px 0;font-size:13px;}
        .totals-row.final{padding-top:10px;margin-top:6px;border-top:2px solid #1E3A8A;font-size:16px;font-weight:800;color:#1E3A8A;}
        .obs{background:#fffbeb;border:1px solid #fde68a;border-radius:8px;padding:14px 16px;font-size:12px;color:#78350f;line-height:1.5;}
        .footer{margin-top:40px;padding-top:16px;border-top:1px solid #e5e7eb;display:flex;justify-content:space-between;font-size:11px;color:#9ca3af;}
        @media print{body{padding:20px;}}
      </style></head><body>
      <div class="header">
        <div class="logo-area">
          <h1>${esc(empresa?.nomeFantasia || empresa?.razaoSocial || 'Minha Empresa')}</h1>
          <p>${empresa?.cnpj ? 'CNPJ: ' + esc(empresa.cnpj) : ''}</p>
          <p>${esc(empresa?.endereco || '')}</p>
          <p>${esc(empresa?.telefone || '')} ${empresa?.email ? '· ' + esc(empresa.email) : ''}</p>
        </div>
        <div class="proposta-info">
          <h2>PROPOSTA COMERCIAL</h2>
          <p>${esc(p.nome)}</p>
          <p>Data: ${new Date().toLocaleDateString('pt-BR')}</p>
          ${p.condicoesPagamento ? `<p style="margin-top:4px;font-size:10px;color:#374151;">Pagamento: ${esc(p.condicoesPagamento)}</p>` : ''}
        </div>
      </div>

      <div class="cliente-box">
        <h3>Cliente</h3>
        <p>${esc(p.clienteNome) || 'A definir'}</p>
        ${p.clienteCnpj ? `<span>CNPJ: ${esc(p.clienteCnpj)}</span>` : ''}
        ${p.clienteEndereco ? `<br/><span>${esc(p.clienteEndereco)}</span>` : ''}
      </div>

      ${orcItens.length > 0 ? `<section>
        <h3>Materiais e Serviços</h3>
        <table>
          <thead><tr><th>Descrição</th><th>Unid.</th><th style="text-align:right">Qtd.</th><th style="text-align:right">Unit.</th><th style="text-align:right">Total</th></tr></thead>
          <tbody>${linhasItens}<tr style="background:#f3f4f6;font-weight:700;"><td colspan="4" style="padding:8px 12px;text-align:right;font-size:12px;">Subtotal</td><td style="padding:8px 12px;text-align:right;">${fmt(totalItens)}</td></tr></tbody>
        </table>
      </section>` : ''}

      ${orcMO.length > 0 ? `<section>
        <h3>Mão de Obra</h3>
        <table>
          <thead><tr><th>Profissional</th><th>Função</th><th style="text-align:right">Período</th><th style="text-align:right">Custo</th><th style="text-align:right">Total</th></tr></thead>
          <tbody>${linhasMO}<tr style="background:#f3f4f6;font-weight:700;"><td colspan="4" style="padding:8px 12px;text-align:right;font-size:12px;">Subtotal</td><td style="padding:8px 12px;text-align:right;">${fmt(totalMO)}</td></tr></tbody>
        </table>
      </section>` : ''}

      ${totalMob > 0 ? `<section>
        <h3>Mobilização</h3>
        <table>
          <thead><tr><th>Item</th><th colspan="3"></th><th style="text-align:right">Valor</th></tr></thead>
          <tbody>
            ${orcMob.veiculo ? `<tr><td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;">Veículo: ${esc(orcMob.veiculo)}</td><td colspan="3" style="padding:8px 12px;border-bottom:1px solid #e5e7eb;">${esc(orcMob.distanciaKm)} km · ${esc(orcMob.numViagens)} viagen(s)</td><td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;text-align:right;font-weight:600;">${fmt(totalMob)}</td></tr>` : ''}
          </tbody>
        </table>
      </section>` : ''}

      <div class="totals">
        <div class="totals-row"><span>Custo Base</span><span>${fmt(totalOrc)}</span></div>
        ${margem > 0 ? `<div class="totals-row"><span>Margem de Lucro (${margem}%)</span><span>+ ${fmt(totalOrc * margem / 100)}</span></div>` : ''}
        ${impostos > 0 ? `<div class="totals-row"><span>Impostos (${impostos}%)</span><span>+ ${fmt(valorComMargem * impostos / 100)}</span></div>` : ''}
        <div class="totals-row final"><span>VALOR TOTAL DA PROPOSTA</span><span>${fmt(valorFinal)}</span></div>
      </div>

      ${p.observacoes ? `<div class="obs"><strong>Observações:</strong> ${esc(p.observacoes)}</div>` : ''}

      <div class="footer">
        <span>${esc(empresa?.nomeFantasia || empresa?.razaoSocial || '')}</span>
        <span>Documento gerado em ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
      </div>
      <script>window.onload=()=>window.print();</script>
      </body></html>`;
    const w = window.open('', '_blank');
    if (w) { w.document.write(html); w.document.close(); }
  };

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
        {['resumo', 'proposta', 'equipe', 'gastos', 'orcamento', 'cronograma', 'arquivos', 'rte'].map(t => (
          <button key={t} className={`tab-btn ${aba === t ? 'active' : ''}`} onClick={() => setAba(t)} style={{ textTransform: t === 'rte' ? 'uppercase' : 'capitalize' }}>{t}</button>
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

      {/* === PROPOSTA === */}
      {aba === 'proposta' && (
        <div>
          {!propostaPrincipal ? (
            <div className="card" style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
              <FileText size={36} style={{ marginBottom: 12, opacity: .35 }} />
              <p style={{ fontWeight: 600, fontSize: 15 }}>Nenhuma proposta vinculada</p>
              <p style={{ fontSize: 13, marginTop: 6, maxWidth: 340, margin: '6px auto 0' }}>
                Crie uma proposta na página{' '}
                <span style={{ color: 'var(--primary)', cursor: 'pointer', fontWeight: 600 }} onClick={() => navigate('/proposta')}>Propostas</span>
                {' '}e vincule-a a esta obra.
              </p>
            </div>
          ) : (
            <>
              {/* Header da proposta */}
              <div className="card" style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                      <h3 style={{ fontWeight: 700, fontSize: 17 }}>{propostaPrincipal.nome}</h3>
                      <span style={{
                        fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20,
                        color: STATUS_PROPOSTA[propostaPrincipal.status]?.color || 'var(--text-muted)',
                        background: STATUS_PROPOSTA[propostaPrincipal.status]?.bg || 'var(--background)',
                        border: `1px solid ${STATUS_PROPOSTA[propostaPrincipal.status]?.color || 'var(--border)'}22`
                      }}>
                        {STATUS_PROPOSTA[propostaPrincipal.status]?.label || propostaPrincipal.status}
                      </span>
                    </div>
                    {propostaPrincipal.condicoesPagamento && (
                      <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                        Pagamento: {propostaPrincipal.condicoesPagamento}
                      </p>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <button className="btn btn-secondary btn-sm" onClick={() => navigate('/proposta')}>
                      <ExternalLink size={14} /> Abrir Proposta
                    </button>
                    <button className="btn btn-secondary btn-sm" onClick={exportarPropostaDaObraPDF}>
                      <Download size={14} /> Exportar PDF
                    </button>
                    <button className="btn btn-primary btn-sm" onClick={() => gerarPTC(propostaPrincipal, obra, null, orcamento, orcItens, empresa)}>
                      <FileText size={14} /> Exportar PTC
                    </button>
                  </div>
                </div>
              </div>

              {/* Cliente */}
              <div className="card" style={{ marginBottom: 16 }}>
                <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.05em', color: 'var(--text-muted)', marginBottom: 10 }}>Cliente</p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
                  <div>
                    <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Nome / Razão Social</p>
                    <p style={{ fontWeight: 600, fontSize: 14 }}>{propostaPrincipal.clienteNome || '—'}</p>
                  </div>
                  {propostaPrincipal.clienteCnpj && (
                    <div>
                      <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>CNPJ</p>
                      <p style={{ fontWeight: 600, fontSize: 14 }}>{propostaPrincipal.clienteCnpj}</p>
                    </div>
                  )}
                  {propostaPrincipal.clienteEndereco && (
                    <div>
                      <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Endereço</p>
                      <p style={{ fontWeight: 600, fontSize: 14 }}>{propostaPrincipal.clienteEndereco}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Resumo financeiro */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: 16 }}>
                <div className="card" style={{ padding: 16 }}>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>Custo Base</p>
                  <p style={{ fontSize: 20, fontWeight: 700 }}>{formatCurrency(totalOrc)}</p>
                </div>
                {propostaPrincipal.margemLucro > 0 && (
                  <div className="card" style={{ padding: 16 }}>
                    <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>Margem de Lucro</p>
                    <p style={{ fontSize: 20, fontWeight: 700, color: 'var(--success)' }}>{propostaPrincipal.margemLucro}%</p>
                  </div>
                )}
                {propostaPrincipal.impostos > 0 && (
                  <div className="card" style={{ padding: 16 }}>
                    <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>Impostos</p>
                    <p style={{ fontSize: 20, fontWeight: 700, color: 'var(--warning)' }}>{propostaPrincipal.impostos}%</p>
                  </div>
                )}
                <div className="card" style={{ padding: 16, background: 'var(--primary)', border: 'none' }}>
                  <p style={{ fontSize: 12, color: 'rgba(255,255,255,.75)', marginBottom: 4 }}>Valor da Proposta</p>
                  <p style={{ fontSize: 20, fontWeight: 800, color: 'white' }}>
                    {formatCurrency(propostaPrincipal.valorProposto || (totalOrc * (1 + (propostaPrincipal.margemLucro || 0) / 100) * (1 + (propostaPrincipal.impostos || 0) / 100)))}
                  </p>
                </div>
              </div>

              {/* Itens */}
              {orcItens.length > 0 && (
                <div className="card" style={{ padding: 0, overflow: 'hidden', marginBottom: 16 }}>
                  <div style={{ padding: '10px 16px', borderBottom: '1px solid var(--border)', fontWeight: 600, fontSize: 13 }}>
                    Materiais e Serviços
                  </div>
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
                          <td colSpan="4" style={{ textAlign: 'right', fontSize: 12 }}>Subtotal materiais</td>
                          <td style={{ textAlign: 'right', color: 'var(--primary)' }}>{formatCurrency(totalItens)}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

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
                        <th style={{ textAlign: 'center' }}>Dias</th>
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
                        <td colSpan="4" style={{ textAlign: 'right', fontSize: 12 }}>Subtotal mão de obra</td>
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
                    {orcMob.numViagens && <div><span style={{ color: 'var(--text-muted)' }}>Viagens: </span><strong>{orcMob.numViagens}</strong></div>}
                  </div>
                  <div style={{ padding: '8px 16px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end', fontWeight: 700, color: '#f59e0b' }}>
                    Total Mobilização: {formatCurrency(totalMob)}
                  </div>
                </div>
              )}

              {/* Observações */}
              {propostaPrincipal.observacoes && (
                <div className="card" style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.25)' }}>
                  <p style={{ fontSize: 12, fontWeight: 700, color: '#92400e', marginBottom: 6 }}>Observações</p>
                  <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{propostaPrincipal.observacoes}</p>
                </div>
              )}

              {/* ── Dados PTC ── */}
              {(() => {
                const p = propostaPrincipal;
                const fs = { width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid var(--border)', fontSize: 13, outline: 'none', background: 'var(--surface)' };
                const ls = { display: 'block', fontSize: 12, color: 'var(--text-muted)', marginBottom: 4, fontWeight: 600 };
                const st = { fontWeight: 700, fontSize: 12, textTransform: 'uppercase', letterSpacing: '.05em', color: 'var(--text-muted)', marginBottom: 14 };
                const up = (campo, valor) => updateProposta(p.id, campo, valor);
                return (
                  <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div style={{ borderTop: '2px solid var(--border)', paddingTop: 16 }}>
                      <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.05em', color: 'var(--primary)', marginBottom: 4 }}>
                        Dados PTC — preencha para gerar a Proposta Técnica Comercial
                      </p>
                    </div>

                    {/* Identificação */}
                    <div className="card">
                      <p style={st}>Identificação</p>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
                        <div><label style={ls}>Nº PTC</label>
                          <input style={fs} placeholder="PTC-0001.06.26 REV00" value={p.ptcNumero || ''} onChange={e => up('ptcNumero', e.target.value)} /></div>
                        <div><label style={ls}>Revisão</label>
                          <input style={fs} value={p.revisao || 'REV00'} onChange={e => up('revisao', e.target.value)} /></div>
                        <div><label style={ls}>Elaboração</label>
                          <input style={fs} placeholder="Nome do responsável" value={p.elaboracao || ''} onChange={e => up('elaboracao', e.target.value)} /></div>
                        <div><label style={ls}>Visita Técnica</label>
                          <input style={fs} placeholder="Nome / data" value={p.visita || ''} onChange={e => up('visita', e.target.value)} /></div>
                      </div>
                    </div>

                    {/* Escopo */}
                    <div className="card">
                      <p style={st}>Escopo</p>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        <div><label style={ls}>1.0 Objetivo</label>
                          <textarea style={{ ...fs, resize: 'vertical', lineHeight: 1.5 }} rows={3} value={p.objetivo || ''} onChange={e => up('objetivo', e.target.value)} /></div>
                        <div><label style={ls}>2.0 Prazo de Execução</label>
                          <textarea style={{ ...fs, resize: 'vertical', lineHeight: 1.5 }} rows={3} value={p.prazoExecucao || ''} onChange={e => up('prazoExecucao', e.target.value)} /></div>
                        <div><label style={ls}>2.2 Não incluso no escopo <span style={{ fontWeight: 400, color: 'var(--text-muted)' }}>(opcional)</span></label>
                          <textarea style={{ ...fs, resize: 'vertical', lineHeight: 1.5 }} rows={2} value={p.naoIncluso || ''} onChange={e => up('naoIncluso', e.target.value)} /></div>
                        <div><label style={ls}>4.0 Observações <span style={{ fontWeight: 400 }}>(opcional)</span></label>
                          <textarea style={{ ...fs, resize: 'vertical', lineHeight: 1.5 }} rows={2} value={p.observacoes || ''} onChange={e => up('observacoes', e.target.value)} /></div>
                        <div><label style={ls}>7.0 Notas <span style={{ fontWeight: 400 }}>(opcional)</span></label>
                          <textarea style={{ ...fs, resize: 'vertical', lineHeight: 1.5 }} rows={2} value={p.notas || ''} onChange={e => up('notas', e.target.value)} /></div>
                      </div>
                    </div>

                    {/* Condições comerciais */}
                    <div className="card">
                      <p style={st}>Condições Comerciais</p>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14 }}>
                        <div><label style={ls}>Pagamento (dias)</label>
                          <input type="number" min="1" style={fs} value={p.pagamentoDias ?? 14} onChange={e => up('pagamentoDias', parseInt(e.target.value) || 14)} /></div>
                        <div><label style={ls}>Validade (dias)</label>
                          <input type="number" min="1" style={fs} value={p.validadeDias ?? 15} onChange={e => up('validadeDias', parseInt(e.target.value) || 15)} /></div>
                        <div><label style={ls}>Frete</label>
                          <select style={fs} value={p.frete || 'CIF'} onChange={e => up('frete', e.target.value)}>
                            <option value="CIF">CIF</option>
                            <option value="FOB">FOB</option>
                            <option value="A combinar">A combinar</option>
                          </select>
                        </div>
                        <div><label style={ls}>Mobilização</label>
                          <input style={fs} value={p.mobilizacaoObs || 'A combinar'} onChange={e => up('mobilizacaoObs', e.target.value)} /></div>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </>
          )}
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

      {/* === RTE === */}
      {aba === 'rte' && (() => {
        const dim = obra.dimensoes || {};
        const TIPOS_SERVICO = [
          { value: 'RECUPERACAO_LINER',           label: 'Recuperação de Liner Interno/Externo (PRFV)' },
          { value: 'REVESTIMENTO_PINTURA',        label: 'Tratamento e Pintura Anticorrosiva' },
          { value: 'REVESTIMENTO_IMPERMEABILIZANTE', label: 'Revestimento Impermeabilizante' },
          { value: 'INJECAO_QUIMICA',             label: 'Injeção Química em Trincas/Fissuras' },
          { value: 'SOLDA_PLASTICA',              label: 'Solda Plástica por Termofusão (PP/PRFV)' },
          { value: 'CONSTRUCAO',                  label: 'Construção de Estrutura Nova' },
        ];

        const fieldStyle = { width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid var(--border)', fontSize: 13, outline: 'none', background: 'var(--surface)' };
        const labelStyle = { display: 'block', fontSize: 12, color: 'var(--text-muted)', marginBottom: 4, fontWeight: 600 };
        const gridStyle = { display: 'grid', gap: 16 };

        const handleDim = (key, val) => {
          updateObra(id, 'dimensoes', { ...dim, [key]: val });
        };

        const rteData = obra.dadosRte || {};
        const handleRteField = (key, val) => {
          updateObra(id, 'dadosRte', { ...rteData, [key]: val });
        };

        const sectionTitleStyle = { fontWeight: 700, fontSize: 12, textTransform: 'uppercase', letterSpacing: '.05em', color: 'var(--text-muted)', marginBottom: 16 };

        const renderCamposTipo = () => {
          if (!obra.tipoServico) return null;
          const tipoLabel = TIPOS_SERVICO.find(t => t.value === obra.tipoServico)?.label || obra.tipoServico;

          const Row = ({ children }) => (
            <div style={{ ...gridStyle, gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', marginBottom: 0 }}>{children}</div>
          );
          const Field = ({ label, children }) => (
            <div><label style={labelStyle}>{label}</label>{children}</div>
          );
          const inp = (key, placeholder = '') => (
            <input style={fieldStyle} placeholder={placeholder} value={rteData[key] || ''} onChange={e => handleRteField(key, e.target.value)} />
          );
          const num = (key, placeholder = '') => (
            <input type="number" style={fieldStyle} placeholder={placeholder} value={rteData[key] || ''} onChange={e => handleRteField(key, e.target.value)} />
          );
          const ta = (key, rows = 3) => (
            <textarea rows={rows} style={{ ...fieldStyle, resize: 'vertical', lineHeight: 1.5 }} value={rteData[key] || ''} onChange={e => handleRteField(key, e.target.value)} />
          );
          const chk = (key, label) => (
            <label key={key} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer' }}>
              <input type="checkbox" checked={!!rteData[key]} onChange={e => handleRteField(key, e.target.checked)} style={{ width: 15, height: 15 }} />
              {label}
            </label>
          );

          switch (obra.tipoServico) {
            case 'REVESTIMENTO_PINTURA':
              return (
                <div className="card">
                  <p style={sectionTitleStyle}>Dados Técnicos — {tipoLabel}</p>
                  <Row>
                    <Field label="Produto / Sistema">{inp('produto_nome')}</Field>
                    <Field label="Fabricante">{inp('fabricante')}</Field>
                    <Field label="Norma de Preparo de Superfície">{inp('norma_jato', 'Ex: Sa 2½ ISO 8501-1')}</Field>
                    <Field label="Sistema de Aplicação">{inp('sistema_aplicacao', 'Airless / Broxa / Rolo')}</Field>
                  </Row>
                  <p style={{ ...labelStyle, marginTop: 16, marginBottom: 10 }}>Camadas de Tinta</p>
                  {[1, 2, 3].map(n => (
                    <div key={n} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: 12, marginBottom: 8, padding: '10px 12px', background: 'var(--background)', borderRadius: 8 }}>
                      <Field label={`Camada ${n} — Material/Produto`}>{inp(`camada_${n}_material`)}</Field>
                      <Field label="Cor">{inp(`camada_${n}_cor`)}</Field>
                      <Field label="Esp. Úmida (µm)">{num(`camada_${n}_esp_umida`)}</Field>
                      <Field label="Esp. Seca (µm)">{num(`camada_${n}_esp_seca`)}</Field>
                    </div>
                  ))}
                  <div style={{ marginTop: 8, maxWidth: 220 }}>
                    <Field label="Espessura Total Seca (µm)">{num('espessura_total')}</Field>
                  </div>
                </div>
              );

            case 'REVESTIMENTO_IMPERMEABILIZANTE':
              return (
                <div className="card">
                  <p style={sectionTitleStyle}>Dados Técnicos — {tipoLabel}</p>
                  <Row>
                    <Field label="Produto / Sistema">{inp('produto_nome')}</Field>
                    <Field label="Fabricante">{inp('fabricante')}</Field>
                    <Field label="Sistema de Aplicação">{inp('sistema_aplicacao', 'Airless / Broxa / Rolo')}</Field>
                    <Field label="Espessura Interna (µm)">{num('espessura_interna')}</Field>
                    <Field label="Espessura Externa (µm)">{num('espessura_externa')}</Field>
                  </Row>
                </div>
              );

            case 'RECUPERACAO_LINER':
              return (
                <div className="card">
                  <p style={sectionTitleStyle}>Dados Técnicos — {tipoLabel}</p>
                  <Row>
                    <Field label="Tipo de Manta">{inp('tipo_manta', 'Ex: Fibra de vidro 450 g/m²')}</Field>
                    <Field label="Resina">{inp('resina', 'Ex: Derakane 411-350')}</Field>
                    <Field label="Tratamento Químico">{inp('tratamento_quimico')}</Field>
                    <Field label="Acabamento">{inp('acabamento')}</Field>
                    <Field label="Área Total (m²)">{inp('area_total_m2')}</Field>
                  </Row>
                  <p style={{ ...labelStyle, marginTop: 14, marginBottom: 8 }}>Áreas Executadas</p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 20 }}>
                    {[['interno', 'Liner interno'], ['externo', 'Liner externo'], ['estrutural', 'Reforço estrutural'], ['fundo', 'Fundo do equipamento']].map(([k, l]) => chk(k, l))}
                  </div>
                </div>
              );

            case 'INJECAO_QUIMICA':
              return (
                <div className="card">
                  <p style={sectionTitleStyle}>Dados Técnicos — {tipoLabel}</p>
                  <Row>
                    <Field label="Produto Injetado">{inp('produto_injetado')}</Field>
                    <Field label="Total de Pontos de Injeção">{num('total_pontos')}</Field>
                    <Field label="Área Recuperada (m²)">{inp('area_recuperada_m2')}</Field>
                  </Row>
                  <div style={{ marginTop: 8 }}>
                    <Field label="Descrição das Áreas Recuperadas">{ta('descricao_areas', 3)}</Field>
                  </div>
                </div>
              );

            case 'SOLDA_PLASTICA':
              return (
                <div className="card">
                  <p style={sectionTitleStyle}>Dados Técnicos — {tipoLabel}</p>
                  <Row>
                    <Field label="Material Base">{inp('material_base', 'PP, PRFV, PEAD...')}</Field>
                    <Field label="Tipo de Solda">{inp('tipo_solda', 'Termofusão, Extrusão...')}</Field>
                    <Field label="Área Reparada (m²)">{inp('area_reparada_m2')}</Field>
                  </Row>
                  <div style={{ marginTop: 8 }}>
                    <Field label="Descrição dos Reparos">{ta('descricao', 3)}</Field>
                  </div>
                </div>
              );

            case 'CONSTRUCAO':
              return (
                <div className="card">
                  <p style={sectionTitleStyle}>Dados Técnicos — {tipoLabel}</p>
                  <Row>
                    <Field label="Material">{inp('material')}</Field>
                    <Field label="Norma Aplicável">{inp('norma', 'NBR XXXX')}</Field>
                  </Row>
                  <div style={{ marginTop: 8 }}>
                    <Field label="Descrição da Estrutura">{ta('descricao_estrutura', 3)}</Field>
                  </div>
                </div>
              );

            default:
              return null;
          }
        };

        const gerarRTE = () => {
          const html = gerarHTMLRTE(obra, empresa, cronograma, propostaPrincipal, equipeObra);
          const w = window.open('', '_blank');
          if (w) { w.document.write(html); w.document.close(); }
        };

        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* Gerar RTE */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ fontWeight: 700, fontSize: 16 }}>RTE — Relatório Técnico de Execução</h3>
                <p className="text-muted" style={{ fontSize: 12, marginTop: 2 }}>Preencha os campos abaixo e clique em Gerar RTE para exportar o PDF.</p>
              </div>
              <button className="btn btn-primary" onClick={gerarRTE} style={{ whiteSpace: 'nowrap' }}>
                <ClipboardList size={15} /> Gerar RTE (PDF)
              </button>
            </div>

            {/* Bloco: Identificação */}
            <div className="card">
              <p style={sectionTitleStyle}>Identificação do Documento</p>
              <div style={{ ...gridStyle, gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
                <div>
                  <label style={labelStyle}>Nº RTE</label>
                  <input
                    style={fieldStyle} placeholder="RTE-0000.MM.AA REV00"
                    value={obra.rteNumero || ''}
                    onChange={e => updateObra(id, 'rteNumero', e.target.value)}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Tipo de Serviço</label>
                  <select
                    style={fieldStyle}
                    value={obra.tipoServico || ''}
                    onChange={e => updateObra(id, 'tipoServico', e.target.value)}
                  >
                    <option value="">— Selecionar —</option>
                    {TIPOS_SERVICO.map(t => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Dados técnicos dinâmicos por tipo de serviço */}
            {renderCamposTipo()}

            {/* Bloco: Dados Fiscais */}
            <div className="card">
              <p style={sectionTitleStyle}>Dados Fiscais</p>
              <div style={{ ...gridStyle, gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
                <div>
                  <label style={labelStyle}>Pedido Nº</label>
                  <input style={fieldStyle} value={obra.pedidoNumero || ''} onChange={e => updateObra(id, 'pedidoNumero', e.target.value)} />
                </div>
                <div>
                  <label style={labelStyle}>Data do Pedido</label>
                  <input type="date" style={fieldStyle} value={obra.pedidoData || ''} onChange={e => updateObra(id, 'pedidoData', e.target.value)} />
                </div>
                <div>
                  <label style={labelStyle}>ART Nº</label>
                  <input style={fieldStyle} value={obra.artNumero || ''} onChange={e => updateObra(id, 'artNumero', e.target.value)} />
                </div>
                <div>
                  <label style={labelStyle}>Data da ART</label>
                  <input type="date" style={fieldStyle} value={obra.artData || ''} onChange={e => updateObra(id, 'artData', e.target.value)} />
                </div>
                <div>
                  <label style={labelStyle}>Nota Fiscal Nº</label>
                  <input style={fieldStyle} value={obra.nfNumero || ''} onChange={e => updateObra(id, 'nfNumero', e.target.value)} />
                </div>
                <div>
                  <label style={labelStyle}>Data da NF</label>
                  <input type="date" style={fieldStyle} value={obra.nfData || ''} onChange={e => updateObra(id, 'nfData', e.target.value)} />
                </div>
              </div>
              {propostaPrincipal && (
                <div style={{ marginTop: 14, padding: '10px 14px', background: 'var(--background)', borderRadius: 8, fontSize: 13 }}>
                  <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>PTC Referência: </span>
                  <span>{propostaPrincipal.nome}</span>
                </div>
              )}
            </div>

            {/* Bloco: Equipamento */}
            <div className="card">
              <p style={sectionTitleStyle}>Equipamento</p>
              <div style={{ ...gridStyle, gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={labelStyle}>Material / Tipo do Equipamento</label>
                  <input style={fieldStyle} placeholder="Ex: AÇO CARBONO, PRFV, CONCRETO" value={obra.materialEquipamento || ''} onChange={e => updateObra(id, 'materialEquipamento', e.target.value)} />
                </div>
                <div>
                  <label style={labelStyle}>Diâmetro</label>
                  <input style={fieldStyle} placeholder="Ex: 3.000 mm" value={dim.diametro || ''} onChange={e => handleDim('diametro', e.target.value)} />
                </div>
                <div>
                  <label style={labelStyle}>Altura</label>
                  <input style={fieldStyle} placeholder="Ex: 8.500 mm" value={dim.altura || ''} onChange={e => handleDim('altura', e.target.value)} />
                </div>
                <div>
                  <label style={labelStyle}>Área (m²)</label>
                  <input style={fieldStyle} placeholder="Ex: 85,00" value={dim.area || ''} onChange={e => handleDim('area', e.target.value)} />
                </div>
                <div>
                  <label style={labelStyle}>Responsável do Cliente (acompanhante)</label>
                  <input style={fieldStyle} placeholder="Nome e cargo" value={obra.responsavelCliente || ''} onChange={e => updateObra(id, 'responsavelCliente', e.target.value)} />
                </div>
              </div>
            </div>

            {/* Bloco: Garantia e Descrição */}
            <div className="card">
              <p style={sectionTitleStyle}>Garantia e Descrição Técnica</p>
              <div style={{ ...gridStyle, gridTemplateColumns: '1fr 1fr' }}>
                <div>
                  <label style={labelStyle}>Prazo de Garantia (meses)</label>
                  <input type="number" min="1" style={fieldStyle} value={obra.garantiaMeses ?? 36} onChange={e => updateObra(id, 'garantiaMeses', parseInt(e.target.value) || 36)} />
                </div>
                <div>
                  <label style={labelStyle}>Periodicidade de Inspeção (meses)</label>
                  <input type="number" min="1" style={fieldStyle} value={obra.inspecaoMeses ?? 12} onChange={e => updateObra(id, 'inspecaoMeses', parseInt(e.target.value) || 12)} />
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={labelStyle}>Descrição Técnica do Serviço (texto da Introdução)</label>
                  <textarea
                    rows={4}
                    style={{ ...fieldStyle, resize: 'vertical', lineHeight: 1.5 }}
                    placeholder="Descreva o serviço executado conforme o RTE..."
                    value={obra.descricaoTecnica || ''}
                    onChange={e => updateObra(id, 'descricaoTecnica', e.target.value)}
                  />
                </div>
              </div>
            </div>

          </div>
        );
      })()}

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
