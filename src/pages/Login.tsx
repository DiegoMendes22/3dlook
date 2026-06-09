import { useState, type FormEvent } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import Logo from '../components/Logo'

interface LocationState {
  from?: { pathname: string }
}

export default function Login() {
  const { session, loading, signIn } = useAuth()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  // Já autenticado: manda direto pro app (ou pra rota de origem).
  if (!loading && session) {
    const to = (location.state as LocationState | null)?.from?.pathname ?? '/'
    return <Navigate to={to} replace />
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    const { error } = await signIn(email, password)
    setSubmitting(false)
    if (error) setError(error)
  }

  return (
    <div className="centered-screen">
      <form className="login-card" onSubmit={handleSubmit}>
        <Logo size={40} className="login-brand" />
        <p className="login-subtitle">Entre com seu e-mail e senha</p>

        <label className="field">
          <span className="field-label">E-mail</span>
          <input
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="voce@exemplo.com"
          />
        </label>

        <label className="field">
          <span className="field-label">Senha</span>
          <input
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
          />
        </label>

        {error && <div className="form-error">{error}</div>}

        <button type="submit" className="btn-primary" disabled={submitting}>
          {submitting ? 'Entrando…' : 'Entrar'}
        </button>
      </form>
    </div>
  )
}
