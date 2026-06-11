import { Navigate, Route, Routes } from 'react-router-dom'
import ProtectedRoute from './auth/ProtectedRoute'
import AppLayout from './components/AppLayout'
import Login from './pages/Login'
import ProdutosPage from './features/produtos/ProdutosPage'
import ParceirosPage from './features/parceiros/ParceirosPage'
import ClientesPage from './features/clientes/ClientesPage'
import OrcamentosPage from './features/orcamentos/OrcamentosPage'
import PedidosPage from './features/pedidos/PedidosPage'
import ContasReceberPage from './features/pedidos/ContasReceberPage'
import ConsignacoesPage from './features/consignacoes/ConsignacoesPage'
import AcertosPage from './features/acertos/AcertosPage'
import EstoquePage from './features/estoque/EstoquePage'
import EmpresaPage from './features/empresa/EmpresaPage'

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      {/* Rotas protegidas: sem sessão, ProtectedRoute redireciona ao login. */}
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route index element={<Navigate to="/produtos" replace />} />
          <Route path="/produtos" element={<ProdutosPage />} />
          <Route path="/parceiros" element={<ParceirosPage />} />
          <Route path="/clientes" element={<ClientesPage />} />
          <Route path="/orcamentos" element={<OrcamentosPage />} />
          <Route path="/pedidos" element={<PedidosPage />} />
          <Route path="/contas-receber" element={<ContasReceberPage />} />
          <Route path="/consignacoes" element={<ConsignacoesPage />} />
          <Route path="/acertos" element={<AcertosPage />} />
          <Route path="/estoque" element={<EstoquePage />} />
          <Route path="/empresa" element={<EmpresaPage />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
