"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { 
  ArrowLeft, Loader2, Users, Briefcase, MapPin, 
  CreditCard, Shield, Save, Heart, GraduationCap, 
  DollarSign, Camera, Clock, CheckCircle2 
} from "lucide-react"
import Link from "next/link"
import { MaskedInput } from "@/components/ui/MaskedInput"
import { getEmployeeLegalName, getEmployeePrimaryName } from "@/lib/employee-name"
import { unmask } from "@/lib/utils"

// â”€â”€â”€ Componentes auxiliares â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function Section({ icon, title, subtitle, color = "primary" }: any) {
  return (
    <div className={`flex items-center gap-3 pb-4 border-b border-slate-50`}>
      <div className={`h-10 w-10 rounded-2xl bg-${color}/10 flex items-center justify-center`}>{icon}</div>
      <div>
        <h2 className="font-black text-slate-800 uppercase tracking-tight text-base font-outfit">{title}</h2>
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{subtitle}</p>
      </div>
    </div>
  )
}

function Toggle({ value, onChange, label, description }: any) {
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

export default function EditarFuncionarioPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [workSchedules, setWorkSchedules] = useState<any[]>([])
  const [jobTitles, setJobTitles] = useState<any[]>([])
  const [costCenters, setCostCenters] = useState<any[]>([])
  const isFetched = useRef(false)

  const [form, setForm] = useState<any>({
    fullName: "", socialName: "", cpf: "", rg: "", rgExpeditor: "",
    pis: "", birthDate: "", birthCity: "", birthState: "",
    nationality: "Brasileiro(a)", gender: "", maritalStatus: "", educationLevel: "",
    raceColor: "", motherName: "", fatherName: "",
    voterCardNumber: "", voterCardZone: "", voterCardSection: "",
    professionalCouncilNumber: "", professionalCouncilName: "",
    ctpsNumber: "", ctpsSeries: "", ctpsIssuanceDate: "", ctpsUf: "",
    cnhNumber: "", cnhCategory: "",
    militaryDocumentNumber: "", militaryDocumentCategory: "",
    phone: "", whatsapp: "", email: "", photoUrl: "",
    isPCD: false, pcdDetails: "", hasHealthCondition: false, healthConditionDetails: "",
    cep: "", address: "", neighborhood: "", city: "", state: "",
    contractType: "CLT", status: "ACTIVE", admissionDate: "",
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
    schoolName: "", schoolShift: "", technicalCourse: "", apprenticeshipEnd: "",
    vtDailyValue: "", vtWorkDaysPerMonth: "22",
    transportationPayrollDeductionEnabled: true, transportationPayrollDeductionPercent: "6",
    foodAllowance: "",
    foodPayrollDeductionEnabled: false, foodPayrollDeductionPercent: "0",
    fuelAllowance: "",
    healthPlan: false, healthPlanDetails: "", dentalPlan: false, lifeInsurance: false,
    attendanceBonusEnabled: false, attendanceBonusAmount: "",
    pharmacyAllowance: "", childcareAllowance: "", otherBenefits: "",
    fgtsOptionDate: "", fgtsAccount: "", fgtsRectificationDate: "",
    bankName: "", bankBranch: "", bankAccount: "", bankAccountType: "CHECKING",
    pixKey: "", pixKeyType: "CPF", serialId: "", pointMachineId: "",
    number: "", complement: "",
  })

  useEffect(() => {
    if (isFetched.current) return
    isFetched.current = true

    async function init() {
      // Carregar escalas
      const scalesRes = await fetch("/api/rh/ponto/escalas")
      const scales = await scalesRes.json()
      setWorkSchedules(Array.isArray(scales) ? scales : [])

      const jobTitlesRes = await fetch("/api/rh/cargos")
      const jobs = await jobTitlesRes.json()
      setJobTitles(Array.isArray(jobs) ? jobs.filter(item => item.isActive) : [])

      const costCentersRes = await fetch("/api/rh/centros-de-custo")
      const centers = await costCentersRes.json()
      setCostCenters(Array.isArray(centers) ? centers : [])

      // Carregar funcionÃ¡rio
      const res = await fetch(`/api/rh/funcionarios/${params.id}`)
      if (!res.ok) { setLoading(false); return }
      const emp = await res.json()

      setForm((prev: any) => ({
        ...prev,
        ...emp,
        birthDate: emp.birthDate?.slice(0, 10) || "",
        admissionDate: emp.admissionDate?.slice(0, 10) || "",
        apprenticeshipEnd: emp.apprenticeshipEnd?.slice(0, 10) || "",
        salaryBase: emp.salaryBase?.toString() || "",
        vtDailyValue: emp.vtDailyValue?.toString() || "",
        vtWorkDaysPerMonth: emp.vtWorkDaysPerMonth?.toString() || "22",
        transportationPayrollDeductionEnabled: Boolean(emp.transportationPayrollDeductionEnabled),
        transportationPayrollDeductionPercent:
          emp.transportationPayrollDeductionPercent?.toString() || "6",
        foodAllowance: emp.foodAllowance?.toString() || "",
        foodPayrollDeductionEnabled: Boolean(emp.foodPayrollDeductionEnabled),
        foodPayrollDeductionPercent: emp.foodPayrollDeductionPercent?.toString() || "0",
        fuelAllowance: emp.fuelAllowance?.toString() || "",
        attendanceBonusAmount: emp.attendanceBonusAmount?.toString() || "",
        pharmacyAllowance: emp.pharmacyAllowance?.toString() || "",
        childcareAllowance: emp.childcareAllowance?.toString() || "",
        serialId: emp.serialId?.toString() || "",
        cep: emp.zipCode || "",
        number: emp.number || "",
        complement: emp.complement || "",
        // Se a escala do funcionário for individual (customizada), carregar os dados
        isCustomSchedule: emp.workSchedule?.name?.includes("Individual") || false,
        customScheduleData: emp.workSchedule ? {
          ...prev.customScheduleData,
          ...emp.workSchedule,
          weeklyHours: emp.workSchedule.weeklyHours?.toString() || "0"
        } : prev.customScheduleData,
        rgIssuanceDate: emp.rgIssuanceDate?.slice(0, 10) || "",
        ctpsIssuanceDate: emp.ctpsIssuanceDate?.slice(0, 10) || "",
        fgtsOptionDate: emp.fgtsOptionDate?.slice(0, 10) || "",
        fgtsRectificationDate: emp.fgtsRectificationDate?.slice(0, 10) || "",
      }))
      setLoading(false)
    }

    init()
  }, [params.id])

  function set(field: string, value: any) {
    setForm((prev: any) => ({ ...prev, [field]: value }))
  }

  async function handleCepChange(val: string) {
    setForm((prev: any) => ({ ...prev, cep: val }))
    const cleanCep = val.replace(/\D/g, "")
    if (cleanCep.length === 8) {
      try {
        const res = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`)
        const data = await res.json()
        if (!data.erro) {
          setForm((prev: any) => ({
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

    setForm((prev: any) => ({
      ...prev,
      jobTitleId,
      department: selectedJobTitle?.department || prev.department || "",
      costCenterId: selectedJobTitle?.costCenterId || prev.costCenterId,
      salaryBase:
        selectedJobTitle?.defaultSalary !== null && selectedJobTitle?.defaultSalary !== undefined
          ? String(selectedJobTitle.defaultSalary)
          : prev.salaryBase,
      workScheduleId:
        selectedJobTitle?.workScheduleId && !prev.isCustomSchedule
          ? selectedJobTitle.workScheduleId
          : prev.workScheduleId,
      isCustomSchedule: selectedJobTitle?.workScheduleId ? false : prev.isCustomSchedule,
    }))
  }

  function updateCustomSchedule(day: string, field: string, value: string) {
    setForm((prev: any) => {
      const newSchedule = { ...prev.customScheduleData } as any
      newSchedule[`${day}${field}`] = value
      
      let minutes = 0
      const in1 = newSchedule[`${day}In1`], out1 = newSchedule[`${day}Out1`]
      const in2 = newSchedule[`${day}In2`], out2 = newSchedule[`${day}Out2`]
      
      if (in1 && out1) {
        const [h1, m1] = in1.split(":").map(Number), [h2, m2] = out1.split(":").map(Number)
        minutes += (h2 * 60 + m2) - (h1 * 60 + m1)
      }
      if (in2 && out2) {
        const [h3, m3] = in2.split(":").map(Number), [h4, m4] = out2.split(":").map(Number)
        minutes += (h4 * 60 + m4) - (h3 * 60 + m3)
      }
      newSchedule[`${day}Minutes`] = Math.max(0, minutes)
      
      const days = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]
      const totalMin = days.reduce((acc, d) => acc + (newSchedule[`${d}Minutes`] || 0), 0)
      newSchedule.weeklyHours = (totalMin / 60).toFixed(1)
      
      return { ...prev, customScheduleData: newSchedule }
    })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.jobTitleId) {
      alert("Selecione o cargo do funcionario antes de salvar.")
      return
    }
    if (!form.costCenterId) {
      alert("Selecione o centro de custo do funcionario antes de salvar.")
      return
    }
    setSaving(true)
    try {
      const res = await fetch(`/api/rh/funcionarios/${params.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          cpf: unmask(form.cpf),
          pis: unmask(form.pis),
          phone: unmask(form.phone),
          whatsapp: unmask(form.whatsapp),
          cep: unmask(form.cep),
          number: form.number,
          complement: form.complement,
          rg: form.rg ? form.rg.replace(/[^a-zA-Z0-9]/g, "").toUpperCase() : "",
          rgIssuanceDate: form.rgIssuanceDate ? new Date(form.rgIssuanceDate) : undefined,
          ctpsIssuanceDate: form.ctpsIssuanceDate ? new Date(form.ctpsIssuanceDate) : undefined,
          fgtsOptionDate: form.fgtsOptionDate ? new Date(form.fgtsOptionDate) : undefined,
          fgtsRectificationDate: form.fgtsRectificationDate ? new Date(form.fgtsRectificationDate) : undefined,
          transportationAllowance: vtMonthly > 0 ? vtMonthly : undefined,
        })
      })
      if (!res.ok) throw new Error()
      router.push(`/rh/funcionarios/${params.id}`)
      router.refresh()
    } catch {
      alert("Erro ao salvar alteraÃ§Ãµes.")
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <main className="flex-1 min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></main>

  const inputCls = "rounded-full h-14 border-slate-100 bg-slate-50/50 focus-visible:ring-primary font-medium"
  const selectCls = "flex h-14 w-full rounded-full border border-slate-100 bg-slate-50/50 px-5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary"
  const primaryName = getEmployeePrimaryName(form)
  const legalName = getEmployeeLegalName(form)
  const vtMonthly = parseFloat(form.vtDailyValue || "0") * parseInt(form.vtWorkDaysPerMonth || "0") * 2
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

  return (
    <main className="flex-1 min-h-screen py-10 px-6 max-w-[1000px] mx-auto space-y-8 animate-in fade-in duration-700 pb-20 text-slate-700">
      <div className="flex items-center gap-4">
        <Link href={`/rh/funcionarios/${params.id}`}>
          <Button variant="ghost" size="icon" className="h-12 w-12 rounded-full bg-white shadow-sm border border-slate-100"><ArrowLeft className="h-5 w-5 text-slate-500" /></Button>
        </Link>
        <div>
          <h1 className="text-3xl font-black text-primary font-outfit uppercase tracking-tight">Editar Funcionário</h1>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">
            ID #{(form.serialId || "").padStart(4, '0')} • {primaryName}
            {legalName ? ` • Legal: ${legalName}` : ""}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="bg-white rounded-[2.5rem] shadow-lahomes border border-slate-50 p-8 space-y-6">
          <Section icon={<Users className="h-5 w-5 text-primary" />} title="Identificação & Pessoal" subtitle="Dados básicos e documentos" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
             <div className="md:col-span-2">
               <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2 mb-1 block">Nome Completo *</label>
               <Input required value={form.fullName} onChange={e => set("fullName", e.target.value)} className={inputCls} />
             </div>
             <div>
               <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2 mb-1 block">Nome Social</label>
               <Input value={form.socialName} onChange={e => set("socialName", e.target.value)} className={inputCls} />
             </div>
             <div>
               <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2 mb-1 block">Gênero</label>
               <select value={form.gender} onChange={e => set("gender", e.target.value)} className={selectCls}>
                 <option value="">Selecione...</option>
                 <option value="M">Masculino</option><option value="F">Feminino</option>
                 <option value="NB">Não-binário</option><option value="NO_ANSWER">Não informar</option>
               </select>
             </div>
             <div>
               <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2 mb-1 block">Raça / Cor</label>
               <select value={form.raceColor} onChange={e => set("raceColor", e.target.value)} className={selectCls}>
                 <option value="">Selecione...</option>
                 <option value="WHITE">Branca</option>
                 <option value="BLACK">Preta</option>
                 <option value="PARDA">Parda</option>
                 <option value="YELLOW">Amarela</option>
                 <option value="INDIGENOUS">Indígena</option>
                 <option value="NOT_INFORMED">Não informado</option>
               </select>
             </div>
             <div>
               <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2 mb-1 block">CPF *</label>
               <MaskedInput required value={form.cpf} onChange={e => set("cpf", e.target.value)} maskType="cpf" className={inputCls} />
             </div>
             <div>
               <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2 mb-1 block">RG</label>
               <MaskedInput value={form.rg} onChange={e => set("rg", e.target.value)} maskType="rg" className={inputCls} />
             </div>
             <div>
               <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2 mb-1 block">Data de Emissão RG</label>
               <Input type="date" value={form.rgIssuanceDate} onChange={e => set("rgIssuanceDate", e.target.value)} className={inputCls} />
             </div>
             <div>
               <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2 mb-1 block">Órgão Expedidor RG</label>
               <Input value={form.rgExpeditor} onChange={e => set("rgExpeditor", e.target.value)} placeholder="SSP/SP" className={inputCls} />
             </div>
             <div>
               <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2 mb-1 block">PIS</label>
               <MaskedInput value={form.pis} onChange={e => set("pis", e.target.value)} maskType="cpf" className={inputCls} />
             </div>
             <div>
               <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2 mb-1 block">País de Nacionalidade</label>
               <Input value={form.nationality} onChange={e => set("nationality", e.target.value)} placeholder="Brasil" className={inputCls} />
             </div>
             <div>
               <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2 mb-1 block">Nome da Mãe</label>
               <Input value={form.motherName} onChange={e => set("motherName", e.target.value)} placeholder="Nome completo da mãe" className={inputCls} />
             </div>
             <div>
               <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2 mb-1 block">Nome do Pai</label>
               <Input value={form.fatherName} onChange={e => set("fatherName", e.target.value)} placeholder="Nome completo do pai" className={inputCls} />
             </div>
             <div>
               <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2 mb-1 block">Data de Nascimento</label>
               <Input type="date" value={form.birthDate} onChange={e => set("birthDate", e.target.value)} className={inputCls} />
             </div>
             <div>
               <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2 mb-1 block">Naturalidade (Cidade)</label>
               <Input value={form.birthCity} onChange={e => set("birthCity", e.target.value)} className={inputCls} />
             </div>
             <div>
               <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2 mb-1 block">Naturalidade (UF)</label>
               <Input value={form.birthState} onChange={e => set("birthState", e.target.value.toUpperCase())} maxLength={2} className={inputCls} />
             </div>
             <div>
               <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2 mb-1 block">Estado Civil</label>
               <select value={form.maritalStatus} onChange={e => set("maritalStatus", e.target.value)} className={selectCls}>
                 <option value="">Selecione...</option>
                 <option value="SINGLE">Solteiro(a)</option><option value="MARRIED">Casado(a)</option>
                 <option value="DIVORCED">Divorciado(a)</option><option value="WIDOWED">Viúvo(a)</option>
                 <option value="STABLE_UNION">União Estável</option>
               </select>
             </div>
             <div>
               <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2 mb-1 block">Escolaridade</label>
               <select value={form.educationLevel} onChange={e => set("educationLevel", e.target.value)} className={selectCls}>
                 <option value="">Selecione...</option>
                 <option value="ELEMENTARY">Ensino Fundamental</option><option value="HIGH_SCHOOL">Ensino Médio</option>
                 <option value="TECHNICAL">Técnico</option><option value="BACHELOR">Superior Incompleto</option>
                 <option value="GRADUATED">Superior Completo</option><option value="POSTGRAD">Pós-Graduação</option>
               </select>
             </div>
             <div className="md:col-span-2 pt-4">
               <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 pl-2">Documentos Complementares</p>
             </div>
             <div>
               <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2 mb-1 block">Título de Eleitor</label>
               <Input value={form.voterCardNumber} onChange={e => set("voterCardNumber", e.target.value)} placeholder="Número" className={inputCls} />
             </div>
             <div className="grid grid-cols-2 gap-4">
               <div>
                 <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2 mb-1 block">Zona</label>
                 <Input value={form.voterCardZone} onChange={e => set("voterCardZone", e.target.value)} placeholder="000" className={inputCls} />
               </div>
               <div>
                 <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2 mb-1 block">Seção</label>
                 <Input value={form.voterCardSection} onChange={e => set("voterCardSection", e.target.value)} placeholder="0000" className={inputCls} />
               </div>
             </div>
             <div>
               <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2 mb-1 block">Órgão de Classe</label>
               <Input value={form.professionalCouncilName} onChange={e => set("professionalCouncilName", e.target.value)} placeholder="Ex: CRM, OAB" className={inputCls} />
             </div>
             <div>
               <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2 mb-1 block">Inscrição Órgão de Classe</label>
               <Input value={form.professionalCouncilNumber} onChange={e => set("professionalCouncilNumber", e.target.value)} placeholder="Número" className={inputCls} />
             </div>
             <div>
               <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2 mb-1 block">CTPS (Número)</label>
               <Input value={form.ctpsNumber} onChange={e => set("ctpsNumber", e.target.value)} placeholder="Número" className={inputCls} />
             </div>
             <div>
               <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2 mb-1 block">CTPS (Série)</label>
               <Input value={form.ctpsSeries} onChange={e => set("ctpsSeries", e.target.value)} placeholder="Série" className={inputCls} />
             </div>
             <div>
               <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2 mb-1 block">CTPS (Data Expedição)</label>
               <Input type="date" value={form.ctpsIssuanceDate} onChange={e => set("ctpsIssuanceDate", e.target.value)} className={inputCls} />
             </div>
             <div>
               <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2 mb-1 block">CTPS (UF)</label>
               <Input value={form.ctpsUf} onChange={e => set("ctpsUf", e.target.value.toUpperCase())} maxLength={2} placeholder="SP" className={inputCls} />
             </div>
             <div>
               <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2 mb-1 block">CNH (Número)</label>
               <Input value={form.cnhNumber} onChange={e => set("cnhNumber", e.target.value)} placeholder="Número" className={inputCls} />
             </div>
             <div>
               <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2 mb-1 block">CNH (Categoria)</label>
               <Input value={form.cnhCategory} onChange={e => set("cnhCategory", e.target.value.toUpperCase())} placeholder="Ex: AB" className={inputCls} />
             </div>
             <div>
               <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2 mb-1 block">Doc. Militar (Número)</label>
               <Input value={form.militaryDocumentNumber} onChange={e => set("militaryDocumentNumber", e.target.value)} placeholder="Número" className={inputCls} />
             </div>
             <div>
               <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2 mb-1 block">Doc. Militar (Categoria)</label>
               <Input value={form.militaryDocumentCategory} onChange={e => set("militaryDocumentCategory", e.target.value)} placeholder="Ex: Reservista" className={inputCls} />
             </div>
             <div>
               <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2 mb-1 block">Telefone</label>
               <Input value={form.phone} onChange={e => set("phone", e.target.value)} className={inputCls} />
             </div>
             <div>
               <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2 mb-1 block">WhatsApp</label>
               <Input value={form.whatsapp} onChange={e => set("whatsapp", e.target.value)} className={inputCls} />
             </div>
             <div className="md:col-span-2">
               <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2 mb-1 block">Email</label>
               <Input type="email" value={form.email} onChange={e => set("email", e.target.value)} className={inputCls} />
             </div>
          </div>
        </div>

        <div className="bg-white rounded-[2.5rem] shadow-lahomes border border-slate-50 p-8 space-y-6">
          <Section icon={<Heart className="h-5 w-5 text-rose-500" />} title="Saúde & PcD" subtitle="Condições e acessibilidade" color="rose-500" />
          <div className="space-y-4">
            <Toggle value={form.isPCD} onChange={(v:any) => set("isPCD", v)} label="Pessoa com Deficiência (PcD)" description="Necessário para cota e acessibilidade" />
            {form.isPCD && <textarea value={form.pcdDetails} onChange={e => set("pcdDetails", e.target.value)} rows={2} placeholder="Detalhes da deficiência e CID..." className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-100 text-sm focus:ring-primary focus:ring-2 outline-none" />}
            
            <Toggle value={form.hasHealthCondition} onChange={(v:any) => set("hasHealthCondition", v)} label="Condição de Saúde Relevante" description="Alergias, medicamentos contínuos, etc" />
            {form.hasHealthCondition && <textarea value={form.healthConditionDetails} onChange={e => set("healthConditionDetails", e.target.value)} rows={2} placeholder="Detalhes da condição..." className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-100 text-sm focus:ring-primary focus:ring-2 outline-none" />}
          </div>
        </div>

        <div className="bg-white rounded-[2.5rem] shadow-lahomes border border-slate-50 p-8 space-y-6">
          <Section icon={<MapPin className="h-5 w-5 text-violet-500" />} title="Endereço Residencial" subtitle="Logradouro e localização" color="violet-500" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2 mb-1 block">CEP</label>
              <MaskedInput value={form.cep} onChange={e => handleCepChange(e.target.value)} maskType="cep" className={inputCls} />
            </div>
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2 mb-1 block">Logradouro</label>
              <Input value={form.address} onChange={e => set("address", e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2 mb-1 block">Número</label>
              <Input id="funcAddressNumber" value={form.number} onChange={e => set("number", e.target.value)} placeholder="123" className={inputCls} />
            </div>
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2 mb-1 block">Complemento</label>
              <Input value={form.complement} onChange={e => set("complement", e.target.value)} placeholder="Apto 12, Bloco B" className={inputCls} />
            </div>
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2 mb-1 block">Bairro</label>
              <Input value={form.neighborhood} onChange={e => set("neighborhood", e.target.value)} className={inputCls} />
            </div>
            <div className="flex gap-4">
               <div className="flex-1">
                 <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2 mb-1 block">Cidade</label>
                 <Input value={form.city} onChange={e => set("city", e.target.value)} className={inputCls} />
               </div>
               <div className="w-20">
                 <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2 mb-1 block">UF</label>
                 <Input value={form.state} onChange={e => set("state", e.target.value.toUpperCase())} maxLength={2} className={inputCls} />
               </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-[2.5rem] shadow-lahomes border border-slate-50 p-8 space-y-6">
           <Section icon={<Briefcase className="h-5 w-5 text-emerald-500" />} title="Vínculo & Jornada" subtitle="Contrato, status e horários" color="emerald-500" />
           <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2 mb-1 block">Tipo Contrato *</label>
                <select value={form.contractType} onChange={e => set("contractType", e.target.value)} className={selectCls}>
                   <option value="CLT">CLT</option><option value="PJ">PJ</option>
                   <option value="INTERN">Estágio</option><option value="APPRENTICE">Aprendiz</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2 mb-1 block">Status</label>
                <select value={form.status} onChange={e => set("status", e.target.value)} className={selectCls}>
                   <option value="ACTIVE">Ativo</option><option value="VACATION">Férias</option>
                   <option value="SUSPENDED">Afastado</option><option value="INACTIVE">Inativo</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2 mb-1 block">Data de Admissão</label>
                <Input type="date" value={form.admissionDate} onChange={e => set("admissionDate", e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2 mb-1 block">Cargo / Função (Descritivo)</label>
                <Input value={form.department} onChange={e => set("department", e.target.value)} placeholder="Ex: Auxiliar de Produção" className={inputCls} />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2 mb-1 block">Salário Base (R$)</label>
                <Input type="number" step="0.01" value={form.salaryBase} onChange={e => set("salaryBase", e.target.value)} className={inputCls} />
              </div>
              <div className="md:col-span-2 pt-4">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 pl-2">FGTS</p>
              </div>
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2 mb-1 block">Opção em (Data de Admissão)</label>
                <Input type="date" value={form.fgtsOptionDate} onChange={e => set("fgtsOptionDate", e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2 mb-1 block">Conta Vinculada (Banco)</label>
                <Input value={form.fgtsAccount} onChange={e => set("fgtsAccount", e.target.value)} placeholder="Ex: Caixa Econômica" className={inputCls} />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2 mb-1 block">Data de Retificação FGTS</label>
                <Input type="date" value={form.fgtsRectificationDate} onChange={e => set("fgtsRectificationDate", e.target.value)} className={inputCls} />
              </div>
              <div className="md:col-span-2">
                <div className="mb-1 flex items-center justify-between gap-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2 block">Cargo *</label>
                  <Link href="/rh/cargos" className="text-[10px] font-black uppercase tracking-widest text-primary hover:text-primary/80">
                    Gerenciar cargos
                  </Link>
                </div>
                <select
                  required
                  value={form.jobTitleId}
                  onChange={e => applyJobTitleDefaults(e.target.value)}
                  className={selectCls}
                >
                  <option value="">Selecione um cargo...</option>
                  {jobTitles.map(job => (
                    <option key={job.id} value={job.id}>
                      {job.name}
                      {job.shiftName ? ` â€¢ ${job.shiftName}` : ""}
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
                    {selectedJobTitle?.cbo ? ` • CBO: ${selectedJobTitle.cbo}` : ""}
                  </p>
                  <p className="mt-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                    O RH pode trocar centro de custo, escala, turno, salário e setor durante a admissão ou na edição do cadastro.
                  </p>
                </div>
              )}
              <div className="md:col-span-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2 mb-1 block">Centro de Custo *</label>
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
                <p className="mt-1 ml-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Vem sugerido pelo cargo, mas pode ser ajustado pelo RH
                </p>
              </div>
              <div className="md:col-span-2 grid grid-cols-2 gap-5">
                 <div>
                   <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2 mb-1 block">Serial ID / Cartão</label>
                   <Input value={form.serialId} onChange={e => set("serialId", e.target.value)} placeholder="0001" className={inputCls} />
                 </div>
                 <div>
                   <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2 mb-1 block">ID Máquina Ponto</label>
                   <Input value={form.pointMachineId} onChange={e => set("pointMachineId", e.target.value)} placeholder="Ex: BIO-01" className={inputCls} />
                 </div>
              </div>
           </div>

           {/* Jornada */}
           <div className="space-y-4 pt-4 border-t border-slate-50">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2 block">Escala de Trabalho</label>
              <div className="grid grid-cols-2 gap-4">
                 <button type="button" onClick={() => set("isCustomSchedule", false)} className={`p-4 rounded-2xl border text-left transition-all ${!form.isCustomSchedule ? 'bg-primary/5 border-primary shadow-sm' : 'bg-slate-50 border-slate-100 opacity-60'}`}>
                    <p className="font-bold text-sm">Escala Padrão</p>
                    <p className="text-[9px] uppercase tracking-widest font-black text-slate-400 mt-1">Usar regras do sistema</p>
                 </button>
                 <button type="button" onClick={() => set("isCustomSchedule", true)} className={`p-4 rounded-2xl border text-left transition-all ${form.isCustomSchedule ? 'bg-primary/5 border-primary shadow-sm' : 'bg-slate-50 border-slate-100 opacity-60'}`}>
                    <p className="font-bold text-sm">Escala Customizada</p>
                    <p className="text-[9px] uppercase tracking-widest font-black text-slate-400 mt-1">Definir horários livres</p>
                 </button>
              </div>
              {!form.isCustomSchedule ? (
                <div className="space-y-2">
                  <select value={form.workScheduleId} onChange={e => set("workScheduleId", e.target.value)} className={selectCls}>
                    <option value="">Selecione uma escala...</option>
                    {workSchedules.map(s => <option key={s.id} value={s.id}>{s.name} ({s.weeklyHours}h)</option>)}
                  </select>
                </div>
              ) : (
                <div className="bg-slate-50 border border-slate-100 rounded-[2rem] p-6 space-y-4">
                  <div className="flex justify-between items-center px-2">
                     <p className="text-[10px] font-black text-primary uppercase tracking-widest">Configuração Diária</p>
                     <Badge className="bg-white text-primary rounded-full px-4 h-8 font-black text-[10px] border border-slate-100 shadow-sm">{form.customScheduleData.weeklyHours}h Semanais</Badge>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead>
                        <tr className="text-slate-400 font-black uppercase tracking-tighter border-b border-slate-100">
                          <th className="pb-3 px-2">Dia</th>
                          <th className="text-center pb-3">Entr. 1</th>
                          <th className="text-center pb-3">SaÃ­da 1</th>
                          <th className="text-center pb-3">Entr. 2</th>
                          <th className="text-center pb-3">SaÃ­da 2</th>
                          <th className="text-right pb-3 pr-2 font-black">Tot.</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100/50">
                        {[
                          { id: "monday", label: "Seg" },
                          { id: "tuesday", label: "Ter" },
                          { id: "wednesday", label: "Qua" },
                          { id: "thursday", label: "Qui" },
                          { id: "friday", label: "Sex" },
                          { id: "saturday", label: "SÃ¡b" },
                          { id: "sunday", label: "Dom" }
                        ].map(day => (
                          <tr key={day.id} className="h-14 hover:bg-white/50 transition-colors">
                            <td className="font-bold uppercase tracking-widest text-[10px] text-slate-500 pl-2">{day.label}</td>
                            {["In1", "Out1", "In2", "Out2"].map(field => (
                              <td key={field} className="text-center">
                                <input 
                                  type="time" 
                                  value={form.customScheduleData[`${day.id}${field}`] || ""} 
                                  onChange={e => updateCustomSchedule(day.id, field, e.target.value)} 
                                  className="w-[72px] h-9 rounded-xl bg-white border border-slate-100 text-center text-[10px] font-bold focus:ring-1 focus:ring-primary outline-none" 
                                />
                              </td>
                            ))}
                            <td className="text-right pr-2">
                              {form.customScheduleData[`${day.id}Minutes`] === 0 ? (
                                <span className="text-[8px] font-black text-rose-400 uppercase tracking-widest bg-rose-50 px-2 py-1 rounded-md">Folga</span>
                              ) : (
                                <span className="font-black text-[10px] text-slate-400">
                                  {Math.floor(form.customScheduleData[`${day.id}Minutes`] / 60)}h{form.customScheduleData[`${day.id}Minutes`] % 60}
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
        </div>

        {/* Menor Aprendiz (Condicional) */}
        {form.contractType === 'APPRENTICE' && (
          <div className="bg-indigo-50/30 rounded-[2.5rem] shadow-sm border border-indigo-100 p-8 space-y-6">
            <Section icon={<GraduationCap className="h-5 w-5 text-indigo-500" />} title="Dados Escolares (Aprendiz)" subtitle="Escola e curso tÃ©cnico" color="indigo-500" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
               <div className="md:col-span-2">
                 <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2 mb-1 block">Nome da InstituiÃ§Ã£o</label>
                 <Input value={form.schoolName} onChange={e => set("schoolName", e.target.value)} placeholder="Ex: SENAC, CIEE..." className={inputCls} />
               </div>
               <div>
                 <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2 mb-1 block">Turno Escolar</label>
                 <select value={form.schoolShift} onChange={e => set("schoolShift", e.target.value)} className={selectCls}>
                    <option value="">Selecione...</option>
                    <option value="MORNING">ManhÃ£</option><option value="AFTERNOON">Tarde</option>
                    <option value="NIGHT">Noite</option><option value="FULL">Integral</option>
                 </select>
               </div>
               <div>
                 <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2 mb-1 block">PrevisÃ£o TÃ©rmino</label>
                 <Input type="date" value={form.apprenticeshipEnd} onChange={e => set("apprenticeshipEnd", e.target.value)} className={inputCls} />
               </div>
               <div className="md:col-span-2">
                 <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2 mb-1 block">Curso / Aprendizagem</label>
                 <Input value={form.technicalCourse} onChange={e => set("technicalCourse", e.target.value)} placeholder="Ex: Auxiliar Administrativo" className={inputCls} />
               </div>
            </div>
          </div>
        )}

        {/* Beneficios */}
        <div className="bg-white rounded-[2.5rem] shadow-lahomes border border-slate-50 p-8 space-y-6">
           <Section icon={<DollarSign className="h-5 w-5 text-amber-500" />} title="Beneficios & Auxilios" subtitle="VT, alimentacao cedida e beneficios de apoio" color="amber-500" />
           <div className="space-y-6">
              <div className="p-5 rounded-2xl bg-blue-50 border border-blue-100 space-y-4">
                <p className="text-xs font-black text-blue-700 uppercase tracking-widest">Vale Transporte</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2 mb-1 block">Valor por passagem</label>
                    <Input type="number" step="0.01" value={form.vtDailyValue} onChange={e => set("vtDailyValue", e.target.value)} className={inputCls + " bg-white"} />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2 mb-1 block">Dias úteis / mes</label>
                    <Input type="number" min="0" max="31" value={form.vtWorkDaysPerMonth} onChange={e => set("vtWorkDaysPerMonth", e.target.value)} className={inputCls + " bg-white"} />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2 mb-1 block">Total mensal calculado</label>
                    <div className="flex h-14 items-center rounded-full border border-emerald-200 bg-emerald-50 px-5 font-black text-emerald-700">
                      {vtMonthly > 0 ? `R$ ${vtMonthly.toFixed(2).replace(".", ",")}` : "—"}
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-[1.2fr_0.8fr_1fr] gap-4">
                  <Toggle value={form.transportationPayrollDeductionEnabled} onChange={(v:any) => set("transportationPayrollDeductionEnabled", v)} label="Descontar VT na folha" description="Opcional pelo RH, com teto legal de 6% do salário base." />
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2 mb-1 block">Percentual VT (%)</label>
                    <Input type="number" min="0" max="6" step="0.01" value={form.transportationPayrollDeductionPercent} onChange={e => set("transportationPayrollDeductionPercent", e.target.value)} disabled={!form.transportationPayrollDeductionEnabled} className={inputCls + " bg-white disabled:opacity-60"} />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2 mb-1 block">Desconto previsto</label>
                    <div className="flex h-14 items-center rounded-full border border-slate-200 bg-white px-5 font-black text-slate-700">
                      {vtDiscountPreview > 0 ? `R$ ${vtDiscountPreview.toFixed(2).replace(".", ",")}` : "Sem desconto"}
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-amber-50 border border-amber-100 space-y-4">
                 <p className="text-xs font-black text-amber-700 uppercase tracking-widest">Alimentação Cedida na Empresa</p>
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                   <div>
                     <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2 mb-1 block">Valor mensal</label>
                     <Input type="number" step="0.01" value={form.foodAllowance} onChange={e => set("foodAllowance", e.target.value)} className={inputCls + " bg-white"} />
                   </div>
                   <Toggle value={form.foodPayrollDeductionEnabled} onChange={(v:any) => set("foodPayrollDeductionEnabled", v)} label="Descontar alimentação" description="Permite cobrar participação do colaborador na folha." />
                   <div>
                     <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2 mb-1 block">Percentual alimentação (%)</label>
                     <Input type="number" min="0" max="100" step="0.01" value={form.foodPayrollDeductionPercent} onChange={e => set("foodPayrollDeductionPercent", e.target.value)} disabled={!form.foodPayrollDeductionEnabled} className={inputCls + " bg-white disabled:opacity-60"} />
                     <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2 ml-2">
                       {foodDeductionPreview > 0 ? `Desconto previsto: R$ ${foodDeductionPreview.toFixed(2).replace(".", ",")}` : "Sem desconto configurado"}
                     </p>
                   </div>
                 </div>
               </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2 mb-1 block">Auxilio Gasolina / Diesel</label>
                  <Input type="number" step="0.01" value={form.fuelAllowance} onChange={e => set("fuelAllowance", e.target.value)} className={inputCls} />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2 mb-1 block">Vale Farmacia</label>
                  <Input type="number" step="0.01" value={form.pharmacyAllowance} onChange={e => set("pharmacyAllowance", e.target.value)} className={inputCls} />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2 mb-1 block">Auxilio Creche</label>
                  <Input type="number" step="0.01" value={form.childcareAllowance} onChange={e => set("childcareAllowance", e.target.value)} className={inputCls} />
                </div>
              </div>
              <div className="space-y-4 pt-4 border-t border-slate-50">
                 <Toggle value={form.attendanceBonusEnabled} onChange={(v:any) => set("attendanceBonusEnabled", v)} label="Premio Assiduidade" description="Adicional por pontualidade e presenca" />
                 {form.attendanceBonusEnabled && (
                   <div className="animate-in slide-in-from-top-2 duration-300">
                     <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2 mb-1 block">Valor do premio</label>
                     <Input type="number" step="0.01" value={form.attendanceBonusAmount} onChange={e => set("attendanceBonusAmount", e.target.value)} placeholder="R$ 0,00" className={inputCls} />
                   </div>
                 )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                 <Toggle value={form.healthPlan} onChange={(v:any) => set("healthPlan", v)} label="Plano de Saude" />
                 <Toggle value={form.lifeInsurance} onChange={(v:any) => set("lifeInsurance", v)} label="Seguro de Vida" />
              </div>
              <div>
                 <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2 mb-1 block">Outros Beneficios & Obs</label>
                 <textarea value={form.otherBenefits} onChange={e => set("otherBenefits", e.target.value)} rows={3} placeholder="Descreva beneficios adicionais ou convenios..." className="w-full p-4 rounded-[1.5rem] bg-slate-50/50 border border-slate-100 text-sm focus:ring-primary focus:ring-2 outline-none transition-all" />
              </div>
           </div>
        </div>

         <div className="bg-white rounded-[2.5rem] shadow-lahomes border border-slate-50 p-8 space-y-6">
            <Section icon={<CreditCard className="h-5 w-5 text-indigo-500" />} title="Dados Bancários" subtitle="Conta para recebimento de salário" color="indigo-500" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
               <div className="md:col-span-2">
                 <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2 mb-1 block">Instituição Bancária</label>
                 <Input value={form.bankName} onChange={e => set("bankName", e.target.value)} placeholder="Ex: Itaú, Bradesco, Nubank..." className={inputCls} />
               </div>
               <div>
                 <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2 mb-1 block">Agência</label>
                 <Input value={form.bankBranch} onChange={e => set("bankBranch", e.target.value)} className={inputCls} />
               </div>
               <div>
                 <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2 mb-1 block">Número da Conta</label>
                 <Input value={form.bankAccount} onChange={e => set("bankAccount", e.target.value)} className={inputCls} />
               </div>
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2 mb-1 block">Tipo de Conta</label>
                <select value={form.bankAccountType} onChange={e => set("bankAccountType", e.target.value)} className={selectCls}>
                  <option value="CHECKING">Conta Corrente</option>
                  <option value="SAVINGS">Conta Poupança</option>
                  <option value="SALARY">Conta Salário</option>
                </select>
              </div>
              <div className="grid grid-cols-3 gap-3">
                 <div className="col-span-1">
                   <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2 mb-1 block">Tipo Chave PIX</label>
                   <select value={form.pixKeyType} onChange={e => set("pixKeyType", e.target.value)} className={selectCls}>
                     <option value="CPF">CPF</option><option value="EMAIL">Email</option>
                     <option value="PHONE">Celular</option><option value="RANDOM">Chave Aleatória</option>
                   </select>
                 </div>
                 <div className="col-span-2">
                   <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2 mb-1 block">Chave PIX</label>
                   <Input value={form.pixKey} onChange={e => set("pixKey", e.target.value)} className={inputCls} />
                 </div>
              </div>
           </div>
        </div>

        <div className="flex justify-between pt-4">
          <Link href={`/rh/funcionarios/${params.id}`}>
            <Button variant="ghost" className="rounded-full h-14 px-8 font-black text-xs uppercase tracking-widest text-slate-500">Cancelar</Button>
          </Link>
          <Button type="submit" disabled={saving} className="rounded-full h-14 px-10 bg-primary hover:bg-primary/90 text-white shadow-xl shadow-primary/20 font-black text-xs uppercase tracking-widest gap-2">
            {saving ? <><Loader2 className="h-4 w-4 animate-spin" /> Salvando...</> : <><Save className="h-4 w-4" /> Salvar Alterações</>}
          </Button>
        </div>
      </form>
    </main>
  )
}
