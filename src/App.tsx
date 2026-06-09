import { Navigate, Route, Routes } from 'react-router-dom'
import ProtectedRoute from './auth/ProtectedRoute'
import AppLayout from './components/AppLayout'
import Login from './pages/Login'
import Placeholder from './pages/Placeholder'
import ProdutosPage from './features/produtos/ProdutosPage'
import ParceirosPage from './features/parceiros/ParceirosPage'

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
          <Route
            path="/consignacoes"
            element={<Placeholder title="Consignações" />}
          />
          <Route path="/acertos" element={<Placeholder title="Acertos" />} />
          <Route path="/estoque" element={<Placeholder title="Estoque" />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
