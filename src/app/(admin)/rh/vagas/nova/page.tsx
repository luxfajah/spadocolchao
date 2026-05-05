"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Briefcase, Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { createJobOpening } from "../../components/rh-actions"

type JobTitleOption = {
  id: string
  name: string
  department?: string | null
  shiftName?: string | null
  defaultSalary?: number | null
  costCenter?: {
    id: string
    code?: string | null
    name: string
  } | null
  isActive: boolean
}

export default function NovaVagaPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [loadingJobTitles, setLoadingJobTitles] = useState(true)
  const [jobTitles, setJobTitles] = useState<JobTitleOption[]>([])
  const [form, setForm] = useState({
    jobTitleId: "",
    department: "",
    contractType: "CLT",
    workModel: "ONSITE",
    description: "",
    salaryRange: "",
  })

  useEffect(() => {
    async function loadJobTitles() {
      setLoadingJobTitles(true)
      try {
        const response = await fetch("/api/rh/cargos", { cache: "no-store" })
        const data = await response.json()
        setJobTitles(Array.isArray(data) ? data.filter(item => item.isActive) : [])
      } finally {
        setLoadingJobTitles(false)
      }
    }

    loadJobTitles()
  }, [])

  const selectedJobTitle = useMemo(
    () => jobTitles.find(jobTitle => jobTitle.id === form.jobTitleId),
    [form.jobTitleId, jobTitles]
  )

  function set(field: string, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  function applyJobTitle(jobTitleId: string) {
    const jobTitle = jobTitles.find(item => item.id === jobTitleId)

    setForm(prev => ({
      ...prev,
      jobTitleId,
      department: jobTitle?.department || "",
      salaryRange:
        prev.salaryRange ||
        (jobTitle?.defaultSalary !== null && jobTitle?.defaultSalary !== undefined
          ? new Intl.NumberFormat("pt-BR", {
              style: "currency",
              currency: "BRL",
            }).format(jobTitle.defaultSalary)
          : ""),
    }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!form.jobTitleId) {
      alert("Selecione o cargo da vaga antes de salvar.")
      return
    }

    setLoading(true)
    try {
      await createJobOpening(form)
      router.push("/rh/vagas")
    } catch {
      alert("Erro ao criar vaga. Tente novamente.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="flex-1 min-h-screen py-10 px-6 max-w-[800px] mx-auto space-y-8 animate-in fade-in duration-700 pb-20">
      <div className="flex items-center gap-4">
        <Link href="/rh/vagas">
          <Button
            variant="ghost"
            size="icon"
            className="h-12 w-12 rounded-full bg-white shadow-sm border border-slate-100"
          >
            <ArrowLeft className="h-5 w-5 text-slate-500" />
          </Button>
        </Link>
        <div>
          <h1 className="text-4xl font-black text-primary font-outfit uppercase tracking-tight">
            Nova Vaga
          </h1>
          <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mt-1">
            Cadastro de Processo Seletivo
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="bg-white rounded-[2.5rem] shadow-lahomes border border-slate-50 p-8 space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-50">
            <div className="h-10 w-10 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Briefcase className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="font-black text-slate-800 uppercase tracking-tight text-lg font-outfit">
                Dados da Vaga
              </h2>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                Selecione o cargo e finalize os detalhes do processo seletivo
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="md:col-span-2">
              <div className="mb-2 flex items-center justify-between gap-2 pl-2">
                <label className="text-xs font-black text-slate-500 uppercase tracking-widest block">
                  Cargo da vaga *
                </label>
                <Link
                  href="/rh/cargos"
                  className="text-[10px] font-black uppercase tracking-widest text-primary hover:text-primary/80"
                >
                  Gerenciar cargos
                </Link>
              </div>
              <select
                required
                value={form.jobTitleId}
                onChange={e => applyJobTitle(e.target.value)}
                disabled={loadingJobTitles}
                className="flex h-14 w-full rounded-full border border-slate-100 bg-slate-50/50 px-5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-60"
              >
                <option value="">
                  {loadingJobTitles ? "Carregando cargos..." : "Selecione um cargo..."}
                </option>
                {jobTitles.map(jobTitle => (
                  <option key={jobTitle.id} value={jobTitle.id}>
                    {jobTitle.name}
                    {jobTitle.department ? ` - ${jobTitle.department}` : ""}
                  </option>
                ))}
              </select>
            </div>

            {selectedJobTitle && (
              <div className="md:col-span-2 rounded-[1.75rem] border border-indigo-100 bg-indigo-50/60 px-5 py-4">
                <p className="text-[10px] font-black uppercase tracking-widest text-indigo-500">
                  Cargo selecionado
                </p>
                <p className="mt-2 text-sm font-bold text-slate-700">
                  {selectedJobTitle.name}
                  {" • "}
                  {selectedJobTitle.department || "Sem setor"}
                  {" • "}
                  {selectedJobTitle.shiftName || "Sem turno padrão"}
                </p>
                <p className="mt-2 text-[10px] font-black uppercase tracking-widest text-sky-600">
                  Centro de custo: {selectedJobTitle.costCenter?.name || "Não vinculado"}
                </p>
                <p className="mt-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                  A vaga usa o título do cargo e o RH pode ajustar setor, contrato e faixa salarial abaixo.
                </p>
              </div>
            )}

            <div className="md:col-span-2">
              <label className="text-xs font-black text-slate-500 uppercase tracking-widest block mb-2 pl-2">
                Título publicado
              </label>
              <Input
                value={selectedJobTitle?.name || ""}
                readOnly
                placeholder="Selecione um cargo para definir o título da vaga"
                className="rounded-full h-14 border-slate-100 bg-slate-50/50 text-slate-500 focus-visible:ring-primary font-medium"
              />
            </div>

            <div>
              <label className="text-xs font-black text-slate-500 uppercase tracking-widest block mb-2 pl-2">
                Departamento / Setor
              </label>
              <Input
                value={form.department}
                onChange={e => set("department", e.target.value)}
                placeholder="Ex: Produção / Vendas"
                className="rounded-full h-14 border-slate-100 bg-slate-50/50 focus-visible:ring-primary font-medium"
              />
            </div>

            <div>
              <label className="text-xs font-black text-slate-500 uppercase tracking-widest block mb-2 pl-2">
                Tipo de Contrato *
              </label>
              <select
                required
                value={form.contractType}
                onChange={e => set("contractType", e.target.value)}
                className="flex h-14 w-full rounded-full border border-slate-100 bg-slate-50/50 px-5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="CLT">CLT</option>
                <option value="PJ">PJ</option>
                <option value="INTERNSHIP">Estágio</option>
                <option value="TEMPORARY">Temporário</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-black text-slate-500 uppercase tracking-widest block mb-2 pl-2">
                Modelo de Trabalho
              </label>
              <select
                value={form.workModel}
                onChange={e => set("workModel", e.target.value)}
                className="flex h-14 w-full rounded-full border border-slate-100 bg-slate-50/50 px-5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="ONSITE">Presencial</option>
                <option value="REMOTE">Remoto</option>
                <option value="HYBRID">Híbrido</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-black text-slate-500 uppercase tracking-widest block mb-2 pl-2">
                Faixa Salarial
              </label>
              <Input
                value={form.salaryRange}
                onChange={e => set("salaryRange", e.target.value)}
                placeholder="Ex: R$ 1.800,00 a R$ 2.400,00"
                className="rounded-full h-14 border-slate-100 bg-slate-50/50 focus-visible:ring-primary font-medium"
              />
            </div>

            <div className="md:col-span-2">
              <label className="text-xs font-black text-slate-500 uppercase tracking-widest block mb-2 pl-2">
                Descrição da Vaga *
              </label>
              <textarea
                required
                value={form.description}
                onChange={e => set("description", e.target.value)}
                rows={4}
                placeholder="Requisitos, responsabilidades e benefícios..."
                className="flex w-full rounded-3xl border border-slate-100 bg-slate-50/50 px-5 py-4 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary resize-none"
              />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between pt-4">
          <Link href="/rh/vagas">
            <Button className="rounded-full h-14 px-8 font-black text-xs uppercase tracking-widest text-slate-500" variant="ghost">
              Cancelar
            </Button>
          </Link>
          <Button
            type="submit"
            disabled={loading || loadingJobTitles}
            className="rounded-full h-14 px-10 bg-primary hover:bg-primary/90 text-white shadow-xl shadow-primary/20 font-black text-xs uppercase tracking-widest gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Criando...
              </>
            ) : (
              <>
                <Briefcase className="h-4 w-4" /> Criar Vaga
              </>
            )}
          </Button>
        </div>
      </form>
    </main>
  )
}
