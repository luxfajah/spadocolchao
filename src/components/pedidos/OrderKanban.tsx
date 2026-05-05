"use client"

import { useState, useEffect } from "react"
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  Package, 
  Calendar, 
  MoreVertical,
  MoreHorizontal,
  Eye,
} from "lucide-react"
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu"
import Link from "next/link"
import { 
  KANBAN_COLUMNS, 
  OrderStatus, 
  canUserPerformTransition, 
  UserRoleName 
} from "@/lib/order-flow"
import { updateOrderStatus } from "@/app/(admin)/vendas-clientes/pedidos/actions"
import { useToast } from "@/hooks/use-toast"
import { DeliveryModal } from "./DeliveryModal"

interface OrderKanbanProps {
  initialOrders: any[]
  currentUserRole: UserRoleName | null
  kanbanMode: "view" | "full" | "production_only"
}

export function OrderKanban({ initialOrders, currentUserRole, kanbanMode }: OrderKanbanProps) {
  const [columns, setColumns] = useState<any>({})
  const [isReady, setIsReady] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<any>(null)
  const [deliveryModalOpen, setDeliveryModalOpen] = useState(false)
  
  const { toast } = useToast()

  useEffect(() => {
    const cols: any = {}
    KANBAN_COLUMNS.forEach(col => {
      cols[col.id] = initialOrders.filter(o => o.currentStatus === col.id)
    })
    setColumns(cols)
    setIsReady(true)
  }, [initialOrders])

  const onDragEnd = async (result: DropResult) => {
    const { source, destination, draggableId } = result

    if (!destination) return
    if (source.droppableId === destination.droppableId && source.index === destination.index) return

    const fromStatus = source.droppableId as OrderStatus
    const toStatus = destination.droppableId as OrderStatus
    
    // Find the order being moved
    const movedOrder = columns[source.droppableId][source.index]

    if (!currentUserRole || kanbanMode === "view") {
      toast({
        title: "Ação não permitida",
        description: "Seu perfil pode acompanhar o fluxo, mas não pode mover cards.",
        variant: "destructive",
      })
      return
    }

    // Validate Transition locally first
    const transition = canUserPerformTransition(currentUserRole, fromStatus, toStatus)

    if (!transition.allowed) {
      toast({
        title: "Transição Bloqueada",
        description: transition.reason || "Seu perfil não tem permissão para esta ação.",
        variant: "destructive"
      })
      return
    }

    // Intercept Modals
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

    // Persist to Server
    const response = await updateOrderStatus(draggableId, toStatus)

    if (response.error) {
       toast({
         title: "Falha na Sincronização",
         description: response.error,
         variant: "destructive"
       })
       // Rollback (Simplificado: recarrega a página ou restaura colunas se necessário)
       window.location.reload()
    }
  }

  const getOperationalStatusBadge = (status: OrderStatus) => {
    const config = KANBAN_COLUMNS.find(c => c.id === status)
    if (!config) return null
    
    const colorMap: Record<string, string> = {
      "SOLD": "bg-blue-500/10 text-blue-600 border-blue-500/20",
      "WAITING_PREPARATION": "bg-amber-500/10 text-amber-600 border-amber-500/20",
      "IN_PRODUCTION": "bg-indigo-500/10 text-indigo-600 border-indigo-500/20",
      "WAITING_DELIVERY": "bg-sky-500/10 text-sky-600 border-sky-500/20",
      "DELIVERED": "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
      "FINALIZED": "bg-green-600/10 text-green-700 border-green-600/20",
      "CANCELLED": "bg-slate-400/10 text-slate-500 border-slate-400/20",
    }
    
    const style = colorMap[status] || "bg-slate-100/10 text-slate-600 border-slate-200"

    return (
      <Badge className={`${style} font-black text-[8px] uppercase tracking-tighter rounded-full px-2 h-5 shadow-sm`}>
        {config.title}
      </Badge>
    )
  }

  const getFinancialBadge = (status: string) => {
    switch (status) {
      case "PAID":
        return <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 font-black text-[8px] uppercase tracking-tighter rounded-full px-2 h-5">Quitado</Badge>
      case "PARTIALLY_PAID":
        return <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/20 font-black text-[8px] uppercase tracking-tighter rounded-full px-2 h-5">Parcial</Badge>
      case "OVERDUE":
        return <Badge className="bg-rose-500/10 text-rose-600 border-rose-500/20 font-black text-[8px] uppercase tracking-tighter rounded-full px-2 h-5">Atrasado</Badge>
      default:
        return <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20 font-black text-[8px] uppercase tracking-tighter rounded-full px-2 h-5">Pendente</Badge>
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  if (!isReady) return <div className="p-12 text-center text-slate-400 font-bold uppercase tracking-widest text-xs">Carregando Fluxo...</div>

  return (
    <div className="space-y-4">
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex gap-1 overflow-x-auto pb-12 custom-scrollbar min-h-[750px] px-2 w-full max-w-full">
          {KANBAN_COLUMNS.map((column, index) => (
            <div key={column.id} className={`flex-1 min-w-[280px] flex flex-col gap-6 ${index < KANBAN_COLUMNS.length - 1 ? 'border-r border-slate-100 pr-1' : ''}`}>
              <div className="flex items-center justify-between px-4">
                <div className="flex items-center gap-3">
                  <div className={`w-1.5 h-6 rounded-full ${column.color} shadow-[0_0_10px_rgba(0,0,0,0.1)]`} />
                  <h3 className="font-black text-primary uppercase italic text-sm tracking-tight font-outfit">{column.title}</h3>
                  <span className="text-[10px] bg-white px-2.5 py-1 rounded-full border border-slate-100 font-black text-slate-400 shadow-sm">
                    {columns[column.id]?.length || 0}
                  </span>
                </div>
                <button className="text-slate-300 hover:text-primary transition-all p-1 hover:bg-white rounded-lg">
                  <MoreVertical className="h-4 w-4" />
                </button>
              </div>

              <Droppable droppableId={column.id}>
                {(provided, snapshot) => (
                  <div
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    className={`flex-1 flex flex-col gap-4 p-4 rounded-[2.5rem] transition-all duration-300 min-h-[500px] ${snapshot.isDraggingOver ? 'bg-primary/5 ring-2 ring-primary/10 ring-inset shadow-inner' : 'bg-slate-100/30'}`}
                  >
                    {columns[column.id]?.map((order: any, index: number) => (
                      <Draggable
                        key={order.id}
                        draggableId={order.id}
                        index={index}
                        isDragDisabled={!currentUserRole || kanbanMode === "view"}
                      >
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className="group"
                          >
                            <Card className={`border-none shadow-sm hover:shadow-lahomes transition-all duration-500 rounded-[2rem] overflow-hidden cursor-grab active:cursor-grabbing ${snapshot.isDragging ? 'rotate-3 shadow-2xl scale-105 z-50 ring-2 ring-primary' : 'bg-white'}`}>
                              <CardContent className="p-6 space-y-4">
                                <div className="flex justify-between items-start">
                                  <span className="text-[9px] font-black text-primary uppercase bg-slate-50 px-2.5 py-1 rounded-full border border-slate-100 tracking-widest font-data">
                                    #{order.code || '---'}
                                  </span>
                                  <div className="flex items-center gap-1.5 p-1 bg-slate-50 rounded-full">
                                    {getOperationalStatusBadge(order.currentStatus)}
                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                        <button className="text-slate-300 hover:text-primary transition-all p-1 hover:bg-white rounded-lg">
                                          <MoreHorizontal className="h-4 w-4" />
                                        </button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent align="end" className="w-56 p-2 rounded-3xl border-slate-100 shadow-2xl mt-1">
                                        <DropdownMenuItem 
                                          className="rounded-2xl gap-3 px-4 py-3 cursor-pointer focus:bg-slate-50 font-bold text-xs text-slate-600 focus:text-primary"
                                          onClick={() => window.location.href = `/vendas-clientes/pedidos/${order.id}`}
                                        >
                                          <Eye className="h-4 w-4 text-primary" /> Ver Detalhes do Pedido
                                        </DropdownMenuItem>
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                  </div>
                                </div>
                                
                                <div className="space-y-1">
                                  <p className="font-black text-primary uppercase tracking-tight text-sm line-clamp-1 group-hover:text-blue-600 transition-colors font-outfit">{order.customer.fullName}</p>
                                  <div className="flex items-center gap-2">
                                    <Package className="h-3 w-3 text-slate-300" />
                                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wide truncate max-w-[200px] font-data">
                                      {order.sale.items?.[0]?.description || 'Sem descrição'}
                                    </p>
                                  </div>
                                </div>

                                <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                                  <div className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-slate-400 font-data">
                                    <Calendar className="h-3.5 w-3.5 text-slate-300" />
                                    {order.promisedDate ? new Date(order.promisedDate).toLocaleDateString('pt-BR') : '---'}
                                  </div>
                                  <div className="text-sm font-black text-primary font-outfit italic">
                                    {formatCurrency(order.sale.totalAmount)}
                                  </div>
                                </div>
                                
                                <div className="flex items-center justify-between pt-1">
                                  <div className="flex items-center gap-2">
                                    <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-[9px] font-black text-primary border border-primary/20">
                                      {order.seller?.name?.charAt(0) || 'V'}
                                    </div>
                                    <p className="text-[10px] font-black uppercase tracking-tight text-slate-400 font-data">{order.seller?.name || 'Venda Direta'}</p>
                                  </div>
                                  {order.sale.items?.length > 1 && (
                                    <span className="text-[9px] font-black text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full font-data">+{order.sale.items.length - 1}</span>
                                  )}
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

      <DeliveryModal 
        open={deliveryModalOpen} 
        onOpenChange={setDeliveryModalOpen}
        order={selectedOrder}
        onSuccess={() => window.location.reload()}
      />
    </div>
  )
}
