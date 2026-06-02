"use client"

import { useEffect, useState, useRef } from "react"
import { Package, MapPin, Navigation, Phone, CheckCircle, ArrowLeft, Camera, UploadCloud } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

export default function PedidoDetalhesPage({ params }: { params: { id: string } }) {
  const [order, setOrder] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [finishing, setFinishing] = useState(false)
  const [photo, setPhoto] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  useEffect(() => {
    async function fetchOrder() {
      try {
        const res = await fetch(`/api/entregador/pedidos`)
        const data = await res.json()
        if (data.success) {
          const found = data.orders.find((o: any) => o.id === params.id)
          setOrder(found)
        }
      } catch (err) {
        console.error("Failed to fetch order", err)
      } finally {
        setLoading(false)
      }
    }
    fetchOrder()
  }, [params.id])

  const handleCaptureClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0]
      setPhoto(selectedFile)
      setPhotoPreview(URL.createObjectURL(selectedFile))
    }
  }

  const handleFinishDelivery = async () => {
    if (!photo) return
    setFinishing(true)
    
    try {
      const formData = new FormData()
      formData.append("orderId", params.id)
      formData.append("file", photo)

      const res = await fetch('/api/entregador/comprovante', {
        method: 'POST',
        body: formData
      })
      const data = await res.json()
      
      if (data.success) {
        alert("Entrega finalizada com sucesso!")
        router.push("/app-entregador")
      } else {
        alert("Erro ao finalizar entrega: " + data.error)
      }
    } catch (err) {
      console.error(err)
      alert("Erro de conexão ao finalizar entrega.")
    } finally {
      setFinishing(false)
    }
  }

  const handleNavigate = () => {
    if (!order) return
    const address = `${order.street}, ${order.number} - ${order.neighborhood}, ${order.city}`
    const url = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`
    window.open(url, '_blank')
  }

  if (loading) return <div className="p-6 flex justify-center"><span className="text-slate-500">Carregando detalhes...</span></div>
  if (!order) return <div className="p-6 flex justify-center"><span className="text-red-500">Pedido não encontrado.</span></div>

  return (
    <div className="flex flex-col h-full bg-slate-50">
      <div className="bg-white p-4 border-b flex items-center gap-3 sticky top-0 z-10 shadow-sm">
        <Link href="/app-entregador" className="p-2 -ml-2 rounded-full hover:bg-slate-100 text-slate-600">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-lg font-bold text-slate-800">Pedido #{order.code || order.id.slice(-6).toUpperCase()}</h1>
      </div>

      <div className="p-4 flex flex-col gap-6">
        {/* Customer Info */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">Cliente</h2>
          <div className="flex justify-between items-center">
            <div>
              <p className="font-semibold text-slate-800 text-lg">{order.customer?.fullName}</p>
              {order.customer?.phone && (
                <div className="flex items-center gap-2 mt-1 text-slate-600">
                  <Phone className="w-4 h-4" />
                  <a href={`tel:${order.customer.phone}`} className="text-sky-600 font-medium">{order.customer.phone}</a>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Address Info */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">Endereço de Entrega</h2>
          <div className="flex items-start gap-3">
            <MapPin className="w-5 h-5 text-sky-500 mt-0.5" />
            <div>
              <p className="text-slate-800 font-medium">{order.street}, {order.number}</p>
              {order.complement && <p className="text-slate-600 text-sm">{order.complement}</p>}
              <p className="text-slate-600 text-sm">{order.neighborhood}</p>
              <p className="text-slate-600 text-sm">{order.city} - {order.state}</p>
              <p className="text-slate-500 text-xs mt-1">CEP: {order.zipCode}</p>
            </div>
          </div>
          <button 
            onClick={handleNavigate}
            className="mt-4 w-full bg-slate-100 hover:bg-slate-200 text-slate-800 font-medium py-3 rounded-xl flex items-center justify-center gap-2 transition-colors"
          >
            <Navigation className="w-5 h-5 text-sky-600" />
            Navegar com Google Maps
          </button>
        </div>

        {/* Capture Receipt Section */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">Comprovante de Entrega</h2>
          
          <input 
            type="file" 
            accept="image/*" 
            capture="environment"
            className="hidden" 
            ref={fileInputRef}
            onChange={handleFileChange}
          />

          {!photoPreview ? (
            <button 
              onClick={handleCaptureClick}
              className="w-full border-2 border-dashed border-sky-300 bg-sky-50 hover:bg-sky-100 text-sky-700 py-8 rounded-xl flex flex-col items-center justify-center gap-3 transition-colors"
            >
              <div className="bg-white p-3 rounded-full shadow-sm">
                <Camera className="w-6 h-6 text-sky-600" />
              </div>
              <span className="font-medium">Tirar foto do comprovante</span>
            </button>
          ) : (
            <div className="flex flex-col gap-3">
              <div className="relative rounded-xl overflow-hidden border border-slate-200 bg-slate-100">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={photoPreview} alt="Comprovante" className="w-full h-auto object-cover max-h-[300px]" />
                <button 
                  onClick={handleCaptureClick}
                  className="absolute bottom-3 right-3 bg-white/90 backdrop-blur shadow-sm text-slate-700 p-2 rounded-full"
                >
                  <Camera className="w-4 h-4" />
                </button>
              </div>
              <button 
                onClick={handleFinishDelivery}
                disabled={finishing}
                className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-300 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-all active:scale-[0.98]"
              >
                {finishing ? (
                  <span className="flex items-center gap-2">
                    <UploadCloud className="w-5 h-5 animate-pulse" />
                    Enviando...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5" />
                    Finalizar Entrega
                  </span>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
