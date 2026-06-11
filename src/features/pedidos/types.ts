export type PedidoStatus = 'rascunho' | 'confirmado' | 'entregue' | 'cancelado'
export type SituacaoFinanceira = 'aberto' | 'parcial' | 'pago'

export interface PedidoItem {
  id: string
  produto_id: string
  quantidade: number
  preco_unitario: number
  produto: { nome: string; sku: string | null } | null
}

export interface Financeiro {
  pedido_id: string
  valor_total: number
  total_pago: number
  saldo_devedor: number
  situacao: SituacaoFinanceira
}

export interface Pedido {
  id: string
  numero: string | null
  cliente_id: string
  orcamento_id: string | null
  data: string
  status: PedidoStatus
  condicao_pagamento: string | null
  valor_total: number | null
  observacao: string | null
  criado_em: string
  cliente: { nome: string } | null
  itens: PedidoItem[]
  financeiro: Financeiro | null
}

export interface Pagamento {
  id: string
  pedido_id: string
  data: string
  valor: number
  forma: string | null
  observacao: string | null
  criado_em: string
}

export interface PagamentoInput {
  data: string
  valor: number
  forma: string | null
  observacao: string | null
}

export const STATUS_LABEL: Record<PedidoStatus, string> = {
  rascunho: 'Rascunho',
  confirmado: 'Confirmado',
  entregue: 'Entregue',
  cancelado: 'Cancelado',
}

export const SITUACAO_LABEL: Record<SituacaoFinanceira, string> = {
  aberto: 'Em aberto',
  parcial: 'Parcial',
  pago: 'Pago',
}

export interface ContaReceber {
  pedido_id: string
  numero: string | null
  cliente_id: string
  cliente: string
  data: string
  valor_total: number
  total_pago: number
  saldo_devedor: number
  situacao: SituacaoFinanceira
}

export const FORMAS_PAGAMENTO = [
  'Dinheiro',
  'PIX',
  'Cartão de débito',
  'Cartão de crédito',
  'Transferência',
  'Boleto',
  'Outro',
]
