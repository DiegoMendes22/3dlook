import { useEffect, useMemo, useState } from 'react'
import { listParceiros } from '../parceiros/api'
import type { Parceiro } from '../parceiros/types'
import { createAcerto, getSaldoParceiro } from './api'
import type { AcertoItemInput } from './types'
import { brl, hojeISO } from '../../lib/format'

interface Props {
  onClose: () => void
  onSaved: () => void
}

interface Linha {
  produto_id: string
  produto: string
  sku: string | null
  saldo: number
  preco_venda: number
  sobra: string
  devolvida: string
}

const inteiro = (v: string) => {
  const n = Math.trunc(Number(v))
  return Number.isFinite(n) && n > 0 ? n : 0
}

export default function NovoAcertoModal({ onClose, onSaved }: Props) {
  const [parceiros, setParceiros] = useState<Parceiro[]>([])
  const [parceiroId, setParceiroId] = useState('')
  const [observacao, setObservacao] = useState('')
  const [linhas, setLinhas] = useState<Linha[]>([])

  const [carregandoParceiros, setCarregandoParceiros] = useState(true)
  const [carregandoSaldo, setCarregandoSaldo] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  useEffect(() => {
    listParceiros()
      .then((ps) => setParceiros(ps.filter((p) => p.ativo)))
      .catch((err) =>
        setError(err instanceof Error ? err.message : 'Erro ao carregar parceiros.'),
      )
      .finally(() => setCarregandoParceiros(false))
  }, [])

  const parceiro = useMemo(
    () => parceiros.find((p) => p.id === parceiroId) ?? null,
    [parceiros, parceiroId],
  )
  const comissaoPct = parceiro?.comissao_percent ?? 0

  async function escolherParceiro(id: string) {
    setParceiroId(id)
    setLinhas([])
    setError(null)
    if (!id) return
    setCarregandoSaldo(true)
    try {
      const saldos = await getSaldoParceiro(id)
      setLinhas(
        saldos.map((s) => ({
          produto_id: s.produto_id,
          produto: s.produto,
          sku: s.sku,
          saldo: s.saldo,
          preco_venda: s.preco_venda,
          sobra: '',
          devolvida: '',
        })),
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao buscar o saldo do ponto.')
    } finally {
      setCarregandoSaldo(false)
    }
  }

  function alterar(produtoId: string, campo: 'sobra' | 'devolvida', valor: string) {
    setLinhas((rows) =>
      rows.map((r) => (r.produto_id === produtoId ? { ...r, [campo]: valor } : r)),
    )
  }

  // Cálculo por linha + totais.
  const calc = useMemo(() => {
    const itens = linhas.map((l) => {
      const sobra = inteiro(l.sobra)
      const devolvida = inteiro(l.devolvida)
      const vendida = l.saldo - sobra - devolvida
      const invalida = sobra + devolvida > l.saldo
      const subtotal = Math.max(0, vendida) * l.preco_venda
      return { ...l, sobra, devolvida, vendida, invalida, subtotal }
    })
    const bruto = itens.reduce((acc, i) => acc + i.subtotal, 0)
    const comissao = (bruto * comissaoPct) / 100
    const repasse = bruto - comissao
    const temInvalida = itens.some((i) => i.invalida)
    const temVenda = itens.some((i) => i.vendida > 0 || i.devolvida > 0)
    return { itens, bruto, comissao, repasse, temInvalida, temVenda }
  }, [linhas, comissaoPct])

  async function salvar() {
    if (!parceiroId) {
      setError('Selecione um parceiro.')
      return
    }
    if (calc.temInvalida) {
      setError('Há linhas com sobra + devolvida maior que o saldo.')
      return
    }
    if (!calc.temVenda) {
      setError('Informe ao menos uma venda ou devolução.')
      return
    }
    const itens: AcertoItemInput[] = calc.itens
      .filter((i) => i.vendida > 0 || i.devolvida > 0)
      .map((i) => ({
        produto_id: i.produto_id,
        quantidade_vendida: Math.max(0, i.vendida),
        quantidade_devolvida: i.devolvida,
        preco_unitario: i.preco_venda,
      }))

    setSaving(true)
    setError(null)
    try {
      await createAcerto(
        { parceiro_id: parceiroId, data: hojeISO(), observacao: observacao.trim() || null },
        itens,
      )
      onSaved()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar o acerto.')
    } finally {
      setSaving(false)
    }
  }

  const semSaldo = parceiroId && !carregandoSaldo && linhas.length === 0 && !error

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="drawer drawer--full"
        role="dialog"
        aria-modal="true"
        aria-label="Novo acerto"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="drawer-header">
          <h2>Novo acerto</h2>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Fechar">
            ✕
          </button>
        </header>

        <div className="acerto-scroll">
          <label className="field">
            <span className="field-label">Ponto de venda (parceiro) *</span>
            <select
              value={parceiroId}
              onChange={(e) => escolherParceiro(e.target.value)}
              disabled={carregandoParceiros}
            >
              <option value="">Selecione…</option>
              {parceiros.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nome} — comissão {p.comissao_percent}%
                </option>
              ))}
            </select>
          </label>

          {carregandoSaldo && (
            <div className="list-state">
              <div className="spinner" />
            </div>
          )}

          {semSaldo && (
            <div className="empty-state">
              <p>Sem saldo neste ponto.</p>
              <span>Não há produtos consignados com este parceiro.</span>
            </div>
          )}

          {!carregandoSaldo && linhas.length > 0 && (
            <ul className="acerto-linhas">
              {linhas.map((l) => {
                const sobra = inteiro(l.sobra)
                const devolvida = inteiro(l.devolvida)
                const vendida = l.saldo - sobra - devolvida
                const invalida = sobra + devolvida > l.saldo
                const subtotal = Math.max(0, vendida) * l.preco_venda
                return (
                  <li
                    key={l.produto_id}
                    className={invalida ? 'acerto-linha acerto-linha--erro' : 'acerto-linha'}
                  >
                    <div className="al-top">
                      <span className="al-nome">{l.produto}</span>
                      <span className="al-saldo">
                        saldo <strong>{l.saldo}</strong>
                      </span>
                    </div>

                    <div className="al-inputs">
                      <label className="al-campo">
                        <span>Sobra</span>
                        <input
                          type="number"
                          inputMode="numeric"
                          min="0"
                          max={l.saldo}
                          placeholder="0"
                          value={l.sobra}
                          onChange={(e) => alterar(l.produto_id, 'sobra', e.target.value)}
                        />
                      </label>
                      <label className="al-campo">
                        <span>Devolvida</span>
                        <input
                          type="number"
                          inputMode="numeric"
                          min="0"
                          max={l.saldo}
                          placeholder="0"
                          value={l.devolvida}
                          onChange={(e) => alterar(l.produto_id, 'devolvida', e.target.value)}
                        />
                      </label>
                      <div className="al-vendida">
                        <span>Vendidas</span>
                        <strong className={vendida < 0 ? 'al-neg' : undefined}>{vendida}</strong>
                      </div>
                    </div>

                    <div className="al-foot">
                      <span>{brl(l.preco_venda)} un.</span>
                      <span>{brl(subtotal)}</span>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}

          {linhas.length > 0 && (
            <label className="field">
              <span className="field-label">Observação</span>
              <textarea
                value={observacao}
                onChange={(e) => setObservacao(e.target.value)}
                rows={2}
              />
            </label>
          )}

          {error && <div className="form-error">{error}</div>}
        </div>

        {/* Resumo fixo (balcão) */}
        <div className="acerto-summary">
          <div className="resumo-linhas">
            <div className="resumo-item">
              <span>Vendido</span>
              <strong>{brl(calc.bruto)}</strong>
            </div>
            <div className="resumo-item">
              <span>Comissão ({comissaoPct}%)</span>
              <strong>− {brl(calc.comissao)}</strong>
            </div>
            <div className="resumo-item resumo-repasse">
              <span>Repasse</span>
              <strong>{brl(calc.repasse)}</strong>
            </div>
          </div>
          <div className="acerto-summary-actions">
            <button type="button" className="btn-ghost" onClick={onClose}>
              Cancelar
            </button>
            <button
              type="button"
              className="btn-primary"
              onClick={salvar}
              disabled={saving || !parceiroId || linhas.length === 0}
            >
              {saving ? 'Salvando…' : 'Salvar rascunho'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
