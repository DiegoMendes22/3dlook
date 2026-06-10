export type OrcamentoStatus =
  | 'rascunho'
  | 'enviado'
  | 'aprovado'
  | 'recusado'
  | 'expirado'

export interface OrcamentoItemInput {
  produto_id: string
  quantidade: number
  preco_unitario: number
}

export interface OrcamentoItem {
  id: string
  produto_id: string
  quantidade: number
  preco_unitario: number
  produto: { nome: string; sku: string | null } | null
}

export interface Orcamento {
  id: string
  numero: string | null
  cliente_id: string
  data_emissao: string
  validade: string | null
  status: OrcamentoStatus
  condicoes: string | null
  observacao: string | null
  criado_em: string
  cliente: { nome: string } | null
  itens: OrcamentoItem[]
  total: number
}

export const STATUS_LABEL: Record<OrcamentoStatus, string> = {
  rascunho: 'Rascunho',
  enviado: 'Enviado',
  aprovado: 'Aprovado',
  recusado: 'Recusado',
  expirado: 'Expirado',
}
