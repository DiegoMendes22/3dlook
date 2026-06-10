export const brl = (n: number | null | undefined) =>
  (n ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

/** Formata 'YYYY-MM-DD' (ou ISO) como dd/mm/aaaa, sem deslocamento de fuso. */
export const dataBR = (iso: string | null | undefined) => {
  if (!iso) return '—'
  const [y, m, d] = iso.slice(0, 10).split('-')
  return `${d}/${m}/${y}`
}

/** Data de hoje em 'YYYY-MM-DD' (horário local). */
export const hojeISO = () => emDiasISO(0)

/** Data daqui a N dias em 'YYYY-MM-DD' (horário local). */
export const emDiasISO = (dias: number) => {
  const d = new Date()
  d.setDate(d.getDate() + dias)
  const off = d.getTimezoneOffset()
  return new Date(d.getTime() - off * 60000).toISOString().slice(0, 10)
}
