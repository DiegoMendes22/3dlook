import { useEffect, useMemo, useState } from 'react'
import {
  aprovarOrcamentoEmPedido,
  deleteOrcamento,
  listOrcamentos,
  updateStatusOrcamento,
} from './api'
import type { Orcamento, OrcamentoStatus } from './types'
import { STATUS_LABEL } from './types'
import { listClientes } from '../clientes/api'
import type { Cliente } from '../clientes/types'
import OrcamentoFormModal from './OrcamentoFormModal'
import OrcamentoDocModal from './OrcamentoDocModal'
import { brl, dataBR, hojeISO } from '../../lib/format'

const statusClass: Record<OrcamentoStatus, string> = {
  rascunho: 'badge badge--rascunho',
  enviado: 'badge badge--enviada',
  aprovado: 'badge badge--aprovado',
  recusado: 'badge badge--recusado',
  expirado: 'badge badge--expirado',
}

export default function OrcamentosPage() {
  const [orcamentos, setOrcamentos] = useState<Orcamento[]>([])
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [fCliente, setFCliente] = useState('')

  const [modalOpen, setModalOpen] = useState(false)
  const [editando, setEditando] = useState<Orcamento | null>(null)
  const [detalhe, setDetalhe] = useState<Orcamento | null>(null)
  const [mutando, setMutando] = useState<string | null>(null)

  const hoje = hojeISO()

  async function carregar() {
    setLoading(true)
    setError(null)
    try {
      setOrcamentos(await listOrcamentos())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar orçamentos.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    carregar()
    listClientes()
      .then(setClientes)
      .catch(() => {})
  }, [])

  // Status "efetivo": enviado + validade vencida = expirado (apenas visual).
  function efetivo(o: Orcamento): OrcamentoStatus {
    if (o.status === 'enviado' && o.validade && o.validade < hoje) return 'expirado'
    return o.status
  }

  // Sem cliente: só rascunhos. Com cliente: todos os status daquele cliente.
  const filtrados = useMemo(() => {
    if (fCliente) return orcamentos.filter((o) => o.cliente_id === fCliente)
    return orcamentos.filter((o) => o.status === 'rascunho')
  }, [orcamentos, fCliente])

  async function mudarStatus(o: Orcamento, status: OrcamentoStatus, confirmar?: string) {
    if (confirmar && !confirm(confirmar)) return
    setMutando(o.id)
    try {
      await updateStatusOrcamento(o.id, status)
      await carregar()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erro ao atualizar o status.')
    } finally {
      setMutando(null)
    }
  }

  async function aprovarEGerarPedido(o: Orcamento) {
    if (!confirm('Aprovar o orçamento e gerar um pedido a partir dele?')) return
    setMutando(o.id)
    try {
      await aprovarOrcamentoEmPedido(o.id)
      await carregar()
      alert('Orçamento aprovado. Um pedido (rascunho) foi gerado na tela de Pedidos.')
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erro ao aprovar o orçamento.')
    } finally {
      setMutando(null)
    }
  }

  async function excluir(o: Orcamento) {
    if (!confirm('Excluir este orçamento (rascunho)?')) return
    try {
      await deleteOrcamento(o.id)
      setOrcamentos((atual) => atual.filter((x) => x.id !== o.id))
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
        <h1 className="page-title">Orçamentos</h1>
        <button type="button" className="btn-primary" onClick={() => setModalOpen(true)}>
          + Novo orçamento
        </button>
      </div>

      <div className="filtros">
        <select value={fCliente} onChange={(e) => setFCliente(e.target.value)}>
          <option value="">Rascunhos (todos os clientes)</option>
          {clientes.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nome}
            </option>
          ))}
        </select>
      </div>

      {loading && (
        <div className="list-state">
          <div className="spinner" />
        </div>
      )}

      {error && !loading && <div className="form-error">{error}</div>}

      {!loading && !error && filtrados.length === 0 && (
        <div className="empty-state">
          <p>Nenhum orçamento encontrado.</p>
          <span>
            {fCliente
              ? 'Este cliente ainda não tem orçamentos.'
              : 'Nenhum rascunho. Selecione um cliente para ver os demais status.'}
          </span>
        </div>
      )}

      {!loading && !error && filtrados.length > 0 && (
        <ul className="cons-list">
          {filtrados.map((o) => {
            const ef = efetivo(o)
            return (
              <li
                key={o.id}
                className="cons-card cons-card--click"
                onClick={() => setDetalhe(o)}
                title="Ver / gerar PDF"
              >
                <div className="cons-top">
                  <div>
                    <h3 className="cons-parceiro">
                      {o.numero ?? 'Orçamento'}
                      <span className="orc-cliente"> · {o.cliente?.nome ?? 'Cliente'}</span>
                    </h3>
                    <span className="cons-data">
                      Emissão {dataBR(o.data_emissao)}
                      {o.validade && <> · validade {dataBR(o.validade)}</>}
                    </span>
                  </div>
                  <span className={statusClass[ef]}>{STATUS_LABEL[ef]}</span>
                </div>

                <ul className="cons-itens">
                  {o.itens.map((i) => (
                    <li key={i.id}>
                      <span className="ci-nome">{i.produto?.nome ?? 'Produto'}</span>
                      <span className="ci-calc">
                        {i.quantidade} × {brl(i.preco_unitario)}
                      </span>
                    </li>
                  ))}
                  {o.itens.length === 0 && <li className="ci-vazio">Sem itens</li>}
                </ul>

                {o.condicoes && <p className="orc-condicoes">{o.condicoes}</p>}

                <div className="cons-foot">
                  <span className="cons-total">
                    Total <strong>{brl(o.total)}</strong>
                  </span>

                  <div className="cons-actions">
                    {(o.status === 'rascunho' || o.status === 'enviado') && (
                      <button
                        type="button"
                        className="btn-ghost btn-sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          setEditando(o)
                        }}
                      >
                        Editar
                      </button>
                    )}
                    {o.status === 'rascunho' && (
                      <>
                        <button
                          type="button"
                          className="btn-ghost btn-danger-ghost btn-sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            excluir(o)
                          }}
                        >
                          Excluir
                        </button>
                        <button
                          type="button"
                          className="btn-primary btn-sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            mudarStatus(o, 'enviado')
                          }}
                          disabled={mutando === o.id}
                        >
                          Marcar enviado
                        </button>
                      </>
                    )}
                    {o.status === 'enviado' && (
                      <>
                        <button
                          type="button"
                          className="btn-ghost btn-danger-ghost btn-sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            mudarStatus(o, 'recusado', 'Marcar este orçamento como recusado?')
                          }}
                          disabled={mutando === o.id}
                        >
                          Recusar
                        </button>
                        <button
                          type="button"
                          className="btn-primary btn-sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            aprovarEGerarPedido(o)
                          }}
                          disabled={mutando === o.id}
                        >
                          Aprovar e gerar pedido
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </li>
            )
          })}
        </ul>
      )}

      {modalOpen && (
        <OrcamentoFormModal onClose={() => setModalOpen(false)} onSaved={aoSalvar} />
      )}

      {editando && (
        <OrcamentoFormModal
          orcamento={editando}
          onClose={() => setEditando(null)}
          onSaved={() => {
            setEditando(null)
            carregar()
          }}
        />
      )}

      {detalhe && (
        <OrcamentoDocModal orcamento={detalhe} onClose={() => setDetalhe(null)} />
      )}
    </section>
  )
}
