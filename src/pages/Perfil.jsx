import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { Building2, Users, Mail, Phone, MapPin, Globe, Contact2, Search } from 'lucide-react';
import InlineEdit from '../components/InlineEdit';
import Funcionarios from './Funcionarios';
import logoImg from '../assets/logo.jpeg';

export default function Perfil() {
  const [activeTab, setActiveTab] = useState('empresa');
  const [cnpjInput, setCnpjInput] = useState('');
  const [isLoadingCnpj, setIsLoadingCnpj] = useState(false);
  const { empresa, updateEmpresa } = useAppContext();

  const handleCnpjSearch = async () => {
    const clean = (cnpjInput || empresa.cnpj || '').replace(/\D/g, '');
    if (clean.length !== 14) { alert('CNPJ inválido. Deve ter 14 dígitos.'); return; }
    setIsLoadingCnpj(true);
    try {
      const response = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${clean}`);
      if (!response.ok) throw new Error('CNPJ não encontrado');
      const data = await response.json();
      const endereco = [
        data.logradouro, data.numero,
        data.complemento ? data.complemento : null,
        data.bairro, `${data.municipio}/${data.uf}`
      ].filter(Boolean).join(', ');
      await Promise.all([
        updateEmpresa('cnpj', cnpjInput || empresa.cnpj),
        updateEmpresa('razaoSocial', data.razao_social),
        updateEmpresa('nomeFantasia', data.nome_fantasia || data.razao_social),
        updateEmpresa('endereco', endereco),
        data.ddd_telefone_1 && updateEmpresa('telefone', data.ddd_telefone_1.trim()),
        data.email && updateEmpresa('email', data.email.toLowerCase()),
      ].filter(Boolean));
    } catch (err) {
      alert('Erro ao buscar CNPJ: ' + err.message);
    } finally {
      setIsLoadingCnpj(false);
    }
  };
  
  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Configurações do Sistema</h1>
          <p className="page-subtitle">Gerencie os dados da sua empresa e equipe</p>
        </div>
      </div>

      <div className="tabs-container">
        <button className={`tab-btn ${activeTab === 'empresa' ? 'active' : ''}`} onClick={() => setActiveTab('empresa')}>
          <Building2 size={18} /> Empresa
        </button>
        <button className={`tab-btn ${activeTab === 'equipe' ? 'active' : ''}`} onClick={() => setActiveTab('equipe')}>
          <Users size={18} /> Equipe
        </button>
      </div>

      {activeTab === 'empresa' && (
        <div className="grid-2" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: 24 }}>
          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 30, paddingBottom: 20, borderBottom: '1px solid var(--border)' }}>
              <div style={{ width: 100, height: 100, borderRadius: 12, border: '2px dashed var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', background: 'var(--background)' }}>
                <img src={empresa.logo || logoImg} alt="Logo" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
              </div>
              <div>
                <h3 style={{ fontSize: 18, fontWeight: 700 }}>Logo da Empresa</h3>
                <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 8 }}>Caminho da imagem (ex: /logo.png)</p>
                <InlineEdit value={empresa.logo || '/logo.png'} onSave={(v) => updateEmpresa('logo', v)} />
                <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 8 }}>Dica: Coloque o arquivo na pasta <b>public</b> do projeto.</p>
              </div>
            </div>

            <h3 className="mb-6 flex items-center gap-2" style={{ fontSize: 18 }}>
              <Building2 size={20} color="var(--primary)" /> Dados Institucionais
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <DataRow label="Razão Social" value={empresa.razaoSocial} onSave={(v) => updateEmpresa('razaoSocial', v)} />
              <DataRow label="Nome Fantasia" value={empresa.nomeFantasia} onSave={(v) => updateEmpresa('nomeFantasia', v)} />
              <div style={{ display: 'flex', gap: 24 }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: 12, color: 'var(--text-muted)', marginBottom: 4, fontWeight: 500, textTransform: 'uppercase' }}>CNPJ</label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input
                      type="text"
                      placeholder="00.000.000/0001-00"
                      defaultValue={empresa.cnpj}
                      onChange={e => setCnpjInput(e.target.value)}
                      onBlur={e => updateEmpresa('cnpj', e.target.value)}
                      style={{ flex: 1, padding: '6px 10px', borderRadius: 6, border: '1px solid var(--border)', fontSize: 14, outline: 'none', background: 'var(--input-bg, #fff)', color: 'var(--text-primary)' }}
                    />
                    <button className="btn btn-primary btn-sm" onClick={handleCnpjSearch} disabled={isLoadingCnpj} title="Buscar dados pelo CNPJ">
                      {isLoadingCnpj ? '...' : <Search size={14} />}
                    </button>
                  </div>
                </div>
                <div style={{ flex: 1 }}>
                  <DataRow label="Insc. Estadual" value={empresa.inscricaoEstadual} onSave={(v) => updateEmpresa('inscricaoEstadual', v)} />
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <h3 className="mb-6 flex items-center gap-2" style={{ fontSize: 18 }}>
              <Contact2 size={20} color="var(--primary)" /> Contato e Localização
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <DataRow icon={<MapPin size={16} />} label="Endereço" value={empresa.endereco} onSave={(v) => updateEmpresa('endereco', v)} />
              <div style={{ display: 'flex', gap: 24 }}>
                <div style={{ flex: 1 }}>
                  <DataRow icon={<Phone size={16} />} label="Telefone" value={empresa.telefone} onSave={(v) => updateEmpresa('telefone', v)} />
                </div>
                <div style={{ flex: 1 }}>
                  <DataRow icon={<Mail size={16} />} label="E-mail" value={empresa.email} onSave={(v) => updateEmpresa('email', v)} />
                </div>
              </div>
              <DataRow icon={<Globe size={16} />} label="Website" value={empresa.site} onSave={(v) => updateEmpresa('site', v)} />
            </div>
          </div>
        </div>
      )}

      {activeTab === 'equipe' && (
        <Funcionarios />
      )}
    </div>
  );
}

function DataRow({ label, value, onSave, icon }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: 12, color: 'var(--text-muted)', marginBottom: 4, fontWeight: 500, textTransform: 'uppercase' }}>
        {label}
      </label>
      <div className="flex items-center gap-2">
        {icon && <span style={{ color: 'var(--text-muted)' }}>{icon}</span>}
        <InlineEdit value={value} onSave={onSave} style={{ fontSize: 15, fontWeight: 500 }} />
      </div>
    </div>
  );
}
