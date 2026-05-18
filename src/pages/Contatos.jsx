import { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { Users, Plus, Trash2, CreditCard, Search, Loader2, Package, MapPin, DollarSign, Clock } from 'lucide-react';
import InlineEdit from '../components/InlineEdit';
import Modal from '../components/Modal';

// Strip HTML tags and limit length — applied to data from external APIs
const sanitizeText = (val, max = 200) =>
  val == null ? '' : String(val).replace(/[<>"']/g, '').trim().substring(0, max);

// Formatações utilitárias
const formatCNPJ = (value) => {
  const cnpj = value.replace(/\D/g, '');
  return cnpj.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5').substring(0, 18);
};

const formatPhone = (value) => {
  const phone = value.replace(/\D/g, '');
  if (phone.length <= 10) return phone.replace(/^(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
  return phone.replace(/^(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
};

export default function Contatos() {
  const { clientes, addCliente, updateCliente, deleteCliente, fornecedores, addFornecedor, updateFornecedor, deleteFornecedor } = useAppContext();
  const [activeTab, setActiveTab] = useState('clientes');
  const [searchTerm, setSearchTerm] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState('cliente');
  const [loadingCnpj, setLoadingCnpj] = useState(false);
  const [cnpjError, setCnpjError] = useState('');
  const [formData, setFormData] = useState({ 
    nome: '', contato: '', telefone: '', email: '', tipo: 'Jurídica', 
    cnpj: '', materiais: '', pagamento: 'Boleto 30 dias', endereco: '', prazo: 'Imediato' 
  });

  const handleOpenModal = (type) => {
    setModalType(type);
    setFormData({
      nome: '', contato: '', telefone: '', email: '', tipo: 'Jurídica',
      cnpj: '', materiais: '', pagamento: 'Boleto 30 dias', endereco: '', prazo: 'Imediato'
    });
    setCnpjError('');
    setIsModalOpen(true);
  };

  const handleAddContact = (e) => {
    e.preventDefault();
    const formattedData = {
      ...formData,
      cnpj: formData.cnpj, // Já formatado no input
      telefone: formData.telefone
    };
    if (modalType === 'cliente') {
      addCliente(formattedData);
    } else {
      addFornecedor(formattedData);
    }
    setIsModalOpen(false);
  };

  const handleCnpjChange = async (val) => {
    const rawValue = val.replace(/\D/g, '');
    const formatted = formatCNPJ(val);
    setFormData({ ...formData, cnpj: formatted });
    setCnpjError('');

    if (rawValue.length === 14) {
      setLoadingCnpj(true);
      try {
        const response = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${rawValue}`);
        if (response.ok) {
          const data = await response.json();
          const endereco = [data.logradouro, data.numero, data.bairro, data.municipio, data.uf]
            .filter(Boolean).map(s => sanitizeText(s, 100)).join(', ');
          setFormData(prev => ({
            ...prev,
            nome: sanitizeText(data.razao_social || data.nome_fantasia) || prev.nome,
            email: sanitizeText(data.email, 150) || prev.email,
            telefone: formatPhone(sanitizeText(data.telefone, 20) || prev.telefone),
            endereco: endereco || prev.endereco,
            tipo: 'Jurídica'
          }));
        } else {
          setCnpjError('CNPJ não encontrado na Receita Federal.');
        }
      } catch {
        setCnpjError('Não foi possível consultar o CNPJ. Verifique sua conexão.');
      } finally {
        setLoadingCnpj(false);
      }
    }
  };

  const filteredClientes = clientes.filter(c => 
    c.nome.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (c.contato && c.contato.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (c.cnpj && c.cnpj.includes(searchTerm))
  );

  const filteredFornecedores = fornecedores.filter(f => 
    f.nome.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (f.contato && f.contato.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (f.materiais && f.materiais.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (f.cnpj && f.cnpj.includes(searchTerm))
  );

  const pagtoOptions = ['À Vista', 'Boleto 15 dias', 'Boleto 28 dias', 'Boleto 30 dias', 'Boleto 30/60/90', 'Cartão de Crédito', 'Pix', 'Transferência'];
  const prazoOptions = ['Imediato', '24 horas', '48 horas', '3 a 5 dias', '7 dias', '15 dias', 'A combinar'];

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Clientes & Fornecedores</h1>
          <p className="page-subtitle">Gerencie sua rede de contatos com formatação automática e dados detalhados</p>
        </div>
        <div className="flex gap-2">
          <div style={{ position: 'relative' }}>
            <Search size={18} style={{ position: 'absolute', left: 12, top: 10, color: 'var(--text-muted)' }} />
            <input 
              type="text" 
              placeholder="Buscar por nome, material ou CNPJ..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              style={{ padding: '8px 12px 8px 36px', width: 280, borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', outline: 'none', fontSize: 14 }} 
            />
          </div>
          <button className="btn btn-primary" onClick={() => handleOpenModal(activeTab === 'clientes' ? 'cliente' : 'fornecedor')}>
            <Plus size={18} /> Novo {activeTab === 'clientes' ? 'Cliente' : 'Fornecedor'}
          </button>
        </div>
      </div>

      <div className="tabs-container">
        <button className={`tab-btn ${activeTab === 'clientes' ? 'active' : ''}`} onClick={() => setActiveTab('clientes')}>
          <Users size={18} /> Clientes ({clientes.length})
        </button>
        <button className={`tab-btn ${activeTab === 'fornecedores' ? 'active' : ''}`} onClick={() => setActiveTab('fornecedores')}>
          <CreditCard size={18} /> Fornecedores ({fornecedores.length})
        </button>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table className="table-editable">
            <thead>
              {activeTab === 'clientes' ? (
                <tr>
                  <th>Cliente / Razão Social</th>
                  <th>Contato</th>
                  <th>Telefone / E-mail</th>
                  <th>Pagamento</th>
                  <th>Endereço</th>
                  <th style={{ textAlign: 'right' }}>Ações</th>
                </tr>
              ) : (
                <tr>
                  <th>Fornecedor / Empresa</th>
                  <th>Materiais</th>
                  <th>Prazo / Pagto</th>
                  <th>Contato / Telefone</th>
                  <th>Localização</th>
                  <th style={{ textAlign: 'right' }}>Ações</th>
                </tr>
              )}
            </thead>
            <tbody>
              {activeTab === 'clientes' ? (
                filteredClientes.map(c => (
                  <tr key={c.id}>
                    <td>
                      <div className="flex flex-col">
                        <InlineEdit value={c.nome} onSave={v => updateCliente(c.id, 'nome', v)} style={{ fontWeight: 600 }} />
                        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{c.cnpj || 'CNPJ não informado'}</span>
                      </div>
                    </td>
                    <td><InlineEdit value={c.contato || '-'} onSave={v => updateCliente(c.id, 'contato', v)} /></td>
                    <td>
                      <div className="flex flex-col" style={{ gap: 2 }}>
                        <InlineEdit value={c.telefone || '-'} onSave={v => updateCliente(c.id, 'telefone', formatPhone(v))} style={{ fontSize: 13 }} />
                        <InlineEdit value={c.email || '-'} onSave={v => updateCliente(c.id, 'email', v)} style={{ fontSize: 11, color: 'var(--text-muted)' }} />
                      </div>
                    </td>
                    <td>
                      <div className="badge badge-primary">
                        <DollarSign size={12} />
                        <InlineEdit value={c.pagamento || 'À Vista'} type="select" options={pagtoOptions} onSave={v => updateCliente(c.id, 'pagamento', v)} />
                      </div>
                    </td>
                    <td>
                      <div style={{ maxWidth: 200, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontSize: 12 }}>
                        <InlineEdit value={c.endereco || 'Adicionar endereço'} onSave={v => updateCliente(c.id, 'endereco', v)} />
                      </div>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button className="icon-btn" style={{ color: 'var(--danger)' }} onClick={() => { if(confirm('Excluir?')) deleteCliente(c.id); }}>
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                filteredFornecedores.map(f => (
                  <tr key={f.id}>
                    <td>
                      <div className="flex flex-col">
                        <InlineEdit value={f.nome} onSave={v => updateFornecedor(f.id, 'nome', v)} style={{ fontWeight: 600 }} />
                        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{f.cnpj || 'CNPJ não informado'}</span>
                      </div>
                    </td>
                    <td>
                      <div className="flex items-center gap-1" style={{ color: 'var(--primary)', fontWeight: 500 }}>
                        <Package size={14} />
                        <InlineEdit value={f.materiais || 'Não definido'} onSave={v => updateFornecedor(f.id, 'materiais', v)} />
                      </div>
                    </td>
                    <td>
                      <div className="flex flex-col" style={{ gap: 4 }}>
                        <div className="flex items-center gap-1" style={{ fontSize: 12 }}>
                          <Clock size={12} />
                          <InlineEdit value={f.prazo || 'Imediato'} type="select" options={prazoOptions} onSave={v => updateFornecedor(f.id, 'prazo', v)} />
                        </div>
                        <div className="flex items-center gap-1" style={{ fontSize: 12, color: 'var(--success)' }}>
                          <DollarSign size={12} />
                          <InlineEdit value={f.pagamento || 'Boleto 30 dias'} type="select" options={pagtoOptions} onSave={v => updateFornecedor(f.id, 'pagamento', v)} />
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="flex flex-col" style={{ gap: 2 }}>
                        <InlineEdit value={f.contato || '-'} onSave={v => updateFornecedor(f.id, 'contato', v)} style={{ fontWeight: 500 }} />
                        <InlineEdit value={f.telefone || '-'} onSave={v => updateFornecedor(f.id, 'telefone', formatPhone(v))} style={{ fontSize: 11 }} />
                      </div>
                    </td>
                    <td>
                      <div style={{ maxWidth: 180, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontSize: 11 }}>
                        <InlineEdit value={f.endereco || 'Adicionar endereço'} onSave={v => updateFornecedor(f.id, 'endereco', v)} />
                      </div>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button className="icon-btn" style={{ color: 'var(--danger)' }} onClick={() => { if(confirm('Excluir?')) deleteFornecedor(f.id); }}>
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
              {(activeTab === 'clientes' ? filteredClientes : filteredFornecedores).length === 0 && (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
                    Nenhum {activeTab === 'clientes' ? 'cliente' : 'fornecedor'} encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={`Novo ${modalType === 'cliente' ? 'Cliente' : 'Fornecedor'}`}>
        <form onSubmit={handleAddContact} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="flex gap-4 items-end">
            <div style={{ flex: 1 }}>
              <label className="text-secondary mb-1" style={{ display: 'block', fontSize: 13 }}>CNPJ</label>
              <div style={{ position: 'relative' }}>
                <input 
                  type="text" 
                  placeholder="00.000.000/0001-00" 
                  value={formData.cnpj} 
                  onChange={e => handleCnpjChange(e.target.value)}
                  style={{ width: '100%', padding: '10px 35px 10px 10px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', outline: 'none' }} 
                />
                {loadingCnpj && <Loader2 size={18} className="spin" style={{ position: 'absolute', right: 10, top: 12, color: 'var(--primary)' }} />}
              </div>
              {cnpjError && <p style={{ fontSize: 12, color: 'var(--danger)', marginTop: 4 }}>{cnpjError}</p>}
            </div>
            <div style={{ flex: 1 }}>
              <label className="text-secondary mb-1" style={{ display: 'block', fontSize: 13 }}>Condição de Pagamento</label>
              <select value={formData.pagamento} onChange={e => setFormData({...formData, pagamento: e.target.value})} 
                style={{ width: '100%', padding: 10, borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', outline: 'none' }}>
                {pagtoOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="text-secondary mb-1" style={{ display: 'block', fontSize: 13 }}>Nome / Razão Social</label>
            <input required type="text" value={formData.nome} onChange={e => setFormData({...formData, nome: e.target.value})} 
              style={{ width: '100%', padding: 10, borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', outline: 'none' }} />
          </div>

          <div className="flex gap-4">
            <div style={{ flex: 1 }}>
              <label className="text-secondary mb-1" style={{ display: 'block', fontSize: 13 }}>Contato Responsável</label>
              <input type="text" value={formData.contato} onChange={e => setFormData({...formData, contato: e.target.value})} 
                style={{ width: '100%', padding: 10, borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', outline: 'none' }} />
            </div>
            <div style={{ flex: 1 }}>
              <label className="text-secondary mb-1" style={{ display: 'block', fontSize: 13 }}>Telefone</label>
              <input type="text" value={formData.telefone} onChange={e => setFormData({...formData, telefone: formatPhone(e.target.value)})} 
                style={{ width: '100%', padding: 10, borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', outline: 'none' }} />
            </div>
          </div>

          <div>
            <label className="text-secondary mb-1" style={{ display: 'block', fontSize: 13 }}>E-mail</label>
            <input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} 
              style={{ width: '100%', padding: 10, borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', outline: 'none' }} />
          </div>

          <div>
            <label className="text-secondary mb-1" style={{ display: 'block', fontSize: 13 }}>Endereço Completo</label>
            <div style={{ position: 'relative' }}>
              <MapPin size={16} style={{ position: 'absolute', left: 10, top: 12, color: 'var(--text-muted)' }} />
              <input type="text" value={formData.endereco} onChange={e => setFormData({...formData, endereco: e.target.value})} 
                style={{ width: '100%', padding: '10px 10px 10px 35px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', outline: 'none' }} />
            </div>
          </div>

          {modalType === 'fornecedor' && (
            <div className="flex gap-4">
              <div style={{ flex: 1 }}>
                <label className="text-secondary mb-1" style={{ display: 'block', fontSize: 13 }}>Materiais</label>
                <input type="text" placeholder="Ex: Cimento, Areia..." value={formData.materiais} onChange={e => setFormData({...formData, materiais: e.target.value})} 
                  style={{ width: '100%', padding: 10, borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', outline: 'none' }} />
              </div>
              <div style={{ flex: 1 }}>
                <label className="text-secondary mb-1" style={{ display: 'block', fontSize: 13 }}>Prazo de Entrega</label>
                <select value={formData.prazo} onChange={e => setFormData({...formData, prazo: e.target.value})} 
                  style={{ width: '100%', padding: 10, borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', outline: 'none' }}>
                  {prazoOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              </div>
            </div>
          )}
          
          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: 8 }}>
            Cadastrar {modalType === 'cliente' ? 'Cliente' : 'Fornecedor'}
          </button>
        </form>
      </Modal>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .spin { animation: spin 1s linear infinite; }
        .badge { display: inline-flex; align-items: center; gap: 4px; padding: 4px 8px; borderRadius: 4px; font-size: 12px; font-weight: 500; }
        .badge-primary { background: var(--primary-light); color: var(--primary); }
      `}</style>
    </div>
  );
}
