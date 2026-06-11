import { useEffect, useMemo, useState } from 'react'
import {
  getEstoqueParado,
  getRendimentoPonto,
  getResumo,
  getTopProdutos,
  getVendasMensal,
  type BarraReceita,
  type EstoqueParado,
  type Resumo,
  type VendaMes,
} from './api'
import { brl } from '../../lib/format'

const numero = (n: number) => n.toLocaleString('pt-BR')

function diasSelo(dias: number): { cls: string } {
  if (dias <= 30) return { cls: 'badge badge--on' }
  if (dias <= 60) return { cls: 'badge badge--rascunho' }
  return { cls: 'badge badge--recusado' }
}

/** Lista de barras horizontais (largura proporcional ao maior valor). */
function BarrasReceita({ itens }: { itens: BarraReceita[] }) {
  const max = Math.max(1, ...itens.map((i) => i.receita))
  return (
    <div className="bar-list">
      {itens.map((i) => (
        <div key={i.chave} className="bar-row">
          <div className="bar-head">
            <span className="bar-label">{i.nome}</span>
            <span className="bar-value">{brl(i.receita)}</span>
          </div>
          <div className="bar-track">
            <div
              className="bar-fill"
              style={{ width: `${Math.max(2, (i.receita / max) * 100)}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}

/** Últimos 6 meses (preenche meses sem venda com zero). */
function ultimos6Meses(vendas: VendaMes[]) {
  const mapa = new Map(vendas.map((v) => [v.mes, v.receita]))
  const hoje = new Date()
  const out: { key: string; label: string; receita: number }[] = []
  for (let i = 5; i >= 0; i--) {
    const d = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    const label = d
      .toLocaleDateString('pt-BR', { month: 'short' })
      .replace('.', '')
    out.push({ key, label, receita: mapa.get(key) ?? 0 })
  }
  return out
}

export default function PainelPage() {
  const [resumo, setResumo] = useState<Resumo | null>(null)
  const [topProdutos, setTopProdutos] = useState<BarraReceita[]>([])
  const [pontos, setPontos] = useState<BarraReceita[]>([])
  const [parado, setParado] = useState<EstoqueParado[]>([])
  const [vendas, setVendas] = useState<VendaMes[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([
      getResumo(),
      getTopProdutos(),
      getRendimentoPonto(),
      getEstoqueParado(),
      getVendasMensal(),
    ])
      .then(([r, tp, pt, ep, vm]) => {
        setResumo(r)
        setTopProdutos(tp)
        setPontos(pt)
        setParado(ep)
        setVendas(vm)
      })
      .catch((err) =>
        setError(err instanceof Error ? err.message : 'Erro ao carregar o painel.'),
      )
      .finally(() => setLoading(false))
  }, [])

  const meses = useMemo(() => ultimos6Meses(vendas), [vendas])
  const maxMes = Math.max(1, ...meses.map((m) => m.receita))

  if (loading) {
    return (
      <section className="page">
        <h1 className="page-title">Painel</h1>
        <div className="list-state">
          <div className="spinner" />
        </div>
      </section>
    )
  }

  if (error) {
    return (
      <section className="page">
        <h1 className="page-title">Painel</h1>
        <div className="form-error">{error}</div>
      </section>
    )
  }

  return (
    <section className="page">
      <h1 className="page-title">Painel</h1>

      {/* KPIs */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <span className="kpi-label">Receita total</span>
          <strong className="kpi-valor">{brl(resumo?.receita_total ?? 0)}</strong>
        </div>
        <div className="kpi-card">
          <span className="kpi-label">Total a receber</span>
          <strong className="kpi-valor">{brl(resumo?.total_a_receber ?? 0)}</strong>
        </div>
        <div className="kpi-card">
          <span className="kpi-label">Estoque a custo</span>
          <strong className="kpi-valor">{brl(resumo?.valor_estoque_custo ?? 0)}</strong>
        </div>
        <div className="kpi-card">
          <span className="kpi-label">Unidades nos pontos</span>
          <strong className="kpi-valor">{numero(resumo?.unidades_em_pontos ?? 0)}</strong>
        </div>
        <div className="kpi-card">
          <span className="kpi-label">Unidades na oficina</span>
          <strong className="kpi-valor">{numero(resumo?.unidades_oficina ?? 0)}</strong>
        </div>
      </div>

      {/* Vendas mensais */}
      <div className="painel-secao">
        <div className="painel-secao-titulo">Vendas nos últimos 6 meses</div>
        <div className="chart">
          {meses.map((m) => (
            <div key={m.key} className="chart-col">
              <span className="chart-col-value">{m.receita > 0 ? brl(m.receita) : ''}</span>
              <div className="chart-bar-area">
                <div
                  className="chart-bar"
                  style={{ height: `${(m.receita / maxMes) * 100}%` }}
                />
              </div>
              <span className="chart-col-label">{m.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Top produtos */}
      <div className="painel-secao">
        <div className="painel-secao-titulo">Top produtos por receita</div>
        {topProdutos.length > 0 ? (
          <BarrasReceita itens={topProdutos} />
        ) : (
          <p className="painel-vazio">Sem vendas registradas.</p>
        )}
      </div>

      {/* Rendimento por ponto */}
      <div className="painel-secao">
        <div className="painel-secao-titulo">Rendimento por ponto de venda</div>
        {pontos.length > 0 ? (
          <BarrasReceita itens={pontos} />
        ) : (
          <p className="painel-vazio">Sem vendas em pontos.</p>
        )}
      </div>

      {/* Estoque parado */}
      <div className="painel-secao">
        <div className="painel-secao-titulo">Estoque parado</div>
        {parado.length > 0 ? (
          <ul className="parado-list">
            {parado.map((p) => (
              <li key={`${p.produto_id}-${p.ponto}`} className="parado-item">
                <div className="parado-info">
                  <span className="parado-produto">{p.produto}</span>
                  <span className="parado-ponto">{p.ponto}</span>
                </div>
                <div className="parado-valores">
                  <span className="parado-saldo">{numero(p.saldo)} un.</span>
                  <span className={diasSelo(p.dias_sem_vender).cls}>
                    {p.dias_sem_vender}d
                  </span>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="painel-vazio">Nenhum item parado. 🎉</p>
        )}
      </div>
    </section>
  )
}
