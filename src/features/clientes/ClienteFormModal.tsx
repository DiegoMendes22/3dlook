import { useEffect, useState, type FormEvent } from 'react'
import type { Cliente, ClienteInput } from './types'
import { createCliente, updateCliente } from './api'

interface Props {
  /** Cliente em edição; null = criação. */
  cliente: Cliente | null
  onClose: () => void
  onSaved: () => void
}

export default function ClienteFormModal({ cliente, onClose, onSaved }: Props) {
  const editing = !!cliente
  const [nome, setNome] = useState(cliente?.nome ?? '')
  const [cnpjCpf, setCnpjCpf] = useState(cliente?.cnpj_cpf ?? '')
  const [contato, setContato] = useState(cliente?.contato ?? '')
  const [telefone, setTelefone] = useState(cliente?.telefone ?? '')
  const [email, setEmail] = useState(cliente?.email ?? '')
  const [endereco, setEndereco] = useState(cliente?.endereco ?? '')
  const [ativo, setAtivo] = useState(cliente?.ativo ?? true)

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

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
      const input: ClienteInput = {
        nome: nome.trim(),
        cnpj_cpf: cnpjCpf.trim() || null,
        contato: contato.trim() || null,
        telefone: telefone.trim() || null,
        email: email.trim() || null,
        endereco: endereco.trim() || null,
        ativo,
      }
      if (editing) await updateCliente(cliente!.id, input)
      else await createCliente(input)
      onSaved()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar o cliente.')
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
        aria-label={editing ? 'Editar cliente' : 'Novo cliente'}
        onClick={(e) => e.stopPropagation()}
      >
        <header className="drawer-header">
          <h2>{editing ? 'Editar cliente' : 'Novo cliente'}</h2>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Fechar">
            ✕
          </button>
        </header>

        <form className="drawer-body" onSubmit={handleSubmit}>
          <label className="field">
            <span className="field-label">Nome *</span>
            <input value={nome} onChange={(e) => setNome(e.target.value)} required />
          </label>

          <label className="field">
            <span className="field-label">CNPJ / CPF</span>
            <input
              value={cnpjCpf}
              onChange={(e) => setCnpjCpf(e.target.value)}
              placeholder="Documento (opcional)"
            />
          </label>

          <label className="field">
            <span className="field-label">Contato</span>
            <input
              value={contato}
              onChange={(e) => setContato(e.target.value)}
              placeholder="Pessoa responsável (opcional)"
            />
          </label>

          <div className="field-row">
            <label className="field">
              <span className="field-label">Telefone</span>
              <input
                value={telefone}
                onChange={(e) => setTelefone(e.target.value)}
                placeholder="(00) 00000-0000"
              />
            </label>
            <label className="field">
              <span className="field-label">E-mail</span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="cliente@exemplo.com"
              />
            </label>
          </div>

          <label className="field">
            <span className="field-label">Endereço</span>
            <textarea
              value={endereco}
              onChange={(e) => setEndereco(e.target.value)}
              rows={2}
            />
          </label>

          <label className="switch-field">
            <input
              type="checkbox"
              checked={ativo}
              onChange={(e) => setAtivo(e.target.checked)}
            />
            <span>Cliente ativo</span>
          </label>

          {error && <div className="form-error">{error}</div>}

          <div className="drawer-footer">
            <button type="button" className="btn-ghost" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? 'Salvando…' : editing ? 'Salvar' : 'Criar cliente'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
