import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { listParceiros } from '../parceiros/api'
import { listProdutos } from '../produtos/api'
import type { Parceiro } from '../parceiros/types'
import type { Produto } from '../produtos/types'
import { createConsignacao } from './api'
import type { ConsignacaoItemInput } from './types'
import { brl, hojeISO } from '../../lib/format'

interface Props {
  onClose: () => void
  onSaved: () => void
}

interface ItemRow {
  key: string
  produto_id: string
  quantidade: string
  preco_unitario: string
}

const novaLinha = (): ItemRow => ({
  key: crypto.randomUUID(),
  produto_id: '',
  quantidade: '1',
  preco_unitario: '',
})

export default function NovaConsignacaoModal({ onClose, onSaved }: Props) {
  const [parceiros, setParceiros] = useState<Parceiro[]>([])
  const [produtos, setProdutos] = useState<Produto[]>([])
  const [carregandoDados, setCarregandoDados] = useState(true)

  const [parceiroId, setParceiroId] = useState('')
  const [dataEnvio, setDataEnvio] = useState(hojeISO())
  const [observacao, setObservacao] = useState('')
  const [itens, setItens] = useState<ItemRow[]>([novaLinha()])

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  useEffect(() => {
    Promise.all([listParceiros(), listProdutos()])
      .then(([ps, pds]) => {
        setParceiros(ps.filter((p) => p.ativo))
        setProdutos(pds.filter((p) => p.ativo))
      })
      .catch((err) =>
        setError(err instanceof Error ? err.message : 'Erro ao carregar dados.'),
      )
      .finally(() => setCarregandoDados(false))
  }, [])

  const produtoPorId = useMemo(
    () => new Map(produtos.map((p) => [p.id, p])),
    [produtos],
  )

  function alterarProduto(key: string, produtoId: string) {
    const prod = produtoPorId.get(produtoId)
    setItens((rows) =>
      rows.map((r) =>
        r.key === key
          ? {
              ...r,
              produto_id: produtoId,
              // Prefill com o preço de venda do produto.
              preco_unitario: prod?.preco_venda != null ? String(prod.preco_venda) : '',
            }
          : r,
      ),
    )
  }

  function alterarCampo(key: string, campo: 'quantidade' | 'preco_unitario', valor: string) {
    setItens((rows) => rows.map((r) => (r.key === key ? { ...r, [campo]: valor } : r)))
  }

  function adicionarLinha() {
    setItens((rows) => [...rows, novaLinha()])
  }

  function removerLinha(key: string) {
    setItens((rows) => (rows.length > 1 ? rows.filter((r) => r.key !== key) : rows))
  }

  const total = useMemo(
    () =>
      itens.reduce((acc, r) => {
        const q = Number(r.quantidade) || 0
        const p = Number(r.preco_unitario.replace(',', '.')) || 0
        return acc + q * p
      }, 0),
    [itens],
  )

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!parceiroId) {
      setError('Selecione um parceiro.')
      return
    }
    const itensValidos: ConsignacaoItemInput[] = itens
      .filter((r) => r.produto_id && Number(r.quantidade) > 0)
      .map((r) => ({
        produto_id: r.produto_id,
        quantidade_enviada: Math.trunc(Number(r.quantidade)),
        preco_unitario: Number(r.preco_unitario.replace(',', '.')) || 0,
      }))

    if (itensValidos.length === 0) {
      setError('Adicione ao menos um item com produto e quantidade.')
      return
    }
    // Impede produto repetido na mesma remessa.
    const ids = itensValidos.map((i) => i.produto_id)
    if (new Set(ids).size !== ids.length) {
      setError('Há produtos repetidos. Use uma linha por produto.')
      return
    }

    setSaving(true)
    setError(null)
    try {
      await createConsignacao(
        { parceiro_id: parceiroId, data_envio: dataEnvio, observacao: observacao.trim() || null },
        itensValidos,
      )
      onSaved()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar a consignação.')
    } finally {
      setSaving(false)
    }
  }

  const semCadastros = !carregandoDados && (parceiros.length === 0 || produtos.length === 0)

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="drawer drawer--wide"
        role="dialog"
        aria-modal="true"
        aria-label="Nova consignação"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="drawer-header">
          <h2>Nova consignação</h2>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Fechar">
            ✕
          </button>
        </header>

        <form className="drawer-body" onSubmit={handleSubmit}>
          {carregandoDados && (
            <div className="list-state">
              <div className="spinner" />
            </div>
          )}

          {semCadastros && (
            <div className="form-error">
              É preciso ter ao menos um parceiro ativo e um produto ativo cadastrados.
            </div>
          )}

          {!carregandoDados && (
            <>
              <div className="field-row">
                <label className="field">
                  <span className="field-label">Parceiro *</span>
                  <select value={parceiroId} onChange={(e) => setParceiroId(e.target.value)}>
                    <option value="">Selecione…</option>
                    {parceiros.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.nome}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="field">
                  <span className="field-label">Data de envio</span>
                  <input
                    type="date"
                    value={dataEnvio}
                    onChange={(e) => setDataEnvio(e.target.value)}
                  />
                </label>
              </div>

              <div className="itens-section">
                <div className="itens-head">
                  <span className="field-label">Itens</span>
                  <button type="button" className="btn-ghost btn-sm" onClick={adicionarLinha}>
                    + Adicionar item
                  </button>
                </div>

                <ul className="itens-list">
                  {itens.map((r) => (
                    <li key={r.key} className="item-row">
                      <select
                        className="item-produto"
                        value={r.produto_id}
                        onChange={(e) => alterarProduto(r.key, e.target.value)}
                      >
                        <option value="">Produto…</option>
                        {produtos.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.nome}
                            {p.sku ? ` (${p.sku})` : ''}
                          </option>
                        ))}
                      </select>
                      <input
                        className="item-qtd"
                        type="number"
                        min="1"
                        step="1"
                        value={r.quantidade}
                        onChange={(e) => alterarCampo(r.key, 'quantidade', e.target.value)}
                        aria-label="Quantidade"
                      />
                      <input
                        className="item-preco"
                        type="number"
                        min="0"
                        step="0.01"
                        value={r.preco_unitario}
                        onChange={(e) => alterarCampo(r.key, 'preco_unitario', e.target.value)}
                        placeholder="preço un."
                        aria-label="Preço unitário"
                      />
                      <button
                        type="button"
                        className="icon-btn item-remove"
                        onClick={() => removerLinha(r.key)}
                        aria-label="Remover item"
                        disabled={itens.length === 1}
                      >
                        ✕
                      </button>
                    </li>
                  ))}
                </ul>

                <div className="itens-total">
                  <span>Total da remessa</span>
                  <strong>{brl(total)}</strong>
                </div>
              </div>

              <label className="field">
                <span className="field-label">Observação</span>
                <textarea
                  value={observacao}
                  onChange={(e) => setObservacao(e.target.value)}
                  rows={2}
                />
              </label>
            </>
          )}

          {error && <div className="form-error">{error}</div>}

          <div className="drawer-footer">
            <button type="button" className="btn-ghost" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="btn-primary" disabled={saving || semCadastros}>
              {saving ? 'Salvando…' : 'Salvar rascunho'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
