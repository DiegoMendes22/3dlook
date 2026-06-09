import { supabase } from '../../lib/supabase'
import type { Produto, ProdutoInput } from './types'

const BUCKET = 'produtos'

/** Lista todos os produtos, mais recentes primeiro. */
export async function listProdutos(): Promise<Produto[]> {
  const { data, error } = await supabase
    .from('produtos')
    .select('*')
    .order('criado_em', { ascending: false })
  if (error) throw error
  return data ?? []
}

export async function createProduto(input: ProdutoInput): Promise<Produto> {
  const { data, error } = await supabase
    .from('produtos')
    .insert(input)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateProduto(
  id: string,
  input: ProdutoInput,
): Promise<Produto> {
  const { data, error } = await supabase
    .from('produtos')
    .update(input)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteProduto(produto: Produto): Promise<void> {
  const { error } = await supabase.from('produtos').delete().eq('id', produto.id)
  if (error) throw error
  // Limpa a foto do Storage (best-effort: não falha a operação se der erro).
  if (produto.foto_url) {
    await supabase.storage.from(BUCKET).remove([produto.foto_url])
  }
}

/** Faz upload da foto e retorna o caminho (object key) salvo em foto_url. */
export async function uploadFoto(file: File): Promise<string> {
  const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
  const path = `${crypto.randomUUID()}.${ext}`
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { cacheControl: '3600', upsert: false })
  if (error) throw error
  return path
}

/** Remove uma foto do Storage (usada ao trocar a imagem). */
export async function removeFoto(path: string): Promise<void> {
  await supabase.storage.from(BUCKET).remove([path])
}

/** Resolve o caminho salvo em foto_url para uma URL pública exibível. */
export function fotoPublicUrl(path: string | null): string | null {
  if (!path) return null
  return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl
}
