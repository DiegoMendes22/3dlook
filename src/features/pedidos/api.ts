import { supabase } from '../../lib/supabase'
import type {
  ContaReceber,
  Financeiro,
  Pagamento,
  PagamentoInput,
  Pedido,
} from './types'

/** Pedidos confirmados com saldo devedor (> 0), com nome do cliente. */
export async function listContasReceber(): Promise<ContaReceber[]> {
  const { data, error } = await supabase
    .from('v_contas_a_receber')
    .select('*')
    .order('data', { ascending: true })
  if (error) throw error
  return (data ?? []) as ContaReceber[]
}

const SELECT = `
  id, numero, cliente_id, orcamento_id, data, status, condicao_pagamento,
  valor_total, observacao, criado_em,
  cliente:clientes(nome),
  itens:pedido_itens(
    id, produto_id, quantidade, preco_unitario,
    produto:produtos(nome, sku)
  )
`

/** Lista pedidos com cliente, itens e o resumo financeiro (quando confirmado). */
export async function listPedidos(): Promise<Pedido[]> {
  const { data, error } = await supabase
    .from('pedidos')
    .select(SELECT)
    .order('criado_em', { ascending: false })
  if (error) throw error

  const pedidos = (data ?? []) as unknown as Pedido[]
  if (pedidos.length === 0) return []

  const { data: fin, error: errFin } = await supabase
    .from('v_pedidos_financeiro')
    .select('*')
    .in(
      'pedido_id',
      pedidos.map((p) => p.id),
    )
  if (errFin) throw errFin

  const mapa = new Map((fin ?? []).map((f) => [f.pedido_id, f as Financeiro]))
  return pedidos.map((p) => ({ ...p, financeiro: mapa.get(p.id) ?? null }))
}

export async function getFinanceiro(pedidoId: string): Promise<Financeiro | null> {
  const { data, error } = await supabase
    .from('v_pedidos_financeiro')
    .select('*')
    .eq('pedido_id', pedidoId)
    .maybeSingle()
  if (error) throw error
  return (data as Financeiro) ?? null
}

/** Confirma o pedido (rascunho -> confirmado, baixa estoque, calcula total). */
export async function confirmarPedido(id: string): Promise<void> {
  const { error } = await supabase.rpc('confirmar_pedido', { p_pedido_id: id })
  if (error) throw error
}

export async function listPagamentos(pedidoId: string): Promise<Pagamento[]> {
  const { data, error } = await supabase
    .from('pagamentos')
    .select('*')
    .eq('pedido_id', pedidoId)
    .order('data', { ascending: false })
  if (error) throw error
  return data ?? []
}

export async function addPagamento(
  pedidoId: string,
  input: PagamentoInput,
): Promise<void> {
  const { error } = await supabase
    .from('pagamentos')
    .insert({ ...input, pedido_id: pedidoId })
  if (error) throw error
}

export async function deletePagamento(id: string): Promise<void> {
  const { error } = await supabase.from('pagamentos').delete().eq('id', id)
  if (error) throw error
}
