import { supabase } from '../../lib/supabase'
import type { Cliente, ClienteInput } from './types'

/** Lista todos os clientes, mais recentes primeiro. */
export async function listClientes(): Promise<Cliente[]> {
  const { data, error } = await supabase
    .from('clientes')
    .select('*')
    .order('criado_em', { ascending: false })
  if (error) throw error
  return data ?? []
}

export async function getCliente(id: string): Promise<Cliente> {
  const { data, error } = await supabase
    .from('clientes')
    .select('*')
    .eq('id', id)
    .single()
  if (error) throw error
  return data
}

export async function createCliente(input: ClienteInput): Promise<Cliente> {
  const { data, error } = await supabase
    .from('clientes')
    .insert(input)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateCliente(
  id: string,
  input: ClienteInput,
): Promise<Cliente> {
  const { data, error } = await supabase
    .from('clientes')
    .update(input)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteCliente(id: string): Promise<void> {
  const { error } = await supabase.from('clientes').delete().eq('id', id)
  if (error) throw error
}
