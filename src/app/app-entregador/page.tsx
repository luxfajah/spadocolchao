"use client"

import { useEffect, useState } from "react"
import { Package, MapPin, Clock, Navigation } from "lucide-react"
import Link from "next/link"
import { format } from "date-fns"

export default function EntregadorPage() {
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchOrders() {
      try {
        const res = await fetch('/api/entregador/rotas')
        const data = await res.json()
        if (data.success) {
          setOrders(data.route)
        }
      } catch (err) {
        console.error("Failed to fetch route", err)
      } finally {
        setLoading(false)
      }
    }
    fetchOrders()
  }, [])

  if (loading) {
    return <div className="p-6 flex justify-center"><span className="text-slate-500">Carregando rotas...</span></div>
  }

  return (
    <div className="p-4 flex flex-col gap-4">
      <div className="bg-sky-600 text-white p-6 rounded-2xl shadow-lg shadow-sky-600/20 mb-2">
        <h1 className="text-2xl font-bold">Entregas de Hoje</h1>
        <p className="opacity-80 text-sm mt-1">{orders.length} pedidos aguardando entrega</p>
      </div>

      <div className="flex flex-col gap-4">
        {orders.length === 0 ? (
          <div className="text-center p-8 bg-white rounded-xl border border-dashed border-slate-300 text-slate-500">
            Nenhuma entrega pendente para hoje.
          </div>
        ) : (
          orders.map((order, idx) => (
            <Link key={order.id} href={`/app-entregador/pedido/${order.id}`}>
              <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex flex-col gap-3 active:scale-[0.98] transition-transform">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2">
                    <div className="bg-sky-100 p-2 rounded-lg text-sky-600">
                      <Package className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-800">Pedido #{order.code || order.id.slice(-6).toUpperCase()}</h3>
                      <p className="text-xs text-slate-500">{order.customer?.fullName}</p>
                    </div>
                  </div>
                  <span className="bg-amber-100 text-amber-700 text-xs font-medium px-2 py-1 rounded-full">
                    Aguardando
                  </span>
                </div>

                <div className="flex flex-col gap-1.5 mt-1">
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <MapPin className="w-4 h-4 text-slate-400" />
                    <span className="line-clamp-1">{order.street}, {order.number} - {order.neighborhood}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Clock className="w-4 h-4 text-slate-400" />
                    <span>{order.deliveryDate ? format(new Date(order.deliveryDate), "dd/MM/yyyy 'às' HH:mm") : 'Data não definida'}</span>
                  </div>
                </div>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  )
}
