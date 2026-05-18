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

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useAppContext();
  return isAuthenticated ? children : <Navigate to="/login" />;
};

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
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
      </Route>
    </Routes>
  )
}

export default App
