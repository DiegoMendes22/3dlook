import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { listClientes } from '../clientes/api'
import { listProdutos } from '../produtos/api'
import type { Cliente } from '../clientes/types'
import type { Produto } from '../produtos/types'
import { createOrcamento, updateOrcamento } from './api'
import type { Orcamento, OrcamentoItemInput } from './types'
import { brl, emDiasISO, hojeISO } from '../../lib/format'

interface Props {
  /** Quando informado, o formulário entra em modo de edição. */
  orcamento?: Orcamento
  onClose: () => void
  onSaved: () => void
}

interface ItemRow {
  key: string
  produto_id: string
  quantidade: string
  preco_unitario: string
  observacao: string
}

const novaLinha = (): ItemRow => ({
  key: crypto.randomUUID(),
  produto_id: '',
  quantidade: '1',
  preco_unitario: '',
  observacao: '',
})

export default function OrcamentoFormModal({ orcamento, onClose, onSaved }: Props) {
  const editando = !!orcamento

  const [clientes, setClientes] = useState<Cliente[]>([])
  const [produtos, setProdutos] = useState<Produto[]>([])
  const [carregandoDados, setCarregandoDados] = useState(true)

  const [clienteId, setClienteId] = useState(orcamento?.cliente_id ?? '')
  const [validade, setValidade] = useState(orcamento?.validade ?? emDiasISO(30))
  const [condicoes, setCondicoes] = useState(orcamento?.condicoes ?? '')
  const [observacao, setObservacao] = useState(orcamento?.observacao ?? '')
  const [itens, setItens] = useState<ItemRow[]>(
    orcamento && orcamento.itens.length > 0
      ? orcamento.itens.map((i) => ({
          key: i.id,
          produto_id: i.produto_id,
          quantidade: String(i.quantidade),
          preco_unitario: String(i.preco_unitario),
          observacao: i.observacao ?? '',
        }))
      : [novaLinha()],
  )

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  useEffect(() => {
    Promise.all([listClientes(), listProdutos()])
      .then(([cs, pds]) => {
        setClientes(cs)
        setProdutos(pds)
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

  // Mostra ativos + o que já está selecionado (mesmo se inativo) ao editar.
  const idsNosItens = useMemo(
    () => new Set(itens.map((r) => r.produto_id).filter(Boolean)),
    [itens],
  )
  const clientesOpcoes = useMemo(
    () => clientes.filter((c) => c.ativo || c.id === clienteId),
    [clientes, clienteId],
  )
  const produtosOpcoes = useMemo(
    () => produtos.filter((p) => p.ativo || idsNosItens.has(p.id)),
    [produtos, idsNosItens],
  )

  function alterarProduto(key: string, produtoId: string) {
    const prod = produtoPorId.get(produtoId)
    setItens((rows) =>
      rows.map((r) =>
        r.key === key
          ? {
              ...r,
              produto_id: produtoId,
              preco_unitario: prod?.preco_venda != null ? String(prod.preco_venda) : '',
            }
          : r,
      ),
    )
  }

  function alterarCampo(
    key: string,
    campo: 'quantidade' | 'preco_unitario' | 'observacao',
    valor: string,
  ) {
    setItens((rows) => rows.map((r) => (r.key === key ? { ...r, [campo]: valor } : r)))
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
    if (!clienteId) {
      setError('Selecione um cliente.')
      return
    }
    const itensValidos: OrcamentoItemInput[] = itens
      .filter((r) => r.produto_id && Number(r.quantidade) > 0)
      .map((r) => ({
        produto_id: r.produto_id,
        quantidade: Math.trunc(Number(r.quantidade)),
        preco_unitario: Number(r.preco_unitario.replace(',', '.')) || 0,
        observacao: r.observacao.trim() || null,
      }))

    if (itensValidos.length === 0) {
      setError('Adicione ao menos um item com produto e quantidade.')
      return
    }
    const ids = itensValidos.map((i) => i.produto_id)
    if (new Set(ids).size !== ids.length) {
      setError('Há produtos repetidos. Use uma linha por produto.')
      return
    }

    setSaving(true)
    setError(null)
    try {
      if (editando) {
        await updateOrcamento(
          orcamento.id,
          {
            cliente_id: clienteId,
            validade: validade || null,
            condicoes: condicoes.trim() || null,
            observacao: observacao.trim() || null,
          },
          itensValidos,
        )
      } else {
        await createOrcamento(
          {
            cliente_id: clienteId,
            data_emissao: hojeISO(),
            validade: validade || null,
            condicoes: condicoes.trim() || null,
            observacao: observacao.trim() || null,
          },
          itensValidos,
        )
      }
      onSaved()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar o orçamento.')
    } finally {
      setSaving(false)
    }
  }

  // Bloqueia apenas a criação quando não há cadastros ativos.
  const semCadastros =
    !carregandoDados &&
    !editando &&
    (clientes.filter((c) => c.ativo).length === 0 ||
      produtos.filter((p) => p.ativo).length === 0)

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="drawer drawer--wide"
        role="dialog"
        aria-modal="true"
        aria-label={editando ? 'Editar orçamento' : 'Novo orçamento'}
        onClick={(e) => e.stopPropagation()}
      >
        <header className="drawer-header">
          <h2>
            {editando ? `Editar ${orcamento.numero ?? 'orçamento'}` : 'Novo orçamento'}
          </h2>
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
              É preciso ter ao menos um cliente ativo e um produto ativo cadastrados.
            </div>
          )}

          {!carregandoDados && (
            <>
              <label className="field">
                <span className="field-label">Cliente *</span>
                <select value={clienteId} onChange={(e) => setClienteId(e.target.value)}>
                  <option value="">Selecione…</option>
                  {clientesOpcoes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nome}
                    </option>
                  ))}
                </select>
              </label>

              <div className="field-row">
                <label className="field">
                  <span className="field-label">Validade</span>
                  <input
                    type="date"
                    value={validade ?? ''}
                    onChange={(e) => setValidade(e.target.value)}
                  />
                </label>
                <label className="field">
                  <span className="field-label">Condições de pagamento</span>
                  <input
                    value={condicoes}
                    onChange={(e) => setCondicoes(e.target.value)}
                    placeholder="Ex.: 50% na aprovação, 50% na entrega"
                  />
                </label>
              </div>

              <div className="itens-section">
                <div className="itens-head">
                  <span className="field-label">Itens</span>
                  <button
                    type="button"
                    className="btn-ghost btn-sm"
                    onClick={() => setItens((rows) => [...rows, novaLinha()])}
                  >
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
                        {produtosOpcoes.map((p) => (
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
                        onChange={(e) =>
                          alterarCampo(r.key, 'preco_unitario', e.target.value)
                        }
                        placeholder="preço un."
                        aria-label="Preço unitário"
                      />
                      <button
                        type="button"
                        className="icon-btn item-remove"
                        onClick={() =>
                          setItens((rows) =>
                            rows.length > 1 ? rows.filter((x) => x.key !== r.key) : rows,
                          )
                        }
                        aria-label="Remover item"
                        disabled={itens.length === 1}
                      >
                        ✕
                      </button>
                      <input
                        className="item-obs"
                        value={r.observacao}
                        onChange={(e) => alterarCampo(r.key, 'observacao', e.target.value)}
                        placeholder="Observação do item (opcional)"
                        aria-label="Observação do item"
                      />
                    </li>
                  ))}
                </ul>

                <div className="itens-total">
                  <span>Total do orçamento</span>
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
              {saving ? 'Salvando…' : editando ? 'Salvar alterações' : 'Salvar rascunho'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
