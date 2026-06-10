import { useEffect, useMemo, useState } from 'react'
import type { Cliente } from './types'
import { deleteCliente, listClientes } from './api'
import ClienteFormModal from './ClienteFormModal'

export default function ClientesPage() {
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [busca, setBusca] = useState('')

  const [modalOpen, setModalOpen] = useState(false)
  const [editando, setEditando] = useState<Cliente | null>(null)

  async function carregar() {
    setLoading(true)
    setError(null)
    try {
      setClientes(await listClientes())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar clientes.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    carregar()
  }, [])

  const filtrados = useMemo(() => {
    const q = busca.trim().toLowerCase()
    if (!q) return clientes
    return clientes.filter((c) => c.nome.toLowerCase().includes(q))
  }, [clientes, busca])

  function abrirNovo() {
    setEditando(null)
    setModalOpen(true)
  }

  function abrirEdicao(c: Cliente) {
    setEditando(c)
    setModalOpen(true)
  }

  async function excluir(c: Cliente) {
    if (!confirm(`Excluir o cliente "${c.nome}"?`)) return
    try {
      await deleteCliente(c.id)
      setClientes((atual) => atual.filter((x) => x.id !== c.id))
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erro ao excluir.')
    }
  }

  function aoSalvar() {
    setModalOpen(false)
    carregar()
  }

  return (
    <section className="page">
      <div className="page-head">
        <h1 className="page-title">Clientes</h1>
        <button type="button" className="btn-primary" onClick={abrirNovo}>
          + Novo cliente
        </button>
      </div>

      <input
        className="search-input"
        type="search"
        placeholder="Buscar por nome…"
        value={busca}
        onChange={(e) => setBusca(e.target.value)}
      />

      {loading && (
        <div className="list-state">
          <div className="spinner" />
        </div>
      )}

      {error && !loading && <div className="form-error">{error}</div>}

      {!loading && !error && filtrados.length === 0 && (
        <div className="empty-state">
          <p>{busca ? 'Nenhum cliente encontrado.' : 'Nenhum cliente ainda.'}</p>
          <span>
            {busca
              ? 'Tente outro termo de busca.'
              : 'Clique em “Novo cliente” para cadastrar o primeiro.'}
          </span>
        </div>
      )}

      {!loading && !error && filtrados.length > 0 && (
        <ul className="cliente-grid">
          {filtrados.map((c) => (
            <li key={c.id} className="cliente-card">
              <div className="cliente-info">
                <div className="cliente-top">
                  <h3 className="cliente-nome">{c.nome}</h3>
                  <span className={c.ativo ? 'badge badge--on' : 'badge badge--off'}>
                    {c.ativo ? 'Ativo' : 'Inativo'}
                  </span>
                </div>

                <div className="cliente-meta">
                  {c.cnpj_cpf && <span>{c.cnpj_cpf}</span>}
                  {c.contato && <span>{c.contato}</span>}
                  {c.telefone && <span>{c.telefone}</span>}
                  {c.email && <span>{c.email}</span>}
                  {c.endereco && <span>{c.endereco}</span>}
                </div>
              </div>

              <div className="cliente-actions">
                <button type="button" className="btn-ghost" onClick={() => abrirEdicao(c)}>
                  Editar
                </button>
                <button
                  type="button"
                  className="btn-ghost btn-danger-ghost"
                  onClick={() => excluir(c)}
                >
                  Excluir
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {modalOpen && (
        <ClienteFormModal
          cliente={editando}
          onClose={() => setModalOpen(false)}
          onSaved={aoSalvar}
        />
      )}
    </section>
  )
}
