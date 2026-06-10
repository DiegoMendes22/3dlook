import { useEffect, useRef, useState, type FormEvent } from 'react'
import {
  getEmpresa,
  logoPublicUrl,
  removeLogo,
  updateEmpresa,
  uploadLogo,
  type EmpresaInput,
} from './api'

export default function EmpresaPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [salvo, setSalvo] = useState(false)

  const [nome, setNome] = useState('')
  const [cnpj, setCnpj] = useState('')
  const [contato, setContato] = useState('')
  const [telefone, setTelefone] = useState('')
  const [email, setEmail] = useState('')
  const [endereco, setEndereco] = useState('')

  const [logoPath, setLogoPath] = useState<string | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  // Caminho que está de fato salvo no banco, para limpar o arquivo antigo.
  const logoSalvo = useRef<string | null>(null)

  useEffect(() => {
    getEmpresa()
      .then((e) => {
        setNome(e.nome ?? '')
        setCnpj(e.cnpj ?? '')
        setContato(e.contato ?? '')
        setTelefone(e.telefone ?? '')
        setEmail(e.email ?? '')
        setEndereco(e.endereco ?? '')
        setLogoPath(e.logo_url)
        setPreview(logoPublicUrl(e.logo_url))
        logoSalvo.current = e.logo_url
      })
      .catch((err) =>
        setError(err instanceof Error ? err.message : 'Erro ao carregar a empresa.'),
      )
      .finally(() => setLoading(false))
  }, [])

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null
    setFile(f)
    setPreview(f ? URL.createObjectURL(f) : logoPublicUrl(logoPath))
    setSalvo(false)
  }

  function clearLogo() {
    setFile(null)
    setLogoPath(null)
    setPreview(null)
    if (fileRef.current) fileRef.current.value = ''
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!nome.trim()) {
      setError('O nome da empresa é obrigatório.')
      return
    }
    setSaving(true)
    setError(null)
    setSalvo(false)
    try {
      let novoPath = logoPath
      if (file) novoPath = await uploadLogo(file)

      const input: EmpresaInput = {
        nome: nome.trim(),
        cnpj: cnpj.trim() || null,
        contato: contato.trim() || null,
        telefone: telefone.trim() || null,
        email: email.trim() || null,
        endereco: endereco.trim() || null,
        logo_url: novoPath,
      }
      await updateEmpresa(input)

      // Remove o arquivo anterior do bucket se o logo mudou (troca ou remoção).
      const anterior = logoSalvo.current
      if (anterior && anterior !== novoPath) await removeLogo(anterior)
      logoSalvo.current = novoPath

      setLogoPath(novoPath)
      setFile(null)
      setSalvo(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <section className="page">
        <h1 className="page-title">Minha empresa</h1>
        <div className="list-state">
          <div className="spinner" />
        </div>
      </section>
    )
  }

  return (
    <section className="page">
      <h1 className="page-title">Minha empresa</h1>
      <p className="page-subtitle">
        Esses dados aparecem no cabeçalho dos orçamentos.
      </p>

      <form className="empresa-form" onSubmit={handleSubmit}>
        <div className="foto-field logo-field">
          <div className="foto-preview logo-preview">
            {preview ? (
              <img src={preview} alt="Logo da empresa" />
            ) : (
              <span className="foto-placeholder">Sem logo</span>
            )}
          </div>
          <div className="foto-actions">
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              onChange={handleFile}
              hidden
            />
            <button
              type="button"
              className="btn-ghost"
              onClick={() => fileRef.current?.click()}
            >
              {preview ? 'Trocar logo' : 'Adicionar logo'}
            </button>
            {preview && (
              <button
                type="button"
                className="btn-ghost btn-danger-ghost"
                onClick={clearLogo}
              >
                Remover
              </button>
            )}
          </div>
        </div>

        <label className="field">
          <span className="field-label">Nome *</span>
          <input value={nome} onChange={(e) => setNome(e.target.value)} required />
        </label>

        <div className="field-row">
          <label className="field">
            <span className="field-label">CNPJ</span>
            <input
              value={cnpj}
              onChange={(e) => setCnpj(e.target.value)}
              placeholder="00.000.000/0000-00"
            />
          </label>
          <label className="field">
            <span className="field-label">Contato</span>
            <input value={contato} onChange={(e) => setContato(e.target.value)} />
          </label>
        </div>

        <div className="field-row">
          <label className="field">
            <span className="field-label">Telefone</span>
            <input
              value={telefone}
              onChange={(e) => setTelefone(e.target.value)}
              placeholder="(00) 00000-0000"
            />
          </label>
          <label className="field">
            <span className="field-label">E-mail</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="contato@empresa.com"
            />
          </label>
        </div>

        <label className="field">
          <span className="field-label">Endereço</span>
          <textarea
            value={endereco}
            onChange={(e) => setEndereco(e.target.value)}
            rows={2}
          />
        </label>

        {error && <div className="form-error">{error}</div>}
        {salvo && <div className="form-success">Dados salvos com sucesso.</div>}

        <div className="empresa-actions">
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? 'Salvando…' : 'Salvar'}
          </button>
        </div>
      </form>
    </section>
  )
}
