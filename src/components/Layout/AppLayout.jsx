import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, HardHat, FileText, Wallet, ShoppingCart, BarChart3, Users, Menu, Bell, Search, Settings, LogOut, Check, Calendar, FolderOpen, History, ClipboardList, Contact2, BookMarked, Microscope } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import logoImg from '../../assets/logo.jpeg';
import Modal from '../Modal';
import './Layout.css';

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
  { icon: HardHat, label: 'Obras', path: '/obras' },
  { icon: Wallet, label: 'Financeiro', path: '/financeiro' },
  { icon: Users, label: 'Equipe', path: '/funcionarios' },
  { icon: Contact2, label: 'Contatos', path: '/contatos' },
  { icon: ClipboardList, label: 'Orçamentos', path: '/orcamentos' },
  { icon: FileText, label: 'Proposta', path: '/proposta' },
  { icon: ShoppingCart, label: 'Compras', path: '/compras' },
  { icon: FileText, label: 'Catálogo', path: '/catalogo' },
  { icon: BarChart3, label: 'Relatórios', path: '/relatorios' },
  { icon: History, label: 'Histórico', path: '/historico' },
  { icon: BookMarked, label: 'PTCs', path: '/ptc', divider: true },
  { icon: Microscope, label: 'RVTs', path: '/rvt' },
];

export default function AppLayout() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => { setIsMobileMenuOpen(false); }, [location.pathname]);

  const { notificacoes, marcarComoLida, getNotificacoesNaoLidas, obras, funcionarios, historico, empresa, listaOrcamentos, propostas, clientes, fornecedores, user, logout } = useAppContext();
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  const filteredObras = obras.filter(o => o.nome.toLowerCase().includes(searchTerm.toLowerCase()));
  const filteredFunc = funcionarios.filter(f => f.nome.toLowerCase().includes(searchTerm.toLowerCase()));
  const filteredOrcamentos = listaOrcamentos.filter(o => o.nome.toLowerCase().includes(searchTerm.toLowerCase()));
  const filteredPropostas = propostas.filter(p => p.nome.toLowerCase().includes(searchTerm.toLowerCase()) || p.clienteNome.toLowerCase().includes(searchTerm.toLowerCase()));
  const filteredClientes = clientes.filter(c => c.nome.toLowerCase().includes(searchTerm.toLowerCase()));
  const filteredFornecedores = fornecedores.filter(f => f.nome.toLowerCase().includes(searchTerm.toLowerCase()));
  
  // Busca em gastos de todas as obras
  const filteredGastos = [];
  obras.forEach(o => {
    o.gastosDespesas.forEach(g => {
      if (g.descricao.toLowerCase().includes(searchTerm.toLowerCase())) {
        filteredGastos.push({ ...g, obraNome: o.nome, obraId: o.id });
      }
    });
  });

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="layout-container">
      {/* Sidebar */}
      <aside className={`sidebar desktop-only ${isMobileMenuOpen ? 'mobile-open' : ''}`}>
          <div className="logo" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '10px 0' }}>
            <img src={empresa.logo || logoImg} alt="Logo" style={{ maxHeight: 50, maxWidth: '100%', objectFit: 'contain' }} />
            {!empresa.logo && !logoImg && <span className="logo-text" style={{ marginLeft: 8 }}>{empresa.nomeFantasia}</span>}
          </div>
        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <React.Fragment key={item.path}>
              {item.divider && (
                <div style={{ height: 1, background: 'var(--border)', margin: '8px 12px', opacity: 0.5 }} />
              )}
              <NavLink to={item.path} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                <item.icon size={20} />
                <span>{item.label}</span>
              </NavLink>
            </React.Fragment>
          ))}
          {/* Link extra para Área do Usuário no final do menu */}
          <NavLink to="/perfil" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} style={{ marginTop: 'auto', borderTop: '1px solid var(--border)', paddingTop: 16 }}>
            <Settings size={20} />
            <span>Configurações</span>
          </NavLink>
        </nav>
      </aside>

      {/* Main */}
      <div className="main-content">
        <header className="topbar">
          <div className="topbar-left">
            <button className="mobile-menu-btn mobile-only" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
              <Menu size={24} />
            </button>
            <div className="search-bar desktop-only" onClick={() => setIsSearchOpen(true)}>
              <Search size={18} className="search-icon" />
              <input type="text" placeholder="Buscar obras, funcionários..." readOnly style={{ cursor: 'pointer' }} />
            </div>
          </div>
          <div className="topbar-right" style={{ position: 'relative' }}>
            {/* Change counter */}
            {historico.length > 0 && (
              <button className="icon-btn" onClick={() => navigate('/historico')} title="Histórico de alterações" style={{ position: 'relative' }}>
                <History size={18} />
                <span style={{ position: 'absolute', top: 4, right: 4, width: 16, height: 16, borderRadius: '50%', background: 'var(--primary)', color: 'white', fontSize: 9, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {historico.length > 99 ? '99' : historico.length}
                </span>
              </button>
            )}

            <button className="icon-btn" onClick={() => { setIsNotifOpen(!isNotifOpen); setIsProfileOpen(false); }}>
              <Bell size={20} />
              {getNotificacoesNaoLidas() > 0 && <span className="notification-dot"></span>}
            </button>
            <div className="user-profile" onClick={() => { setIsProfileOpen(!isProfileOpen); setIsNotifOpen(false); }}>
              <div className="avatar">{user?.name?.charAt(0) || 'A'}</div>
              <div className="user-info desktop-only">
                <span className="user-name">{user?.name || 'Administrador'}</span>
                <span style={{ fontSize: 10, color: 'var(--text-muted)', display: 'block' }}>{user?.role || 'Admin'}</span>
              </div>
            </div>

            {isNotifOpen && (
              <div className="card" style={{ position: 'absolute', top: 50, right: 60, width: 320, zIndex: 50, padding: 0 }}>
                <div style={{ padding: 16, borderBottom: '1px solid var(--border)', fontWeight: 600 }}>Notificações</div>
                <div style={{ maxHeight: 300, overflowY: 'auto' }}>
                  {notificacoes.length === 0 ? (
                    <p style={{ padding: 20, textAlign: 'center', color: 'var(--text-muted)' }}>Sem notificações.</p>
                  ) : notificacoes.map(n => (
                    <div key={n.id} style={{ padding: 16, borderBottom: '1px solid var(--border)', backgroundColor: n.lida ? 'transparent' : 'var(--primary-light)', opacity: n.lida ? 0.7 : 1 }}>
                      <div className="flex justify-between">
                        <p style={{ fontWeight: 600, fontSize: 13 }}>{n.titulo}</p>
                        {!n.lida && (
                          <button onClick={() => marcarComoLida(n.id)} className="icon-btn text-primary-color" style={{ width: 20, height: 20 }}>
                            <Check size={14} />
                          </button>
                        )}
                      </div>
                      <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>{n.descricao}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {isProfileOpen && (
              <div className="card" style={{ position: 'absolute', top: 50, right: 0, width: 200, zIndex: 50, padding: 8 }}>
                <button className="btn" style={{ width: '100%', justifyContent: 'flex-start', color: 'var(--text-secondary)' }} onClick={() => { navigate('/perfil'); setIsProfileOpen(false); }}>
                  <Settings size={16} /> Área do Usuário
                </button>
                <button className="btn" style={{ width: '100%', justifyContent: 'flex-start', color: 'var(--danger)', marginTop: 4 }} onClick={handleLogout}>
                  <LogOut size={16} /> Sair
                </button>
              </div>
            )}
          </div>
        </header>

        <main className="content-area">
          <Outlet />
        </main>
      </div>

      {/* Mobile Nav */}
      <nav className="mobile-bottom-nav mobile-only">
        {navItems.slice(0, 5).map((item) => (
          <NavLink key={item.path} to={item.path} className={({ isActive }) => `mobile-nav-item ${isActive ? 'active' : ''}`}>
            <item.icon size={20} />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Search Modal */}
      <Modal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} title="Pesquisar">
        <div style={{ position: 'relative', marginBottom: 20 }}>
          <Search size={18} style={{ position: 'absolute', left: 12, top: 12, color: 'var(--text-muted)' }} />
          <input type="text" autoFocus placeholder="Nome da obra, funcionário..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
            style={{ width: '100%', padding: '12px 12px 12px 40px', borderRadius: 'var(--radius-md)', border: '1px solid var(--primary)', outline: 'none' }} />
        </div>
        {searchTerm.length > 1 && (
          <div style={{ maxHeight: '60vh', overflowY: 'auto', paddingRight: 8 }}>
            {/* Obras */}
            {filteredObras.length > 0 && <h4 style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 8 }}>Obras</h4>}
            {filteredObras.map(o => (
              <div key={`ob-${o.id}`} className="card hover-effect mb-2" style={{ padding: 12, cursor: 'pointer' }} onClick={() => { setIsSearchOpen(false); navigate(`/obras/${o.id}`); }}>
                <p style={{ fontWeight: 600, fontSize: 14 }}>{o.nome}</p>
                <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{o.endereco}</p>
              </div>
            ))}

            {/* Funcionários */}
            {filteredFunc.length > 0 && <h4 style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 8, marginTop: 16 }}>Funcionários</h4>}
            {filteredFunc.map(f => (
              <div key={`fn-${f.id}`} className="card hover-effect mb-2" style={{ padding: 12, cursor: 'pointer' }} onClick={() => { setIsSearchOpen(false); navigate('/funcionarios'); }}>
                <p style={{ fontWeight: 600, fontSize: 14 }}>{f.nome}</p>
                <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{f.funcao}</p>
              </div>
            ))}

            {/* Orçamentos */}
            {filteredOrcamentos.length > 0 && <h4 style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 8, marginTop: 16 }}>Orçamentos</h4>}
            {filteredOrcamentos.map(o => (
              <div key={`orc-${o.id}`} className="card hover-effect mb-2" style={{ padding: 12, cursor: 'pointer' }} onClick={() => { setIsSearchOpen(false); navigate('/orcamentos'); }}>
                <p style={{ fontWeight: 600, fontSize: 14 }}>{o.nome}</p>
                <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{o.itens.length} itens cadastrados</p>
              </div>
            ))}

            {/* Propostas */}
            {filteredPropostas.length > 0 && <h4 style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 8, marginTop: 16 }}>Propostas</h4>}
            {filteredPropostas.map(p => (
              <div key={`prop-${p.id}`} className="card hover-effect mb-2" style={{ padding: 12, cursor: 'pointer' }} onClick={() => { setIsSearchOpen(false); navigate('/proposta'); }}>
                <p style={{ fontWeight: 600, fontSize: 14 }}>{p.nome}</p>
                <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Cliente: {p.clienteNome}</p>
              </div>
            ))}

            {/* Clientes e Fornecedores */}
            {(filteredClientes.length > 0 || filteredFornecedores.length > 0) && <h4 style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 8, marginTop: 16 }}>Contatos</h4>}
            {filteredClientes.map(c => (
              <div key={`cli-${c.id}`} className="card hover-effect mb-2" style={{ padding: 12, cursor: 'pointer' }} onClick={() => { setIsSearchOpen(false); navigate('/contatos'); }}>
                <p style={{ fontWeight: 600, fontSize: 14 }}>{c.nome} (Cliente)</p>
                <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{c.telefone}</p>
              </div>
            ))}
            {filteredFornecedores.map(f => (
              <div key={`forn-${f.id}`} className="card hover-effect mb-2" style={{ padding: 12, cursor: 'pointer' }} onClick={() => { setIsSearchOpen(false); navigate('/contatos'); }}>
                <p style={{ fontWeight: 600, fontSize: 14 }}>{f.nome} (Fornecedor)</p>
                <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{f.categoria}</p>
              </div>
            ))}

            {/* Gastos */}
            {filteredGastos.length > 0 && <h4 style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 8, marginTop: 16 }}>Gastos de Obras</h4>}
            {filteredGastos.map((g, idx) => (
              <div key={`gas-${idx}`} className="card hover-effect mb-2" style={{ padding: 12, cursor: 'pointer' }} onClick={() => { setIsSearchOpen(false); navigate(`/obras/${g.obraId}`); }}>
                <p style={{ fontWeight: 600, fontSize: 14 }}>{g.descricao}</p>
                <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Obra: {g.obraNome} · Valor: R$ {g.valor.toLocaleString('pt-BR')}</p>
              </div>
            ))}

            {filteredObras.length === 0 && filteredFunc.length === 0 && filteredOrcamentos.length === 0 && filteredPropostas.length === 0 && filteredClientes.length === 0 && filteredFornecedores.length === 0 && filteredGastos.length === 0 && (
              <p className="text-muted" style={{ textAlign: 'center', marginTop: 16 }}>Nenhum resultado encontrado para "{searchTerm}"</p>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
