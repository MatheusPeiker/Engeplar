import { Routes, Route, Navigate } from 'react-router-dom'
import AppLayout from './components/Layout/AppLayout'
import { useAppContext } from './context/AppContext'

import Dashboard from './pages/Dashboard'
import Obras from './pages/Obras'
import ObraDetalhes from './pages/ObraDetalhes'
import Financeiro from './pages/Financeiro'
import Orcamentos from './pages/Orcamentos'
import Compras from './pages/Compras'
import Relatorios from './pages/Relatorios'
import Funcionarios from './pages/Funcionarios'
import TabelaPrecos from './pages/TabelaPrecos'
import Proposta from './pages/Proposta'
import Cronograma from './pages/Cronograma'
import Arquivos from './pages/Arquivos'
import Historico from './pages/Historico'
import Login from './pages/Login'
import Perfil from './pages/Perfil'
import Contatos from './pages/Contatos'
import DocumentosPTC from './pages/DocumentosPTC'
import DocumentosRVT from './pages/DocumentosRVT'
import RedefinirSenha from './pages/RedefinirSenha'

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, authLoading } = useAppContext();
  if (authLoading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0F172A' }}>
      <div style={{ color: '#60A5FA', fontSize: 14 }}>Carregando...</div>
    </div>
  );
  return isAuthenticated ? children : <Navigate to="/login" />;
};

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/redefinir-senha" element={<RedefinirSenha />} />
      <Route path="/" element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
        <Route index element={<Dashboard />} />
        <Route path="obras" element={<Obras />} />
        <Route path="obras/:id" element={<ObraDetalhes />} />
        <Route path="financeiro" element={<Financeiro />} />
        <Route path="funcionarios" element={<Funcionarios />} />
        <Route path="orcamentos" element={<Orcamentos />} />
        <Route path="proposta" element={<Proposta />} />
        <Route path="cronograma" element={<Cronograma />} />
        <Route path="arquivos" element={<Arquivos />} />
        <Route path="compras" element={<Compras />} />
        <Route path="relatorios" element={<Relatorios />} />
        <Route path="catalogo" element={<TabelaPrecos />} />
        <Route path="historico" element={<Historico />} />
        <Route path="perfil" element={<Perfil />} />
        <Route path="contatos" element={<Contatos />} />
        <Route path="ptc" element={<DocumentosPTC />} />
        <Route path="rvt" element={<DocumentosRVT />} />
      </Route>
    </Routes>
  )
}

export default App
