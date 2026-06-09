import { supabase } from '../../lib/supabase'
import type { Acerto, AcertoItemInput, AcertoStatus, SaldoPonto } from './types'

const SELECT = `
  id, parceiro_id, data, status, observacao,
  valor_bruto, valor_comissao, valor_repasse, criado_em,
  parceiro:parceiros(nome, comissao_percent),
  itens:acerto_itens(
    id, produto_id, quantidade_vendida, quantidade_devolvida, preco_unitario,
    produto:produtos(nome, sku)
  )
`

interface Filtros {
  parceiroId?: string
  status?: AcertoStatus | ''
}

export async function listAcertos(filtros: Filtros = {}): Promise<Acerto[]> {
  let q = supabase
    .from('acertos')
    .select(SELECT)
    .order('criado_em', { ascending: false })

  if (filtros.parceiroId) q = q.eq('parceiro_id', filtros.parceiroId)
  if (filtros.status) q = q.eq('status', filtros.status)

  const { data, error } = await q
  if (error) throw error
  return (data ?? []) as unknown as Acerto[]
}

/**
 * Saldo atual de cada produto no ponto do parceiro (v_estoque_detalhado),
 * enriquecido com o preço de venda do produto. Só itens com saldo positivo.
 */
export async function getSaldoParceiro(parceiroId: string): Promise<SaldoPonto[]> {
  const { data: saldos, error } = await supabase
    .from('v_estoque_detalhado')
    .select('produto_id, produto, saldo')
    .eq('parceiro_id', parceiroId)
  if (error) throw error

  const rows = (saldos ?? []).filter((r) => r.saldo > 0)
  if (rows.length === 0) return []

  const ids = rows.map((r) => r.produto_id)
  const { data: prods, error: errProd } = await supabase
    .from('produtos')
    .select('id, preco_venda, sku')
    .in('id', ids)
  if (errProd) throw errProd

  const map = new Map((prods ?? []).map((p) => [p.id, p]))
  return rows
    .map((r) => ({
      produto_id: r.produto_id,
      produto: r.produto,
      sku: map.get(r.produto_id)?.sku ?? null,
      saldo: r.saldo,
      preco_venda: Number(map.get(r.produto_id)?.preco_venda ?? 0),
    }))
    .sort((a, b) => a.produto.localeCompare(b.produto))
}

interface NovoAcerto {
  parceiro_id: string
  data: string
  observacao: string | null
}

/** Cria o acerto (status rascunho) e seus itens. */
export async function createAcerto(
  header: NovoAcerto,
  itens: AcertoItemInput[],
): Promise<string> {
  const { data: acerto, error } = await supabase
    .from('acertos')
    .insert({ ...header, status: 'rascunho' })
    .select('id')
    .single()
  if (error) throw error

  const rows = itens.map((i) => ({ ...i, acerto_id: acerto.id }))
  const { error: errItens } = await supabase.from('acerto_itens').insert(rows)
  if (errItens) {
    await supabase.from('acertos').delete().eq('id', acerto.id)
    throw errItens
  }
  return acerto.id
}

/** Chama a função do banco que finaliza o acerto (baixa estoque + valores). */
export async function finalizarAcerto(id: string): Promise<void> {
  const { error } = await supabase.rpc('finalizar_acerto', { p_acerto_id: id })
  if (error) throw error
}

/** Remove um acerto (apenas rascunho) e seus itens. */
export async function deleteAcerto(id: string): Promise<void> {
  await supabase.from('acerto_itens').delete().eq('acerto_id', id)
  const { error } = await supabase.from('acertos').delete().eq('id', id)
  if (error) throw error
}
