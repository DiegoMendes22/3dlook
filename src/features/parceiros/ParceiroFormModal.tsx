import { useEffect, useState, type FormEvent } from 'react'
import type { Parceiro, ParceiroInput } from './types'
import { createParceiro, updateParceiro } from './api'

interface Props {
  /** Parceiro em edição; null = criação. */
  parceiro: Parceiro | null
  onClose: () => void
  onSaved: () => void
}

function parsePercent(v: string): number {
  const n = Number(v.replace(',', '.'))
  if (!Number.isFinite(n)) return 0
  return Math.min(100, Math.max(0, n))
}

export default function ParceiroFormModal({ parceiro, onClose, onSaved }: Props) {
  const editing = !!parceiro
  const [nome, setNome] = useState(parceiro?.nome ?? '')
  const [contato, setContato] = useState(parceiro?.contato ?? '')
  const [telefone, setTelefone] = useState(parceiro?.telefone ?? '')
  const [endereco, setEndereco] = useState(parceiro?.endereco ?? '')
  const [comissao, setComissao] = useState(
    parceiro?.comissao_percent != null ? String(parceiro.comissao_percent) : '',
  )
  const [ativo, setAtivo] = useState(parceiro?.ativo ?? true)

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fecha com ESC.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!nome.trim()) {
      setError('O nome é obrigatório.')
      return
    }
    setSaving(true)
    setError(null)
    try {
      const input: ParceiroInput = {
        nome: nome.trim(),
        contato: contato.trim() || null,
        telefone: telefone.trim() || null,
        endereco: endereco.trim() || null,
        comissao_percent: parsePercent(comissao),
        ativo,
      }
      if (editing) await updateParceiro(parceiro!.id, input)
      else await createParceiro(input)
      onSaved()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar o parceiro.')
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
        aria-label={editing ? 'Editar parceiro' : 'Novo parceiro'}
        onClick={(e) => e.stopPropagation()}
      >
        <header className="drawer-header">
          <h2>{editing ? 'Editar parceiro' : 'Novo parceiro'}</h2>
          <button
            type="button"
            className="icon-btn"
            onClick={onClose}
            aria-label="Fechar"
          >
            ✕
          </button>
        </header>

        <form className="drawer-body" onSubmit={handleSubmit}>
          <label className="field">
            <span className="field-label">Nome *</span>
            <input value={nome} onChange={(e) => setNome(e.target.value)} required />
          </label>

          <label className="field">
            <span className="field-label">Contato</span>
            <input
              value={contato}
              onChange={(e) => setContato(e.target.value)}
              placeholder="Pessoa responsável (opcional)"
            />
          </label>

          <label className="field">
            <span className="field-label">Telefone</span>
            <input
              value={telefone}
              onChange={(e) => setTelefone(e.target.value)}
              placeholder="(00) 00000-0000"
            />
          </label>

          <label className="field">
            <span className="field-label">Endereço</span>
            <textarea
              value={endereco}
              onChange={(e) => setEndereco(e.target.value)}
              rows={2}
            />
          </label>

          <label className="field">
            <span className="field-label">Comissão (%)</span>
            <input
              type="number"
              step="0.1"
              min="0"
              max="100"
              value={comissao}
              onChange={(e) => setComissao(e.target.value)}
              placeholder="0"
            />
          </label>

          <label className="switch-field">
            <input
              type="checkbox"
              checked={ativo}
              onChange={(e) => setAtivo(e.target.checked)}
            />
            <span>Parceiro ativo</span>
          </label>

          {error && <div className="form-error">{error}</div>}

          <div className="drawer-footer">
            <button type="button" className="btn-ghost" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? 'Salvando…' : editing ? 'Salvar' : 'Criar parceiro'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
