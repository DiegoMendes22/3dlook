import { useEffect, useMemo, useState } from 'react'
import { listContasReceber } from './api'
import type { ContaReceber } from './types'
import { SITUACAO_LABEL } from './types'
import { brl, dataBR } from '../../lib/format'

interface GrupoCliente {
  cliente_id: string
  cliente: string
  total: number
  contas: ContaReceber[]
}

export default function ContasReceberPage() {
  const [contas, setContas] = useState<ContaReceber[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    listContasReceber()
      .then(setContas)
      .catch((err) =>
        setError(err instanceof Error ? err.message : 'Erro ao carregar contas a receber.'),
      )
      .finally(() => setLoading(false))
  }, [])

  const { grupos, totalGeral } = useMemo(() => {
    const map = new Map<string, GrupoCliente>()
    for (const c of contas) {
      if (!map.has(c.cliente_id)) {
        map.set(c.cliente_id, {
          cliente_id: c.cliente_id,
          cliente: c.cliente,
          total: 0,
          contas: [],
        })
      }
      const g = map.get(c.cliente_id)!
      g.contas.push(c)
      g.total += Number(c.saldo_devedor)
    }
    const grupos = [...map.values()].sort((a, b) => b.total - a.total)
    const totalGeral = grupos.reduce((acc, g) => acc + g.total, 0)
    return { grupos, totalGeral }
  }, [contas])

  return (
    <section className="page">
      <div className="page-head">
        <h1 className="page-title">Contas a receber</h1>
      </div>

      {loading && (
        <div className="list-state">
          <div className="spinner" />
        </div>
      )}

      {error && !loading && <div className="form-error">{error}</div>}

      {!loading && !error && grupos.length === 0 && (
        <div className="empty-state">
          <p>Nenhuma conta a receber.</p>
          <span>Todos os pedidos confirmados estão quitados.</span>
        </div>
      )}

      {!loading && !error && grupos.length > 0 && (
        <>
          <div className="cr-total-geral">
            <span>Total a receber</span>
            <strong>{brl(totalGeral)}</strong>
          </div>

          {grupos.map((g) => (
            <div key={g.cliente_id} className="cr-grupo">
              <div className="cr-grupo-head">
                <span className="cr-cliente">{g.cliente}</span>
                <strong className="cr-saldo">{brl(g.total)}</strong>
              </div>
              <ul className="cr-pedidos">
                {g.contas.map((c) => (
                  <li key={c.pedido_id} className="cr-pedido">
                    <div className="cr-pedido-info">
                      <span className="cr-numero">{c.numero}</span>
                      <span className="cr-data">{dataBR(c.data)}</span>
                    </div>
                    <div className="cr-pedido-valores">
                      <span className={`badge badge--${c.situacao === 'parcial' ? 'rascunho' : 'recusado'}`}>
                        {SITUACAO_LABEL[c.situacao]}
                      </span>
                      <span className="cr-pedido-saldo">{brl(c.saldo_devedor)}</span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </>
      )}
    </section>
  )
}
