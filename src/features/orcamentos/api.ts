import { supabase } from '../../lib/supabase'
import type { Orcamento, OrcamentoItemInput, OrcamentoStatus } from './types'

const SELECT = `
  id, numero, cliente_id, data_emissao, validade, status, condicoes, observacao, criado_em,
  cliente:clientes(nome),
  itens:orcamento_itens(
    id, produto_id, quantidade, preco_unitario,
    produto:produtos(nome, sku)
  )
`

/** Lista os orçamentos com cliente, itens e o total vindo de v_orcamento_total. */
export async function listOrcamentos(): Promise<Orcamento[]> {
  const { data, error } = await supabase
    .from('orcamentos')
    .select(SELECT)
    .order('criado_em', { ascending: false })
  if (error) throw error

  const orcs = (data ?? []) as unknown as Omit<Orcamento, 'total'>[]
  if (orcs.length === 0) return []

  // Total vem da view (não da soma local dos itens).
  const ids = orcs.map((o) => o.id)
  const { data: totais, error: errTot } = await supabase
    .from('v_orcamento_total')
    .select('orcamento_id, total')
    .in('orcamento_id', ids)
  if (errTot) throw errTot

  const mapa = new Map((totais ?? []).map((t) => [t.orcamento_id, Number(t.total)]))
  return orcs.map((o) => ({ ...o, total: mapa.get(o.id) ?? 0 }))
}

interface NovoOrcamento {
  cliente_id: string
  data_emissao: string
  validade: string | null
  condicoes: string | null
  observacao: string | null
}

/** Cria o orçamento (rascunho) + itens. Retorna id e número gerado pelo banco. */
export async function createOrcamento(
  header: NovoOrcamento,
  itens: OrcamentoItemInput[],
): Promise<{ id: string; numero: string | null }> {
  const { data: orc, error } = await supabase
    .from('orcamentos')
    .insert({ ...header, status: 'rascunho' })
    .select('id, numero')
    .single()
  if (error) throw error

  const rows = itens.map((i) => ({ ...i, orcamento_id: orc.id }))
  const { error: errItens } = await supabase.from('orcamento_itens').insert(rows)
  if (errItens) {
    await supabase.from('orcamentos').delete().eq('id', orc.id)
    throw errItens
  }
  return orc
}

export async function updateStatusOrcamento(
  id: string,
  status: OrcamentoStatus,
): Promise<void> {
  const { error } = await supabase.from('orcamentos').update({ status }).eq('id', id)
  if (error) throw error
}

export async function deleteOrcamento(id: string): Promise<void> {
  await supabase.from('orcamento_itens').delete().eq('orcamento_id', id)
  const { error } = await supabase.from('orcamentos').delete().eq('id', id)
  if (error) throw error
}
