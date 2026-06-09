import { useEffect, useMemo, useState } from 'react'
import type { Parceiro } from './types'
import { deleteParceiro, listParceiros } from './api'
import ParceiroFormModal from './ParceiroFormModal'

const pct = (n: number | null) =>
  `${(n ?? 0).toLocaleString('pt-BR', { maximumFractionDigits: 2 })}%`

export default function ParceirosPage() {
  const [parceiros, setParceiros] = useState<Parceiro[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [busca, setBusca] = useState('')

  const [modalOpen, setModalOpen] = useState(false)
  const [editando, setEditando] = useState<Parceiro | null>(null)

  async function carregar() {
    setLoading(true)
    setError(null)
    try {
      setParceiros(await listParceiros())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar parceiros.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    carregar()
  }, [])

  const filtrados = useMemo(() => {
    const q = busca.trim().toLowerCase()
    if (!q) return parceiros
    return parceiros.filter(
      (p) =>
        p.nome.toLowerCase().includes(q) ||
        (p.contato ?? '').toLowerCase().includes(q) ||
        (p.telefone ?? '').toLowerCase().includes(q),
    )
  }, [parceiros, busca])

  function abrirNovo() {
    setEditando(null)
    setModalOpen(true)
  }

  function abrirEdicao(p: Parceiro) {
    setEditando(p)
    setModalOpen(true)
  }

  async function excluir(p: Parceiro) {
    if (!confirm(`Excluir o parceiro "${p.nome}"?`)) return
    try {
      await deleteParceiro(p.id)
      setParceiros((atual) => atual.filter((x) => x.id !== p.id))
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
        <h1 className="page-title">Parceiros</h1>
        <button type="button" className="btn-primary" onClick={abrirNovo}>
          + Novo parceiro
        </button>
      </div>

      <input
        className="search-input"
        type="search"
        placeholder="Buscar por nome, contato ou telefone…"
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
          <p>{busca ? 'Nenhum parceiro encontrado.' : 'Nenhum parceiro ainda.'}</p>
          <span>
            {busca
              ? 'Tente outro termo de busca.'
              : 'Clique em “Novo parceiro” para cadastrar o primeiro.'}
          </span>
        </div>
      )}

      {!loading && !error && filtrados.length > 0 && (
        <ul className="parceiro-grid">
          {filtrados.map((p) => (
            <li key={p.id} className="parceiro-card">
              <div className="parceiro-info">
                <div className="parceiro-top">
                  <h3 className="parceiro-nome">{p.nome}</h3>
                  <span className={p.ativo ? 'badge badge--on' : 'badge badge--off'}>
                    {p.ativo ? 'Ativo' : 'Inativo'}
                  </span>
                </div>

                <div className="parceiro-meta">
                  {p.contato && <span>{p.contato}</span>}
                  {p.telefone && <span>{p.telefone}</span>}
                  {p.endereco && <span>{p.endereco}</span>}
                </div>

                <span className="parceiro-comissao">
                  Comissão <strong>{pct(p.comissao_percent)}</strong>
                </span>
              </div>

              <div className="parceiro-actions">
                <button type="button" className="btn-ghost" onClick={() => abrirEdicao(p)}>
                  Editar
                </button>
                <button
                  type="button"
                  className="btn-ghost btn-danger-ghost"
                  onClick={() => excluir(p)}
                >
                  Excluir
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {modalOpen && (
        <ParceiroFormModal
          parceiro={editando}
          onClose={() => setModalOpen(false)}
          onSaved={aoSalvar}
        />
      )}
    </section>
  )
}
