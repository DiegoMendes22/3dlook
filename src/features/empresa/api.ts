import { supabase } from '../../lib/supabase'

export interface Empresa {
  id: number
  nome: string
  cnpj: string | null
  contato: string | null
  telefone: string | null
  email: string | null
  endereco: string | null
  logo_url: string | null
  atualizado_em: string
}

export interface EmpresaInput {
  nome: string
  cnpj: string | null
  contato: string | null
  telefone: string | null
  email: string | null
  endereco: string | null
  logo_url: string | null
}

// O logo é guardado no bucket de imagens já existente.
const BUCKET = 'produtos'

/** Lê a única linha da empresa (id = 1). */
export async function getEmpresa(): Promise<Empresa> {
  const { data, error } = await supabase
    .from('empresa')
    .select('*')
    .eq('id', 1)
    .single()
  if (error) throw error
  return data
}

export async function updateEmpresa(input: EmpresaInput): Promise<Empresa> {
  const { data, error } = await supabase
    .from('empresa')
    .update(input)
    .eq('id', 1)
    .select()
    .single()
  if (error) throw error
  return data
}

/** Faz upload do logo e retorna o caminho salvo em logo_url. */
export async function uploadLogo(file: File): Promise<string> {
  const ext = file.name.split('.').pop()?.toLowerCase() || 'png'
  const path = `empresa/${crypto.randomUUID()}.${ext}`
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { cacheControl: '3600', upsert: false })
  if (error) throw error
  return path
}

export async function removeLogo(path: string): Promise<void> {
  await supabase.storage.from(BUCKET).remove([path])
}

/** Resolve o caminho de logo_url para uma URL pública exibível. */
export function logoPublicUrl(path: string | null): string | null {
  if (!path) return null
  return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl
}
