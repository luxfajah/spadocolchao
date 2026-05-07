"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { MaskedInput } from "@/components/ui/MaskedInput"
import {
  ArrowLeft, ArrowRight, Loader2, Users, Briefcase, MapPin,
  CreditCard, Shield, Upload, X, CheckCircle2, Heart,
  GraduationCap, DollarSign, Camera, Clock
} from "lucide-react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { cleanNumericValues } from "@/lib/utils"

// ─── Steps ────────────────────────────────────────────────────────────────────
const STEPS = [
  { id: 1, icon: Users,         label: "Identificação",    sub: "Nome, CPF, RG, foto" },
  { id: 2, icon: Heart,         label: "Saúde & PcD",      sub: "Deficiência, condições" },
  { id: 3, icon: MapPin,        label: "Endereço",         sub: "CEP, rua, cidade" },
  { id: 4, icon: Briefcase,     label: "Vínculo",          sub: "Contrato, cargo, jornada" },
  { id: 5, icon: DollarSign,    label: "Benefícios",       sub: "VT, VA, assiduidade" },
  { id: 6, icon: CreditCard,    label: "Dados Bancários",  sub: "Banco, conta, PIX" },
  { id: 7, icon: Shield,        label: "Documentos",       sub: "Cópias obrigatórias" },
]

const DOC_SLOTS = [
  { key: "rg_cpf",     label: "Cópia do RG e CPF",             required: false },
  { key: "ctps",       label: "Cópia da CTPS",                  required: false },
  { key: "pis",        label: "Cartão PIS / PASEP",              required: false },
  { key: "admissional",label: "Exame Admissional",               required: false },
  { key: "contrato",   label: "Contrato de Trabalho Assinado",   required: false },
  { key: "cnpj_pj",   label: "CNPJ / Contrato Social (PJ)",     required: false },
  { key: "titulo",     label: "Título de Eleitor",               required: false },
  { key: "reservista", label: "Certificado de Reservista",       required: false },
  { key: "comprovante",label: "Comprovante de Residência",       required: false },
  { key: "foto_3x4",  label: "Foto 3x4 / Selfie",               required: false },
]

// ─── Componentes auxiliares ───────────────────────────────────────────────────
function FileUpload({ label, required, value, onChange }: {
  label: string; required?: boolean; value: File | null; onChange: (f: File | null) => void
}) {
  return value ? (
    <div className="flex items-center gap-3 p-3 rounded-2xl border border-emerald-100 bg-emerald-50">
      <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-xs font-bold text-emerald-700 truncate">{value.name}</p>
        <p className="text-[9px] text-emerald-500 font-bold uppercase tracking-widest">{(value.size / 1024).toFixed(1)} KB</p>
      </div>
      <button type="button" onClick={() => onChange(null)}
        className="h-6 w-6 rounded-full bg-red-100 flex items-center justify-center hover:bg-red-200">
        <X className="h-3 w-3 text-red-500" />
      </button>
    </div>
  ) : (
    <label className="cursor-pointer flex items-center gap-3 p-3 rounded-2xl border-2 border-dashed border-slate-200 hover:border-primary/40 hover:bg-primary/5 transition-all group">
      <div className="h-8 w-8 rounded-xl bg-white border border-slate-100 flex items-center justify-center flex-shrink-0">
        <Upload className="h-4 w-4 text-slate-400 group-hover:text-primary transition-colors" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-bold text-slate-600 truncate">
          {label} {required && <span className="text-rose-500">*</span>}
        </p>
        <p className="text-[9px] text-slate-400 uppercase tracking-widest font-bold">PDF, JPG ou PNG</p>
      </div>
      <input type="file" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" className="hidden"
        onChange={e => onChange(e.target.files?.[0] || null)} />
    </label>
  )
}

function Toggle({ value, onChange, label, description, color = "primary" }: {
  value: boolean; onChange: (v: boolean) => void; label: string; description?: string; color?: string
}) {
  return (
    <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-100 cursor-pointer" onClick={() => onChange(!value)}>
      <div>
        <p className="text-sm font-bold text-slate-700">{label}</p>
        {description && <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold mt-0.5">{description}</p>}
      </div>
      <div className={`h-6 w-11 rounded-full transition-all relative ${value ? 'bg-primary' : 'bg-slate-200'}`}>
        <div className={`h-5 w-5 rounded-full bg-white shadow-sm absolute top-0.5 transition-all ${value ? 'left-5' : 'left-0.5'}`} />
      </div>
    </div>
  )
}

export default function NovoFuncionarioPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const photoRef = useRef<HTMLInputElement>(null)
  const isFetched = useRef(false)

  const [workSchedules, setWorkSchedules] = useState<any[]>([])
  const [jobTitles, setJobTitles] = useState<any[]>([])
  const [costCenters, setCostCenters] = useState<any[]>([])
  
  useEffect(() => {
    if (isFetched.current) return
    isFetched.current = true
    
    fetch("/api/rh/funcionarios/next-id")
      .then(res => res.json())
      .then(data => {
        if (data.nextId) {
          setForm(prev => ({ 
            ...prev, 
            serialId: data.nextId.toString(),
            pointMachineId: data.nextId.toString()
          }))
        }
      })

    fetch("/api/rh/ponto/escalas")
      .then(res => res.json())
      .then(data => setWorkSchedules(Array.isArray(data) ? data : []))

    fetch("/api/rh/cargos")
      .then(res => res.json())
      .then(data => setJobTitles(Array.isArray(data) ? data.filter(item => item.isActive) : []))

    fetch("/api/rh/centros-de-custo")
      .then(res => res.json())
      .then(data => setCostCenters(Array.isArray(data) ? data : []))
  }, [])

  const [form, setForm] = useState({
    // Etapa 1 — Identificação
    fullName: "", socialName: "", cpf: "", rg: "", rgExpeditor: "",
    pis: "", birthDate: "", birthCity: "", birthState: "",
    nationality: "Brasileiro(a)", gender: "", maritalStatus: "", educationLevel: "",
    phone: "", whatsapp: "", email: "",
    photoUrl: "",
    // Etapa 2 — Saúde / PcD
    isPCD: false, pcdDetails: "", hasHealthCondition: false, healthConditionDetails: "",
    // Etapa 3 — Endereço
    cep: "", address: "", number: "", complement: "", neighborhood: "", city: "", state: "",
    // Etapa 4 — Vínculo
    contractType: "CLT", admissionDate: new Date().toISOString().split("T")[0],
    jobTitleId: "", salaryBase: "", department: "", workScheduleId: "", costCenterId: "",
    isCustomSchedule: false,
    customScheduleData: {
      mondayIn1: "08:00", mondayOut1: "12:00", mondayIn2: "13:00", mondayOut2: "17:00", mondayMinutes: 480,
      tuesdayIn1: "08:00", tuesdayOut1: "12:00", tuesdayIn2: "13:00", tuesdayOut2: "17:00", tuesdayMinutes: 480,
      wednesdayIn1: "08:00", wednesdayOut1: "12:00", wednesdayIn2: "13:00", wednesdayOut2: "17:00", wednesdayMinutes: 480,
      thursdayIn1: "08:00", thursdayOut1: "12:00", thursdayIn2: "13:00", thursdayOut2: "17:00", thursdayMinutes: 480,
      fridayIn1: "08:00", fridayOut1: "12:00", fridayIn2: "13:00", fridayOut2: "17:00", fridayMinutes: 480,
      saturdayIn1: "", saturdayOut1: "", saturdayIn2: "", saturdayOut2: "", saturdayMinutes: 0,
      sundayIn1: "", sundayOut1: "", sundayIn2: "", sundayOut2: "", sundayMinutes: 0,
      weeklyHours: "40", expectedLunchMinutes: "60"
    },
    apprenticeshipEnd: "", schoolName: "", schoolShift: "", technicalCourse: "",
    // Etapa 5 — Benefícios
    vtDailyValue: "", vtWorkDaysPerMonth: "22",
    transportationPayrollDeductionEnabled: true, transportationPayrollDeductionPercent: "6",
    foodAllowance: "",
    foodPayrollDeductionEnabled: false, foodPayrollDeductionPercent: "0",
    fuelAllowance: "",
    healthPlan: false, healthPlanDetails: "",
    dentalPlan: false, lifeInsurance: false,
    attendanceBonusEnabled: false, attendanceBonusAmount: "",
    pharmacyAllowance: "", childcareAllowance: "", otherBenefits: "",
    // Etapa 6 — Banco
    bankName: "", bankBranch: "", bankAccount: "", bankAccountType: "CHECKING",
    pixKey: "", pixKeyType: "CPF",
    serialId: "", pointMachineId: "",
  })

  const [docs, setDocs] = useState<Record<string, File | null>>(
    Object.fromEntries(DOC_SLOTS.map(d => [d.key, null]))
  )

  function set(field: string, value: any) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  async function handleCepChange(val: string) {
    setForm(prev => ({ ...prev, cep: val }))
    const cleanCep = val.replace(/\D/g, "")
    if (cleanCep.length === 8) {
      try {
        const res = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`)
        const data = await res.json()
        if (!data.erro) {
          setForm(prev => ({
            ...prev,
            address: data.logradouro,
            neighborhood: data.bairro,
            city: data.localidade,
            state: data.uf,
          }))
          document.getElementById('funcAddressNumber')?.focus()
        }
      } catch (err) {
        console.error("Erro ao buscar CEP", err)
      }
    }
  }

  function applyJobTitleDefaults(jobTitleId: string) {
    const selectedJobTitle = jobTitles.find(job => job.id === jobTitleId)

    setForm(prev => ({
      ...prev,
      jobTitleId,
      department: selectedJobTitle?.department || "",
      costCenterId: selectedJobTitle?.costCenterId || prev.costCenterId,
      salaryBase:
        selectedJobTitle?.defaultSalary !== null && selectedJobTitle?.defaultSalary !== undefined
          ? String(selectedJobTitle.defaultSalary)
          : "",
      workScheduleId:
        selectedJobTitle?.workScheduleId && !prev.isCustomSchedule
          ? selectedJobTitle.workScheduleId
          : prev.workScheduleId,
      isCustomSchedule: selectedJobTitle?.workScheduleId ? false : prev.isCustomSchedule,
    }))
  }

  function handlePhoto(file: File | null) {
    if (!file) { setPhotoPreview(null); return }
    const url = URL.createObjectURL(file)
    setPhotoPreview(url)
  }

  function updateCustomSchedule(day: string, field: string, value: string) {
    setForm(prev => {
      const newSchedule = { ...prev.customScheduleData } as any
      newSchedule[`${day}${field}`] = value
      
      // Calcular minutos do dia
      const in1 = newSchedule[`${day}In1`]
      const out1 = newSchedule[`${day}Out1`]
      const in2 = newSchedule[`${day}In2`]
      const out2 = newSchedule[`${day}Out2`]
      
      let minutes = 0
      if (in1 && out1) {
        const [h1, m1] = in1.split(":").map(Number)
        const [h2, m2] = out1.split(":").map(Number)
        minutes += (h2 * 60 + m2) - (h1 * 60 + m1)
      }
      if (in2 && out2) {
        const [h3, m3] = in2.split(":").map(Number)
        const [h4, m4] = out2.split(":").map(Number)
        minutes += (h4 * 60 + m4) - (h3 * 60 + m3)
      }
      
      newSchedule[`${day}Minutes`] = Math.max(0, minutes)
      
      // Calcular total semanal
      const days = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]
      const totalMin = days.reduce((acc, d) => acc + (newSchedule[`${d}Minutes`] || 0), 0)
      newSchedule.weeklyHours = (totalMin / 60).toFixed(1)
      
      return { ...prev, customScheduleData: newSchedule }
    })
  }

  // Cálculo automático do VT mensal
  const vtMonthly = parseFloat(form.vtDailyValue || "0") * parseInt(form.vtWorkDaysPerMonth || "0") * 2 // ida e volta
  const vtDiscountPreview =
    form.transportationPayrollDeductionEnabled
      ? Math.min(
          vtMonthly,
          (parseFloat(form.salaryBase || "0") *
            Math.min(6, Math.max(0, parseFloat(form.transportationPayrollDeductionPercent || "6")))) /
            100
        )
      : 0
  const foodDeductionPreview =
    form.foodPayrollDeductionEnabled
      ? (parseFloat(form.foodAllowance || "0") *
          Math.min(100, Math.max(0, parseFloat(form.foodPayrollDeductionPercent || "0")))) /
        100
      : 0
  const selectedJobTitle = jobTitles.find(job => job.id === form.jobTitleId)

  function canAdvance() {
    if (step === 1) return form.fullName.trim().length > 0 && form.cpf.trim().length > 0
    if (step === 4) return form.contractType.trim().length > 0 && form.jobTitleId.trim().length > 0 && form.costCenterId.trim().length > 0
    // Documentos agora são opcionais
    if (step === 7) return true
    return true
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (step < STEPS.length) { setStep(s => s + 1); return }
    if (!canAdvance()) {
      alert(step === 7 ? "Anexe os documentos obrigatórios." : "Preencha os campos obrigatórios antes de continuar.")
      return
    }
    if (!form.jobTitleId) {
      alert("Selecione o cargo do funcionário antes de finalizar o cadastro.")
      return
    }
    if (!form.costCenterId) {
      alert("Selecione o centro de custo do funcionário antes de finalizar o cadastro.")
      return
    }
    if (!canAdvance()) { alert("Anexe os documentos obrigatórios."); return }

    try {
      // Limpeza de dados antes de enviar ao servidor (salvando só números)
      const cleanData = {
        ...form,
        cpf: cleanNumericValues(form.cpf),
        pis: cleanNumericValues(form.pis),
        phone: cleanNumericValues(form.phone),
        cep: cleanNumericValues(form.cep),
        rg: form.rg.replace(/[^a-zA-Z0-9]/g, "").toUpperCase(), // RG flexível
        salaryBase: form.salaryBase ? parseFloat(form.salaryBase) : undefined,
      }

      const payload = {
        ...cleanData,
        transportationAllowance: vtMonthly > 0 ? vtMonthly : undefined,
      }
      const res = await fetch("/api/rh/funcionarios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error()
      router.push("/rh/funcionarios")
      router.refresh()
    } catch {
      alert("Erro ao cadastrar funcionário. Verifique os dados.")
    } finally {
      setLoading(false)
    }
  }

  const inputCls = "rounded-full h-14 border-slate-100 bg-slate-50/50 focus-visible:ring-primary font-medium"
  const selectCls = "flex h-14 w-full rounded-full border border-slate-100 bg-slate-50/50 px-5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary"

  const isMinorApprentice = form.contractType === "APPRENTICE"

  return (
    <main className="flex-1 min-h-screen py-10 px-6 max-w-[1000px] mx-auto space-y-8 animate-in fade-in duration-700 pb-20">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/rh/funcionarios">
          <Button variant="ghost" size="icon" className="h-12 w-12 rounded-full bg-white shadow-sm border border-slate-100">
            <ArrowLeft className="h-5 w-5 text-slate-500" />
          </Button>
        </Link>
        <div>
          <h1 className="text-4xl font-black text-primary font-outfit uppercase tracking-tight">Novo Funcionário</h1>
          <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mt-1">Cadastro Completo de Colaborador</p>
        </div>
      </div>

      {/* Stepper */}
      <div className="bg-white rounded-[2rem] shadow-lahomes border border-slate-50 p-5">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          {STEPS.map((s, i) => {
            const Icon = s.icon
            const active = step === s.id
            const done = step > s.id
            return (
              <div key={s.id} className="flex items-center gap-1.5 flex-shrink-0">
                <button type="button" onClick={() => done && setStep(s.id)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-full font-black text-[9px] uppercase tracking-widest transition-all
                    ${active ? 'bg-primary text-white shadow-lg shadow-primary/20' : done ? 'bg-emerald-100 text-emerald-700 cursor-pointer hover:bg-emerald-200' : 'bg-slate-100 text-slate-400'}`}>
                  {done ? <CheckCircle2 className="h-3 w-3" /> : <Icon className="h-3 w-3" />}
                  <span className="hidden xl:block">{s.label}</span>
                  <span className="xl:hidden">{s.id}</span>
                </button>
                {i < STEPS.length - 1 && <div className="w-3 h-px bg-slate-200 flex-shrink-0" />}
              </div>
            )
          })}
        </div>
        <div className="mt-2 px-1">
          <p className="text-xs font-black text-slate-400 uppercase tracking-widest">
            Etapa {step}: {STEPS[step - 1]?.label}
            <span className="font-medium text-slate-300"> — {STEPS[step - 1]?.sub}</span>
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="bg-white rounded-[2.5rem] shadow-lahomes border border-slate-50 p-8 space-y-8">

          {/* ── ETAPA 1: Identificação ─────────────────────────────────────── */}
          {step === 1 && (
            <>
              {/* Upload de Foto */}
              <div className="flex items-center gap-6 pb-6 border-b border-slate-50">
                <div className="relative flex-shrink-0">
                  <div className="h-24 w-24 rounded-3xl bg-slate-100 border-2 border-dashed border-slate-300 overflow-hidden flex items-center justify-center">
                    {photoPreview
                      ? <img src={photoPreview} alt="Foto" className="h-full w-full object-cover" />
                      : <Camera className="h-8 w-8 text-slate-300" />
                    }
                  </div>
                  <button type="button" onClick={() => photoRef.current?.click()}
                    className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full bg-primary text-white flex items-center justify-center shadow-lg hover:bg-primary/90">
                    <Upload className="h-3.5 w-3.5" />
                  </button>
                  <input ref={photoRef} type="file" accept=".jpg,.jpeg,.png,.webp" className="hidden"
                    onChange={e => handlePhoto(e.target.files?.[0] || null)} />
                </div>
                <div>
                  <h2 className="font-black text-slate-800 uppercase tracking-tight text-lg font-outfit">Dados Pessoais</h2>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-0.5">Clique no ícone para adicionar a foto do colaborador</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="text-xs font-black text-slate-500 uppercase tracking-widest block mb-2 pl-2">ID de Funcionário *</label>
                  <Input required type="number" value={form.serialId} onChange={e => set("serialId", e.target.value)} placeholder="Ex: 42" className={inputCls} />
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1 pl-2">Sugestão sequencial (1-10.000)</p>
                </div>
                <div>
                  <label className="text-xs font-black text-slate-500 uppercase tracking-widest block mb-2 pl-2">ID Relógio de Ponto (EnNo)</label>
                  <Input value={form.pointMachineId} onChange={e => set("pointMachineId", e.target.value)} placeholder="Ex: 42" className={inputCls} />
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1 pl-2">Deixe vazio para usar o mesmo ID acima</p>
                </div>
                <div className="md:col-span-2">
                  <div className="mb-2 flex items-center justify-between gap-2 pl-2">
                    <label className="text-xs font-black text-slate-500 uppercase tracking-widest block">Cargo *</label>
                    <Link href="/rh/cargos" className="text-[10px] font-black uppercase tracking-widest text-primary hover:text-primary/80">
                      Gerenciar cargos
                    </Link>
                  </div>
                  <select required value={form.jobTitleId} onChange={e => applyJobTitleDefaults(e.target.value)} className={selectCls}>
                    <option value="">Selecione um cargo...</option>
                    {jobTitles.map(job => (
                      <option key={job.id} value={job.id}>
                        {job.name}
                        {job.shiftName ? ` • ${job.shiftName}` : ""}
                      </option>
                    ))}
                  </select>
                </div>
                {form.jobTitleId && (
                  <div className="md:col-span-2 rounded-[1.5rem] border border-indigo-100 bg-indigo-50/60 px-5 py-4">
                    <p className="text-[10px] font-black uppercase tracking-widest text-indigo-500">Padrões do cargo selecionado</p>
                    <p className="mt-2 text-sm font-bold text-slate-700">
                      {jobTitles.find(job => job.id === form.jobTitleId)?.shiftName || "Turno não definido"}
                      {" • "}
                      {jobTitles.find(job => job.id === form.jobTitleId)?.workSchedule?.name || "Sem escala padrão"}
                      {" • "}
                      {jobTitles.find(job => job.id === form.jobTitleId)?.defaultSalary !== null && jobTitles.find(job => job.id === form.jobTitleId)?.defaultSalary !== undefined
                        ? `R$ ${Number(jobTitles.find(job => job.id === form.jobTitleId)?.defaultSalary || 0).toFixed(2)}`
                        : "Sem remuneração padrão"}
                    </p>
                    <p className="mt-2 text-[10px] font-black uppercase tracking-widest text-sky-600">
                      Centro de custo padrão: {selectedJobTitle?.costCenter?.name || "Não vinculado"}
                    </p>
                    <p className="mt-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                      O RH pode ajustar cargo, centro de custo, jornada, turno e remuneração antes de concluir a admissão.
                    </p>
                  </div>
                )}
                <div className="md:col-span-2">
                  <label className="text-xs font-black text-slate-500 uppercase tracking-widest block mb-2 pl-2">Nome Completo *</label>
                  <Input required value={form.fullName} onChange={e => set("fullName", e.target.value)} placeholder="Ex: João da Silva Santos" className={inputCls} />
                </div>
                <div>
                  <label className="text-xs font-black text-slate-500 uppercase tracking-widest block mb-2 pl-2">Nome Social</label>
                  <Input value={form.socialName} onChange={e => set("socialName", e.target.value)} className={inputCls} />
                </div>
                <div>
                  <label className="text-xs font-black text-slate-500 uppercase tracking-widest block mb-2 pl-2">Gênero</label>
                  <select value={form.gender} onChange={e => set("gender", e.target.value)} className={selectCls}>
                    <option value="">Selecione...</option>
                    <option value="M">Masculino</option>
                    <option value="F">Feminino</option>
                    <option value="NB">Não-binário</option>
                    <option value="NO_ANSWER">Prefiro não informar</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-black text-slate-500 uppercase tracking-widest block mb-2 pl-2">CPF *</label>
                  <MaskedInput 
                    required 
                    value={form.cpf} 
                    onChange={e => set("cpf", e.target.value)} 
                    placeholder="000.000.000-00" 
                    maskType="cpf"
                    className={inputCls} 
                  />
                </div>
                <div>
                  <label className="text-xs font-black text-slate-500 uppercase tracking-widest block mb-2 pl-2">RG</label>
                  <MaskedInput 
                    value={form.rg} 
                    onChange={e => set("rg", e.target.value)} 
                    placeholder="00.000.000-0" 
                    maskType="rg"
                    className={inputCls} 
                  />
                </div>
                <div>
                  <label className="text-xs font-black text-slate-500 uppercase tracking-widest block mb-2 pl-2">Órgão Expedidor RG</label>
                  <Input value={form.rgExpeditor} onChange={e => set("rgExpeditor", e.target.value)} placeholder="SSP/SP" className={inputCls} />
                </div>
                <div>
                  <label className="text-xs font-black text-slate-500 uppercase tracking-widest block mb-2 pl-2">PIS / PASEP</label>
                  <MaskedInput 
                    value={form.pis} 
                    onChange={e => set("pis", e.target.value)} 
                    placeholder="000.00000.00-0" 
                    maskType="cpf" // PIS can use a similar mask or numeric
                    className={inputCls} 
                  />
                </div>
                <div>
                  <label className="text-xs font-black text-slate-500 uppercase tracking-widest block mb-2 pl-2">Data de Nascimento</label>
                  <Input type="date" value={form.birthDate} onChange={e => set("birthDate", e.target.value)} className={inputCls} />
                </div>
                <div>
                  <label className="text-xs font-black text-slate-500 uppercase tracking-widest block mb-2 pl-2">Naturalidade (Cidade/UF)</label>
                  <div className="flex gap-2">
                    <Input value={form.birthCity} onChange={e => set("birthCity", e.target.value)} placeholder="São Paulo" className={inputCls + " flex-1"} />
                    <Input value={form.birthState} onChange={e => set("birthState", e.target.value.toUpperCase())} placeholder="SP" maxLength={2} className={inputCls + " w-20"} />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-black text-slate-500 uppercase tracking-widest block mb-2 pl-2">Estado Civil</label>
                  <select value={form.maritalStatus} onChange={e => set("maritalStatus", e.target.value)} className={selectCls}>
                    <option value="">Selecione...</option>
                    <option value="SINGLE">Solteiro(a)</option><option value="MARRIED">Casado(a)</option>
                    <option value="DIVORCED">Divorciado(a)</option><option value="WIDOWED">Viúvo(a)</option>
                    <option value="STABLE_UNION">União Estável</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-black text-slate-500 uppercase tracking-widest block mb-2 pl-2">Escolaridade</label>
                  <select value={form.educationLevel} onChange={e => set("educationLevel", e.target.value)} className={selectCls}>
                    <option value="">Selecione...</option>
                    <option value="ELEMENTARY">Ensino Fundamental</option><option value="HIGH_SCHOOL">Ensino Médio</option>
                    <option value="TECHNICAL">Técnico</option><option value="BACHELOR">Superior Incompleto</option>
                    <option value="GRADUATED">Superior Completo</option><option value="POSTGRAD">Pós-Graduação</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-black text-slate-500 uppercase tracking-widest block mb-2 pl-2">Telefone / WhatsApp</label>
                  <MaskedInput 
                    value={form.phone} 
                    onChange={e => set("phone", e.target.value)} 
                    placeholder="(11) 9 9999-9999" 
                    maskType="phone"
                    className={inputCls} 
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="text-xs font-black text-slate-500 uppercase tracking-widest block mb-2 pl-2">E-mail</label>
                  <Input type="email" value={form.email} onChange={e => set("email", e.target.value)} placeholder="nome@email.com" className={inputCls} />
                </div>
              </div>
            </>
          )}

          {/* ── ETAPA 2: Saúde / PcD ──────────────────────────────────────── */}
          {step === 2 && (
            <>
              <div className="flex items-center gap-3 pb-4 border-b border-slate-50">
                <div className="h-10 w-10 rounded-2xl bg-rose-500/10 flex items-center justify-center">
                  <Heart className="h-5 w-5 text-rose-500" />
                </div>
                <div>
                  <h2 className="font-black text-slate-800 uppercase tracking-tight text-lg font-outfit">Saúde & Acessibilidade</h2>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">PcD, condições de saúde e cota legal</p>
                </div>
              </div>

              <div className="space-y-4">
                <Toggle value={form.isPCD} onChange={v => set("isPCD", v)}
                  label="Pessoa com Deficiência (PcD)"
                  description="Cota legal conforme Lei 8.213/91 — cotas para reabilitados" />
                {form.isPCD && (
                  <div className="pl-4 space-y-3 border-l-4 border-rose-200">
                    <label className="text-xs font-black text-slate-500 uppercase tracking-widest block pl-1">Tipo de Deficiência e CID</label>
                    <textarea value={form.pcdDetails} onChange={e => set("pcdDetails", e.target.value)}
                      rows={3} placeholder="Ex: Deficiência física — CID M54.5. Recursos necessários: cadeira de rodas, mesa adaptada..."
                      className="flex w-full rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-rose-400 resize-none" />
                  </div>
                )}

                <Toggle value={form.hasHealthCondition} onChange={v => set("hasHealthCondition", v)}
                  label="Possui condição de saúde relevante"
                  description="Alergias, restrições médicas, uso de medicamentos contínuos ou laudo médico" />
                {form.hasHealthCondition && (
                  <div className="pl-4 space-y-3 border-l-4 border-amber-200">
                    <label className="text-xs font-black text-slate-500 uppercase tracking-widest block pl-1">Detalhes da Condição</label>
                    <textarea value={form.healthConditionDetails} onChange={e => set("healthConditionDetails", e.target.value)}
                      rows={3} placeholder="Ex: Alergia a látex, hipertensão controlada, uso de insulina. Restrições de esforço físico..."
                      className="flex w-full rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-amber-400 resize-none" />
                  </div>
                )}

                <div className="p-5 rounded-2xl bg-blue-50 border border-blue-100 mt-4">
                  <p className="text-xs font-bold text-blue-700 uppercase tracking-widest flex items-center gap-2">
                    <Shield className="h-3.5 w-3.5" />
                    Todas as informações de saúde são sigilosas e utilizadas exclusivamente para fins trabalhistas e de segurança do trabalho. Acesso restrito ao DP.
                  </p>
                </div>
              </div>
            </>
          )}

          {/* ── ETAPA 3: Endereço ──────────────────────────────────────────── */}
          {step === 3 && (
            <>
              <div className="flex items-center gap-3 pb-4 border-b border-slate-50">
                <div className="h-10 w-10 rounded-2xl bg-violet-500/10 flex items-center justify-center">
                  <MapPin className="h-5 w-5 text-violet-500" />
                </div>
                <div>
                  <h2 className="font-black text-slate-800 uppercase tracking-tight text-lg font-outfit">Endereço Residencial</h2>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">CEP, logradouro, complemento</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="text-xs font-black text-slate-500 uppercase tracking-widest block mb-2 pl-2">CEP</label>
                  <MaskedInput 
                    value={form.cep} 
                    onChange={e => handleCepChange(e.target.value)} 
                    placeholder="00000-000" 
                    maskType="cep"
                    className={inputCls} 
                  />
                </div>
                <div>
                  <label className="text-xs font-black text-slate-500 uppercase tracking-widest block mb-2 pl-2">Estado (UF)</label>
                  <Input value={form.state} onChange={e => set("state", e.target.value.toUpperCase())} placeholder="SP" maxLength={2} className={inputCls} />
                </div>
                <div className="md:col-span-2">
                  <label className="text-xs font-black text-slate-500 uppercase tracking-widest block mb-2 pl-2">Logradouro</label>
                  <Input value={form.address} onChange={e => set("address", e.target.value)} placeholder="Rua das Flores" className={inputCls} />
                </div>
                <div>
                  <label className="text-xs font-black text-slate-500 uppercase tracking-widest block mb-2 pl-2">Número</label>
                  <Input id="funcAddressNumber" value={form.number} onChange={e => set("number", e.target.value)} placeholder="123" className={inputCls} />
                </div>
                <div>
                  <label className="text-xs font-black text-slate-500 uppercase tracking-widest block mb-2 pl-2">Complemento</label>
                  <Input value={form.complement} onChange={e => set("complement", e.target.value)} placeholder="Apto 12, Bloco B" className={inputCls} />
                </div>
                <div>
                  <label className="text-xs font-black text-slate-500 uppercase tracking-widest block mb-2 pl-2">Bairro</label>
                  <Input value={form.neighborhood} onChange={e => set("neighborhood", e.target.value)} placeholder="Centro" className={inputCls} />
                </div>
                <div>
                  <label className="text-xs font-black text-slate-500 uppercase tracking-widest block mb-2 pl-2">Cidade</label>
                  <Input value={form.city} onChange={e => set("city", e.target.value)} placeholder="São Paulo" className={inputCls} />
                </div>
              </div>
            </>
          )}

          {/* ── ETAPA 4: Vínculo ────────────────────────────────────────────── */}
          {step === 4 && (
            <>
              <div className="flex items-center gap-3 pb-4 border-b border-slate-50">
                <div className="h-10 w-10 rounded-2xl bg-emerald-500/10 flex items-center justify-center">
                  <Briefcase className="h-5 w-5 text-emerald-500" />
                </div>
                <div>
                  <h2 className="font-black text-slate-800 uppercase tracking-tight text-lg font-outfit">Vínculo Empregatício</h2>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Contrato, cargo, salário e jornada</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="text-xs font-black text-slate-500 uppercase tracking-widest block mb-2 pl-2">Tipo de Contrato *</label>
                  <select required value={form.contractType} onChange={e => set("contractType", e.target.value)} className={selectCls}>
                    <option value="CLT">CLT — Carteira Assinada</option>
                    <option value="PJ">PJ — Pessoa Jurídica</option>
                    <option value="INTERN">Estágio</option>
                    <option value="TEMPORARY">Temporário</option>
                    <option value="APPRENTICE">Jovem Aprendiz (Lei 10.097/00)</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-black text-slate-500 uppercase tracking-widest block mb-2 pl-2">Data de Admissão *</label>
                  <Input required type="date" value={form.admissionDate} onChange={e => set("admissionDate", e.target.value)} className={inputCls} />
                </div>
                <div>
                  <label className="text-xs font-black text-slate-500 uppercase tracking-widest block mb-2 pl-2">Cargo / Função</label>
                  <Input value={form.department} onChange={e => set("department", e.target.value)} placeholder="Ex: Auxiliar de Produção" className={inputCls} />
                </div>
                <div>
                  <label className="text-xs font-black text-slate-500 uppercase tracking-widest block mb-2 pl-2">Salário Base (R$)</label>
                  <Input type="number" min="0" step="0.01" value={form.salaryBase} onChange={e => set("salaryBase", e.target.value)} placeholder="0,00" className={inputCls} />
                </div>
                <div className="md:col-span-2">
                  <div className="mb-2 flex items-center justify-between gap-2 pl-2">
                    <label className="text-xs font-black text-slate-500 uppercase tracking-widest block">Cargo *</label>
                    <Link href="/rh/cargos" className="text-[10px] font-black uppercase tracking-widest text-primary hover:text-primary/80">
                      Gerenciar cargos
                    </Link>
                  </div>
                  <select required value={form.jobTitleId} onChange={e => applyJobTitleDefaults(e.target.value)} className={selectCls}>
                    <option value="">Selecione um cargo...</option>
                    {jobTitles.map(job => (
                      <option key={job.id} value={job.id}>
                        {job.name}
                        {job.shiftName ? ` • ${job.shiftName}` : ""}
                      </option>
                    ))}
                  </select>
                </div>
                {form.jobTitleId && (
                  <div className="md:col-span-2 rounded-[1.5rem] border border-indigo-100 bg-indigo-50/60 px-5 py-4">
                    <p className="text-[10px] font-black uppercase tracking-widest text-indigo-500">Padrões do cargo selecionado</p>
                    <p className="mt-2 text-sm font-bold text-slate-700">
                      {jobTitles.find(job => job.id === form.jobTitleId)?.shiftName || "Turno não definido"}
                      {" • "}
                      {jobTitles.find(job => job.id === form.jobTitleId)?.workSchedule?.name || "Sem escala padrão"}
                      {" • "}
                      {jobTitles.find(job => job.id === form.jobTitleId)?.defaultSalary !== null && jobTitles.find(job => job.id === form.jobTitleId)?.defaultSalary !== undefined
                        ? `R$ ${Number(jobTitles.find(job => job.id === form.jobTitleId)?.defaultSalary || 0).toFixed(2)}`
                        : "Sem remuneração padrão"}
                    </p>
                    <p className="mt-2 text-[10px] font-black uppercase tracking-widest text-sky-600">
                      Centro de custo padrão: {selectedJobTitle?.costCenter?.name || "Não vinculado"}
                    </p>
                    <p className="mt-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                      O RH pode ajustar cargo, centro de custo, jornada, turno e remuneração antes de concluir a admissão.
                    </p>
                  </div>
                )}
                <div className="md:col-span-2">
                  <label className="text-xs font-black text-slate-500 uppercase tracking-widest block mb-2 pl-2">Centro de Custo *</label>
                  <select
                    required
                    value={form.costCenterId}
                    onChange={e => set("costCenterId", e.target.value)}
                    className={selectCls}
                  >
                    <option value="">Selecione um centro de custo...</option>
                    {costCenters.map(center => (
                      <option key={center.id} value={center.id}>
                        {center.name}
                        {center.code ? ` (${center.code})` : ""}
                      </option>
                    ))}
                  </select>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1 pl-2">
                    Vem sugerido pelo cargo, mas pode ser ajustado pelo RH
                  </p>
                </div>
                <div className="md:col-span-2 space-y-4">
                  <label className="text-xs font-black text-slate-500 uppercase tracking-widest block mb-2 pl-2">Escala de Trabalho</label>
                  
                  <div className="grid grid-cols-2 gap-4">
                     <button type="button" onClick={() => set("isCustomSchedule", false)}
                       className={`p-4 rounded-2xl border transition-all text-left ${!form.isCustomSchedule ? 'bg-primary/5 border-primary shadow-sm' : 'bg-slate-50 border-slate-100 opacity-60'}`}>
                       <p className="font-bold text-sm text-slate-700">Escala Padrão</p>
                       <p className="text-[10px] uppercase tracking-widest font-bold text-slate-400">Selecionar do banco de dados</p>
                     </button>
                     <button type="button" onClick={() => set("isCustomSchedule", true)}
                       className={`p-4 rounded-2xl border transition-all text-left ${form.isCustomSchedule ? 'bg-primary/5 border-primary shadow-sm' : 'bg-slate-50 border-slate-100 opacity-60'}`}>
                       <p className="font-bold text-sm text-slate-700">Escala Customizada</p>
                       <p className="text-[10px] uppercase tracking-widest font-bold text-slate-400">Definir horários manualmente</p>
                     </button>
                  </div>

                  {!form.isCustomSchedule ? (
                    <select value={form.workScheduleId} onChange={e => set("workScheduleId", e.target.value)} className={selectCls}>
                      <option value="">Selecione uma escala...</option>
                      {workSchedules.map(s => (
                        <option key={s.id} value={s.id}>{s.name} ({s.weeklyHours}h)</option>
                      ))}
                    </select>
                  ) : (
                    <div className="bg-slate-50 border border-slate-100 rounded-[2rem] p-6 space-y-6">
                      <div className="flex justify-between items-center px-2">
                        <p className="text-xs font-black text-primary uppercase tracking-widest">Definir Horários Diários</p>
                        <Badge variant="secondary" className="bg-white text-primary rounded-full px-4 h-8 font-black text-[10px] uppercase tracking-widest">
                          {form.customScheduleData.weeklyHours}h Semanais
                        </Badge>
                      </div>
                      
                      <div className="overflow-x-auto no-scrollbar">
                        <table className="w-full min-w-[600px]">
                          <thead>
                            <tr className="text-[9px] font-black text-slate-400 uppercase tracking-widest text-left">
                              <th className="pb-3 pl-2">Dia</th>
                              <th className="pb-3 text-center">Entrada 1</th>
                              <th className="pb-3 text-center">Saída 1</th>
                              <th className="pb-3 text-center">Entrada 2</th>
                              <th className="pb-3 text-center">Saída 2</th>
                              <th className="pb-3 text-right pr-2">Total</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {[
                              { id: "monday", label: "Seg" }, { id: "tuesday", label: "Ter" },
                              { id: "wednesday", label: "Qua" }, { id: "thursday", label: "Qui" },
                              { id: "friday", label: "Sex" }, { id: "saturday", label: "Sáb" },
                              { id: "sunday", label: "Dom" }
                            ].map(day => (
                              <tr key={day.id} className="h-14">
                                <td className="font-bold text-xs text-slate-600 pl-2 uppercase tracking-tighter">{day.label}</td>
                                <td>
                                  <input type="time" value={(form.customScheduleData as any)[`${day.id}In1`]} 
                                    onChange={e => updateCustomSchedule(day.id, "In1", e.target.value)}
                                    className="w-20 mx-auto block h-9 rounded-full bg-white border border-slate-100 text-[11px] font-bold text-slate-600 text-center focus:ring-1 focus:ring-primary" />
                                </td>
                                <td>
                                  <input type="time" value={(form.customScheduleData as any)[`${day.id}Out1`]} 
                                    onChange={e => updateCustomSchedule(day.id, "Out1", e.target.value)}
                                    className="w-20 mx-auto block h-9 rounded-full bg-white border border-slate-100 text-[11px] font-bold text-slate-600 text-center focus:ring-1 focus:ring-primary" />
                                </td>
                                <td>
                                  <input type="time" value={(form.customScheduleData as any)[`${day.id}In2`]} 
                                    onChange={e => updateCustomSchedule(day.id, "In2", e.target.value)}
                                    className="w-20 mx-auto block h-9 rounded-full bg-white border border-slate-100 text-[11px] font-bold text-slate-600 text-center focus:ring-1 focus:ring-primary" />
                                </td>
                                <td>
                                  <input type="time" value={(form.customScheduleData as any)[`${day.id}Out2`]} 
                                    onChange={e => updateCustomSchedule(day.id, "Out2", e.target.value)}
                                    className="w-20 mx-auto block h-9 rounded-full bg-white border border-slate-100 text-[11px] font-bold text-slate-600 text-center focus:ring-1 focus:ring-primary" />
                                </td>
                                <td className="text-right pr-2">
                                  {(form.customScheduleData as any)[`${day.id}Minutes`] === 0 ? (
                                    <span className="text-[9px] font-black text-rose-400 uppercase tracking-widest bg-rose-50 px-2 py-1 rounded-md">Folga</span>
                                  ) : (
                                    <span className="font-black text-[10px] text-slate-400">
                                      {Math.floor((form.customScheduleData as any)[`${day.id}Minutes`] / 60)}h {(form.customScheduleData as any)[`${day.id}Minutes`] % 60}m
                                    </span>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>

                {/* ── Campos exclusivos Menor Aprendiz ── */}
                {isMinorApprentice && (
                  <>
                    <div className="md:col-span-2">
                      <div className="flex items-center gap-2 mb-4 px-1">
                        <GraduationCap className="h-4 w-4 text-indigo-500" />
                        <p className="text-xs font-black text-indigo-600 uppercase tracking-widest">Dados Escolares — Jovem Aprendiz</p>
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-black text-slate-500 uppercase tracking-widest block mb-2 pl-2">Término do Contrato de Aprendizagem</label>
                      <Input type="date" value={form.apprenticeshipEnd} onChange={e => set("apprenticeshipEnd", e.target.value)} className={inputCls} />
                    </div>
                    <div>
                      <label className="text-xs font-black text-slate-500 uppercase tracking-widest block mb-2 pl-2">Turno Escolar</label>
                      <select value={form.schoolShift} onChange={e => set("schoolShift", e.target.value)} className={selectCls}>
                        <option value="">Selecione...</option>
                        <option value="MORNING">Manhã</option>
                        <option value="AFTERNOON">Tarde</option>
                        <option value="EVENING">Noite</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-black text-slate-500 uppercase tracking-widest block mb-2 pl-2">Nome da Escola</label>
                      <Input value={form.schoolName} onChange={e => set("schoolName", e.target.value)} placeholder="Ex: ETEC Centro Paula Souza" className={inputCls} />
                    </div>
                    <div>
                      <label className="text-xs font-black text-slate-500 uppercase tracking-widest block mb-2 pl-2">Curso Técnico (se houver)</label>
                      <Input value={form.technicalCourse} onChange={e => set("technicalCourse", e.target.value)} placeholder="Ex: Técnico em Administração" className={inputCls} />
                    </div>
                  </>
                )}
              </div>
            </>
          )}

          {/* ── ETAPA 5: Benefícios ─────────────────────────────────────────── */}
          {step === 5 && (
            <>
              <div className="flex items-center gap-3 pb-4 border-b border-slate-50">
                <div className="h-10 w-10 rounded-2xl bg-amber-500/10 flex items-center justify-center">
                  <DollarSign className="h-5 w-5 text-amber-500" />
                </div>
                <div>
                  <h2 className="font-black text-slate-800 uppercase tracking-tight text-lg font-outfit">Benefícios & Remuneração Variável</h2>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Vale transporte, alimentação, premiações e planos</p>
                </div>
              </div>

              <div className="space-y-6">
                {/* Vale Transporte */}
                <div className="p-5 rounded-2xl bg-blue-50 border border-blue-100 space-y-4">
                  <p className="text-xs font-black text-blue-700 uppercase tracking-widest flex items-center gap-2">
                    🚌 Vale Transporte
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="text-xs font-black text-slate-500 uppercase tracking-widest block mb-2 pl-2">Valor por Passagem (R$)</label>
                      <Input type="number" min="0" step="0.01" value={form.vtDailyValue}
                        onChange={e => set("vtDailyValue", e.target.value)} placeholder="0,00" className={inputCls + " bg-white"} />
                      <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest pl-2 mt-1">Valor unitário de cada trecho</p>
                    </div>
                    <div>
                      <label className="text-xs font-black text-slate-500 uppercase tracking-widest block mb-2 pl-2">Dias Úteis / Mês</label>
                      <Input type="number" min="0" max="31" value={form.vtWorkDaysPerMonth}
                        onChange={e => set("vtWorkDaysPerMonth", e.target.value)} placeholder="22" className={inputCls + " bg-white"} />
                      <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest pl-2 mt-1">Quantidade de deslocamentos mensais</p>
                    </div>
                    <div>
                      <label className="text-xs font-black text-slate-500 uppercase tracking-widest block mb-2 pl-2">Total Mensal Calculado</label>
                      <div className={`flex h-14 items-center rounded-full border border-emerald-200 bg-emerald-50 px-5 font-black text-emerald-700`}>
                        {vtMonthly > 0 ? `R$ ${vtMonthly.toFixed(2).replace(".", ",")}` : "—"}
                      </div>
                      <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest pl-2 mt-1">Ida e volta no transporte coletivo</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-[1.2fr_0.8fr_1fr] gap-4">
                    <Toggle value={form.transportationPayrollDeductionEnabled} onChange={v => set("transportationPayrollDeductionEnabled", v)}
                      label="Descontar VT na folha"
                      description="Aplica desconto opcional na folha limitado ao percentual definido pelo RH." />
                    <div>
                      <label className="text-xs font-black text-slate-500 uppercase tracking-widest block mb-2 pl-2">Percentual de Desconto (%)</label>
                      <Input type="number" min="0" max="6" step="0.01" value={form.transportationPayrollDeductionPercent}
                        onChange={e => set("transportationPayrollDeductionPercent", e.target.value)} placeholder="6,00"
                        disabled={!form.transportationPayrollDeductionEnabled} className={inputCls + " bg-white disabled:opacity-60"} />
                      <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest pl-2 mt-1">Lei 7.418/1985: teto de 6% do salário base</p>
                    </div>
                    <div>
                      <label className="text-xs font-black text-slate-500 uppercase tracking-widest block mb-2 pl-2">Desconto Máximo Previsto</label>
                      <div className="flex h-14 items-center rounded-full border border-slate-200 bg-white px-5 font-black text-slate-700">
                        {vtDiscountPreview > 0 ? `R$ ${vtDiscountPreview.toFixed(2).replace(".", ",")}` : "Sem desconto"}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Alimentacao Cedida */}
                <div className="p-5 rounded-2xl bg-amber-50 border border-amber-100 space-y-4">
                  <p className="text-xs font-black text-amber-700 uppercase tracking-widest flex items-center gap-2">
                    🍽 Alimentação Cedida na Empresa
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="text-xs font-black text-slate-500 uppercase tracking-widest block mb-2 pl-2">Valor Mensal do Benefício (R$)</label>
                      <Input type="number" min="0" step="0.01" value={form.foodAllowance}
                        onChange={e => set("foodAllowance", e.target.value)} placeholder="0,00" className={inputCls + " bg-white"} />
                    </div>
                    <Toggle value={form.foodPayrollDeductionEnabled} onChange={v => set("foodPayrollDeductionEnabled", v)}
                      label="Descontar alimentação na folha"
                      description="O RH decide se o colaborador participa do custo deste benefício." />
                    <div>
                      <label className="text-xs font-black text-slate-500 uppercase tracking-widest block mb-2 pl-2">Percentual de Desconto (%)</label>
                      <Input type="number" min="0" max="100" step="0.01" value={form.foodPayrollDeductionPercent}
                        onChange={e => set("foodPayrollDeductionPercent", e.target.value)} placeholder="0,00"
                        disabled={!form.foodPayrollDeductionEnabled} className={inputCls + " bg-white disabled:opacity-60"} />
                      <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest pl-2 mt-1">
                        {foodDeductionPreview > 0
                          ? `Desconto previsto: R$ ${foodDeductionPreview.toFixed(2).replace(".", ",")}`
                          : "Sem desconto configurado"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Outros Beneficios Comuns */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  <div>
                    <label className="text-xs font-black text-slate-500 uppercase tracking-widest block mb-2 pl-2">Auxilio Gasolina / Diesel (R$/mes)</label>
                    <Input type="number" min="0" step="0.01" value={form.fuelAllowance}
                      onChange={e => set("fuelAllowance", e.target.value)} placeholder="0,00" className={inputCls} />
                  </div>
                  <div>
                    <label className="text-xs font-black text-slate-500 uppercase tracking-widest block mb-2 pl-2">💊 Vale Farmácia (R$/mês)</label>
                    <Input type="number" min="0" step="0.01" value={form.pharmacyAllowance}
                      onChange={e => set("pharmacyAllowance", e.target.value)} placeholder="0,00" className={inputCls} />
                  </div>
                  <div>
                    <label className="text-xs font-black text-slate-500 uppercase tracking-widest block mb-2 pl-2">👶 Auxílio Creche (R$/mês)</label>
                    <Input type="number" min="0" step="0.01" value={form.childcareAllowance}
                      onChange={e => set("childcareAllowance", e.target.value)} placeholder="0,00" className={inputCls} />
                  </div>
                </div>

                {/* Planos */}
                <div className="space-y-3">
                  <Toggle value={form.healthPlan} onChange={v => set("healthPlan", v)}
                    label="🏥 Plano de Saúde" description="Cobertura médica custeada pela empresa" />
                  {form.healthPlan && (
                    <div className="pl-4 border-l-4 border-blue-200">
                      <Input value={form.healthPlanDetails} onChange={e => set("healthPlanDetails", e.target.value)}
                        placeholder="Ex: Amil 400 — titular + 2 dependentes" className={inputCls + " mt-2"} />
                    </div>
                  )}
                  <Toggle value={form.dentalPlan} onChange={v => set("dentalPlan", v)}
                    label="🦷 Plano Odontológico" description="Cobertura odontológica" />
                  <Toggle value={form.lifeInsurance} onChange={v => set("lifeInsurance", v)}
                    label="🛡️ Seguro de Vida" description="Seguro de vida em grupo" />
                </div>

                {/* Prêmio por Assiduidade */}
                <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-100 space-y-4">
                  <Toggle value={form.attendanceBonusEnabled} onChange={v => set("attendanceBonusEnabled", v)}
                    label="🏆 Prêmio por Assiduidade"
                    description="Condiciona o pagamento do prêmio à ausência de faltas injustificadas no período" />
                  {form.attendanceBonusEnabled && (
                    <div className="border-l-4 border-emerald-400 pl-4 space-y-3">
                      <div>
                        <label className="text-xs font-black text-slate-500 uppercase tracking-widest block mb-2 pl-1">Valor do Prêmio (R$)</label>
                        <Input type="number" min="0" step="0.01" value={form.attendanceBonusAmount}
                          onChange={e => set("attendanceBonusAmount", e.target.value)} placeholder="0,00" className={inputCls + " bg-white"} />
                      </div>
                    </div>
                  )}
                </div>

                {/* Observações de Outros Benefícios */}
                <div>
                  <label className="text-xs font-black text-slate-500 uppercase tracking-widest block mb-2 pl-2">📝 Outros Benefícios / Observações</label>
                  <textarea value={form.otherBenefits} onChange={e => set("otherBenefits", e.target.value)}
                    rows={3} placeholder="Descreva aqui outros benefícios, convênios ou regras específicas deste colaborador..."
                    className="flex w-full rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary resize-none" />
                </div>
              </div>
            </>
          )}

          {/* ── ETAPA 6: Dados Bancários ─────────────────────────────────────── */}
          {step === 6 && (
            <>
              <div className="flex items-center gap-3 pb-4 border-b border-slate-50">
                <div className="h-10 w-10 rounded-2xl bg-indigo-500/10 flex items-center justify-center">
                  <CreditCard className="h-5 w-5 text-indigo-500" />
                </div>
                <div>
                  <h2 className="font-black text-slate-800 uppercase tracking-tight text-lg font-outfit">Dados Bancários</h2>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Conta para pagamento de salário e benefícios</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="md:col-span-2">
                  <label className="text-xs font-black text-slate-500 uppercase tracking-widest block mb-2 pl-2">Banco</label>
                  <Input value={form.bankName} onChange={e => set("bankName", e.target.value)} placeholder="Ex: Nubank, Caixa, Bradesco" className={inputCls} />
                </div>
                <div>
                  <label className="text-xs font-black text-slate-500 uppercase tracking-widest block mb-2 pl-2">Agência</label>
                  <Input value={form.bankBranch} onChange={e => set("bankBranch", e.target.value)} placeholder="0001" className={inputCls} />
                </div>
                <div>
                  <label className="text-xs font-black text-slate-500 uppercase tracking-widest block mb-2 pl-2">Conta (com Dígito)</label>
                  <Input value={form.bankAccount} onChange={e => set("bankAccount", e.target.value)} placeholder="12345-6" className={inputCls} />
                </div>
                <div>
                  <label className="text-xs font-black text-slate-500 uppercase tracking-widest block mb-2 pl-2">Tipo de Conta</label>
                  <select value={form.bankAccountType} onChange={e => set("bankAccountType", e.target.value)} className={selectCls}>
                    <option value="CHECKING">Conta Corrente</option>
                    <option value="SAVINGS">Conta Poupança</option>
                    <option value="SALARY_ACCOUNT">Conta Salário</option>
                    <option value="DIGITAL">Conta Digital</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-black text-slate-500 uppercase tracking-widest block mb-2 pl-2">Tipo de Chave PIX</label>
                  <select value={form.pixKeyType} onChange={e => set("pixKeyType", e.target.value)} className={selectCls}>
                    <option value="CPF">CPF</option>
                    <option value="PHONE">Telefone</option>
                    <option value="EMAIL">E-mail</option>
                    <option value="RANDOM">Chave Aleatória</option>
                    <option value="CNPJ">CNPJ</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="text-xs font-black text-slate-500 uppercase tracking-widest block mb-2 pl-2">Chave PIX</label>
                  <Input value={form.pixKey} onChange={e => set("pixKey", e.target.value)} placeholder="Informe a chave PIX" className={inputCls} />
                </div>
              </div>
            </>
          )}

          {/* ── ETAPA 7: Documentos ─────────────────────────────────────────── */}
          {step === 7 && (
            <>
              <div className="flex items-center gap-3 pb-4 border-b border-slate-50">
                <div className="h-10 w-10 rounded-2xl bg-rose-500/10 flex items-center justify-center">
                  <Shield className="h-5 w-5 text-rose-500" />
                </div>
                <div>
                  <h2 className="font-black text-slate-800 uppercase tracking-tight text-lg font-outfit">Documentos Admissionais</h2>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                    Você pode anexar os documentos agora ou posteriormente no perfil do colaborador.
                  </p>
                </div>
              </div>
              <div className="space-y-3">
                {DOC_SLOTS.map(slot => (
                  <FileUpload key={slot.key} label={slot.label} required={slot.required}
                    value={docs[slot.key]} onChange={f => setDocs(prev => ({ ...prev, [slot.key]: f }))} />
                ))}
              </div>
              <div className="p-4 rounded-2xl bg-blue-50 border border-blue-100">
                <p className="text-xs font-bold text-blue-700 uppercase tracking-widest">
                  📋 Os arquivos ficam disponíveis na aba Documentos do perfil do colaborador, com acesso restrito ao RH.
                </p>
              </div>
            </>
          )}
        </div>

        {/* Rodapé de navegação */}
        <div className="flex items-center justify-between pt-4">
          {step > 1 ? (
            <Button type="button" variant="ghost" onClick={() => setStep(s => s - 1)}
              className="rounded-full h-14 px-8 font-black text-xs uppercase tracking-widest text-slate-500 gap-2">
              <ArrowLeft className="h-4 w-4" /> Voltar
            </Button>
          ) : (
            <Link href="/rh/funcionarios">
              <Button variant="ghost" className="rounded-full h-14 px-8 font-black text-xs uppercase tracking-widest text-slate-500">
                Cancelar
              </Button>
            </Link>
          )}
          <div className="flex items-center gap-3">
            <span className="text-xs font-black text-slate-400 uppercase tracking-widest">{step}/{STEPS.length}</span>
            <Button type="submit" disabled={loading || !canAdvance()}
              className="rounded-full h-14 px-10 bg-primary hover:bg-primary/90 text-white shadow-xl shadow-primary/20 font-black text-xs uppercase tracking-widest gap-2 disabled:opacity-50">
              {loading
                ? <><Loader2 className="h-4 w-4 animate-spin" /> Cadastrando...</>
                : step < STEPS.length
                ? <>Próximo <ArrowRight className="h-4 w-4" /></>
                : <><CheckCircle2 className="h-4 w-4" /> Finalizar Cadastro</>
              }
            </Button>
          </div>
        </div>
      </form>
    </main>
  )
}
