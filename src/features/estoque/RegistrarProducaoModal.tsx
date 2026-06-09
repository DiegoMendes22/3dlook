import { useEffect, useState, type FormEvent } from 'react'
import { listProdutos } from '../produtos/api'
import type { Produto } from '../produtos/types'
import { registrarProducao } from './api'

interface Props {
  onClose: () => void
  onSaved: () => void
}

export default function RegistrarProducaoModal({ onClose, onSaved }: Props) {
  const [produtos, setProdutos] = useState<Produto[]>([])
  const [produtoId, setProdutoId] = useState('')
  const [quantidade, setQuantidade] = useState('')

  const [carregando, setCarregando] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  useEffect(() => {
    listProdutos()
      .then((ps) => setProdutos(ps.filter((p) => p.ativo)))
      .catch((err) =>
        setError(err instanceof Error ? err.message : 'Erro ao carregar produtos.'),
      )
      .finally(() => setCarregando(false))
  }, [])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const qtd = Math.trunc(Number(quantidade))
    if (!produtoId) {
      setError('Selecione um produto.')
      return
    }
    if (!(qtd > 0)) {
      setError('Informe uma quantidade maior que zero.')
      return
    }
    setSaving(true)
    setError(null)
    try {
      await registrarProducao(produtoId, qtd)
      onSaved()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao registrar produção.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="drawer"
        role="dialog"
        aria-modal="true"
        aria-label="Registrar produção"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="drawer-header">
          <h2>Registrar produção</h2>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Fechar">
            ✕
          </button>
        </header>

        <form className="drawer-body" onSubmit={handleSubmit}>
          <p className="drawer-hint">
            A quantidade entra no estoque da <strong>Oficina</strong>.
          </p>

          <label className="field">
            <span className="field-label">Produto *</span>
            <select
              value={produtoId}
              onChange={(e) => setProdutoId(e.target.value)}
              disabled={carregando}
            >
              <option value="">Selecione…</option>
              {produtos.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nome}
                  {p.sku ? ` (${p.sku})` : ''}
                </option>
              ))}
            </select>
          </label>

          <label className="field">
            <span className="field-label">Quantidade produzida *</span>
            <input
              type="number"
              inputMode="numeric"
              min="1"
              step="1"
              value={quantidade}
              onChange={(e) => setQuantidade(e.target.value)}
              placeholder="0"
            />
          </label>

          {error && <div className="form-error">{error}</div>}

          <div className="drawer-footer">
            <button type="button" className="btn-ghost" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? 'Registrando…' : 'Registrar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
