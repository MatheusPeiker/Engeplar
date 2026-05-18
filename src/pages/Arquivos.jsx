import React, { useState } from 'react';
import { Upload, Trash2, FileText, Image, Table, File, Link } from 'lucide-react';
import { useAppContext } from '../context/AppContext';

const fileIcons = {
  pdf: <FileText size={20} color="#EF4444" />,
  xlsx: <Table size={20} color="#10B981" />,
  xls: <Table size={20} color="#10B981" />,
  jpg: <Image size={20} color="#F59E0B" />,
  png: <Image size={20} color="#F59E0B" />,
  default: <File size={20} color="var(--text-muted)" />
};

export default function Arquivos() {
  const { obras, getArquivosObra, addArquivo, deleteArquivo } = useAppContext();
  const [obraSelecionada, setObraSelecionada] = useState(obras[0]?.id || '');
  const [dragActive, setDragActive] = useState(false);

  const arquivos = getArquivosObra(obraSelecionada);

  const handleSimulateUpload = () => {
    if (!obraSelecionada) return;
    const nomes = ['Planta_Detalhada.pdf', 'Orcamento_Final.xlsx', 'Foto_Obra.jpg', 'Contrato_Assinado.pdf', 'Cronograma_Rev2.xlsx'];
    const tipos = ['pdf', 'xlsx', 'jpg', 'pdf', 'xlsx'];
    const vinculos = ['Orçamento', 'Proposta', 'Cronograma', 'Etapa', 'Geral'];
    const i = Math.floor(Math.random() * nomes.length);
    addArquivo(obraSelecionada, {
      nome: nomes[i], tipo: tipos[i],
      tamanho: `${(Math.random() * 5 + 0.1).toFixed(1)} MB`,
      vinculo: vinculos[i]
    });
  };

  const getIcon = (tipo) => fileIcons[tipo] || fileIcons.default;

  const getVinculoBadge = (vinculo) => {
    const map = { 'Orçamento': 'badge-primary', 'Proposta': 'badge-success', 'Cronograma': 'badge-warning', 'Etapa': 'badge-danger' };
    return <span className={`badge ${map[vinculo] || ''}`}>{vinculo}</span>;
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Arquivos da Obra</h1>
          <p className="page-subtitle">Gerencie e vincule documentos a etapas, orçamentos e propostas</p>
        </div>
        <select value={obraSelecionada} onChange={e => setObraSelecionada(parseInt(e.target.value))} style={{ padding: '10px 14px', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', fontWeight: 600, fontSize: 14 }}>
          {obras.map(o => <option key={o.id} value={o.id}>{o.nome}</option>)}
        </select>
      </div>

      {/* Dropzone */}
      <div
        className={`dropzone mb-6 ${dragActive ? 'active' : ''}`}
        onClick={handleSimulateUpload}
        onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
        onDragLeave={() => setDragActive(false)}
        onDrop={(e) => { e.preventDefault(); setDragActive(false); handleSimulateUpload(); }}
      >
        <Upload size={36} color="var(--primary)" style={{ marginBottom: 8 }} />
        <p style={{ fontWeight: 600, fontSize: 15, color: 'var(--text-primary)' }}>Clique ou arraste arquivos aqui</p>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>PDF, imagens, planilhas — qualquer formato</p>
      </div>

      {/* Grid de Arquivos */}
      {arquivos.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
          <File size={40} style={{ marginBottom: 8, opacity: .5 }} />
          <p>Nenhum arquivo nesta obra. Faça upload acima.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
          {arquivos.map(arq => (
            <div key={arq.id} className="card" style={{ padding: 16, display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <div style={{ width: 40, height: 40, borderRadius: 8, background: 'var(--background)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {getIcon(arq.tipo)}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontWeight: 600, fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{arq.nome}</p>
                <div className="flex gap-2 items-center" style={{ marginTop: 4 }}>
                  <span className="text-muted" style={{ fontSize: 12 }}>{arq.tamanho}</span>
                  {getVinculoBadge(arq.vinculo)}
                </div>
                <p className="text-muted" style={{ fontSize: 11, marginTop: 4 }}>{arq.dataCriacao}</p>
              </div>
              <button className="icon-btn" style={{ color: 'var(--danger)', flexShrink: 0 }} onClick={() => deleteArquivo(arq.id)}>
                <Trash2 size={15} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
