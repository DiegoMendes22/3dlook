import { useEffect, useMemo, useState } from 'react'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import { listPedidos, updateStatusPedido } from './api'
import type { Pedido, PedidoStatus, SituacaoFinanceira } from './types'
import { COLUNAS, SITUACAO_LABEL } from './types'
import { listClientes } from '../clientes/api'
import type { Cliente } from '../clientes/types'
import PedidoDetailModal from './PedidoDetailModal'
import { brl } from '../../lib/format'

const situacaoClass: Record<SituacaoFinanceira, string> = {
  aberto: 'badge badge--recusado',
  parcial: 'badge badge--rascunho',
  pago: 'badge badge--aprovado',
}

function CardConteudo({ pedido }: { pedido: Pedido }) {
  return (
    <>
      <div className="kanban-card-numero">{pedido.numero}</div>
      <div className="kanban-card-cliente">{pedido.cliente?.nome ?? '—'}</div>
      <div className="kanban-card-foot">
        <span className="kanban-card-total">{brl(pedido.total)}</span>
        {pedido.status === 'entregue' && pedido.financeiro && (
          <span className={situacaoClass[pedido.financeiro.situacao]}>
            {SITUACAO_LABEL[pedido.financeiro.situacao]}
          </span>
        )}
      </div>
    </>
  )
}

function KanbanCard({
  pedido,
  onAbrir,
}: {
  pedido: Pedido
  onAbrir: (p: Pedido) => void
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: pedido.id,
  })
  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      className="kanban-card"
      style={isDragging ? { opacity: 0.4 } : undefined}
      onClick={() => onAbrir(pedido)}
    >
      <CardConteudo pedido={pedido} />
    </div>
  )
}

function KanbanColuna({
  status,
  label,
  pedidos,
  onAbrir,
}: {
  status: PedidoStatus
  label: string
  pedidos: Pedido[]
  onAbrir: (p: Pedido) => void
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status })
  return (
    <div className="kanban-col">
      <div className="kanban-col-head">
        <span className="kanban-col-titulo">{label}</span>
        <span className="kanban-col-count">{pedidos.length}</span>
      </div>
      <div
        ref={setNodeRef}
        className={isOver ? 'kanban-col-body kanban-col-body--over' : 'kanban-col-body'}
      >
        {pedidos.map((p) => (
          <KanbanCard key={p.id} pedido={p} onAbrir={onAbrir} />
        ))}
        {pedidos.length === 0 && <div className="kanban-vazio">—</div>}
      </div>
    </div>
  )
}

export default function PedidosPage() {
  const [pedidos, setPedidos] = useState<Pedido[]>([])
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [fCliente, setFCliente] = useState('')
  const [detalhe, setDetalhe] = useState<Pedido | null>(null)
  const [arrastando, setArrastando] = useState<Pedido | null>(null)

  // Toque com delay distingue rolar (swipe) de arrastar (segurar + mover).
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } }),
  )

  async function carregar() {
    setError(null)
    try {
      setPedidos(await listPedidos())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar pedidos.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    carregar()
    listClientes()
      .then(setClientes)
      .catch(() => {})
  }, [])

  const visiveis = useMemo(
    () => (fCliente ? pedidos.filter((p) => p.cliente_id === fCliente) : pedidos),
    [pedidos, fCliente],
  )

  function handleDragStart(e: DragStartEvent) {
    setArrastando(pedidos.find((p) => p.id === e.active.id) ?? null)
  }

  async function handleDragEnd(e: DragEndEvent) {
    setArrastando(null)
    const { active, over } = e
    if (!over) return
    const id = String(active.id)
    const destino = over.id as PedidoStatus
    const pedido = pedidos.find((p) => p.id === id)
    if (!pedido || pedido.status === destino) return

    const anterior = pedido.status
    // Atualização otimista: move o card na hora.
    setPedidos((ps) => ps.map((p) => (p.id === id ? { ...p, status: destino } : p)))

    try {
      await updateStatusPedido(id, destino)
      // Releitura: ao entrar em "Entregue", o banco fixa o valor e o financeiro.
      await carregar()
    } catch (err) {
      // Reverte e avisa.
      setPedidos((ps) => ps.map((p) => (p.id === id ? { ...p, status: anterior } : p)))
      alert(
        'Não foi possível mover o pedido. ' +
          (err instanceof Error ? err.message : ''),
      )
    }
  }

  return (
    <section className="page">
      <div className="page-head">
        <h1 className="page-title">Pedidos</h1>
      </div>

      <div className="filtros">
        <select value={fCliente} onChange={(e) => setFCliente(e.target.value)}>
          <option value="">Todos os clientes</option>
          {clientes.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nome}
            </option>
          ))}
        </select>
      </div>

      {loading && (
        <div className="list-state">
          <div className="spinner" />
        </div>
      )}

      {error && !loading && <div className="form-error">{error}</div>}

      {!loading && !error && (
        <DndContext
          sensors={sensors}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDragCancel={() => setArrastando(null)}
        >
          <div className="kanban">
            {COLUNAS.map((col) => (
              <KanbanColuna
                key={col.status}
                status={col.status}
                label={col.label}
                pedidos={visiveis.filter((p) => p.status === col.status)}
                onAbrir={setDetalhe}
              />
            ))}
          </div>

          <DragOverlay>
            {arrastando ? (
              <div className="kanban-card kanban-card--overlay">
                <CardConteudo pedido={arrastando} />
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      )}

      {detalhe && (
        <PedidoDetailModal
          pedido={detalhe}
          onClose={() => setDetalhe(null)}
          onChange={carregar}
        />
      )}
    </section>
  )
}
