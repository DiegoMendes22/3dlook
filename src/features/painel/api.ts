import { supabase } from '../../lib/supabase'

export interface Resumo {
  receita_total: number
  total_a_receber: number
  valor_estoque_custo: number
  unidades_em_pontos: number
  unidades_oficina: number
}

export interface BarraReceita {
  chave: string
  nome: string
  receita: number
  unidades: number
}

export interface EstoqueParado {
  produto_id: string
  produto: string
  ponto: string
  saldo: number
  dias_sem_vender: number
}

export interface VendaMes {
  mes: string // 'YYYY-MM'
  receita: number
  unidades: number
}

export async function getResumo(): Promise<Resumo | null> {
  const { data, error } = await supabase.from('v_resumo').select('*').maybeSingle()
  if (error) throw error
  return data as Resumo | null
}

export async function getTopProdutos(): Promise<BarraReceita[]> {
  const { data, error } = await supabase
    .from('v_top_produtos')
    .select('produto_id, produto, unidades, receita')
    .order('receita', { ascending: false })
    .limit(5)
  if (error) throw error
  return (data ?? []).map((r) => ({
    chave: r.produto_id,
    nome: r.produto,
    receita: Number(r.receita),
    unidades: r.unidades,
  }))
}

export async function getRendimentoPonto(): Promise<BarraReceita[]> {
  const { data, error } = await supabase
    .from('v_rendimento_ponto')
    .select('parceiro_id, ponto, unidades, receita')
    .order('receita', { ascending: false })
  if (error) throw error
  return (data ?? []).map((r, i) => ({
    chave: r.parceiro_id ?? `ponto-${i}`,
    nome: r.ponto,
    receita: Number(r.receita),
    unidades: r.unidades,
  }))
}

export async function getEstoqueParado(): Promise<EstoqueParado[]> {
  const { data, error } = await supabase
    .from('v_estoque_parado')
    .select('produto_id, produto, ponto, saldo, dias_sem_vender')
    .order('dias_sem_vender', { ascending: false })
  if (error) throw error
  return (data ?? []) as EstoqueParado[]
}

/** Lê v_vendas_mensal e soma os canais por mês. */
export async function getVendasMensal(): Promise<VendaMes[]> {
  const { data, error } = await supabase
    .from('v_vendas_mensal')
    .select('mes, canal, unidades, receita')
  if (error) throw error

  const mapa = new Map<string, VendaMes>()
  for (const r of data ?? []) {
    const mes = String(r.mes).slice(0, 7)
    const cur = mapa.get(mes) ?? { mes, receita: 0, unidades: 0 }
    cur.receita += Number(r.receita)
    cur.unidades += Number(r.unidades)
    mapa.set(mes, cur)
  }
  return [...mapa.values()]
}
