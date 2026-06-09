export type AcertoStatus = 'rascunho' | 'finalizado'

export interface AcertoItemInput {
  produto_id: string
  quantidade_vendida: number
  quantidade_devolvida: number
  preco_unitario: number
}

export interface AcertoItem {
  id: string
  produto_id: string
  quantidade_vendida: number
  quantidade_devolvida: number
  preco_unitario: number
  produto: { nome: string; sku: string | null } | null
}

export interface Acerto {
  id: string
  parceiro_id: string
  data: string
  status: AcertoStatus
  observacao: string | null
  valor_bruto: number | null
  valor_comissao: number | null
  valor_repasse: number | null
  criado_em: string
  parceiro: { nome: string; comissao_percent: number } | null
  itens: AcertoItem[]
}

/** Saldo de um produto num ponto de venda (o que deveria estar lá). */
export interface SaldoPonto {
  produto_id: string
  produto: string
  sku: string | null
  saldo: number
  preco_venda: number
}

export const ACERTO_STATUS_LABEL: Record<AcertoStatus, string> = {
  rascunho: 'Rascunho',
  finalizado: 'Finalizado',
}
