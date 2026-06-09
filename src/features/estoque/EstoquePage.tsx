import { useEffect, useMemo, useState } from 'react'
import { listEstoque } from './api'
import type { EstoqueRow, GrupoEstoque } from './types'
import RegistrarProducaoModal from './RegistrarProducaoModal'

export default function EstoquePage() {
  const [rows, setRows] = useState<EstoqueRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [busca, setBusca] = useState('')
  const [modalOpen, setModalOpen] = useState(false)

  async function carregar() {
    setLoading(true)
    setError(null)
    try {
      setRows(await listEstoque())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar o estoque.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    carregar()
  }, [])

  const grupos = useMemo<GrupoEstoque[]>(() => {
    const q = busca.trim().toLowerCase()
    const filtradas = q
      ? rows.filter((r) => r.produto.toLowerCase().includes(q))
      : rows

    const map = new Map<string, GrupoEstoque>()
    for (const r of filtradas) {
      const chave = r.parceiro_id ?? 'oficina'
      if (!map.has(chave)) {
        map.set(chave, {
          chave,
          local: r.local,
          isOficina: r.parceiro_id == null,
          itens: [],
          total: 0,
        })
      }
      const g = map.get(chave)!
      g.itens.push(r)
      g.total += r.saldo
    }

    const arr = [...map.values()]
    // Oficina primeiro; depois pontos em ordem alfabética.
    arr.sort((a, b) => {
      if (a.isOficina) return -1
      if (b.isOficina) return 1
      return a.local.localeCompare(b.local)
    })
    arr.forEach((g) => g.itens.sort((a, b) => a.produto.localeCompare(b.produto)))
    return arr
  }, [rows, busca])

  function aoSalvar() {
    setModalOpen(false)
    carregar()
  }

  return (
    <section className="page">
      <div className="page-head">
        <h1 className="page-title">Estoque</h1>
        <button type="button" className="btn-primary" onClick={() => setModalOpen(true)}>
          + Registrar produção
        </button>
      </div>

      <input
        className="search-input"
        type="search"
        placeholder="Buscar produto…"
        value={busca}
        onChange={(e) => setBusca(e.target.value)}
      />

      {loading && (
        <div className="list-state">
          <div className="spinner" />
        </div>
      )}

      {error && !loading && <div className="form-error">{error}</div>}

      {!loading && !error && grupos.length === 0 && (
        <div className="empty-state">
          <p>{busca ? 'Nenhum produto encontrado.' : 'Estoque vazio.'}</p>
          <span>
            {busca
              ? 'Tente outro termo de busca.'
              : 'Registre uma produção para abastecer a Oficina.'}
          </span>
        </div>
      )}

      {!loading && !error &&
        grupos.map((g) => (
          <div key={g.chave} className="estoque-grupo">
            <div className="estoque-grupo-head">
              <span className={g.isOficina ? 'estoque-local estoque-local--oficina' : 'estoque-local'}>
                {g.isOficina ? '🏭 Oficina' : g.local}
              </span>
              <span className="estoque-local-total">
                {g.total} {Math.abs(g.total) === 1 ? 'unidade' : 'unidades'}
              </span>
            </div>

            <ul className="estoque-itens">
              {g.itens.map((it) => (
                <li key={it.produto_id} className="estoque-item">
                  <span className="estoque-produto">{it.produto}</span>
                  <span
                    className={
                      it.saldo < 0 ? 'estoque-saldo estoque-saldo--neg' : 'estoque-saldo'
                    }
                  >
                    {it.saldo}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ))}

      {modalOpen && (
        <RegistrarProducaoModal onClose={() => setModalOpen(false)} onSaved={aoSalvar} />
      )}
    </section>
  )
}
