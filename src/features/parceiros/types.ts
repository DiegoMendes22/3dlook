export interface Parceiro {
  id: string
  nome: string
  contato: string | null
  telefone: string | null
  endereco: string | null
  comissao_percent: number
  ativo: boolean
  criado_em: string
  atualizado_em: string
}

/** Campos enviados ao criar/editar um parceiro. */
export interface ParceiroInput {
  nome: string
  contato: string | null
  telefone: string | null
  endereco: string | null
  comissao_percent: number
  ativo: boolean
}
