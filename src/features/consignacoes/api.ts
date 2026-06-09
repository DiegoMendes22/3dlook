import { supabase } from '../../lib/supabase'
import type {
  Consignacao,
  ConsignacaoItemInput,
  ConsignacaoStatus,
} from './types'

const SELECT = `
  id, parceiro_id, data_envio, status, observacao, criado_em,
  parceiro:parceiros(nome),
  itens:consignacao_itens(
    id, produto_id, quantidade_enviada, preco_unitario,
    produto:produtos(nome, sku)
  )
`

interface Filtros {
  parceiroId?: string
  status?: ConsignacaoStatus | ''
}

export async function listConsignacoes(filtros: Filtros = {}): Promise<Consignacao[]> {
  let q = supabase
    .from('consignacoes')
    .select(SELECT)
    .order('criado_em', { ascending: false })

  if (filtros.parceiroId) q = q.eq('parceiro_id', filtros.parceiroId)
  if (filtros.status) q = q.eq('status', filtros.status)

  const { data, error } = await q
  if (error) throw error
  return (data ?? []) as unknown as Consignacao[]
}

interface NovaConsignacao {
  parceiro_id: string
  data_envio: string
  observacao: string | null
}

/** Cria a consignação (status rascunho) e seus itens. */
export async function createConsignacao(
  header: NovaConsignacao,
  itens: ConsignacaoItemInput[],
): Promise<string> {
  const { data: cons, error } = await supabase
    .from('consignacoes')
    .insert({ ...header, status: 'rascunho' })
    .select('id')
    .single()
  if (error) throw error

  const rows = itens.map((i) => ({ ...i, consignacao_id: cons.id }))
  const { error: errItens } = await supabase.from('consignacao_itens').insert(rows)
  if (errItens) {
    // Evita cabeçalho órfão se os itens falharem.
    await supabase.from('consignacoes').delete().eq('id', cons.id)
    throw errItens
  }
  return cons.id
}

/** Chama a função do banco que confirma o envio (status -> enviada + estoque). */
export async function confirmarConsignacao(id: string): Promise<void> {
  const { error } = await supabase.rpc('confirmar_consignacao', {
    p_consignacao_id: id,
  })
  if (error) throw error
}

/** Remove uma consignação (apenas rascunho) e seus itens. */
export async function deleteConsignacao(id: string): Promise<void> {
  await supabase.from('consignacao_itens').delete().eq('consignacao_id', id)
  const { error } = await supabase.from('consignacoes').delete().eq('id', id)
  if (error) throw error
}
