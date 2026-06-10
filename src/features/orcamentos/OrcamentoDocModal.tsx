import { useEffect, useRef, useState } from 'react'
import { getCliente } from '../clientes/api'
import type { Cliente } from '../clientes/types'
import { getEmpresa, logoPublicUrl, type Empresa } from '../empresa/api'
import { pdfBlob, pdfSave, telefoneWhats } from '../../lib/pdf'
import { brl, dataBR } from '../../lib/format'
import type { Orcamento } from './types'

interface Props {
  orcamento: Orcamento
  onClose: () => void
}

export default function OrcamentoDocModal({ orcamento, onClose }: Props) {
  const [empresa, setEmpresa] = useState<Empresa | null>(null)
  const [cliente, setCliente] = useState<Cliente | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sharing, setSharing] = useState(false)
  const docRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  useEffect(() => {
    Promise.all([getEmpresa(), getCliente(orcamento.cliente_id)])
      .then(([e, c]) => {
        setEmpresa(e)
        setCliente(c)
      })
      .catch((err) =>
        setError(err instanceof Error ? err.message : 'Erro ao carregar o documento.'),
      )
      .finally(() => setLoading(false))
  }, [orcamento.cliente_id])

  const nomeArquivo = `${orcamento.numero ?? 'orcamento'}.pdf`
  const logo = logoPublicUrl(empresa?.logo_url ?? null)

  function imprimir() {
    window.print()
  }

  async function compartilhar() {
    const fone = telefoneWhats(cliente?.telefone)
    if (!fone) {
      alert('Este cliente não tem telefone/WhatsApp cadastrado.')
      return
    }
    const el = docRef.current
    if (!el) return

    const resumo =
      `Olá${cliente?.nome ? ' ' + cliente.nome : ''}! Segue o orçamento ` +
      `${orcamento.numero ?? ''} no valor de ${brl(orcamento.total)}.` +
      (orcamento.validade ? ` Validade: ${dataBR(orcamento.validade)}.` : '')

    setSharing(true)
    try {
      // Caminho 1 (mobile/PWA): Web Share API com o arquivo — envia o PDF de fato.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const nav = navigator as any
      if (nav.canShare) {
        const blob = await pdfBlob(el, nomeArquivo)
        const file = new File([blob], nomeArquivo, { type: 'application/pdf' })
        if (nav.canShare({ files: [file] })) {
          await nav.share({
            files: [file],
            title: orcamento.numero ?? 'Orçamento',
            text: resumo,
          })
          return
        }
      }

      // Caminho 2 (desktop / WhatsApp Web): abre a conversa no número cadastrado
      // (o WhatsApp Web exige estar conectado) e baixa o PDF para anexar.
      const win = window.open(
        `https://wa.me/${fone}?text=${encodeURIComponent(resumo)}`,
        '_blank',
        'noopener',
      )
      if (!win) {
        alert('Não foi possível abrir o WhatsApp. Verifique o bloqueador de pop-ups.')
        return
      }
      await pdfSave(el, nomeArquivo)
    } catch (err) {
      // Usuário cancelou a folha de compartilhamento: ignora.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if ((err as any)?.name === 'AbortError') return
      alert(err instanceof Error ? err.message : 'Erro ao compartilhar.')
    } finally {
      setSharing(false)
    }
  }

  const linhasEmpresa = [
    empresa?.cnpj && `CNPJ: ${empresa.cnpj}`,
    empresa?.contato,
    empresa?.telefone,
    empresa?.email,
    empresa?.endereco,
  ].filter(Boolean) as string[]

  const linhasCliente = [
    cliente?.cnpj_cpf,
    cliente?.telefone,
    cliente?.email,
    cliente?.endereco,
  ].filter(Boolean) as string[]

  return (
    <div className="modal-overlay doc-modal-overlay" onClick={onClose}>
      <div className="doc-modal" onClick={(e) => e.stopPropagation()}>
        <div className="doc-toolbar">
          <button type="button" className="btn-ghost" onClick={onClose}>
            Fechar
          </button>
          <div className="doc-toolbar-actions">
            <button
              type="button"
              className="btn-ghost"
              onClick={compartilhar}
              disabled={loading || sharing}
            >
              {sharing ? 'Preparando…' : 'Compartilhar'}
            </button>
            <button
              type="button"
              className="btn-primary"
              onClick={imprimir}
              disabled={loading}
            >
              Gerar PDF
            </button>
          </div>
        </div>

        {loading && (
          <div className="list-state">
            <div className="spinner" />
          </div>
        )}
        {error && <div className="form-error">{error}</div>}

        {!loading && !error && (
          <div className="print-doc" ref={docRef}>
            <header className="doc-header">
              <div className="doc-empresa">
                {logo && <img className="doc-logo" src={logo} alt="" />}
                <div>
                  <div className="doc-empresa-nome">{empresa?.nome}</div>
                  {linhasEmpresa.map((l) => (
                    <div key={l} className="doc-line">
                      {l}
                    </div>
                  ))}
                </div>
              </div>
              <div className="doc-meta">
                <div className="doc-numero">{orcamento.numero}</div>
                <div className="doc-line">Emissão: {dataBR(orcamento.data_emissao)}</div>
                {orcamento.validade && (
                  <div className="doc-line">Validade: {dataBR(orcamento.validade)}</div>
                )}
              </div>
            </header>

            <h1 className="doc-title">Orçamento</h1>

            <section className="doc-cliente">
              <div className="doc-bloco-titulo">Cliente</div>
              <div className="doc-cliente-nome">{cliente?.nome}</div>
              {linhasCliente.map((l) => (
                <div key={l} className="doc-line">
                  {l}
                </div>
              ))}
            </section>

            <table className="doc-itens">
              <thead>
                <tr>
                  <th>Produto</th>
                  <th className="num">Qtd</th>
                  <th className="num">Preço un.</th>
                  <th className="num">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {orcamento.itens.map((i) => (
                  <tr key={i.id}>
                    <td>
                      {i.produto?.nome ?? 'Produto'}
                      {i.produto?.sku && <span className="doc-sku"> ({i.produto.sku})</span>}
                    </td>
                    <td className="num">{i.quantidade}</td>
                    <td className="num">{brl(i.preco_unitario)}</td>
                    <td className="num">{brl(i.quantidade * i.preco_unitario)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={3} className="doc-total-label">
                    Total
                  </td>
                  <td className="num doc-total-valor">{brl(orcamento.total)}</td>
                </tr>
              </tfoot>
            </table>

            {orcamento.condicoes && (
              <section className="doc-secao">
                <div className="doc-bloco-titulo">Condições de pagamento</div>
                <p className="doc-line">{orcamento.condicoes}</p>
              </section>
            )}

            {orcamento.observacao && (
              <section className="doc-secao">
                <div className="doc-bloco-titulo">Observações</div>
                <p className="doc-line">{orcamento.observacao}</p>
              </section>
            )}

            <footer className="doc-rodape">
              Documento gerado por {empresa?.nome}. Este orçamento não é um documento
              fiscal.
            </footer>
          </div>
        )}
      </div>
    </div>
  )
}
