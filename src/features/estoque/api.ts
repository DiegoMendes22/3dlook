import { supabase } from '../../lib/supabase'
import type { EstoqueRow } from './types'

/** Lê o saldo detalhado por produto e local (Oficina + cada ponto). */
export async function listEstoque(): Promise<EstoqueRow[]> {
  const { data, error } = await supabase
    .from('v_estoque_detalhado')
    .select('produto_id, produto, parceiro_id, local, saldo')
  if (error) throw error
  return (data ?? []) as EstoqueRow[]
}

/** Registra uma produção: entra no estoque da oficina (parceiro_id null). */
export async function registrarProducao(
  produtoId: string,
  quantidade: number,
): Promise<void> {
  const { error } = await supabase.from('movimentacoes_estoque').insert({
    produto_id: produtoId,
    parceiro_id: null,
    tipo: 'producao',
    quantidade,
    ref_tipo: 'producao',
  })
  if (error) throw error
}
