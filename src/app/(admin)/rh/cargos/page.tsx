"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Briefcase, Clock3, DollarSign, Loader2, PencilLine, Plus, RefreshCcw, Users } from "lucide-react"

type WorkScheduleSummary = {
  id: string
  name: string
  weeklyHours: number
}

type CostCenterSummary = {
  id: string
  code?: string | null
  name: string
}

type JobTitleItem = {
  id: string
  name: string
  department?: string | null
  description?: string | null
  shiftName?: string | null
  defaultSalary?: number | null
  workScheduleId?: string | null
  costCenterId?: string | null
  cbo?: string | null
  isPdvSellerRole?: boolean
  workSchedule?: WorkScheduleSummary | null
  costCenter?: CostCenterSummary | null
  isActive: boolean
  _count?: {
    employees: number
  }
}

const emptyForm = {
  id: "",
  name: "",
  department: "",
  costCenterId: "",
  shiftName: "",
  workScheduleId: "",
  defaultSalary: "",
  description: "",
  cbo: "",
  isPdvSellerRole: false,
  isActive: true,
}

function formatCurrency(value?: number | null) {
  if (value === null || value === undefined || Number.isNaN(value)) return "Não definido"
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value)
}

export default function CargosPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [jobTitles, setJobTitles] = useState<JobTitleItem[]>([])
  const [workSchedules, setWorkSchedules] = useState<WorkScheduleSummary[]>([])
  const [costCenters, setCostCenters] = useState<CostCenterSummary[]>([])
  const [form, setForm] = useState(emptyForm)

  async function loadData() {
    setLoading(true)
    try {
      const [jobsRes, schedulesRes, costCentersRes] = await Promise.all([
        fetch("/api/rh/cargos", { cache: "no-store" }),
        fetch("/api/rh/ponto/escalas", { cache: "no-store" }),
        fetch("/api/rh/centros-de-custo", { cache: "no-store" }),
      ])

      const jobsData = await jobsRes.json()
      const schedulesData = await schedulesRes.json()
      const costCentersData = await costCentersRes.json()

      setJobTitles(Array.isArray(jobsData) ? jobsData : [])
      setWorkSchedules(Array.isArray(schedulesData) ? schedulesData : [])
      setCostCenters(Array.isArray(costCentersData) ? costCentersData : [])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const selectedSchedule = useMemo(
    () => workSchedules.find(schedule => schedule.id === form.workScheduleId),
    [form.workScheduleId, workSchedules]
  )
  const selectedCostCenter = useMemo(
    () => costCenters.find(costCenter => costCenter.id === form.costCenterId),
    [costCenters, form.costCenterId]
  )

  function resetForm() {
    setForm(emptyForm)
  }

  function editJobTitle(jobTitle: JobTitleItem) {
    setForm({
      id: jobTitle.id,
      name: jobTitle.name || "",
      department: jobTitle.department || "",
      costCenterId: jobTitle.costCenterId || "",
      shiftName: jobTitle.shiftName || "",
      workScheduleId: jobTitle.workScheduleId || "",
      defaultSalary:
        jobTitle.defaultSalary !== null && jobTitle.defaultSalary !== undefined
          ? String(jobTitle.defaultSalary)
          : "",
      description: jobTitle.description || "",
      cbo: jobTitle.cbo || "",
      isPdvSellerRole: Boolean(jobTitle.isPdvSellerRole),
      isActive: jobTitle.isActive,
    })
  }

  async function saveJobTitle() {
    if (!form.name.trim()) {
      alert("Informe o nome do cargo.")
      return
    }

    if (!form.costCenterId) {
      alert("Selecione o centro de custo padrão do cargo.")
      return
    }

    setSaving(true)
    try {
      const payload = {
        name: form.name,
        department: form.department,
        costCenterId: form.costCenterId,
        shiftName: form.shiftName,
        workScheduleId: form.workScheduleId,
        defaultSalary: form.defaultSalary,
        description: form.description,
        cbo: form.cbo,
        isPdvSellerRole: form.isPdvSellerRole,
        isActive: form.isActive,
      }

      const res = await fetch(form.id ? `/api/rh/cargos/${form.id}` : "/api/rh/cargos", {
        method: form.id ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data?.error || "Não foi possível salvar o cargo.")
      }

      await loadData()
      editJobTitle(data)
      alert(form.id ? "Cargo atualizado com sucesso." : "Cargo criado com sucesso.")
    } catch (error: any) {
      alert(error.message || "Erro ao salvar cargo.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <main className="flex-1 min-h-screen py-10 px-6 max-w-[1400px] mx-auto space-y-8 animate-in fade-in duration-700 pb-20 text-slate-700">
      <section className="rounded-[3rem] border border-white/70 bg-white/90 px-8 py-7 shadow-lahomes">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-[1.75rem] bg-indigo-50 text-indigo-600 shadow-sm">
              <Briefcase className="h-8 w-8" />
            </div>
            <div>
              <h1 className="font-outfit text-4xl font-black uppercase tracking-tight text-primary">
                Cargos
              </h1>
              <p className="mt-2 max-w-3xl text-xs font-bold uppercase tracking-[0.24em] text-slate-400">
                Defina o cargo padrão com setor, centro de custo, turno, escala, remuneração base e se ele pode atuar como vendedor no PDV. Na admissão, o RH pode ajustar tudo antes de concluir o cadastro do colaborador.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={loadData}
              className="h-12 rounded-full border-slate-200 bg-white px-6 text-[10px] font-black uppercase tracking-widest text-slate-600"
            >
              <RefreshCcw className="mr-2 h-4 w-4" />
              Atualizar lista
            </Button>
            <Link href="/rh/funcionarios/novo">
              <Button
                type="button"
                className="h-12 rounded-full bg-primary px-6 text-[10px] font-black uppercase tracking-widest text-white shadow-lg shadow-primary/20"
              >
                <Plus className="mr-2 h-4 w-4" />
                Ir para admissão
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <div className="grid gap-8 xl:grid-cols-[1.1fr_0.9fr]">
        <section className="rounded-[2.5rem] border border-slate-100 bg-white p-8 shadow-lahomes">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-5">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-400">Cadastro de cargo</p>
              <h2 className="mt-2 font-outfit text-2xl font-black uppercase tracking-tight text-slate-900">
                {form.id ? "Editar padrões do cargo" : "Novo cargo padrão"}
              </h2>
            </div>

            {form.id && (
              <Button
                type="button"
                variant="outline"
                onClick={resetForm}
                className="h-11 rounded-full border-slate-200 bg-white px-5 text-[10px] font-black uppercase tracking-widest text-slate-600"
              >
                Novo cadastro
              </Button>
            )}
          </div>

          <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2">
            <div>
              <label className="mb-2 ml-2 block text-[10px] font-black uppercase tracking-widest text-slate-400">Nome do cargo *</label>
              <Input
                value={form.name}
                onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Ex: Costureira Industrial"
                className="h-14 rounded-full border-slate-100 bg-slate-50/60"
              />
            </div>
            <div>
              <label className="mb-2 ml-2 block text-[10px] font-black uppercase tracking-widest text-slate-400">Setor / área</label>
              <Input
                value={form.department}
                onChange={e => setForm(prev => ({ ...prev, department: e.target.value }))}
                placeholder="Ex: Produção"
                className="h-14 rounded-full border-slate-100 bg-slate-50/60"
              />
            </div>
            <div>
              <label className="mb-2 ml-2 block text-[10px] font-black uppercase tracking-widest text-slate-400">CBO (Código Brasileiro de Ocupações)</label>
              <Input
                value={form.cbo}
                onChange={e => setForm(prev => ({ ...prev, cbo: e.target.value }))}
                placeholder="Ex: 7632-10"
                className="h-14 rounded-full border-slate-100 bg-slate-50/60"
              />
            </div>
            <div>
              <label className="mb-2 ml-2 block text-[10px] font-black uppercase tracking-widest text-slate-400">Centro de custo padrão *</label>
              <select
                value={form.costCenterId}
                onChange={e => setForm(prev => ({ ...prev, costCenterId: e.target.value }))}
                className="flex h-14 w-full rounded-full border border-slate-100 bg-slate-50/60 px-5 text-sm font-medium outline-none transition-all focus:ring-2 focus:ring-primary"
              >
                <option value="">Selecione um centro de custo...</option>
                {costCenters.map(costCenter => (
                  <option key={costCenter.id} value={costCenter.id}>
                    {costCenter.name}
                    {costCenter.code ? ` (${costCenter.code})` : ""}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-2 ml-2 block text-[10px] font-black uppercase tracking-widest text-slate-400">Turno padrão</label>
              <Input
                value={form.shiftName}
                onChange={e => setForm(prev => ({ ...prev, shiftName: e.target.value }))}
                placeholder="Ex: Comercial, Noite, 12x36"
                className="h-14 rounded-full border-slate-100 bg-slate-50/60"
              />
            </div>
            <div>
              <label className="mb-2 ml-2 block text-[10px] font-black uppercase tracking-widest text-slate-400">Remuneração base</label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={form.defaultSalary}
                onChange={e => setForm(prev => ({ ...prev, defaultSalary: e.target.value }))}
                placeholder="0,00"
                className="h-14 rounded-full border-slate-100 bg-slate-50/60"
              />
            </div>
            <div className="md:col-span-2">
              <label className="mb-2 ml-2 block text-[10px] font-black uppercase tracking-widest text-slate-400">Escala padrão</label>
              <select
                value={form.workScheduleId}
                onChange={e => setForm(prev => ({ ...prev, workScheduleId: e.target.value }))}
                className="flex h-14 w-full rounded-full border border-slate-100 bg-slate-50/60 px-5 text-sm font-medium outline-none transition-all focus:ring-2 focus:ring-primary"
              >
                <option value="">Sem escala padrão vinculada</option>
                {workSchedules.map(schedule => (
                  <option key={schedule.id} value={schedule.id}>
                    {schedule.name} ({schedule.weeklyHours}h)
                  </option>
                ))}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="mb-2 ml-2 block text-[10px] font-black uppercase tracking-widest text-slate-400">Descrição operacional</label>
              <textarea
                value={form.description}
                onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))}
                rows={4}
                placeholder="Descreva responsabilidades, observações ou critérios deste cargo."
                className="w-full rounded-[1.75rem] border border-slate-100 bg-slate-50/60 px-5 py-4 text-sm font-medium outline-none transition-all focus:ring-2 focus:ring-primary"
              />
            </div>
            <div className="md:col-span-2 flex flex-wrap items-center justify-between gap-4 rounded-[1.75rem] border border-indigo-100 bg-indigo-50/60 px-5 py-4">
              <div>
                <p className="text-xs font-black uppercase tracking-widest text-slate-700">Vendedor interno no PDV</p>
                <p className="mt-1 text-[11px] font-medium text-slate-500">
                  Quando ativo, colaboradores com este cargo entram automaticamente na lista de vendedores e podem receber regras de comissão.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setForm(prev => ({ ...prev, isPdvSellerRole: !prev.isPdvSellerRole }))}
                className={`relative h-7 w-14 rounded-full transition-all ${form.isPdvSellerRole ? "bg-primary" : "bg-slate-300"}`}
              >
                <span
                  className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow-sm transition-all ${form.isPdvSellerRole ? "left-8" : "left-1"}`}
                />
              </button>
            </div>
            <div className="md:col-span-2 flex flex-wrap items-center justify-between gap-4 rounded-[1.75rem] border border-slate-100 bg-slate-50/60 px-5 py-4">
              <div>
                <p className="text-xs font-black uppercase tracking-widest text-slate-700">Cargo ativo</p>
                <p className="mt-1 text-[11px] font-medium text-slate-500">
                  Cargos inativos deixam de aparecer na admissão, mas continuam no histórico dos funcionários.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setForm(prev => ({ ...prev, isActive: !prev.isActive }))}
                className={`relative h-7 w-14 rounded-full transition-all ${form.isActive ? "bg-emerald-500" : "bg-slate-300"}`}
              >
                <span
                  className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow-sm transition-all ${form.isActive ? "left-8" : "left-1"}`}
                />
              </button>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <Button
              type="button"
              onClick={saveJobTitle}
              disabled={saving}
              className="h-12 rounded-full bg-primary px-8 text-[10px] font-black uppercase tracking-widest text-white shadow-lg shadow-primary/20"
            >
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PencilLine className="mr-2 h-4 w-4" />}
              {form.id ? "Salvar alterações" : "Criar cargo"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={resetForm}
              className="h-12 rounded-full border-slate-200 bg-white px-8 text-[10px] font-black uppercase tracking-widest text-slate-600"
            >
              Limpar formulário
            </Button>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            <div className="rounded-[1.75rem] border border-emerald-100 bg-emerald-50/70 p-5">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-black uppercase tracking-widest text-emerald-500">Turno</p>
                <Clock3 className="h-4 w-4 text-emerald-500" />
              </div>
              <p className="mt-3 text-lg font-black uppercase text-slate-900">{form.shiftName || "Não definido"}</p>
            </div>
            <div className="rounded-[1.75rem] border border-sky-100 bg-sky-50/80 p-5">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-black uppercase tracking-widest text-sky-500">Centro de custo</p>
                <Briefcase className="h-4 w-4 text-sky-500" />
              </div>
              <p className="mt-3 text-lg font-black text-slate-900">{selectedCostCenter?.name || "Não definido"}</p>
              <p className="mt-1 text-[10px] font-black uppercase tracking-widest text-slate-400">
                {selectedCostCenter?.code || "Vincule um setor de custos"}
              </p>
            </div>
            <div className="rounded-[1.75rem] border border-indigo-100 bg-indigo-50/70 p-5">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-black uppercase tracking-widest text-indigo-500">Escala</p>
                <Clock3 className="h-4 w-4 text-indigo-500" />
              </div>
              <p className="mt-3 text-lg font-black text-slate-900">{selectedSchedule?.name || "Sem padrão"}</p>
              <p className="mt-1 text-[10px] font-black uppercase tracking-widest text-slate-400">
                {selectedSchedule ? `${selectedSchedule.weeklyHours}h semanais` : "Defina na selecao acima"}
              </p>
            </div>
            <div className="rounded-[1.75rem] border border-amber-100 bg-amber-50/80 p-5">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-black uppercase tracking-widest text-amber-500">Salário base</p>
                <DollarSign className="h-4 w-4 text-amber-500" />
              </div>
              <p className="mt-3 text-lg font-black text-slate-900">
                {form.defaultSalary ? formatCurrency(Number(form.defaultSalary)) : "Não definido"}
              </p>
            </div>
            <div className="rounded-[1.75rem] border border-violet-100 bg-violet-50/80 p-5">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-black uppercase tracking-widest text-violet-500">PDV e comissão</p>
                <Users className="h-4 w-4 text-violet-500" />
              </div>
              <p className="mt-3 text-lg font-black uppercase text-slate-900">
                {form.isPdvSellerRole ? "Vendedor habilitado" : "Sem vínculo comercial"}
              </p>
              <p className="mt-1 text-[10px] font-black uppercase tracking-widest text-slate-400">
                {form.isPdvSellerRole ? "Aparece no PDV automaticamente" : "Não entra na lista de vendedores"}
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-[2.5rem] border border-slate-100 bg-white p-8 shadow-lahomes">
          <div className="flex items-center justify-between gap-4 border-b border-slate-100 pb-5">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-400">Base de cargos</p>
              <h2 className="mt-2 font-outfit text-2xl font-black uppercase tracking-tight text-slate-900">
                Cargos cadastrados
              </h2>
            </div>
            <Badge className="rounded-full bg-slate-900 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-white">
              {jobTitles.length} registros
            </Badge>
          </div>

          <div className="mt-6 rounded-[2rem] border border-slate-100 bg-slate-50/70 p-6">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-slate-500 shadow-sm">
                <Users className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-700">
                  Como Funciona Na Admissão
                </p>
                <p className="mt-2 max-w-3xl text-sm font-medium leading-6 text-slate-600">
                  Ao escolher um cargo no cadastro do funcionário, o sistema sugere setor, centro de custo,
                  turno, escala e salário base. O RH continua livre para ajustar esses dados caso a admissão
                  precise fugir do padrão.
                </p>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="flex min-h-[420px] items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="mt-6 space-y-4">
              {jobTitles.length === 0 ? (
                <div className="rounded-[2rem] border border-dashed border-slate-200 bg-slate-50/60 p-8 text-center">
                  <p className="text-sm font-black uppercase tracking-widest text-slate-700">Nenhum cargo cadastrado</p>
                  <p className="mt-2 text-xs font-medium text-slate-500">
                    Crie o primeiro cargo para padronizar salário, turno e escala na admissão.
                  </p>
                </div>
              ) : (
                jobTitles.map(jobTitle => (
                  <button
                    key={jobTitle.id}
                    type="button"
                    onClick={() => editJobTitle(jobTitle)}
                    className={`w-full rounded-[2rem] border p-5 text-left transition-all ${
                      form.id === jobTitle.id
                        ? "border-primary bg-primary/5 shadow-lg shadow-primary/10"
                        : "border-slate-100 bg-slate-50/60 hover:border-indigo-200 hover:bg-white"
                    }`}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-outfit text-xl font-black uppercase tracking-tight text-slate-900">
                            {jobTitle.name}
                          </p>
                          <Badge
                            className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest ${
                              jobTitle.isActive ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-600"
                            }`}
                          >
                            {jobTitle.isActive ? "Ativo" : "Inativo"}
                          </Badge>
                          {jobTitle.isPdvSellerRole && (
                            <Badge className="rounded-full bg-violet-100 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-violet-700">
                              Vendedor PDV
                            </Badge>
                          )}
                        </div>
                        <p className="mt-2 text-[11px] font-black uppercase tracking-widest text-slate-400">
                          {jobTitle.department || "Sem setor"} • {jobTitle.shiftName || "Sem turno padrão"}
                        </p>
                        <p className="mt-1 text-[10px] font-black uppercase tracking-widest text-sky-600">
                          Centro de custo: {jobTitle.costCenter?.name || "Não vinculado"}
                        </p>
                      </div>

                      <div className="rounded-full border border-slate-200 bg-white px-4 py-2 text-[10px] font-black uppercase tracking-widest text-slate-500">
                        {jobTitle._count?.employees || 0} funcionários
                      </div>
                    </div>

                    <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                      <div className="rounded-[1.25rem] bg-white px-4 py-3">
                        <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Centro de custo</p>
                        <p className="mt-2 text-sm font-bold text-slate-700">
                          {jobTitle.costCenter?.name || "Não vinculado"}
                        </p>
                      </div>
                      <div className="rounded-[1.25rem] bg-white px-4 py-3">
                        <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Escala</p>
                        <p className="mt-2 text-sm font-bold text-slate-700">
                          {jobTitle.workSchedule?.name || "Sem escala padrão"}
                        </p>
                      </div>
                      <div className="rounded-[1.25rem] bg-white px-4 py-3">
                        <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Carga semanal</p>
                        <p className="mt-2 text-sm font-bold text-slate-700">
                          {jobTitle.workSchedule ? `${jobTitle.workSchedule.weeklyHours}h` : "Não definida"}
                        </p>
                      </div>
                      <div className="rounded-[1.25rem] bg-white px-4 py-3">
                        <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Remuneração</p>
                        <p className="mt-2 text-sm font-bold text-slate-700">
                          {formatCurrency(jobTitle.defaultSalary)}
                        </p>
                      </div>
                    </div>

                    {jobTitle.description && (
                      <p className="mt-4 text-sm leading-relaxed text-slate-500">{jobTitle.description}</p>
                    )}
                  </button>
                ))
              )}
            </div>
          )}

          <div className="mt-6 rounded-[1.75rem] border border-slate-100 bg-slate-50/70 p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Users className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-black uppercase tracking-widest text-slate-700">Como funciona na admissão</p>
                <p className="mt-1 text-[11px] font-medium leading-relaxed text-slate-500">
                  Ao escolher um cargo no cadastro do funcionário, o sistema sugere setor, centro de custo, turno, escala e salário base. O RH continua livre para ajustar esses dados caso a admissão precise fugir do padrão.
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}
