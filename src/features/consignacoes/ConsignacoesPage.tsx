import { useCallback, useEffect, useState } from 'react'
import { listParceiros } from '../parceiros/api'
import type { Parceiro } from '../parceiros/types'
import {
  confirmarConsignacao,
  deleteConsignacao,
  listConsignacoes,
} from './api'
import type { Consignacao, ConsignacaoStatus } from './types'
import { STATUS_LABEL } from './types'
import NovaConsignacaoModal from './NovaConsignacaoModal'
import { brl, dataBR } from '../../lib/format'

const statusClass: Record<ConsignacaoStatus, string> = {
  rascunho: 'badge badge--rascunho',
  enviada: 'badge badge--enviada',
  encerrada: 'badge badge--encerrada',
}

const totalConsignacao = (c: Consignacao) =>
  c.itens.reduce((acc, i) => acc + i.quantidade_enviada * i.preco_unitario, 0)

export default function ConsignacoesPage() {
  const [consignacoes, setConsignacoes] = useState<Consignacao[]>([])
  const [parceiros, setParceiros] = useState<Parceiro[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [fParceiro, setFParceiro] = useState('')
  const [fStatus, setFStatus] = useState<ConsignacaoStatus | ''>('')

  const [modalOpen, setModalOpen] = useState(false)
  const [confirmando, setConfirmando] = useState<string | null>(null)

  const carregar = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setConsignacoes(
        await listConsignacoes({ parceiroId: fParceiro, status: fStatus }),
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar consignações.')
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

  async function confirmar(c: Consignacao) {
    if (!confirm(`Confirmar o envio da remessa para "${c.parceiro?.nome}"?`)) return
    setConfirmando(c.id)
    try {
      await confirmarConsignacao(c.id)
      await carregar()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erro ao confirmar o envio.')
    } finally {
      setConfirmando(null)
    }
  }

  async function excluir(c: Consignacao) {
    if (!confirm('Excluir esta consignação (rascunho)?')) return
    try {
      await deleteConsignacao(c.id)
      setConsignacoes((atual) => atual.filter((x) => x.id !== c.id))
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
        <h1 className="page-title">Consignações</h1>
        <button type="button" className="btn-primary" onClick={() => setModalOpen(true)}>
          + Nova consignação
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
          onChange={(e) => setFStatus(e.target.value as ConsignacaoStatus | '')}
        >
          <option value="">Todos os status</option>
          <option value="rascunho">Rascunho</option>
          <option value="enviada">Enviada</option>
          <option value="encerrada">Encerrada</option>
        </select>
      </div>

      {loading && (
        <div className="list-state">
          <div className="spinner" />
        </div>
      )}

      {error && !loading && <div className="form-error">{error}</div>}

      {!loading && !error && consignacoes.length === 0 && (
        <div className="empty-state">
          <p>Nenhuma consignação encontrada.</p>
          <span>
            {fParceiro || fStatus
              ? 'Ajuste os filtros ou crie uma nova remessa.'
              : 'Clique em “Nova consignação” para criar a primeira remessa.'}
          </span>
        </div>
      )}

      {!loading && !error && consignacoes.length > 0 && (
        <ul className="cons-list">
          {consignacoes.map((c) => (
            <li key={c.id} className="cons-card">
              <div className="cons-top">
                <div>
                  <h3 className="cons-parceiro">{c.parceiro?.nome ?? 'Parceiro'}</h3>
                  <span className="cons-data">Envio: {dataBR(c.data_envio)}</span>
                </div>
                <span className={statusClass[c.status]}>{STATUS_LABEL[c.status]}</span>
              </div>

              <ul className="cons-itens">
                {c.itens.map((i) => (
                  <li key={i.id}>
                    <span className="ci-nome">{i.produto?.nome ?? 'Produto'}</span>
                    <span className="ci-calc">
                      {i.quantidade_enviada} × {brl(i.preco_unitario)}
                    </span>
                  </li>
                ))}
                {c.itens.length === 0 && <li className="ci-vazio">Sem itens</li>}
              </ul>

              <div className="cons-foot">
                <span className="cons-total">
                  {c.itens.length} {c.itens.length === 1 ? 'item' : 'itens'} ·{' '}
                  <strong>{brl(totalConsignacao(c))}</strong>
                </span>

                {c.status === 'rascunho' && (
                  <div className="cons-actions">
                    <button
                      type="button"
                      className="btn-ghost btn-danger-ghost btn-sm"
                      onClick={() => excluir(c)}
                    >
                      Excluir
                    </button>
                    <button
                      type="button"
                      className="btn-primary btn-sm"
                      onClick={() => confirmar(c)}
                      disabled={confirmando === c.id}
                    >
                      {confirmando === c.id ? 'Confirmando…' : 'Confirmar envio'}
                    </button>
                  </div>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      {modalOpen && (
        <NovaConsignacaoModal onClose={() => setModalOpen(false)} onSaved={aoSalvar} />
      )}
    </section>
  )
}
