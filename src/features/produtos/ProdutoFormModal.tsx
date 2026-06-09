import { useEffect, useRef, useState, type FormEvent } from 'react'
import type { Produto, ProdutoInput } from './types'
import {
  createProduto,
  fotoPublicUrl,
  removeFoto,
  updateProduto,
  uploadFoto,
} from './api'

interface Props {
  /** Produto em edição; null = criação. */
  produto: Produto | null
  onClose: () => void
  onSaved: () => void
}

function parseMoney(v: string): number {
  const n = Number(v.replace(',', '.'))
  return Number.isFinite(n) ? n : 0
}

export default function ProdutoFormModal({ produto, onClose, onSaved }: Props) {
  const editing = !!produto
  const [nome, setNome] = useState(produto?.nome ?? '')
  const [sku, setSku] = useState(produto?.sku ?? '')
  const [descricao, setDescricao] = useState(produto?.descricao ?? '')
  const [custo, setCusto] = useState(
    produto?.custo_producao != null ? String(produto.custo_producao) : '',
  )
  const [preco, setPreco] = useState(
    produto?.preco_venda != null ? String(produto.preco_venda) : '',
  )
  const [ativo, setAtivo] = useState(produto?.ativo ?? true)

  // Foto: caminho atual salvo + arquivo novo + preview.
  const [fotoPath, setFotoPath] = useState<string | null>(produto?.foto_url ?? null)
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(
    fotoPublicUrl(produto?.foto_url ?? null),
  )

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Fecha com ESC.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null
    setFile(f)
    setPreview(f ? URL.createObjectURL(f) : fotoPublicUrl(fotoPath))
  }

  function clearFoto() {
    setFile(null)
    setFotoPath(null)
    setPreview(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!nome.trim()) {
      setError('O nome é obrigatório.')
      return
    }
    setSaving(true)
    setError(null)
    try {
      let novoPath = fotoPath
      // Subiu uma imagem nova: faz upload e descarta a antiga.
      if (file) {
        novoPath = await uploadFoto(file)
        if (produto?.foto_url && produto.foto_url !== novoPath) {
          await removeFoto(produto.foto_url)
        }
      }

      const input: ProdutoInput = {
        nome: nome.trim(),
        sku: sku.trim() || null,
        descricao: descricao.trim() || null,
        custo_producao: parseMoney(custo),
        preco_venda: parseMoney(preco),
        ativo,
        foto_url: novoPath,
      }

      if (editing) await updateProduto(produto!.id, input)
      else await createProduto(input)
      onSaved()
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro ao salvar o produto.'
      // Mensagem amigável para SKU duplicado.
      setError(
        /duplicate key|unique/i.test(msg)
          ? 'Já existe um produto com esse SKU.'
          : msg,
      )
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="drawer"
        role="dialog"
        aria-modal="true"
        aria-label={editing ? 'Editar produto' : 'Novo produto'}
        onClick={(e) => e.stopPropagation()}
      >
        <header className="drawer-header">
          <h2>{editing ? 'Editar produto' : 'Novo produto'}</h2>
          <button
            type="button"
            className="icon-btn"
            onClick={onClose}
            aria-label="Fechar"
          >
            ✕
          </button>
        </header>

        <form className="drawer-body" onSubmit={handleSubmit}>
          {/* Foto */}
          <div className="foto-field">
            <div className="foto-preview">
              {preview ? (
                <img src={preview} alt="Pré-visualização" />
              ) : (
                <span className="foto-placeholder">Sem foto</span>
              )}
            </div>
            <div className="foto-actions">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                hidden
              />
              <button
                type="button"
                className="btn-ghost"
                onClick={() => fileInputRef.current?.click()}
              >
                {preview ? 'Trocar foto' : 'Adicionar foto'}
              </button>
              {preview && (
                <button type="button" className="btn-ghost btn-danger-ghost" onClick={clearFoto}>
                  Remover
                </button>
              )}
            </div>
          </div>

          <label className="field">
            <span className="field-label">Nome *</span>
            <input value={nome} onChange={(e) => setNome(e.target.value)} required />
          </label>

          <label className="field">
            <span className="field-label">SKU</span>
            <input value={sku} onChange={(e) => setSku(e.target.value)} placeholder="Código único (opcional)" />
          </label>

          <label className="field">
            <span className="field-label">Descrição</span>
            <textarea
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              rows={3}
            />
          </label>

          <div className="field-row">
            <label className="field">
              <span className="field-label">Custo de produção (R$)</span>
              <input
                type="number"
                step="0.01"
                min="0"
                value={custo}
                onChange={(e) => setCusto(e.target.value)}
                placeholder="0,00"
              />
            </label>
            <label className="field">
              <span className="field-label">Preço de venda (R$)</span>
              <input
                type="number"
                step="0.01"
                min="0"
                value={preco}
                onChange={(e) => setPreco(e.target.value)}
                placeholder="0,00"
              />
            </label>
          </div>

          <label className="switch-field">
            <input
              type="checkbox"
              checked={ativo}
              onChange={(e) => setAtivo(e.target.checked)}
            />
            <span>Produto ativo</span>
          </label>

          {error && <div className="form-error">{error}</div>}

          <div className="drawer-footer">
            <button type="button" className="btn-ghost" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? 'Salvando…' : editing ? 'Salvar' : 'Criar produto'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
