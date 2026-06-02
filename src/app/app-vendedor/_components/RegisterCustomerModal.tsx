"use client"

import { useState, useEffect } from "react"
import { ArrowLeft, User, Phone, MapPin, Briefcase, FileText, Send, Zap, ShieldCheck, Loader2, XCircle, Search } from "lucide-react"

interface RegisterCustomerModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: (customer: { id: string; fullName: string }) => void
  sellerId?: string | null
  initialData?: {
    fullName?: string
    phone?: string
    street?: string
    number?: string
    neighborhood?: string
    city?: string
    state?: string
    zipCode?: string
  } | null
}

export function RegisterCustomerModal({
  isOpen,
  onClose,
  onSuccess,
  sellerId,
  initialData,
}: RegisterCustomerModalProps) {
  const [isFullMode, setIsFullMode] = useState(false)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  // Config data (sellers & lead sources)
  const [sellers, setSellers] = useState<any[]>([])
  const [leadSources, setLeadSources] = useState<any[]>([])

  // Form states
  const [personType, setPersonType] = useState("INDIVIDUAL")
  const [fullName, setFullName] = useState("")
  const [tradeName, setTradeName] = useState("")
  const [document, setDocument] = useState("")
  const [rg, setRg] = useState("")
  const [companySize, setCompanySize] = useState("")
  const [birthDate, setBirthDate] = useState("")
  const [gender, setGender] = useState("")
  
  const [phone, setPhone] = useState("")
  const [whatsapp, setWhatsapp] = useState("")
  const [email, setEmail] = useState("")
  const [instagram, setInstagram] = useState("")
  const [contactPerson, setContactPerson] = useState("")

  const [zipCode, setZipCode] = useState("")
  const [street, setStreet] = useState("")
  const [number, setNumber] = useState("")
  const [neighborhood, setNeighborhood] = useState("")
  const [city, setCity] = useState("")
  const [state, setState] = useState("")
  const [complement, setComplement] = useState("")
  const [cepLoading, setCepLoading] = useState(false)
  const [cepError, setCepError] = useState("")

  const [formSellerId, setFormSellerId] = useState("")
  const [leadSourceId, setLeadSourceId] = useState("")
  const [creditLimit, setCreditLimit] = useState("0")
  const [priority, setPriority] = useState("NORMAL")
  const [motherName, setMotherName] = useState("")
  const [fatherName, setFatherName] = useState("")
  const [invoiceEmail, setInvoiceEmail] = useState("")
  const [notes, setNotes] = useState("")

  // Fetch configs (sellers & lead sources)
  useEffect(() => {
    if (!isOpen) return
    async function loadConfigs() {
      setLoading(true)
      try {
        const res = await fetch("/api/configuracoes-cadastro")
        if (res.ok) {
          const data = await res.json()
          setSellers(data.sellers || [])
          setLeadSources(data.leadSources || [])
        }
      } catch (err) {
        console.error("Erro ao carregar dados auxiliares", err)
      } finally {
        setLoading(false)
      }
    }
    loadConfigs()
  }, [isOpen])

  // Pre-fill initial data when opened
  useEffect(() => {
    if (!isOpen) return
    
    // Set default seller if passed
    if (sellerId) {
      setFormSellerId(sellerId)
    }

    if (initialData) {
      setFullName(initialData.fullName || "")
      setPhone(initialData.phone || "")
      setWhatsapp(initialData.phone || "")
      setStreet(initialData.street || "")
      setNumber(initialData.number || "")
      setNeighborhood(initialData.neighborhood || "")
      setCity(initialData.city || "")
      setState(initialData.state || "")
      
      if (initialData.zipCode) {
        const clean = initialData.zipCode.replace(/\D/g, "")
        const formatted = clean.length > 5 ? clean.slice(0, 5) + '-' + clean.slice(5, 8) : clean
        setZipCode(formatted)
      }
    } else {
      // Reset form on clean open
      setFullName("")
      setPhone("")
      setWhatsapp("")
      setStreet("")
      setNumber("")
      setNeighborhood("")
      setCity("")
      setState("")
      setZipCode("")
      setDocument("")
      setTradeName("")
      setRg("")
      setCompanySize("")
      setBirthDate("")
      setGender("")
      setEmail("")
      setInstagram("")
      setContactPerson("")
      setComplement("")
      setLeadSourceId("")
      setCreditLimit("0")
      setPriority("NORMAL")
      setMotherName("")
      setFatherName("")
      setInvoiceEmail("")
      setNotes("")
    }
  }, [isOpen, initialData, sellerId])

  // Formatting helpers
  const formatPhone = (val: string) => {
    const clean = val.replace(/\D/g, "")
    if (clean.length <= 10) {
      return clean.replace(/^(\d{2})(\d{0,4})(\d{0,4})/, (_, ddd, p1, p2) => {
        return ddd ? `(${ddd})${p1 ? " " + p1 : ""}${p2 ? "-" + p2 : ""}` : ""
      })
    } else {
      return clean.slice(0, 11).replace(/^(\d{2})(\d{0,5})(\d{0,4})/, (_, ddd, p1, p2) => {
        return ddd ? `(${ddd})${p1 ? " " + p1 : ""}${p2 ? "-" + p2 : ""}` : ""
      })
    }
  }

  const formatCpfCnpj = (val: string) => {
    const clean = val.replace(/\D/g, "")
    if (clean.length <= 11) {
      // CPF: 000.000.000-00
      return clean.replace(/^(\d{3})(\d{0,3})(\d{0,3})(\d{0,2})/, (_, p1, p2, p3, p4) => {
        return `${p1}${p2 ? "." + p2 : ""}${p3 ? "." + p3 : ""}${p4 ? "-" + p4 : ""}`
      })
    } else {
      // CNPJ: 00.000.000/0000-00
      return clean.slice(0, 14).replace(/^(\d{2})(\d{0,3})(\d{0,3})(\d{0,4})(\d{0,2})/, (_, p1, p2, p3, p4, p5) => {
        return `${p1}${p2 ? "." + p2 : ""}${p3 ? "." + p3 : ""}${p4 ? "/" + p4 : ""}${p5 ? "-" + p5 : ""}`
      })
    }
  }

  const formatCep = (val: string) => {
    const clean = val.replace(/\D/g, "")
    return clean.length > 5 ? clean.slice(0, 5) + "-" + clean.slice(5, 8) : clean
  }

  // Address cep search
  const handleCepSearch = async (val: string) => {
    const formatted = formatCep(val)
    setZipCode(formatted)
    setCepError("")

    const clean = formatted.replace(/\D/g, "")
    if (clean.length === 8) {
      setCepLoading(true)
      try {
        const res = await fetch(`https://viacep.com.br/ws/${clean}/json/`)
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

  // CNPJ automatic fetch
  const handleDocumentChange = async (val: string) => {
    const formatted = formatCpfCnpj(val)
    setDocument(formatted)

    const clean = formatted.replace(/\D/g, "")
    if (clean.length > 11) {
      setPersonType("COMPANY")
    } else {
      setPersonType("INDIVIDUAL")
    }

    if (clean.length === 14) {
      try {
        const res = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${clean}`)
        if (res.ok) {
          const data = await res.json()
          
          if (data.razao_social) setFullName(data.razao_social)
          if (data.nome_fantasia) setTradeName(data.nome_fantasia)
          if (data.email) {
            setEmail(data.email)
            setInvoiceEmail(data.email)
          }
          if (data.porte) setCompanySize(data.porte)
          
          let fetchedPhone = ""
          let fetchedWhatsapp = ""
          if (data.ddd_telefone_1) {
            const f = `(${data.ddd_telefone_1.substring(0,2)}) ${data.ddd_telefone_1.substring(2)}`
            if (data.ddd_telefone_1.substring(2).startsWith("9")) {
              fetchedWhatsapp = f
            } else {
              fetchedPhone = f
            }
          }
          if (data.ddd_telefone_2) {
            const f = `(${data.ddd_telefone_2.substring(0,2)}) ${data.ddd_telefone_2.substring(2)}`
            if (data.ddd_telefone_2.substring(2).startsWith("9")) {
              fetchedWhatsapp = f
            } else if (!fetchedPhone) {
              fetchedPhone = f
            }
          }

          if (fetchedPhone) setPhone(formatPhone(fetchedPhone))
          if (fetchedWhatsapp) setWhatsapp(formatPhone(fetchedWhatsapp))

          if (data.cep) {
            const cepStr = data.cep.toString()
            setZipCode(formatCep(cepStr))
            setStreet(data.logradouro || "")
            setNumber(data.numero || "")
            setComplement(data.complemento || "")
            setNeighborhood(data.bairro || "")
            setCity(data.municipio || "")
            setState(data.uf || "")
          }
        }
      } catch (err) {
        console.error("Erro ao buscar CNPJ", err)
      }
    }
  }

  // Handle Save
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!fullName.trim()) return

    setSaving(true)
    try {
      const res = await fetch("/api/clientes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          personType,
          fullName: fullName.trim(),
          tradeName: tradeName.trim() || null,
          document: document.trim() || null,
          rg: rg.trim() || null,
          companySize: companySize.trim() || null,
          birthDate: birthDate || null,
          gender: gender || null,
          phone: phone.trim() || null,
          whatsapp: whatsapp.trim() || null,
          email: email.trim() || null,
          instagram: instagram.trim() || null,
          contactPerson: contactPerson.trim() || null,
          notes: notes.trim() || null,
          sellerId: formSellerId || null,
          leadSourceId: leadSourceId || null,
          creditLimit: creditLimit ? parseFloat(creditLimit) : 0,
          priority,
          commercialStatus: "ACTIVE",
          invoiceEmail: invoiceEmail.trim() || null,
          motherName: motherName.trim() || null,
          fatherName: fatherName.trim() || null,
          zipCode,
          street: street.trim() || null,
          number: number.trim() || null,
          complement: complement.trim() || null,
          neighborhood: neighborhood.trim() || null,
          city: city.trim() || null,
          state: state.trim() || null,
        }),
      })

      if (res.ok) {
        const customer = await res.json()
        onSuccess(customer)
      } else {
        const errorData = await res.json()
        alert(`Erro ao salvar: ${errorData.error || "Erro desconhecido"}`)
      }
    } catch (err) {
      console.error(err)
      alert("Erro de conexão ao salvar cliente")
    } finally {
      setSaving(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[200] bg-white flex flex-col animate-in fade-in slide-in-from-bottom-6 duration-300">
      {/* Header */}
      <div className="shrink-0 flex items-center justify-between px-4 py-3 bg-[#002242] text-white">
        <div className="flex items-center gap-3">
          <button onClick={onClose} className="p-2 -ml-2 text-slate-300 active:bg-white/10 rounded-full transition-colors">
            <ArrowLeft size={22} />
          </button>
          <div>
            <h2 className="text-base font-black uppercase tracking-tight text-white">Novo Cliente</h2>
            <p className="text-[9px] text-slate-300 font-bold uppercase tracking-widest">
              {isFullMode ? "Modo Completo (CRM)" : "Modo Rápido (PDV)"}
            </p>
          </div>
        </div>

        {/* Toggle Mode */}
        <button
          type="button"
          onClick={() => setIsFullMode(!isFullMode)}
          className="flex items-center gap-1 bg-white/10 px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border border-white/20 active:scale-95 transition-transform"
        >
          <Zap size={10} className={isFullMode ? "text-yellow-400 fill-yellow-400" : "text-white"} />
          {isFullMode ? "Modo Rápido" : "Modo Completo"}
        </button>
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center bg-slate-50">
          <Loader2 className="w-8 h-8 animate-spin text-[#002242]" />
        </div>
      ) : (
        <form onSubmit={handleSave} className="flex-1 flex flex-col min-h-0 bg-slate-50">
          {/* Form Scroll Body */}
          <div className="flex-1 overflow-y-auto p-4 space-y-6 pb-24 scrollbar-none">
            
            {/* SEÇÃO 1: IDENTIFICAÇÃO */}
            <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm space-y-4">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-[#002242] flex items-center gap-1.5 border-b border-slate-100 pb-2">
                <User size={14} className="text-blue-500" /> Identificação
              </h3>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 px-1">Tipo Pessoa</label>
                  <select
                    value={personType}
                    onChange={e => setPersonType(e.target.value)}
                    className="w-full h-11 px-3 rounded-xl border border-slate-200 bg-white text-xs font-semibold focus:border-blue-500 outline-none"
                  >
                    <option value="INDIVIDUAL">Física</option>
                    <option value="COMPANY">Jurídica</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 px-1">CPF / CNPJ</label>
                  <input
                    type="text"
                    value={document}
                    onChange={e => handleDocumentChange(e.target.value)}
                    placeholder={personType === "INDIVIDUAL" ? "000.000.000-00" : "00.000.000/0000-00"}
                    className="w-full h-11 px-3 rounded-xl border border-slate-200 bg-white text-xs font-semibold focus:border-blue-500 outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 px-1">Nome Completo / Razão Social *</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  placeholder="Nome do cliente"
                  className="w-full h-11 px-3 rounded-xl border border-slate-200 bg-white text-xs font-bold focus:border-blue-500 outline-none"
                />
              </div>

              {isFullMode && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 px-1">Nome Fantasia</label>
                      <input
                        type="text"
                        value={tradeName}
                        onChange={e => setTradeName(e.target.value)}
                        placeholder="Nome fantasia"
                        className="w-full h-11 px-3 rounded-xl border border-slate-200 bg-white text-xs font-semibold focus:border-blue-500 outline-none"
                      />
                    </div>
                    {personType === "INDIVIDUAL" ? (
                      <div className="space-y-1.5">
                        <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 px-1">RG</label>
                        <input
                          type="text"
                          value={rg}
                          onChange={e => setRg(e.target.value)}
                          placeholder="RG"
                          className="w-full h-11 px-3 rounded-xl border border-slate-200 bg-white text-xs font-semibold focus:border-blue-500 outline-none"
                        />
                      </div>
                    ) : (
                      <div className="space-y-1.5">
                        <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 px-1">Porte da Empresa</label>
                        <input
                          type="text"
                          value={companySize}
                          onChange={e => setCompanySize(e.target.value)}
                          placeholder="Ex: ME, EPP"
                          className="w-full h-11 px-3 rounded-xl border border-slate-200 bg-white text-xs font-semibold focus:border-blue-500 outline-none"
                        />
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 px-1">Data Nascimento</label>
                      <input
                        type="date"
                        value={birthDate}
                        onChange={e => setBirthDate(e.target.value)}
                        className="w-full h-11 px-3 rounded-xl border border-slate-200 bg-white text-xs font-semibold focus:border-blue-500 outline-none"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 px-1">Gênero</label>
                      <select
                        value={gender}
                        onChange={e => setGender(e.target.value)}
                        className="w-full h-11 px-3 rounded-xl border border-slate-200 bg-white text-xs font-semibold focus:border-blue-500 outline-none"
                      >
                        <option value="">Selecione</option>
                        <option value="MASC">Masculino</option>
                        <option value="FEM">Feminino</option>
                        <option value="OTHER">Outro</option>
                      </select>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* SEÇÃO 2: CONTATO */}
            <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm space-y-4">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-[#002242] flex items-center gap-1.5 border-b border-slate-100 pb-2">
                <Phone size={14} className="text-blue-500" /> Contato
              </h3>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 px-1">Telefone Principal</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={e => setPhone(formatPhone(e.target.value))}
                    placeholder="(00) 0000-0000"
                    className="w-full h-11 px-3 rounded-xl border border-slate-200 bg-white text-xs font-semibold focus:border-blue-500 outline-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 px-1">WhatsApp</label>
                  <input
                    type="tel"
                    value={whatsapp}
                    onChange={e => setWhatsapp(formatPhone(e.target.value))}
                    placeholder="(00) 90000-0000"
                    className="w-full h-11 px-3 rounded-xl border border-slate-200 bg-white text-xs font-semibold focus:border-blue-500 outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 px-1">E-mail Principal</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="email@exemplo.com"
                  className="w-full h-11 px-3 rounded-xl border border-slate-200 bg-white text-xs font-semibold focus:border-blue-500 outline-none"
                />
              </div>

              {isFullMode && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 px-1">Instagram</label>
                    <input
                      type="text"
                      value={instagram}
                      onChange={e => setInstagram(e.target.value)}
                      placeholder="@usuario"
                      className="w-full h-11 px-3 rounded-xl border border-slate-200 bg-white text-xs font-semibold focus:border-blue-500 outline-none"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 px-1">Contato Responsável</label>
                    <input
                      type="text"
                      value={contactPerson}
                      onChange={e => setContactPerson(e.target.value)}
                      placeholder="Nome do contato"
                      className="w-full h-11 px-3 rounded-xl border border-slate-200 bg-white text-xs font-semibold focus:border-blue-500 outline-none"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* SEÇÃO 3: ENDEREÇO */}
            <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm space-y-4">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-[#002242] flex items-center gap-1.5 border-b border-slate-100 pb-2">
                <MapPin size={14} className="text-blue-500" /> Endereço Principal
              </h3>

              <div className="space-y-1.5">
                <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 px-1">CEP</label>
                <div className="relative">
                  <input
                    type="text"
                    value={zipCode}
                    onChange={e => handleCepSearch(e.target.value)}
                    placeholder="00000-000"
                    maxLength={9}
                    className="w-full h-11 px-3 pr-10 rounded-xl border border-slate-200 bg-white text-xs font-semibold focus:border-blue-500 outline-none"
                  />
                  {cepLoading && <Loader2 className="absolute right-3 top-3.5 w-4 h-4 animate-spin text-blue-400" />}
                  {!cepLoading && zipCode.length >= 9 && !cepError && street && <Search className="absolute right-3 top-3.5 w-4 h-4 text-emerald-400" />}
                </div>
                {cepError && <p className="text-[10px] text-rose-500 font-bold px-1">{cepError}</p>}
              </div>

              {street && (
                <>
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 px-1">Rua / Logradouro</label>
                    <input
                      type="text"
                      value={street}
                      onChange={e => setStreet(e.target.value)}
                      className="w-full h-11 px-3 rounded-xl border border-slate-200 bg-white text-xs font-semibold focus:border-blue-500 outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 px-1">Número</label>
                      <input
                        type="text"
                        value={number}
                        onChange={e => setNumber(e.target.value)}
                        placeholder="Nº"
                        className="w-full h-11 px-3 rounded-xl border border-slate-200 bg-white text-xs font-semibold focus:border-blue-500 outline-none"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 px-1">Bairro</label>
                      <input
                        type="text"
                        value={neighborhood}
                        onChange={e => setNeighborhood(e.target.value)}
                        className="w-full h-11 px-3 rounded-xl border border-slate-200 bg-white text-xs font-semibold focus:border-blue-500 outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="col-span-2 space-y-1.5">
                      <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 px-1">Cidade</label>
                      <input
                        type="text"
                        value={city}
                        readOnly
                        className="w-full h-11 px-3 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600 outline-none"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 px-1">UF</label>
                      <input
                        type="text"
                        value={state}
                        readOnly
                        className="w-full h-11 px-3 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600 text-center outline-none"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 px-1">Complemento</label>
                    <input
                      type="text"
                      value={complement}
                      onChange={e => setComplement(e.target.value)}
                      placeholder="Apto, Sala, Bloco"
                      className="w-full h-11 px-3 rounded-xl border border-slate-200 bg-white text-xs font-semibold focus:border-blue-500 outline-none"
                    />
                  </div>
                </>
              )}
            </div>

            {/* SEÇÃO 4: DADOS ADICIONAIS & CRM (Apenas no Modo Completo) */}
            {isFullMode && (
              <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm space-y-4">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-[#002242] flex items-center gap-1.5 border-b border-slate-100 pb-2">
                  <Briefcase size={14} className="text-blue-500" /> Vendas & CRM
                </h3>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 px-1">Vendedor Responsável</label>
                    <select
                      value={formSellerId}
                      onChange={e => setFormSellerId(e.target.value)}
                      className="w-full h-11 px-3 rounded-xl border border-slate-200 bg-white text-xs font-semibold focus:border-blue-500 outline-none"
                    >
                      <option value="">Selecione</option>
                      {sellers.map(s => (
                        <option key={s.id} value={s.id}>
                          {s.jobTitleName ? `${s.name} • ${s.jobTitleName}` : s.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 px-1">Origem Principal</label>
                    <select
                      value={leadSourceId}
                      onChange={e => setLeadSourceId(e.target.value)}
                      className="w-full h-11 px-3 rounded-xl border border-slate-200 bg-white text-xs font-semibold focus:border-blue-500 outline-none"
                    >
                      <option value="">Selecione</option>
                      {leadSources.map(ls => (
                        <option key={ls.id} value={ls.id}>{ls.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 px-1">Limite Crédito (R$)</label>
                    <input
                      type="number"
                      value={creditLimit}
                      onChange={e => setCreditLimit(e.target.value)}
                      step="0.01"
                      className="w-full h-11 px-3 rounded-xl border border-slate-200 bg-white text-xs font-bold text-emerald-700 focus:border-blue-500 outline-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 px-1">Prioridade</label>
                    <select
                      value={priority}
                      onChange={e => setPriority(e.target.value)}
                      className="w-full h-11 px-3 rounded-xl border border-slate-200 bg-white text-xs font-semibold focus:border-blue-500 outline-none"
                    >
                      <option value="LOW">Baixa</option>
                      <option value="NORMAL">Normal</option>
                      <option value="HIGH">Alta</option>
                      <option value="CRITICAL">Crítica</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 px-1">Nome da Mãe</label>
                    <input
                      type="text"
                      value={motherName}
                      onChange={e => setMotherName(e.target.value)}
                      placeholder="Nome da mãe"
                      className="w-full h-11 px-3 rounded-xl border border-slate-200 bg-white text-xs font-semibold focus:border-blue-500 outline-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 px-1">Nome do Pai</label>
                    <input
                      type="text"
                      value={fatherName}
                      onChange={e => setFatherName(e.target.value)}
                      placeholder="Nome do pai"
                      className="w-full h-11 px-3 rounded-xl border border-slate-200 bg-white text-xs font-semibold focus:border-blue-500 outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 px-1">E-mail Nota Fiscal (NFe)</label>
                  <input
                    type="email"
                    value={invoiceEmail}
                    onChange={e => setInvoiceEmail(e.target.value)}
                    placeholder="nfe@exemplo.com"
                    className="w-full h-11 px-3 rounded-xl border border-slate-200 bg-white text-xs font-semibold focus:border-blue-500 outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 px-1">Observações do Cliente</label>
                  <textarea
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    placeholder="Informações adicionais relevantes..."
                    rows={3}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold focus:border-blue-500 outline-none resize-none"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="shrink-0 p-4 bg-white border-t border-slate-100 flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="flex-1 h-12 border border-slate-200 text-slate-500 font-black uppercase text-xs tracking-widest rounded-xl active:scale-[0.98] transition-transform disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving || !fullName.trim()}
              className="flex-1 h-12 bg-[#002242] text-white font-black uppercase text-xs tracking-widest rounded-xl shadow-lg shadow-blue-900/20 active:scale-[0.98] transition-transform disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send size={14} />}
              {saving ? "Salvando..." : "Salvar Cliente"}
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
