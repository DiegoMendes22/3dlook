export interface Cliente {
  id: string
  nome: string
  cnpj_cpf: string | null
  contato: string | null
  telefone: string | null
  email: string | null
  endereco: string | null
  ativo: boolean
  criado_em: string
  atualizado_em: string
}

/** Campos enviados ao criar/editar um cliente. */
export interface ClienteInput {
  nome: string
  cnpj_cpf: string | null
  contato: string | null
  telefone: string | null
  email: string | null
  endereco: string | null
  ativo: boolean
}
