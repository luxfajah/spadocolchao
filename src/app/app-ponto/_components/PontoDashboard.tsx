"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { CheckCircle2, AlertTriangle, MapPin, Loader2, Sparkles } from "lucide-react"
import { registerPunchAction, APP_PUNCH_TYPES } from "../actions"

interface PontoDashboardProps {
  initialData: {
    employee?: {
      id: string
      fullName: string
      socialName?: string | null
      pointMachineId?: string | null
      code?: string | null
    }
    punches?: {
      id: string
      punchDateTime: Date
      type: string
      rawType: string
    }[]
    recommendedNextPunch?: {
      label: string
      rawType: string
      type: string
    }
    error?: string
  }
}

export function PontoDashboard({ initialData }: PontoDashboardProps) {
  const router = useRouter()
  const [time, setTime] = useState<Date | null>(null)
  const [selectedRawType, setSelectedRawType] = useState<string>(
    initialData.recommendedNextPunch?.rawType || "S"
  )
  const [loading, setLoading] = useState(false)
  const [gpsStatus, setGpsStatus] = useState<{
    status: "idle" | "getting" | "success" | "error"
    message: string
    coords?: { latitude: number; longitude: number; accuracy: number }
  }>({ status: "idle", message: "Aguardando ação" })

  // Atualizar relógio em tempo real
  useEffect(() => {
    setTime(new Date())
    const interval = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(interval)
  }, [])

  // Buscar localização
  const getCoordinates = (): Promise<{ latitude: number; longitude: number; accuracy: number }> => {
    return new Promise((resolve, reject) => {
      if (typeof window === "undefined" || !navigator.geolocation) {
        reject(new Error("Geolocalização não disponível neste dispositivo."))
        return
      }

      setGpsStatus({ status: "getting", message: "Obtendo localização precisa..." })

      navigator.geolocation.getCurrentPosition(
        (pos) => {
          resolve({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            accuracy: pos.coords.accuracy,
          })
        },
        (err) => {
          console.error("GPS Error:", err)
          let errMsg = "Erro ao acessar o GPS."
          if (err.code === err.PERMISSION_DENIED) {
            errMsg = "Permissão de GPS negada. Por favor, ative nas configurações."
          } else if (err.code === err.POSITION_UNAVAILABLE) {
            errMsg = "Sinal de GPS indisponível."
          } else if (err.code === err.TIMEOUT) {
            errMsg = "Tempo limite excedido ao obter GPS."
          }
          reject(new Error(errMsg))
        },
        { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
      )
    })
  }

  // Registrar batida
  const handleRegisterPunch = async () => {
    if (loading) return
    setLoading(true)
    setGpsStatus({ status: "getting", message: "Obtendo localização..." })

    try {
      // 1. Coleta o GPS
      const coords = await getCoordinates()
      setGpsStatus({
        status: "success",
        message: `GPS Localizado! Precisão de ±${Math.round(coords.accuracy)}m`,
        coords,
      })

      // 2. Registra na tabela via Server Action
      const res = await registerPunchAction(
        selectedRawType,
        coords.latitude,
        coords.longitude,
        coords.accuracy
      )

      if (res.error) {
        alert("Erro ao registrar ponto: " + res.error)
        setGpsStatus({ status: "error", message: res.error })
      } else {
        // Sucesso
        setGpsStatus({
          status: "success",
          message: "Ponto batido com sucesso às " + new Date().toLocaleTimeString("pt-BR"),
          coords,
        })
        
        // Recarregar a rota para atualizar a lista
        router.refresh()
        
        // Exibir alerta rápido e ajustar seleção recomendado se possível
        setTimeout(() => {
          alert(`Ponto registrado com sucesso!`)
        }, 100)
      }
    } catch (err: any) {
      alert(err.message || "Erro de localização")
      setGpsStatus({ status: "error", message: err.message || "Erro de localização" })
    } finally {
      setLoading(false)
    }
  }

  // Formatar tempo
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    })
  }

  // Formatar data por extenso
  const formatDate = (date: Date) => {
    const formatted = date.toLocaleDateString("pt-BR", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    })
    // Capitalizar primeira letra
    return formatted.charAt(0).toUpperCase() + formatted.slice(1)
  }

  if (initialData.error) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center min-h-[70vh]">
        <div className="bg-red-500/10 p-5 rounded-full mb-4">
          <AlertTriangle className="w-12 h-12 text-red-500" />
        </div>
        <h2 className="text-xl font-bold text-white mb-2">Erro de Acesso</h2>
        <p className="text-slate-400 max-w-sm mb-6">{initialData.error}</p>
        <button
          onClick={() => router.refresh()}
          className="bg-slate-900 hover:bg-slate-800 text-white font-semibold py-3 px-6 rounded-xl border border-slate-800 transition-all"
        >
          Tentar Novamente
        </button>
      </div>
    )
  }

  const employeeName =
    initialData.employee?.socialName || initialData.employee?.fullName || "Colaborador"
  const registeredPunches = initialData.punches || []

  return (
    <div className="px-4 py-8 max-w-md mx-auto space-y-6">
      {/* Header */}
      <header className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-400">
              Spa do Colchão
            </span>
          </div>
          <h2 className="text-xl font-black font-outfit uppercase tracking-tight text-white italic">
            Olá, {employeeName}
          </h2>
        </div>
        <div className="h-10 w-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-sm font-black italic text-cyan-400">
          {employeeName.slice(0, 2).toUpperCase()}
        </div>
      </header>

      {/* Relógio Digital Card */}
      <section className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-900 shadow-2xl p-8 text-center flex flex-col justify-center min-h-[190px]">
        {/* Glows */}
        <div className="absolute inset-0 bg-radial-gradient(circle_at_center,_rgba(6,182,212,0.1),_transparent_60%)" />
        <div className="absolute -top-10 -left-10 w-24 h-24 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-10 -right-10 w-24 h-24 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 space-y-3">
          <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">
            Horário do Servidor (Brasília)
          </p>
          <h1 className="font-outfit text-5xl md:text-6xl font-black text-white tracking-widest tabular-nums leading-none">
            {time ? formatTime(time) : "00:00:00"}
          </h1>
          <p className="text-xs text-slate-300 font-medium">
            {time ? formatDate(time) : "Carregando data..."}
          </p>
        </div>
      </section>

      {/* Seletor do Tipo de Batida */}
      <section className="space-y-3">
        <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">
          Selecione a Ação
        </h3>
        <div className="grid grid-cols-2 gap-2.5">
          {APP_PUNCH_TYPES.map((type) => {
            // Checar se já registrou essa batida hoje
            const punchToday = registeredPunches.find((p) => p.rawType === type.rawType)
            const isSelected = selectedRawType === type.rawType

            return (
              <button
                key={type.rawType}
                type="button"
                onClick={() => setSelectedRawType(type.rawType)}
                className={`relative p-4 rounded-3xl border flex flex-col text-left transition-all duration-300 ${
                  isSelected
                    ? "bg-cyan-500/10 border-cyan-500 shadow-md shadow-cyan-500/5 text-white"
                    : "bg-slate-900/50 border-slate-900/80 text-slate-400 hover:bg-slate-900"
                }`}
              >
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                  Ação {type.rawType}
                </span>
                <span className="font-black text-sm uppercase tracking-tight mt-1 font-outfit italic">
                  {type.label}
                </span>

                {punchToday ? (
                  <div className="mt-2.5 flex items-center gap-1.5 text-[10px] font-black text-emerald-400 bg-emerald-500/10 rounded-full px-2 py-0.5 w-fit">
                    <CheckCircle2 size={10} />
                    {new Date(punchToday.punchDateTime).toLocaleTimeString("pt-BR", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                ) : (
                  <div className="mt-2.5 h-4 text-[9px] font-semibold text-slate-600">
                    Não registrada
                  </div>
                )}

                {/* Recomendação indicator */}
                {initialData.recommendedNextPunch?.rawType === type.rawType && (
                  <span className="absolute top-2 right-2 flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </section>

      {/* Botão de Registro */}
      <section className="space-y-4">
        <button
          type="button"
          disabled={loading}
          onClick={handleRegisterPunch}
          className="relative w-full h-20 rounded-[2.5rem] bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-sm uppercase tracking-[0.2em] font-outfit shadow-xl shadow-cyan-500/10 flex items-center justify-center transition-all duration-300 active:scale-[0.98] disabled:opacity-50"
        >
          {loading ? (
            <div className="flex items-center gap-3">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Registrando...</span>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Sparkles className="w-5 h-5" />
              <span>
                Confirmar {APP_PUNCH_TYPES.find((t) => t.rawType === selectedRawType)?.label}
              </span>
            </div>
          )}
        </button>

        {/* GPS Geolocation Status */}
        <div className="flex items-start gap-2.5 p-4 rounded-3xl bg-slate-900/50 border border-slate-900">
          <div className="p-2 rounded-2xl bg-slate-950 text-cyan-400">
            <MapPin size={16} />
          </div>
          <div className="space-y-0.5">
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
              Coleta de Localização
            </p>
            <p className={`text-xs ${
              gpsStatus.status === "error"
                ? "text-red-400"
                : gpsStatus.status === "success"
                ? "text-emerald-400 font-medium"
                : "text-slate-400"
            }`}>
              {gpsStatus.message}
            </p>
          </div>
        </div>
      </section>

      {/* Timeline de hoje */}
      <section className="space-y-3">
        <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">
          Batidas de Hoje ({registeredPunches.length})
        </h3>
        <div className="rounded-[2rem] bg-slate-900/30 border border-slate-900/60 p-5 space-y-4">
          {registeredPunches.length === 0 ? (
            <p className="text-xs text-slate-500 text-center py-2 uppercase font-black tracking-wider">
              Nenhuma batida registrada hoje.
            </p>
          ) : (
            <div className="relative border-l border-slate-800 pl-5 ml-2.5 space-y-4">
              {registeredPunches.map((punch) => {
                const matched = APP_PUNCH_TYPES.find((t) => t.rawType === punch.rawType)
                return (
                  <div key={punch.id} className="relative">
                    {/* Bullet */}
                    <span className="absolute -left-[26px] top-1 h-3.5 w-3.5 rounded-full border-2 border-slate-950 bg-cyan-400 shadow-sm" />
                    
                    <div className="flex justify-between items-center">
                      <span className="font-black text-sm uppercase tracking-tight text-white font-outfit italic">
                        {matched?.label || "Batida"}
                      </span>
                      <span className="text-xs font-black text-cyan-400 font-outfit tabular-nums">
                        {new Date(punch.punchDateTime).toLocaleTimeString("pt-BR", {
                          hour: "2-digit",
                          minute: "2-digit",
                          second: "2-digit",
                        })}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
