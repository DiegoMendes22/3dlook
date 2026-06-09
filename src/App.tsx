import { Navigate, Route, Routes } from 'react-router-dom'
import ProtectedRoute from './auth/ProtectedRoute'
import AppLayout from './components/AppLayout'
import Login from './pages/Login'
import Placeholder from './pages/Placeholder'

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      {/* Rotas protegidas: sem sessão, ProtectedRoute redireciona ao login. */}
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route index element={<Navigate to="/produtos" replace />} />
          <Route path="/produtos" element={<Placeholder title="Produtos" />} />
          <Route path="/parceiros" element={<Placeholder title="Parceiros" />} />
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
