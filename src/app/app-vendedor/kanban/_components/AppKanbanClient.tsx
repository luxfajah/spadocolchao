"use client"

import { useState, useEffect } from "react"
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Package, Calendar, RotateCcw, Maximize2 } from "lucide-react"
import Link from "next/link"
import {
  KANBAN_COLUMNS,
  OrderStatus,
  canUserPerformTransition,
  UserRoleName
} from "@/lib/order-flow"
import { updateOrderStatus } from "@/app/(admin)/vendas-clientes/pedidos/actions"
import { useToast } from "@/hooks/use-toast"
import { DeliveryModal } from "@/components/pedidos/DeliveryModal"

interface AppKanbanClientProps {
  initialOrders: any[]
  currentUserRole: UserRoleName | null
  kanbanMode: "view" | "full" | "production_only"
  portfolioNotice: string | null
  summary: any
}

export function AppKanbanClient({
  initialOrders,
  currentUserRole,
  kanbanMode,
  portfolioNotice,
  summary,
}: AppKanbanClientProps) {
  const [columns, setColumns] = useState<any>({})
  const [isReady, setIsReady] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<any>(null)
  const [deliveryModalOpen, setDeliveryModalOpen] = useState(false)
  const [isLandscape, setIsLandscape] = useState(false)

  const { toast } = useToast()

  useEffect(() => {
    const cols: any = {}
    KANBAN_COLUMNS.forEach(col => {
      cols[col.id] = initialOrders.filter(o => o.currentStatus === col.id)
    })
    setColumns(cols)
    setIsReady(true)
  }, [initialOrders])

  // Detect orientation
  useEffect(() => {
    const checkOrientation = () => {
      setIsLandscape(window.innerWidth > window.innerHeight)
    }
    checkOrientation()
    window.addEventListener('resize', checkOrientation)
    return () => window.removeEventListener('resize', checkOrientation)
  }, [])

  const onDragEnd = async (result: DropResult) => {
    const { source, destination, draggableId } = result
    if (!destination) return
    if (source.droppableId === destination.droppableId && source.index === destination.index) return

    const fromStatus = source.droppableId as OrderStatus
    const toStatus = destination.droppableId as OrderStatus
    const movedOrder = columns[source.droppableId][source.index]

    if (!currentUserRole || kanbanMode === "view") {
      toast({
        title: "Ação não permitida",
        description: "Seu perfil pode acompanhar o fluxo, mas não pode mover cards.",
        variant: "destructive",
      })
      return
    }

    const transition = canUserPerformTransition(currentUserRole, fromStatus, toStatus)
    if (!transition.allowed) {
      toast({
        title: "Transição Bloqueada",
        description: transition.reason || "Seu perfil não tem permissão para esta ação.",
        variant: "destructive"
      })
      return
    }

    if (transition.requiresData === "DELIVERY") {
      setSelectedOrder(movedOrder)
      setDeliveryModalOpen(true)
      return
    }

    const sourceCol: any[] = Array.from(columns[source.droppableId] || [])
    const destCol: any[] = Array.from(columns[destination.droppableId] || [])
    const [removed] = sourceCol.splice(source.index, 1)
    const updated = { ...(removed as any), currentStatus: toStatus }
    destCol.splice(destination.index, 0, updated)

    setColumns({
      ...columns,
      [source.droppableId]: sourceCol,
      [destination.droppableId]: destCol
    })

    const response = await updateOrderStatus(draggableId, toStatus)
    if (response.error) {
      toast({
        title: "Falha na Sincronização",
        description: response.error,
        variant: "destructive"
      })
      window.location.reload()
    }
  }

  const columnColors: Record<string, string> = {
    "SOLD": "from-blue-500 to-blue-600",
    "WAITING_PREPARATION": "from-amber-400 to-amber-500",
    "IN_PRODUCTION": "from-indigo-500 to-indigo-600",
    "WAITING_DELIVERY": "from-sky-400 to-sky-500",
    "DELIVERED": "from-emerald-400 to-emerald-500",
    "FINALIZED": "from-green-500 to-green-600",
    "CANCELLED": "from-slate-400 to-slate-500",
  }

  const columnBg: Record<string, string> = {
    "SOLD": "bg-blue-50/50",
    "WAITING_PREPARATION": "bg-amber-50/50",
    "IN_PRODUCTION": "bg-indigo-50/50",
    "WAITING_DELIVERY": "bg-sky-50/50",
    "DELIVERED": "bg-emerald-50/50",
    "FINALIZED": "bg-green-50/50",
    "CANCELLED": "bg-slate-50/50",
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
  }

  if (!isReady) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-900 text-white">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto" />
          <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Carregando Kanban...</p>
        </div>
      </div>
    )
  }

  // Show rotate prompt when in portrait
  if (!isLandscape) {
    return (
      <div className="fixed inset-0 z-[100] bg-slate-900 flex flex-col items-center justify-center text-white p-8">
        <div className="animate-pulse mb-6">
          <RotateCcw size={64} className="text-blue-400" />
        </div>
        <h2 className="text-xl font-black uppercase tracking-tight text-center mb-2">
          Gire o celular
        </h2>
        <p className="text-sm text-slate-400 text-center max-w-[250px]">
          O Kanban funciona melhor no modo paisagem. Gire seu dispositivo para continuar.
        </p>
        <Link
          href="/app-vendedor/pdv"
          className="mt-8 flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-white transition-colors uppercase tracking-widest"
        >
          <ArrowLeft size={14} />
          Voltar ao PDV
        </Link>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-[90] bg-slate-50 flex flex-col overflow-hidden">
      {/* Compact Top Bar */}
      <div className="shrink-0 flex items-center justify-between px-4 py-2 bg-white border-b border-slate-100 shadow-sm">
        <div className="flex items-center gap-3">
          <Link
            href="/app-vendedor/pdv"
            className="p-2 -ml-2 text-slate-500 active:bg-slate-100 rounded-full transition-colors"
          >
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-sm font-black uppercase tracking-tight text-slate-900">Fluxo de Pedidos</h1>
            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">
              {initialOrders.length} pedido{initialOrders.length !== 1 ? 's' : ''} • Arraste para mover
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {summary && (
            <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-wide">
              <span className="text-blue-600 bg-blue-50 px-2 py-1 rounded-full">{summary.total || initialOrders.length} total</span>
              <span className="text-amber-600 bg-amber-50 px-2 py-1 rounded-full">{summary.inProduction || 0} produção</span>
              <span className="text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">{summary.delivered || 0} entregues</span>
            </div>
          )}
        </div>
      </div>

      {portfolioNotice && (
        <div className="shrink-0 bg-amber-50 border-b border-amber-100 px-4 py-1.5 text-[10px] font-bold text-amber-700 uppercase tracking-wide">
          ⚠ {portfolioNotice}
        </div>
      )}

      {/* Kanban Board */}
      <div className="flex-1 overflow-hidden">
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="flex gap-0 h-full overflow-x-auto scrollbar-none">
            {KANBAN_COLUMNS.map((column, index) => (
              <div
                key={column.id}
                className={`flex flex-col min-w-[200px] w-[200px] h-full ${
                  index < KANBAN_COLUMNS.length - 1 ? 'border-r border-slate-200/50' : ''
                }`}
              >
                {/* Column Header */}
                <div className={`shrink-0 px-3 py-2 ${columnBg[column.id] || 'bg-slate-50'}`}>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full bg-gradient-to-r ${columnColors[column.id] || 'from-slate-400 to-slate-500'} shadow-sm`} />
                    <h3 className="text-[10px] font-black uppercase tracking-tight text-slate-700 truncate flex-1">
                      {column.title}
                    </h3>
                    <span className="text-[9px] bg-white/80 px-1.5 py-0.5 rounded-full font-black text-slate-400 border border-slate-100 min-w-[20px] text-center">
                      {columns[column.id]?.length || 0}
                    </span>
                  </div>
                </div>

                {/* Column Content */}
                <Droppable droppableId={column.id}>
                  {(provided, snapshot) => (
                    <div
                      {...provided.droppableProps}
                      ref={provided.innerRef}
                      className={`flex-1 overflow-y-auto scrollbar-none p-2 space-y-2 transition-colors duration-200 ${
                        snapshot.isDraggingOver
                          ? 'bg-blue-50/50 ring-1 ring-inset ring-blue-200'
                          : 'bg-slate-50/30'
                      }`}
                    >
                      {columns[column.id]?.map((order: any, idx: number) => (
                        <Draggable
                          key={order.id}
                          draggableId={order.id}
                          index={idx}
                          isDragDisabled={!currentUserRole || kanbanMode === "view"}
                        >
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                            >
                              <Card className={`border-none shadow-sm rounded-xl overflow-hidden cursor-grab active:cursor-grabbing transition-all duration-200 ${
                                snapshot.isDragging ? 'rotate-2 shadow-xl scale-105 ring-2 ring-blue-400' : 'bg-white hover:shadow-md'
                              }`}>
                                <CardContent className="p-3 space-y-2">
                                  {/* Order Code */}
                                  <div className="flex items-center justify-between">
                                    <span className="text-[8px] font-black text-blue-600 uppercase bg-blue-50 px-1.5 py-0.5 rounded-full tracking-wider">
                                      #{order.code || '---'}
                                    </span>
                                    <span className="text-[9px] font-black text-slate-700">
                                      {formatCurrency(order.sale.totalAmount)}
                                    </span>
                                  </div>

                                  {/* Customer */}
                                  <p className="text-[11px] font-black text-slate-800 uppercase tracking-tight leading-tight line-clamp-1">
                                    {order.customer.fullName}
                                  </p>

                                  {/* Product */}
                                  <div className="flex items-center gap-1.5">
                                    <Package className="h-3 w-3 text-slate-300 shrink-0" />
                                    <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wide truncate">
                                      {order.sale.items?.[0]?.description || 'Sem descrição'}
                                    </p>
                                  </div>

                                  {/* Footer */}
                                  <div className="flex items-center justify-between pt-1.5 border-t border-slate-50">
                                    <div className="flex items-center gap-1 text-[8px] font-bold text-slate-400">
                                      <Calendar className="h-3 w-3 text-slate-300" />
                                      {order.promisedDate
                                        ? new Date(order.promisedDate).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
                                        : '---'}
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <div className="w-4 h-4 rounded-full bg-blue-100 flex items-center justify-center text-[7px] font-black text-blue-600">
                                        {order.seller?.name?.charAt(0) || 'V'}
                                      </div>
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </div>
            ))}
          </div>
        </DragDropContext>
      </div>

      <DeliveryModal
        open={deliveryModalOpen}
        onOpenChange={setDeliveryModalOpen}
        order={selectedOrder}
        onSuccess={() => window.location.reload()}
      />
    </div>
  )
}
