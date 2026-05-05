import { getJobDetails } from "../actions"
import { notFound } from "next/navigation"
import { PageHeader } from "@/components/layout/PageHeader"
import { Briefcase, Building2, MapPin, Users, Settings, Play, ArchiveX } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

export default async function JobOpeningFunnelPage({
  params
}: {
  params: { id: string }
}) {
  const job = await getJobDetails(params.id)

  if (!job) {
    notFound()
  }

  // Pre-filter applications into stages for Kanban
  const stages = [
    { key: "SCREENING", label: "Triagem", color: "border-slate-200 text-slate-600 bg-slate-50" },
    { key: "SHORTLISTED", label: "Avançados", color: "border-blue-200 text-blue-600 bg-blue-50" },
    { key: "INTERVIEWING", label: "Entrevistas", color: "border-indigo-200 text-indigo-600 bg-indigo-50" },
    { key: "OFFERED", label: "Proposta", color: "border-emerald-200 text-emerald-600 bg-emerald-50" },
    { key: "HIRED", label: "Contratados", color: "border-teal-200 text-teal-600 bg-teal-50" },
    { key: "REJECTED", label: "Reprovados", color: "border-rose-200 text-rose-600 bg-rose-50" },
  ]

  return (
    <main className="flex-1 py-10 px-6 max-w-[1700px] mx-auto space-y-10 animate-in fade-in duration-700 pb-20">
      <div className="flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
        <div className="flex flex-col">
          <div className="flex items-center gap-4 mb-2">
            <Badge variant="outline" className={`text-xs uppercase tracking-widest px-3 py-1 font-black ${
               job.status === 'OPEN' ? 'border-emerald-500 text-emerald-600 bg-emerald-50' : 
               'border-slate-200 text-slate-500 bg-slate-50'
            }`}>
              {job.status}
            </Badge>
            <span className="text-[10px] text-slate-400 font-bold tracking-widest uppercase">
              {job.contractType} • {job.workModel}
            </span>
          </div>
          <h1 className="text-4xl font-black text-primary font-outfit uppercase tracking-tight">
            {job.jobTitle?.name || job.title}
          </h1>
          <div className="flex gap-4 mt-4 text-slate-500 text-sm font-semibold uppercase tracking-tight">
            <span className="flex items-center gap-1"><Building2 className="w-4 h-4" /> {job.jobTitle?.department || job.department || "Geral"}</span>
            <span className="flex items-center gap-1"><MapPin className="w-4 h-4" /> {job.location || "Presencial"}</span>
            <span className="flex items-center gap-1"><Users className="w-4 h-4" /> {job.applications.length} Inscritos</span>
          </div>
          {job.jobTitle && (
            <div className="mt-3 text-[10px] font-black uppercase tracking-widest text-sky-600">
              Cargo vinculado: {job.jobTitle.name}
              {job.jobTitle.costCenter?.name ? ` • ${job.jobTitle.costCenter.name}` : ""}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" className="rounded-xl border-slate-200 shadow-sm text-slate-500 font-bold uppercase tracking-widest text-xs h-12 px-6">
            <Settings className="w-4 h-4 mr-2" /> Editar Vaga
          </Button>
          <Button disabled={job.status === 'CLOSED'} className="rounded-xl shadow-lg shadow-primary/20 bg-primary font-black uppercase tracking-widest text-xs h-12 px-6">
            <Play className="w-4 h-4 mr-2" /> Mover Status
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] shadow-lahomes border border-slate-50 p-6 md:p-8 min-h-[60vh] flex flex-col">
        <div className="mb-6 flex justify-between items-center px-2">
          <h2 className="text-xl font-bold font-outfit uppercase tracking-tighter text-slate-700">Pipeline de Seleção (Kanban)</h2>
        </div>
        
        <div className="flex xl:grid xl:grid-cols-6 gap-4 overflow-x-auto custom-scrollbar pb-6 flex-1 min-h-[400px]">
          {stages.map(stage => {
            const appsInStage = job.applications.filter(a => a.status === stage.key)
            return (
              <div key={stage.key} className={`flex flex-col rounded-2xl border ${stage.color} min-w-[280px] bg-opacity-30 p-2 shadow-sm`}>
                <div className="flex items-center justify-between px-3 py-3 border-b border-black/5 mb-4">
                  <h3 className="font-bold uppercase tracking-widest text-xs">{stage.label}</h3>
                  <Badge variant="secondary" className="bg-white rounded-full px-2 py-0 border shadow-sm font-black text-[10px]">{appsInStage.length}</Badge>
                </div>
                
                <div className="flex flex-col gap-3 flex-1 overflow-y-auto no-scrollbar pb-2 px-1">
                  {appsInStage.map(app => (
                    <div key={app.id} className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow cursor-grab active:cursor-grabbing">
                      <p className="font-black text-slate-700 text-sm font-outfit uppercase tracking-tight truncate">
                        {app.candidate.fullName}
                      </p>
                      <p className="text-[10px] uppercase font-bold text-slate-400 tracking-widest truncate mt-1">
                        {app.candidate.city || "Sem cidade"}
                      </p>
                      
                      {app.candidate.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-3">
                          {app.candidate.tags.slice(0, 2).map(t => (
                            <span key={t.id} className="px-2 py-[2px] rounded-full bg-slate-100 text-[9px] font-bold text-slate-500 uppercase">
                              {t.name}
                            </span>
                          ))}
                          {app.candidate.tags.length > 2 && <span className="text-[9px] text-slate-400 font-bold">+{app.candidate.tags.length - 2}</span>}
                        </div>
                      )}
                    </div>
                  ))}

                  {appsInStage.length === 0 && (
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-4 border border-dashed border-slate-200 rounded-xl bg-white/50 m-1">
                      <ArchiveX className="w-6 h-6 text-slate-300 mb-2 opacity-50" />
                      <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Vazio</p>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </main>
  )
}
