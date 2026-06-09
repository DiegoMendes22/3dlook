import { useCallback, useEffect, useState } from 'react'
import { listParceiros } from '../parceiros/api'
import type { Parceiro } from '../parceiros/types'
import { deleteAcerto, finalizarAcerto, listAcertos } from './api'
import type { Acerto, AcertoStatus } from './types'
import { ACERTO_STATUS_LABEL } from './types'
import NovoAcertoModal from './NovoAcertoModal'
import { brl, dataBR } from '../../lib/format'

const statusClass: Record<AcertoStatus, string> = {
  rascunho: 'badge badge--rascunho',
  finalizado: 'badge badge--enviada',
}

/** Bruto vendido somando os itens (usado para rascunhos, que ainda não têm valores). */
const brutoItens = (a: Acerto) =>
  a.itens.reduce((acc, i) => acc + i.quantidade_vendida * i.preco_unitario, 0)

export default function AcertosPage() {
  const [acertos, setAcertos] = useState<Acerto[]>([])
  const [parceiros, setParceiros] = useState<Parceiro[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [fParceiro, setFParceiro] = useState('')
  const [fStatus, setFStatus] = useState<AcertoStatus | ''>('')

  const [modalOpen, setModalOpen] = useState(false)
  const [finalizando, setFinalizando] = useState<string | null>(null)

  const carregar = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setAcertos(await listAcertos({ parceiroId: fParceiro, status: fStatus }))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar acertos.')
    } finally {
      setLoading(false)
    }
  }, [fParceiro, fStatus])

  useEffect(() => {
    carregar()
  }, [carregar])

  useEffect(() => {
    listParceiros()
      .then(setParceiros)
      .catch(() => {})
  }, [])

  async function finalizar(a: Acerto) {
    if (!confirm(`Finalizar o acerto de "${a.parceiro?.nome}"? Isso baixa o estoque.`)) return
    setFinalizando(a.id)
    try {
      await finalizarAcerto(a.id)
      await carregar()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erro ao finalizar o acerto.')
    } finally {
      setFinalizando(null)
    }
  }

  async function excluir(a: Acerto) {
    if (!confirm('Excluir este acerto (rascunho)?')) return
    try {
      await deleteAcerto(a.id)
      setAcertos((atual) => atual.filter((x) => x.id !== a.id))
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
        <h1 className="page-title">Acertos</h1>
        <button type="button" className="btn-primary" onClick={() => setModalOpen(true)}>
          + Novo acerto
        </button>
      </div>

      <div className="filtros">
        <select value={fParceiro} onChange={(e) => setFParceiro(e.target.value)}>
          <option value="">Todos os parceiros</option>
          {parceiros.map((p) => (
            <option key={p.id} value={p.id}>
              {p.nome}
            </option>
          ))}
        </select>
        <select
          value={fStatus}
          onChange={(e) => setFStatus(e.target.value as AcertoStatus | '')}
        >
          <option value="">Todos os status</option>
          <option value="rascunho">Rascunho</option>
          <option value="finalizado">Finalizado</option>
        </select>
      </div>

      {loading && (
        <div className="list-state">
          <div className="spinner" />
        </div>
      )}

      {error && !loading && <div className="form-error">{error}</div>}

      {!loading && !error && acertos.length === 0 && (
        <div className="empty-state">
          <p>Nenhum acerto encontrado.</p>
          <span>
            {fParceiro || fStatus
              ? 'Ajuste os filtros ou crie um novo acerto.'
              : 'Clique em “Novo acerto” para fechar uma consignação.'}
          </span>
        </div>
      )}

      {!loading && !error && acertos.length > 0 && (
        <ul className="cons-list">
          {acertos.map((a) => {
            const finalizado = a.status === 'finalizado'
            const bruto = finalizado ? a.valor_bruto ?? 0 : brutoItens(a)
            const pct = a.parceiro?.comissao_percent ?? 0
            const comissao = finalizado ? a.valor_comissao ?? 0 : (bruto * pct) / 100
            const repasse = finalizado ? a.valor_repasse ?? 0 : bruto - comissao

            return (
              <li key={a.id} className="cons-card">
                <div className="cons-top">
                  <div>
                    <h3 className="cons-parceiro">{a.parceiro?.nome ?? 'Parceiro'}</h3>
                    <span className="cons-data">{dataBR(a.data)}</span>
                  </div>
                  <span className={statusClass[a.status]}>
                    {ACERTO_STATUS_LABEL[a.status]}
                  </span>
                </div>

                <ul className="cons-itens">
                  {a.itens.map((i) => (
                    <li key={i.id}>
                      <span className="ci-nome">{i.produto?.nome ?? 'Produto'}</span>
                      <span className="ci-calc">
                        {i.quantidade_vendida} vend.
                        {i.quantidade_devolvida > 0 && ` · ${i.quantidade_devolvida} dev.`}
                      </span>
                    </li>
                  ))}
                  {a.itens.length === 0 && <li className="ci-vazio">Sem itens</li>}
                </ul>

                <div className="acerto-valores">
                  <span>
                    Vendido <strong>{brl(bruto)}</strong>
                  </span>
                  <span>
                    Comissão ({pct}%) <strong>{brl(comissao)}</strong>
                  </span>
                  <span className="acerto-repasse">
                    Repasse <strong>{brl(repasse)}</strong>
                  </span>
                </div>

                {!finalizado && (
                  <div className="cons-actions cons-actions--end">
                    <button
                      type="button"
                      className="btn-ghost btn-danger-ghost btn-sm"
                      onClick={() => excluir(a)}
                    >
                      Excluir
                    </button>
                    <button
                      type="button"
                      className="btn-primary btn-sm"
                      onClick={() => finalizar(a)}
                      disabled={finalizando === a.id}
                    >
                      {finalizando === a.id ? 'Finalizando…' : 'Finalizar acerto'}
                    </button>
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      )}

      {modalOpen && (
        <NovoAcertoModal onClose={() => setModalOpen(false)} onSaved={aoSalvar} />
      )}
    </section>
  )
}
