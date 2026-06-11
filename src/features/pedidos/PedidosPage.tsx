import { useEffect, useMemo, useState } from 'react'
import { listPedidos } from './api'
import type { Pedido, PedidoStatus } from './types'
import { STATUS_LABEL } from './types'
import PedidoDetailModal from './PedidoDetailModal'
import { brl, dataBR } from '../../lib/format'

const statusClass: Record<PedidoStatus, string> = {
  rascunho: 'badge badge--rascunho',
  confirmado: 'badge badge--enviada',
  entregue: 'badge badge--aprovado',
  cancelado: 'badge badge--off',
}

export default function PedidosPage() {
  const [pedidos, setPedidos] = useState<Pedido[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [fStatus, setFStatus] = useState<PedidoStatus | ''>('')
  const [detalhe, setDetalhe] = useState<Pedido | null>(null)

  async function carregar() {
    setLoading(true)
    setError(null)
    try {
      setPedidos(await listPedidos())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar pedidos.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    carregar()
  }, [])

  const filtrados = useMemo(
    () => (fStatus ? pedidos.filter((p) => p.status === fStatus) : pedidos),
    [pedidos, fStatus],
  )

  return (
    <section className="page">
      <div className="page-head">
        <h1 className="page-title">Pedidos</h1>
      </div>

      <div className="filtros">
        <select
          value={fStatus}
          onChange={(e) => setFStatus(e.target.value as PedidoStatus | '')}
        >
          <option value="">Todos os status</option>
          <option value="rascunho">Rascunho</option>
          <option value="confirmado">Confirmado</option>
          <option value="entregue">Entregue</option>
          <option value="cancelado">Cancelado</option>
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
          <p>Nenhum pedido encontrado.</p>
          <span>
            Pedidos são gerados ao aprovar um orçamento na tela de Orçamentos.
          </span>
        </div>
      )}

      {!loading && !error && filtrados.length > 0 && (
        <ul className="cons-list">
          {filtrados.map((p) => (
            <li
              key={p.id}
              className="cons-card cons-card--click"
              onClick={() => setDetalhe(p)}
              title="Ver detalhe / financeiro"
            >
              <div className="cons-top">
                <div>
                  <h3 className="cons-parceiro">
                    {p.numero ?? 'Pedido'}
                    <span className="orc-cliente"> · {p.cliente?.nome ?? 'Cliente'}</span>
                  </h3>
                  <span className="cons-data">{dataBR(p.data)}</span>
                </div>
                <span className={statusClass[p.status]}>{STATUS_LABEL[p.status]}</span>
              </div>

              <div className="cons-foot">
                {p.financeiro ? (
                  <span className="cons-total">
                    Total <strong>{brl(p.financeiro.valor_total)}</strong>
                    {p.financeiro.saldo_devedor > 0 && (
                      <span className="ped-saldo"> · saldo {brl(p.financeiro.saldo_devedor)}</span>
                    )}
                  </span>
                ) : (
                  <span className="cons-total ped-rascunho-hint">Rascunho — a confirmar</span>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      {detalhe && (
        <PedidoDetailModal
          pedido={detalhe}
          onClose={() => setDetalhe(null)}
          onChange={carregar}
        />
      )}
    </section>
  )
}
