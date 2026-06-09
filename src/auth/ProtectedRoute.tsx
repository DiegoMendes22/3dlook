import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from './AuthContext'

export default function ProtectedRoute() {
  const { session, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="centered-screen">
        <div className="spinner" aria-label="Carregando" />
      </div>
    )
  }

  if (!session) {
    // Sem sessão: redireciona para o login, lembrando de onde veio.
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  return <Outlet />
}
