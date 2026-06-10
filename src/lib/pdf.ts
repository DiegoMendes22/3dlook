// Geração de PDF a partir de um elemento (carregada sob demanda).
async function instancia() {
  const mod = await import('html2pdf.js')
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return ((mod as any).default ?? mod) as any
}

function opcoes(filename: string) {
  return {
    margin: [10, 10, 10, 10],
    filename,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2, backgroundColor: '#ffffff', useCORS: true },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
  }
}

/** Gera o PDF do elemento como Blob (para compartilhar via Web Share). */
export async function pdfBlob(el: HTMLElement, filename: string): Promise<Blob> {
  const html2pdf = await instancia()
  return html2pdf().set(opcoes(filename)).from(el).outputPdf('blob')
}

/** Gera e baixa o PDF do elemento. */
export async function pdfSave(el: HTMLElement, filename: string): Promise<void> {
  const html2pdf = await instancia()
  await html2pdf().set(opcoes(filename)).from(el).save()
}

/**
 * Normaliza um telefone para o formato do WhatsApp (só dígitos, com DDI).
 * Assume Brasil (55) quando não há código de país.
 */
export function telefoneWhats(telefone: string | null | undefined): string | null {
  if (!telefone) return null
  let d = telefone.replace(/\D/g, '')
  if (!d) return null
  if (d.length <= 11) d = '55' + d
  return d
}
