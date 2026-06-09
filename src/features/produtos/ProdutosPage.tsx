import { useEffect, useMemo, useState } from 'react'
import type { Produto } from './types'
import { deleteProduto, fotoPublicUrl, listProdutos } from './api'
import ProdutoFormModal from './ProdutoFormModal'

const brl = (n: number | null) =>
  (n ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

export default function ProdutosPage() {
  const [produtos, setProdutos] = useState<Produto[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [busca, setBusca] = useState('')

  const [modalOpen, setModalOpen] = useState(false)
  const [editando, setEditando] = useState<Produto | null>(null)

  async function carregar() {
    setLoading(true)
    setError(null)
    try {
      setProdutos(await listProdutos())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar produtos.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    carregar()
  }, [])

  const filtrados = useMemo(() => {
    const q = busca.trim().toLowerCase()
    if (!q) return produtos
    return produtos.filter(
      (p) =>
        p.nome.toLowerCase().includes(q) ||
        (p.sku ?? '').toLowerCase().includes(q),
    )
  }, [produtos, busca])

  function abrirNovo() {
    setEditando(null)
    setModalOpen(true)
  }

  function abrirEdicao(p: Produto) {
    setEditando(p)
    setModalOpen(true)
  }

  async function excluir(p: Produto) {
    if (!confirm(`Excluir o produto "${p.nome}"?`)) return
    try {
      await deleteProduto(p)
      setProdutos((atual) => atual.filter((x) => x.id !== p.id))
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
        <h1 className="page-title">Produtos</h1>
        <button type="button" className="btn-primary" onClick={abrirNovo}>
          + Novo produto
        </button>
      </div>

      <input
        className="search-input"
        type="search"
        placeholder="Buscar por nome ou SKU…"
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
          <p>{busca ? 'Nenhum produto encontrado.' : 'Nenhum produto ainda.'}</p>
          <span>
            {busca
              ? 'Tente outro termo de busca.'
              : 'Clique em “Novo produto” para cadastrar o primeiro.'}
          </span>
        </div>
      )}

      {!loading && !error && filtrados.length > 0 && (
        <ul className="produto-grid">
          {filtrados.map((p) => {
            const foto = fotoPublicUrl(p.foto_url)
            return (
              <li key={p.id} className="produto-card">
                <div className="produto-thumb">
                  {foto ? (
                    <img src={foto} alt={p.nome} loading="lazy" />
                  ) : (
                    <span className="thumb-placeholder">3D</span>
                  )}
                </div>

                <div className="produto-info">
                  <div className="produto-top">
                    <h3 className="produto-nome">{p.nome}</h3>
                    <span className={p.ativo ? 'badge badge--on' : 'badge badge--off'}>
                      {p.ativo ? 'Ativo' : 'Inativo'}
                    </span>
                  </div>
                  {p.sku && <span className="produto-sku">SKU: {p.sku}</span>}
                  <div className="produto-precos">
                    <span className="preco-venda">{brl(p.preco_venda)}</span>
                    <span className="preco-custo">custo {brl(p.custo_producao)}</span>
                  </div>
                </div>

                <div className="produto-actions">
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
            )
          })}
        </ul>
      )}

      {modalOpen && (
        <ProdutoFormModal
          produto={editando}
          onClose={() => setModalOpen(false)}
          onSaved={aoSalvar}
        />
      )}
    </section>
  )
}
