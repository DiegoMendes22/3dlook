import { supabase } from '../../lib/supabase'
import type {
  ContaReceber,
  Financeiro,
  Pagamento,
  PagamentoInput,
  Pedido,
  PedidoStatus,
} from './types'

const SELECT = `
  id, numero, cliente_id, orcamento_id, data, status, condicao_pagamento,
  valor_total, observacao, previsao_entrega, criado_em,
  cliente:clientes(nome),
  orcamento:orcamentos(numero),
  itens:pedido_itens(
    id, produto_id, quantidade, preco_unitario, observacao,
    produto:produtos(nome, sku)
  )
`

/** Pedidos do quadro (exclui cancelados), com total (v_pedido_valor) e financeiro. */
export async function listPedidos(): Promise<Pedido[]> {
  const { data, error } = await supabase
    .from('pedidos')
    .select(SELECT)
    .neq('status', 'cancelado')
    .order('criado_em', { ascending: false })
  if (error) throw error

  const pedidos = (data ?? []) as unknown as Pedido[]
  if (pedidos.length === 0) return []

  const ids = pedidos.map((p) => p.id)
  const [valores, financeiros] = await Promise.all([
    supabase.from('v_pedido_valor').select('pedido_id, total').in('pedido_id', ids),
    supabase.from('v_pedidos_financeiro').select('*').in('pedido_id', ids),
  ])
  if (valores.error) throw valores.error
  if (financeiros.error) throw financeiros.error

  const totMap = new Map((valores.data ?? []).map((v) => [v.pedido_id, Number(v.total)]))
  const finMap = new Map(
    (financeiros.data ?? []).map((f) => [f.pedido_id, f as Financeiro]),
  )

  return pedidos.map((p) => ({
    ...p,
    total: totMap.get(p.id) ?? 0,
    financeiro: finMap.get(p.id) ?? null,
  }))
}

/** Atualiza apenas o status do pedido (sem RPC, sem mexer em estoque). */
export async function updateStatusPedido(
  id: string,
  status: PedidoStatus,
): Promise<void> {
  const { error } = await supabase.from('pedidos').update({ status }).eq('id', id)
  if (error) throw error
}

/** Define/atualiza a data de previsão de entrega do pedido. */
export async function updatePrevisaoEntrega(
  id: string,
  previsao: string | null,
): Promise<void> {
  const { error } = await supabase
    .from('pedidos')
    .update({ previsao_entrega: previsao })
    .eq('id', id)
  if (error) throw error
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

/** Pedidos confirmados com saldo devedor (> 0), com nome do cliente. */
export async function listContasReceber(): Promise<ContaReceber[]> {
  const { data, error } = await supabase
    .from('v_contas_a_receber')
    .select('*')
    .order('data', { ascending: true })
  if (error) throw error
  return (data ?? []) as ContaReceber[]
}
