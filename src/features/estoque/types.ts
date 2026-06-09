export interface EstoqueRow {
  produto_id: string
  produto: string
  parceiro_id: string | null
  local: string
  saldo: number
}

export interface GrupoEstoque {
  chave: string
  local: string
  isOficina: boolean
  itens: EstoqueRow[]
  total: number
}
