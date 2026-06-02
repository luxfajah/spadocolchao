"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Plus, MapPin, Phone, Calendar, Clock, User, CheckCircle2, XCircle, Loader2, MessageSquare, Search, FileText, UserPlus, ShoppingCart } from "lucide-react"

type Visit = {
  id: string
  clientName: string
  clientPhone: string | null
  clientAddress: string | null
  visitDate: string
  status: string
  notes: string | null
}

type ModalMode = "create" | "result" | "register_client" | null

export function VisitasClient({ sellerId }: { sellerId: string | null }) {
  const router = useRouter()
  const [visits, setVisits] = useState<Visit[]>([])
  const [loading, setLoading] = useState(true)
  const [modalMode, setModalMode] = useState<ModalMode>(null)
  const [saving, setSaving] = useState(false)
  const [selectedVisit, setSelectedVisit] = useState<Visit | null>(null)

  // Customer registration form state
  const [regName, setRegName] = useState("")
  const [regPhone, setRegPhone] = useState("")
  const [regDocument, setRegDocument] = useState("")
  const [regCep, setRegCep] = useState("")
  const [regStreet, setRegStreet] = useState("")
  const [regNumber, setRegNumber] = useState("")
  const [regNeighborhood, setRegNeighborhood] = useState("")
  const [regCity, setRegCity] = useState("")
  const [regState, setRegState] = useState("")
  const [regCepLoading, setRegCepLoading] = useState(false)
  const [regCepError, setRegCepError] = useState("")

  // Form state
  const [clientName, setClientName] = useState("")
  const [clientPhone, setClientPhone] = useState("")
  const [cep, setCep] = useState("")
  const [street, setStreet] = useState("")
  const [number, setNumber] = useState("")
  const [neighborhood, setNeighborhood] = useState("")
  const [city, setCity] = useState("")
  const [state, setState] = useState("")
  const [cepLoading, setCepLoading] = useState(false)
  const [cepError, setCepError] = useState("")
  const [visitDate, setVisitDate] = useState("")
  const [visitTime, setVisitTime] = useState("")
  const [notes, setNotes] = useState("")
  const [resultNotes, setResultNotes] = useState("")

  const handleCepChange = async (value: string) => {
    const cleanCep = value.replace(/\D/g, '')
    // Format CEP as 00000-000
    const formatted = cleanCep.length > 5 ? cleanCep.slice(0, 5) + '-' + cleanCep.slice(5, 8) : cleanCep
    setCep(formatted)
    setCepError("")

    if (cleanCep.length === 8) {
      setCepLoading(true)
      try {
        const res = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`)
        const data = await res.json()
        if (!data.erro) {
          setStreet(data.logradouro || "")
          setNeighborhood(data.bairro || "")
          setCity(data.localidade || "")
          setState(data.uf || "")
        } else {
          setCepError("CEP não encontrado")
        }
      } catch {
        setCepError("Erro ao buscar CEP")
      } finally {
        setCepLoading(false)
      }
    }
  }

  const buildFullAddress = () => {
    const parts = [street, number ? `nº ${number}` : '', neighborhood, city, state].filter(Boolean)
    return parts.length > 0 ? parts.join(', ') : ''
  }

  const fetchVisits = async () => {
    try {
      const res = await fetch("/api/visitas")
      if (res.ok) {
        const data = await res.json()
        setVisits(data)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchVisits() }, [])

  const resetForm = () => {
    setClientName("")
    setClientPhone("")
    setCep("")
    setStreet("")
    setNumber("")
    setNeighborhood("")
    setCity("")
    setState("")
    setCepError("")
    setVisitDate("")
    setVisitTime("")
    setNotes("")
    setResultNotes("")
    setSelectedVisit(null)
  }

  const openCreate = () => {
    resetForm()
    // Default date to today
    const today = new Date()
    setVisitDate(today.toISOString().split('T')[0])
    setVisitTime("10:00")
    setModalMode("create")
  }

  const openResult = (visit: Visit) => {
    setSelectedVisit(visit)
    setResultNotes(visit.notes || "")
    setModalMode("result")
  }

  const handleCreate = async () => {
    if (!clientName.trim() || !visitDate || !visitTime) return
    setSaving(true)
    try {
      const dateTime = new Date(`${visitDate}T${visitTime}:00`)
      const res = await fetch("/api/visitas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientName: clientName.trim(),
          clientPhone: clientPhone.trim() || null,
          clientAddress: buildFullAddress() || null,
          visitDate: dateTime.toISOString(),
          notes: notes.trim() || null,
        }),
      })
      if (res.ok) {
        await fetchVisits()
        setModalMode(null)
        resetForm()
      }
    } catch (e) {
      console.error(e)
    } finally {
      setSaving(false)
    }
  }

  const handleUpdateStatus = async (status: "COMPLETED" | "LOST") => {
    if (!selectedVisit) return
    setSaving(true)
    try {
      const res = await fetch("/api/visitas", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          visitId: selectedVisit.id,
          status,
          notes: resultNotes.trim() || null,
        }),
      })
      if (res.ok) {
        await fetchVisits()
        if (status === "COMPLETED") {
          // Pre-fill customer registration from visit data
          setRegName(selectedVisit.clientName || "")
          setRegPhone(selectedVisit.clientPhone || "")
          setRegDocument("")
          // Parse address if available
          if (selectedVisit.clientAddress) {
            const parts = selectedVisit.clientAddress.split(', ')
            setRegStreet(parts[0] || "")
            const numMatch = parts[1]?.match(/nº\s*(.*)/)
            setRegNumber(numMatch ? numMatch[1] : parts[1] || "")
            setRegNeighborhood(parts[2] || "")
            setRegCity(parts[3] || "")
            setRegState(parts[4] || "")
          }
          setModalMode("register_client")
        } else {
          setModalMode(null)
          resetForm()
        }
      }
    } catch (e) {
      console.error(e)
    } finally {
      setSaving(false)
    }
  }

  const handleRegCepChange = async (value: string) => {
    const cleanCep = value.replace(/\D/g, '')
    const formatted = cleanCep.length > 5 ? cleanCep.slice(0, 5) + '-' + cleanCep.slice(5, 8) : cleanCep
    setRegCep(formatted)
    setRegCepError("")
    if (cleanCep.length === 8) {
      setRegCepLoading(true)
      try {
        const res = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`)
        const data = await res.json()
        if (!data.erro) {
          setRegStreet(data.logradouro || "")
          setRegNeighborhood(data.bairro || "")
          setRegCity(data.localidade || "")
          setRegState(data.uf || "")
        } else {
          setRegCepError("CEP não encontrado")
        }
      } catch {
        setRegCepError("Erro ao buscar CEP")
      } finally {
        setRegCepLoading(false)
      }
    }
  }

  const handleCreateCustomer = async () => {
    if (!regName.trim()) return
    setSaving(true)
    try {
      const res = await fetch("/api/clientes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: regName.trim(),
          phone: regPhone.trim() || null,
          document: regDocument.trim() || null,
          sellerId: sellerId || null,
          zipCode: regCep.replace(/\D/g, '') || null,
          street: regStreet || null,
          number: regNumber || null,
          neighborhood: regNeighborhood || null,
          city: regCity || null,
          state: regState || null,
        }),
      })
      if (res.ok) {
        const customer = await res.json()
        // Redirect to PDV with customer pre-selected
        router.push(`/app-vendedor/pdv?customerId=${customer.id}&customerName=${encodeURIComponent(customer.fullName)}`)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setSaving(false)
    }
  }

  const scheduled = visits.filter(v => v.status === "SCHEDULED")
  const completed = visits.filter(v => v.status === "COMPLETED")
  const lost = visits.filter(v => v.status === "LOST" || v.status === "CANCELLED")

  const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
    SCHEDULED: { label: "Agendado", color: "text-blue-600", bg: "bg-blue-50 border-blue-100" },
    COMPLETED: { label: "Sucesso", color: "text-emerald-600", bg: "bg-emerald-50 border-emerald-100" },
    LOST: { label: "Perda", color: "text-rose-600", bg: "bg-rose-50 border-rose-100" },
    CANCELLED: { label: "Cancelado", color: "text-slate-500", bg: "bg-slate-50 border-slate-100" },
  }

  if (!sellerId) {
    return (
      <div className="p-6">
        <div className="bg-amber-50 text-amber-800 p-4 rounded-2xl text-sm border border-amber-200">
          ⚠ Seu usuário não está vinculado a um vendedor ainda.
        </div>
      </div>
    )
  }

  return (
    <>
      {/* Main Page */}
      <div className="flex flex-col h-full bg-slate-50">
        {/* Header */}
        <div className="shrink-0 bg-white border-b border-slate-100 px-4 py-3">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-black uppercase tracking-tight text-slate-900">Agendamentos</h1>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                {scheduled.length} pendente{scheduled.length !== 1 ? "s" : ""} • {completed.length} sucesso{completed.length !== 1 ? "s" : ""}
              </p>
            </div>
            <button
              onClick={openCreate}
              className="flex items-center gap-2 bg-blue-600 text-white text-xs px-4 py-2.5 rounded-xl font-bold shadow-sm shadow-blue-600/20 active:scale-95 transition-transform"
            >
              <Plus size={16} />
              Nova Visita
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6 pb-24">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-6 h-6 animate-spin text-slate-300" />
            </div>
          ) : visits.length === 0 ? (
            <div className="text-center py-16">
              <Calendar className="w-12 h-12 text-slate-200 mx-auto mb-4" />
              <p className="text-sm font-bold text-slate-400">Nenhum agendamento</p>
              <p className="text-xs text-slate-300 mt-1">Toque em "Nova Visita" para começar</p>
            </div>
          ) : (
            <>
              {/* Scheduled */}
              {scheduled.length > 0 && (
                <div>
                  <h2 className="text-[10px] font-black uppercase tracking-widest text-blue-600 mb-3 px-1">
                    📅 Agendados ({scheduled.length})
                  </h2>
                  <div className="space-y-3">
                    {scheduled.map(visit => (
                      <VisitCard key={visit.id} visit={visit} config={statusConfig} onAction={() => openResult(visit)} />
                    ))}
                  </div>
                </div>
              )}

              {/* Completed */}
              {completed.length > 0 && (
                <div>
                  <h2 className="text-[10px] font-black uppercase tracking-widest text-emerald-600 mb-3 px-1">
                    ✅ Sucesso ({completed.length})
                  </h2>
                  <div className="space-y-3">
                    {completed.map(visit => (
                      <VisitCard key={visit.id} visit={visit} config={statusConfig} />
                    ))}
                  </div>
                </div>
              )}

              {/* Lost */}
              {lost.length > 0 && (
                <div>
                  <h2 className="text-[10px] font-black uppercase tracking-widest text-rose-500 mb-3 px-1">
                    ❌ Perdas ({lost.length})
                  </h2>
                  <div className="space-y-3">
                    {lost.map(visit => (
                      <VisitCard key={visit.id} visit={visit} config={statusConfig} />
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* ======================== MODAL: NOVA VISITA ======================== */}
      {modalMode === "create" && (
        <div className="fixed inset-0 z-[100] bg-white flex flex-col">
          {/* Modal Header */}
          <div className="shrink-0 flex items-center gap-3 px-4 py-3 bg-white border-b border-slate-100">
            <button onClick={() => { setModalMode(null); resetForm() }} className="p-2 -ml-2 text-slate-500 active:bg-slate-100 rounded-full transition-colors">
              <ArrowLeft size={22} />
            </button>
            <div>
              <h2 className="text-base font-black uppercase tracking-tight text-slate-900">Nova Visita</h2>
              <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Agendar visita ao cliente</p>
            </div>
          </div>

          {/* Modal Body */}
          <div className="flex-1 overflow-y-auto scrollbar-none p-4 space-y-5 bg-slate-50">
            {/* Nome */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-1.5 px-1">
                <User size={12} className="text-blue-500" /> Nome do Cliente *
              </label>
              <input
                type="text"
                value={clientName}
                onChange={e => setClientName(e.target.value)}
                placeholder="Ex: João da Silva"
                className="w-full h-12 px-4 rounded-xl border-2 border-slate-100 bg-white text-sm font-semibold focus:border-blue-500 focus:ring-0 outline-none transition-colors"
              />
            </div>

            {/* Telefone */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-1.5 px-1">
                <Phone size={12} className="text-blue-500" /> Telefone
              </label>
              <input
                type="tel"
                value={clientPhone}
                onChange={e => setClientPhone(e.target.value)}
                placeholder="(00) 00000-0000"
                className="w-full h-12 px-4 rounded-xl border-2 border-slate-100 bg-white text-sm font-semibold focus:border-blue-500 focus:ring-0 outline-none transition-colors"
              />
            </div>

            {/* Endereço via CEP */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-1.5 px-1">
                <MapPin size={12} className="text-blue-500" /> CEP
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={cep}
                  onChange={e => handleCepChange(e.target.value)}
                  placeholder="00000-000"
                  maxLength={9}
                  className="w-full h-12 px-4 pr-10 rounded-xl border-2 border-slate-100 bg-white text-sm font-semibold focus:border-blue-500 focus:ring-0 outline-none transition-colors"
                />
                {cepLoading && <Loader2 className="absolute right-3 top-3.5 w-5 h-5 animate-spin text-blue-400" />}
                {!cepLoading && cep.length >= 9 && !cepError && street && <Search className="absolute right-3 top-3.5 w-5 h-5 text-emerald-400" />}
              </div>
              {cepError && <p className="text-[10px] text-rose-500 font-bold px-1">{cepError}</p>}
            </div>

            {street && (
              <>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 px-1">Rua</label>
                  <input
                    type="text"
                    value={street}
                    onChange={e => setStreet(e.target.value)}
                    className="w-full h-12 px-4 rounded-xl border-2 border-slate-100 bg-white text-sm font-semibold focus:border-blue-500 focus:ring-0 outline-none transition-colors"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 px-1">Número</label>
                    <input
                      type="text"
                      value={number}
                      onChange={e => setNumber(e.target.value)}
                      placeholder="Nº"
                      className="w-full h-12 px-4 rounded-xl border-2 border-slate-100 bg-white text-sm font-semibold focus:border-blue-500 focus:ring-0 outline-none transition-colors"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 px-1">Bairro</label>
                    <input
                      type="text"
                      value={neighborhood}
                      onChange={e => setNeighborhood(e.target.value)}
                      className="w-full h-12 px-4 rounded-xl border-2 border-slate-100 bg-white text-sm font-semibold focus:border-blue-500 focus:ring-0 outline-none transition-colors"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-2 space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 px-1">Cidade</label>
                    <input
                      type="text"
                      value={city}
                      readOnly
                      className="w-full h-12 px-4 rounded-xl border-2 border-slate-100 bg-slate-50 text-sm font-semibold text-slate-600"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 px-1">UF</label>
                    <input
                      type="text"
                      value={state}
                      readOnly
                      className="w-full h-12 px-4 rounded-xl border-2 border-slate-100 bg-slate-50 text-sm font-semibold text-slate-600 text-center"
                    />
                  </div>
                </div>
              </>
            )}

            {/* Data e Hora */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-1.5 px-1">
                  <Calendar size={12} className="text-blue-500" /> Data *
                </label>
                <input
                  type="date"
                  value={visitDate}
                  onChange={e => setVisitDate(e.target.value)}
                  className="w-full h-12 px-4 rounded-xl border-2 border-slate-100 bg-white text-sm font-semibold focus:border-blue-500 focus:ring-0 outline-none transition-colors"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-1.5 px-1">
                  <Clock size={12} className="text-blue-500" /> Hora *
                </label>
                <input
                  type="time"
                  value={visitTime}
                  onChange={e => setVisitTime(e.target.value)}
                  className="w-full h-12 px-4 rounded-xl border-2 border-slate-100 bg-white text-sm font-semibold focus:border-blue-500 focus:ring-0 outline-none transition-colors"
                />
              </div>
            </div>

            {/* Observações */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-1.5 px-1">
                <MessageSquare size={12} className="text-blue-500" /> Observações
              </label>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Detalhes sobre a visita..."
                rows={3}
                className="w-full px-4 py-3 rounded-xl border-2 border-slate-100 bg-white text-sm font-semibold focus:border-blue-500 focus:ring-0 outline-none transition-colors resize-none"
              />
            </div>
          </div>

          {/* Modal Footer */}
          <div className="shrink-0 p-4 bg-white border-t border-slate-100">
            <button
              onClick={handleCreate}
              disabled={saving || !clientName.trim() || !visitDate || !visitTime}
              className="w-full h-12 bg-blue-600 text-white font-black uppercase text-xs tracking-widest rounded-xl shadow-lg shadow-blue-600/20 active:scale-[0.98] transition-transform disabled:opacity-50 disabled:active:scale-100 flex items-center justify-center gap-2"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Calendar size={16} />}
              {saving ? "Salvando..." : "Agendar Visita"}
            </button>
          </div>
        </div>
      )}

      {/* ======================== MODAL: RESULTADO ======================== */}
      {modalMode === "result" && selectedVisit && (
        <div className="fixed inset-0 z-[100] bg-white flex flex-col">
          {/* Modal Header */}
          <div className="shrink-0 flex items-center gap-3 px-4 py-3 bg-white border-b border-slate-100">
            <button onClick={() => { setModalMode(null); resetForm() }} className="p-2 -ml-2 text-slate-500 active:bg-slate-100 rounded-full transition-colors">
              <ArrowLeft size={22} />
            </button>
            <div>
              <h2 className="text-base font-black uppercase tracking-tight text-slate-900">Resultado da Visita</h2>
              <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Registrar sucesso ou perda</p>
            </div>
          </div>

          {/* Modal Body */}
          <div className="flex-1 overflow-y-auto scrollbar-none p-4 space-y-5 bg-slate-50">
            {/* Visit Info Card */}
            <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-sm font-black text-blue-600">
                  {selectedVisit.clientName.charAt(0)}
                </div>
                <div>
                  <p className="font-bold text-slate-800">{selectedVisit.clientName}</p>
                  <p className="text-[10px] text-slate-400 font-bold">
                    {new Date(selectedVisit.visitDate).toLocaleDateString('pt-BR')} às{" "}
                    {new Date(selectedVisit.visitDate).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
              {selectedVisit.clientPhone && (
                <p className="text-xs text-slate-500 flex items-center gap-2">
                  <Phone size={12} className="text-slate-300" /> {selectedVisit.clientPhone}
                </p>
              )}
              {selectedVisit.clientAddress && (
                <p className="text-xs text-slate-500 flex items-center gap-2">
                  <MapPin size={12} className="text-slate-300" /> {selectedVisit.clientAddress}
                </p>
              )}
            </div>

            {/* Notes */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-1.5 px-1">
                <MessageSquare size={12} className="text-blue-500" /> Observações do resultado
              </label>
              <textarea
                value={resultNotes}
                onChange={e => setResultNotes(e.target.value)}
                placeholder="O que aconteceu na visita? O cliente fechou? Qual produto?"
                rows={4}
                className="w-full px-4 py-3 rounded-xl border-2 border-slate-100 bg-white text-sm font-semibold focus:border-blue-500 focus:ring-0 outline-none transition-colors resize-none"
              />
            </div>
          </div>

          {/* Modal Footer - Two buttons */}
          <div className="shrink-0 p-4 bg-white border-t border-slate-100 space-y-3">
            <button
              onClick={() => handleUpdateStatus("COMPLETED")}
              disabled={saving}
              className="w-full h-12 bg-emerald-600 text-white font-black uppercase text-xs tracking-widest rounded-xl shadow-lg shadow-emerald-600/20 active:scale-[0.98] transition-transform disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 size={16} />}
              Sucesso — Venda Fechada
            </button>
            <button
              onClick={() => handleUpdateStatus("LOST")}
              disabled={saving}
              className="w-full h-12 bg-rose-600 text-white font-black uppercase text-xs tracking-widest rounded-xl shadow-lg shadow-rose-600/20 active:scale-[0.98] transition-transform disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle size={16} />}
              Perda — Não Fechou
            </button>
          </div>
        </div>
      )}

      {/* ======================== MODAL: CADASTRAR CLIENTE ======================== */}
      {modalMode === "register_client" && (
        <div className="fixed inset-0 z-[100] bg-white flex flex-col">
          {/* Modal Header */}
          <div className="shrink-0 flex items-center gap-3 px-4 py-3 bg-white border-b border-slate-100">
            <button onClick={() => { setModalMode(null); resetForm() }} className="p-2 -ml-2 text-slate-500 active:bg-slate-100 rounded-full transition-colors">
              <ArrowLeft size={22} />
            </button>
            <div>
              <h2 className="text-base font-black uppercase tracking-tight text-slate-900">Cadastrar Cliente</h2>
              <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Finalizar cadastro antes do PDV</p>
            </div>
          </div>

          {/* Modal Body */}
          <div className="flex-1 overflow-y-auto scrollbar-none p-4 space-y-5 bg-slate-50">
            {/* Nome */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-1.5 px-1">
                <User size={12} className="text-blue-500" /> Nome Completo *
              </label>
              <input
                type="text"
                value={regName}
                onChange={e => setRegName(e.target.value)}
                placeholder="Ex: João da Silva"
                className="w-full h-12 px-4 rounded-xl border-2 border-slate-100 bg-white text-sm font-semibold focus:border-blue-500 focus:ring-0 outline-none transition-colors"
              />
            </div>

            {/* Telefone */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-1.5 px-1">
                <Phone size={12} className="text-blue-500" /> Telefone
              </label>
              <input
                type="tel"
                value={regPhone}
                onChange={e => setRegPhone(e.target.value)}
                placeholder="(00) 00000-0000"
                className="w-full h-12 px-4 rounded-xl border-2 border-slate-100 bg-white text-sm font-semibold focus:border-blue-500 focus:ring-0 outline-none transition-colors"
              />
            </div>

            {/* CPF / CNPJ */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-1.5 px-1">
                <FileText size={12} className="text-blue-500" /> CPF ou CNPJ
              </label>
              <input
                type="text"
                value={regDocument}
                onChange={e => setRegDocument(e.target.value)}
                placeholder="000.000.000-00"
                className="w-full h-12 px-4 rounded-xl border-2 border-slate-100 bg-white text-sm font-semibold focus:border-blue-500 focus:ring-0 outline-none transition-colors"
              />
            </div>

            {/* Endereço via CEP */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-1.5 px-1">
                <MapPin size={12} className="text-blue-500" /> CEP
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={regCep}
                  onChange={e => handleRegCepChange(e.target.value)}
                  placeholder="00000-000"
                  maxLength={9}
                  className="w-full h-12 px-4 pr-10 rounded-xl border-2 border-slate-100 bg-white text-sm font-semibold focus:border-blue-500 focus:ring-0 outline-none transition-colors"
                />
                {regCepLoading && <Loader2 className="absolute right-3 top-3.5 w-5 h-5 animate-spin text-blue-400" />}
                {!regCepLoading && regCep.length >= 9 && !regCepError && regStreet && <Search className="absolute right-3 top-3.5 w-5 h-5 text-emerald-400" />}
              </div>
              {regCepError && <p className="text-[10px] text-rose-500 font-bold px-1">{regCepError}</p>}
            </div>

            {regStreet && (
              <>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 px-1">Rua</label>
                  <input
                    type="text"
                    value={regStreet}
                    onChange={e => setRegStreet(e.target.value)}
                    className="w-full h-12 px-4 rounded-xl border-2 border-slate-100 bg-white text-sm font-semibold focus:border-blue-500 focus:ring-0 outline-none transition-colors"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 px-1">Número</label>
                    <input
                      type="text"
                      value={regNumber}
                      onChange={e => setRegNumber(e.target.value)}
                      placeholder="Nº"
                      className="w-full h-12 px-4 rounded-xl border-2 border-slate-100 bg-white text-sm font-semibold focus:border-blue-500 focus:ring-0 outline-none transition-colors"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 px-1">Bairro</label>
                    <input
                      type="text"
                      value={regNeighborhood}
                      onChange={e => setRegNeighborhood(e.target.value)}
                      className="w-full h-12 px-4 rounded-xl border-2 border-slate-100 bg-white text-sm font-semibold focus:border-blue-500 focus:ring-0 outline-none transition-colors"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-2 space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 px-1">Cidade</label>
                    <input
                      type="text"
                      value={regCity}
                      readOnly
                      className="w-full h-12 px-4 rounded-xl border-2 border-slate-100 bg-slate-50 text-sm font-semibold text-slate-600"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 px-1">UF</label>
                    <input
                      type="text"
                      value={regState}
                      readOnly
                      className="w-full h-12 px-4 rounded-xl border-2 border-slate-100 bg-slate-50 text-sm font-semibold text-slate-600 text-center"
                    />
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Modal Footer */}
          <div className="shrink-0 p-4 bg-white border-t border-slate-100">
            <button
              onClick={handleCreateCustomer}
              disabled={saving || !regName.trim()}
              className="w-full h-12 bg-blue-600 text-white font-black uppercase text-xs tracking-widest rounded-xl shadow-lg shadow-blue-600/20 active:scale-[0.98] transition-transform disabled:opacity-50 disabled:active:scale-100 flex items-center justify-center gap-2"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShoppingCart size={16} />}
              {saving ? "Salvando..." : "Finalizar e ir ao PDV"}
            </button>
          </div>
        </div>
      )}
    </>
  )
}

/* ======================== VISIT CARD COMPONENT ======================== */
function VisitCard({
  visit,
  config,
  onAction,
}: {
  visit: Visit
  config: Record<string, { label: string; color: string; bg: string }>
  onAction?: () => void
}) {
  const cfg = config[visit.status] || config.SCHEDULED
  const date = new Date(visit.visitDate)

  return (
    <div className={`bg-white rounded-2xl border shadow-sm overflow-hidden ${onAction ? 'active:scale-[0.98] transition-transform' : ''}`}>
      <div className="p-4 space-y-2.5" onClick={onAction}>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-sm font-black text-slate-600">
              {visit.clientName.charAt(0)}
            </div>
            <div>
              <p className="font-bold text-slate-800 text-sm">{visit.clientName}</p>
              <div className="flex items-center gap-2 text-[10px] text-slate-400 font-bold mt-0.5">
                <Calendar size={10} />
                {date.toLocaleDateString('pt-BR')} às {date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>
          <span className={`text-[9px] uppercase font-black px-2.5 py-1 rounded-full border ${cfg.bg} ${cfg.color}`}>
            {cfg.label}
          </span>
        </div>

        {visit.clientAddress && (
          <p className="text-[11px] text-slate-400 flex items-center gap-1.5 pl-[52px]">
            <MapPin size={10} className="shrink-0" /> {visit.clientAddress}
          </p>
        )}

        {visit.clientPhone && (
          <p className="text-[11px] text-slate-400 flex items-center gap-1.5 pl-[52px]">
            <Phone size={10} className="shrink-0" /> {visit.clientPhone}
          </p>
        )}

        {visit.notes && (
          <p className="text-[11px] text-slate-400 italic pl-[52px] border-t border-slate-50 pt-2">
            "{visit.notes}"
          </p>
        )}

        {onAction && visit.status === "SCHEDULED" && (
          <div className="pl-[52px] pt-1">
            <span className="text-[9px] font-bold text-blue-500 uppercase tracking-widest">
              Toque para registrar resultado →
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
