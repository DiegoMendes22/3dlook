import { supabase } from '../../lib/supabase'
import type { Parceiro, ParceiroInput } from './types'

/** Lista todos os parceiros, mais recentes primeiro. */
export async function listParceiros(): Promise<Parceiro[]> {
  const { data, error } = await supabase
    .from('parceiros')
    .select('*')
    .order('criado_em', { ascending: false })
  if (error) throw error
  return data ?? []
}

export async function createParceiro(input: ParceiroInput): Promise<Parceiro> {
  const { data, error } = await supabase
    .from('parceiros')
    .insert(input)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateParceiro(
  id: string,
  input: ParceiroInput,
): Promise<Parceiro> {
  const { data, error } = await supabase
    .from('parceiros')
    .update(input)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteParceiro(id: string): Promise<void> {
  const { error } = await supabase.from('parceiros').delete().eq('id', id)
  if (error) throw error
}
