export type ConsignacaoStatus = 'rascunho' | 'enviada' | 'encerrada'

export interface ConsignacaoItemInput {
  produto_id: string
  quantidade_enviada: number
  preco_unitario: number
}

export interface ConsignacaoItem {
  id: string
  produto_id: string
  quantidade_enviada: number
  preco_unitario: number
  produto: { nome: string; sku: string | null } | null
}

export interface Consignacao {
  id: string
  parceiro_id: string
  data_envio: string
  status: ConsignacaoStatus
  observacao: string | null
  criado_em: string
  parceiro: { nome: string } | null
  itens: ConsignacaoItem[]
}

export const STATUS_LABEL: Record<ConsignacaoStatus, string> = {
  rascunho: 'Rascunho',
  enviada: 'Enviada',
  encerrada: 'Encerrada',
}
