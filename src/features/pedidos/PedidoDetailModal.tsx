import { useEffect, useState, type FormEvent } from 'react'
import {
  addPagamento,
  confirmarPedido,
  deletePagamento,
  getFinanceiro,
  listPagamentos,
} from './api'
import type { Financeiro, Pagamento, Pedido, SituacaoFinanceira } from './types'
import { FORMAS_PAGAMENTO, SITUACAO_LABEL, STATUS_LABEL } from './types'
import { brl, dataBR, hojeISO } from '../../lib/format'

interface Props {
  pedido: Pedido
  onClose: () => void
  /** Chamado quando algo muda (confirmar/pagamento) para a lista recarregar. */
  onChange: () => void
}

const situacaoClass: Record<SituacaoFinanceira, string> = {
  aberto: 'badge badge--recusado',
  parcial: 'badge badge--rascunho',
  pago: 'badge badge--aprovado',
}

export default function PedidoDetailModal({ pedido, onClose, onChange }: Props) {
  const [financeiro, setFinanceiro] = useState<Financeiro | null>(pedido.financeiro)
  const [pagamentos, setPagamentos] = useState<Pagamento[]>([])
  const [status, setStatus] = useState(pedido.status)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Form de pagamento
  const [valor, setValor] = useState('')
  const [data, setData] = useState(hojeISO())
  const [forma, setForma] = useState(FORMAS_PAGAMENTO[0])

  const confirmado = status === 'confirmado' || status === 'entregue'

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  async function recarregar() {
    const [fin, pgs] = await Promise.all([
      getFinanceiro(pedido.id),
      confirmado ? listPagamentos(pedido.id) : Promise.resolve([]),
    ])
    setFinanceiro(fin)
    setPagamentos(pgs)
  }

  useEffect(() => {
    setLoading(true)
    recarregar()
      .catch((err) =>
        setError(err instanceof Error ? err.message : 'Erro ao carregar o pedido.'),
      )
      .finally(() => setLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pedido.id, confirmado])

  async function confirmar() {
    if (!confirm('Confirmar o pedido? Isso baixa o estoque e fixa o valor total.')) return
    setBusy(true)
    setError(null)
    try {
      await confirmarPedido(pedido.id)
      setStatus('confirmado')
      onChange()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao confirmar.')
    } finally {
      setBusy(false)
    }
  }

  async function registrarPagamento(e: FormEvent) {
    e.preventDefault()
    const v = Number(valor.replace(',', '.'))
    if (!(v > 0)) {
      setError('Informe um valor maior que zero.')
      return
    }
    setBusy(true)
    setError(null)
    try {
      await addPagamento(pedido.id, {
        valor: v,
        data,
        forma: forma || null,
        observacao: null,
      })
      setValor('')
      await recarregar()
      onChange()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao registrar pagamento.')
    } finally {
      setBusy(false)
    }
  }

  async function removerPagamento(id: string) {
    if (!confirm('Remover este pagamento?')) return
    try {
      await deletePagamento(id)
      await recarregar()
      onChange()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erro ao remover.')
    }
  }

  const totalItens = pedido.itens.reduce(
    (acc, i) => acc + i.quantidade * i.preco_unitario,
    0,
  )

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="drawer drawer--wide"
        role="dialog"
        aria-modal="true"
        aria-label="Detalhe do pedido"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="drawer-header">
          <h2>
            {pedido.numero ?? 'Pedido'}
            <span className={`badge ${'badge--' + (confirmado ? 'aprovado' : 'rascunho')} ped-status`}>
              {STATUS_LABEL[status]}
            </span>
          </h2>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Fechar">
            ✕
          </button>
        </header>

        <div className="drawer-body">
          <div className="ped-cabecalho">
            <div>
              <div className="doc-bloco-titulo">Cliente</div>
              <div className="ped-cliente">{pedido.cliente?.nome ?? '—'}</div>
            </div>
            <div className="ped-data">{dataBR(pedido.data)}</div>
          </div>

          {/* Itens */}
          <ul className="cons-itens ped-itens">
            {pedido.itens.map((i) => (
              <li key={i.id}>
                <span className="ci-nome">{i.produto?.nome ?? 'Produto'}</span>
                <span className="ci-calc">
                  {i.quantidade} × {brl(i.preco_unitario)} = {brl(i.quantidade * i.preco_unitario)}
                </span>
              </li>
            ))}
            {pedido.itens.length === 0 && <li className="ci-vazio">Sem itens</li>}
          </ul>

          {loading && (
            <div className="list-state">
              <div className="spinner" />
            </div>
          )}

          {!loading && !confirmado && (
            <>
              <div className="itens-total">
                <span>Total estimado</span>
                <strong>{brl(totalItens)}</strong>
              </div>
              <p className="drawer-hint">
                O pedido ainda é um rascunho. Confirme para baixar o estoque, fixar o
                valor e habilitar os pagamentos.
              </p>
              <button
                type="button"
                className="btn-primary"
                onClick={confirmar}
                disabled={busy}
              >
                {busy ? 'Confirmando…' : 'Confirmar pedido'}
              </button>
            </>
          )}

          {/* Financeiro (pedido confirmado) */}
          {!loading && confirmado && financeiro && (
            <>
              <div className="fin-grid">
                <div className="fin-item">
                  <span>Valor total</span>
                  <strong>{brl(financeiro.valor_total)}</strong>
                </div>
                <div className="fin-item">
                  <span>Total pago</span>
                  <strong>{brl(financeiro.total_pago)}</strong>
                </div>
                <div className="fin-item">
                  <span>Saldo devedor</span>
                  <strong className={financeiro.saldo_devedor > 0 ? 'fin-deve' : 'fin-ok'}>
                    {brl(financeiro.saldo_devedor)}
                  </strong>
                </div>
                <div className="fin-item fin-situacao">
                  <span>Situação</span>
                  <span className={situacaoClass[financeiro.situacao]}>
                    {SITUACAO_LABEL[financeiro.situacao]}
                  </span>
                </div>
              </div>

              {/* Pagamentos */}
              <div className="ped-pagamentos">
                <div className="doc-bloco-titulo">Pagamentos</div>
                {pagamentos.length === 0 && (
                  <p className="drawer-hint">Nenhum pagamento registrado.</p>
                )}
                <ul className="pag-list">
                  {pagamentos.map((p) => (
                    <li key={p.id} className="pag-item">
                      <div className="pag-info">
                        <strong>{brl(p.valor)}</strong>
                        <span>
                          {dataBR(p.data)}
                          {p.forma && ` · ${p.forma}`}
                        </span>
                      </div>
                      <button
                        type="button"
                        className="icon-btn"
                        onClick={() => removerPagamento(p.id)}
                        aria-label="Remover pagamento"
                      >
                        ✕
                      </button>
                    </li>
                  ))}
                </ul>
              </div>

              {financeiro.saldo_devedor > 0 && (
                <form className="pag-form" onSubmit={registrarPagamento}>
                  <div className="doc-bloco-titulo">Registrar pagamento</div>
                  <div className="field-row">
                    <label className="field">
                      <span className="field-label">Valor (R$)</span>
                      <input
                        type="number"
                        step="0.01"
                        min="0.01"
                        value={valor}
                        onChange={(e) => setValor(e.target.value)}
                        placeholder="0,00"
                      />
                    </label>
                    <label className="field">
                      <span className="field-label">Data</span>
                      <input
                        type="date"
                        value={data}
                        onChange={(e) => setData(e.target.value)}
                      />
                    </label>
                  </div>
                  <label className="field">
                    <span className="field-label">Forma</span>
                    <select value={forma} onChange={(e) => setForma(e.target.value)}>
                      {FORMAS_PAGAMENTO.map((f) => (
                        <option key={f} value={f}>
                          {f}
                        </option>
                      ))}
                    </select>
                  </label>
                  <button type="submit" className="btn-primary" disabled={busy}>
                    {busy ? 'Registrando…' : 'Registrar pagamento'}
                  </button>
                </form>
              )}
            </>
          )}

          {error && <div className="form-error">{error}</div>}
        </div>
      </div>
    </div>
  )
}
