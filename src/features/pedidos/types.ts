export type PedidoStatus =
  | 'orcamento_aprovado'
  | 'em_producao'
  | 'entregue'
  | 'concluido'
  | 'cancelado'

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
  orcamento: { numero: string | null } | null
  itens: PedidoItem[]
  /** Total vindo de v_pedido_valor. */
  total: number
  /** Resumo financeiro (apenas entregue/concluído). */
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

/** Colunas do quadro (rótulo visível → status no banco), na ordem. */
export const COLUNAS: { status: PedidoStatus; label: string }[] = [
  { status: 'orcamento_aprovado', label: 'Orçamento Aprovado' },
  { status: 'em_producao', label: 'Em produção' },
  { status: 'entregue', label: 'Entregue' },
  { status: 'concluido', label: 'Concluído' },
]

export const STATUS_LABEL: Record<PedidoStatus, string> = {
  orcamento_aprovado: 'Orçamento Aprovado',
  em_producao: 'Em produção',
  entregue: 'Entregue',
  concluido: 'Concluído',
  cancelado: 'Cancelado',
}

export const SITUACAO_LABEL: Record<SituacaoFinanceira, string> = {
  aberto: 'Em aberto',
  parcial: 'Parcial',
  pago: 'Pago',
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
