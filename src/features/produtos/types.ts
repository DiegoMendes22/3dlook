export interface Produto {
  id: string
  nome: string
  sku: string | null
  descricao: string | null
  foto_url: string | null
  custo_producao: number | null
  preco_venda: number | null
  ativo: boolean
  criado_em: string
  atualizado_em: string
}

/** Campos enviados ao criar/editar um produto. */
export interface ProdutoInput {
  nome: string
  sku: string | null
  descricao: string | null
  custo_producao: number
  preco_venda: number
  ativo: boolean
  foto_url: string | null
}
