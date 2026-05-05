import { Metadata } from "next"
import Link from "next/link"
import {
  Briefcase,
  CalendarCheck,
  Search,
  Users,
  UserPlus,
  ArrowRight,
  TrendingUp,
  Sparkles,
  SearchCode,
  GraduationCap,
} from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

import { PageHeader } from "@/components/layout/PageHeader"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { getRecruitmentDashboardData } from "./actions"

export const metadata: Metadata = {
  title: "Processos Seletivos | RH",
}

export default async function RecruitmentDashboardPage() {
  const data = await getRecruitmentDashboardData()

  const { stats, openJobs, scheduledInterviews, recentApplications } = data

  const spotlightModules = [
    {
      title: "Vagas em Aberto",
      href: "/rh/vagas",
      description: "Gestão de novos postos, definição de requisitos e publicação.",
      icon: Briefcase,
      eyebrow: "Pipeline",
      metricValue: stats.openJobsCount,
      metricLabel: "vagas ativas",
      accentClass: "from-blue-600/18 via-cyan-500/10 to-white",
      iconClass: "bg-blue-600 text-white",
    },
    {
      title: "Banco de Talentos",
      href: "/rh/candidatos",
      description: "Base de currículos, triagem, tags de habilidades e histórico.",
      icon: Users,
      eyebrow: "Sourcing",
      metricValue: stats.totalCandidates,
      metricLabel: "candidatos na base",
      accentClass: "from-emerald-500/18 via-teal-400/10 to-white",
      iconClass: "bg-emerald-600 text-white",
    },
    {
      title: "Agenda de Entrevistas",
      href: "/rh/entrevistas",
      description: "Acompanhamento de etapas, feedback e agendamentos.",
      icon: CalendarCheck,
      eyebrow: "Agenda",
      metricValue: stats.interviewsScheduledCount,
      metricLabel: "entrevistas na agenda",
      accentClass: "from-amber-500/18 via-orange-400/10 to-white",
      iconClass: "bg-amber-500 text-slate-950",
    },
  ]

  return (
    <main className="flex-1 py-10 px-6 max-w-[1700px] mx-auto space-y-10 animate-in fade-in duration-700 pb-20">
      <PageHeader
        title="Processos Seletivos"
        subtitle="CENTRAL DE RECRUTAMENTO E SELEÇÃO. GESTÃO DE VAGAS, TRIAGEM DE TALENTOS E AGENDA DE ENTREVISTAS."
        icon={<SearchCode className="h-8 w-8 text-blue-600" />}
        actions={
          <div className="flex gap-3">
            <Link href="/rh/vagas">
              <Button className="rounded-full h-12 px-8 bg-slate-900 hover:bg-black text-white font-black text-xs uppercase tracking-[0.14em]">
                Nova Vaga
              </Button>
            </Link>
            <Link href="/rh/candidatos">
              <Button
                variant="outline"
                className="rounded-full h-12 px-8 border-slate-200 text-slate-600 hover:bg-slate-50 font-black text-xs uppercase tracking-[0.14em]"
              >
                Cadastrar Candidato
              </Button>
            </Link>
          </div>
        }
      />

      <section className="relative overflow-hidden rounded-[2.75rem] border-0 bg-slate-950 text-white shadow-[0_36px_90px_-48px_rgba(15,23,42,0.85)]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.22),_transparent_36%),radial-gradient(circle_at_80%_20%,_rgba(16,185,129,0.18),_transparent_28%),linear-gradient(135deg,_rgba(15,23,42,0.94),_rgba(15,23,42,0.82))]" />
        <div className="absolute -right-16 bottom-0 h-56 w-56 rounded-full bg-cyan-400/10 blur-3xl" />
        <div className="absolute -left-14 top-8 h-40 w-40 rounded-full bg-blue-500/10 blur-3xl" />
        
        <CardContent className="relative p-8 md:p-10">
          <div className="grid gap-8 xl:grid-cols-[1.35fr_0.95fr] xl:items-end">
            <div className="space-y-6">
              <span className="inline-flex rounded-full border border-white/15 bg-white/10 px-4 py-2 text-[10px] font-black uppercase tracking-[0.24em] text-slate-100">
                Dashboard de Recrutamento Unificado
              </span>
              <div className="space-y-4">
                <h2 className="max-w-3xl font-outfit text-4xl font-black uppercase italic tracking-tight text-white md:text-5xl">
                  Encontrar os melhores talentos ficou mais simples.
                </h2>
                <p className="max-w-2xl text-sm leading-7 text-slate-300 md:text-base">
                  Consolidamos o banco de talentos, a gestão de vagas e a agenda de entrevistas em um único lugar. 
                  Acompanhe o funil de contratação de ponta a ponta sem trocar de módulo.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                {["Pipeline transparente", "Banco de talentos integrado", "Agenda centralizada"].map((item) => (
                  <span
                    key={item}
                    className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-200"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
              <div className="rounded-[2rem] border border-white/10 bg-white/10 p-5 backdrop-blur-sm">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-300">Vagas Ativas</p>
                <p className="mt-4 text-2xl font-black italic tracking-tight text-white md:text-3xl">{stats.openJobsCount}</p>
                <p className="mt-3 text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">Em processo de triagem</p>
              </div>
              <div className="rounded-[2rem] border border-white/10 bg-white/10 p-5 backdrop-blur-sm">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-300">Banco de Talentos</p>
                <p className="mt-4 text-2xl font-black italic tracking-tight text-white md:text-3xl">{stats.talentPoolCount}</p>
                <p className="mt-3 text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">Candidatos qualificados</p>
              </div>
            </div>
          </div>
        </CardContent>
      </section>

      <div className="grid gap-5 lg:grid-cols-3">
        {spotlightModules.map((moduleItem) => (
          <Link key={moduleItem.href} href={moduleItem.href} className="group">
            <Card className="relative h-full overflow-hidden rounded-[2.5rem] border border-slate-100 bg-white shadow-lahomes transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl group">
              <div className={`absolute inset-0 bg-gradient-to-br ${moduleItem.accentClass} opacity-50`} />
              <CardContent className="relative flex h-full flex-col justify-between gap-8 p-8">
                <div className="space-y-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className={`flex h-14 w-14 items-center justify-center rounded-[1.5rem] shadow-lg shadow-slate-900/5 ${moduleItem.iconClass}`}>
                      <moduleItem.icon className="h-6 w-6" />
                    </div>
                    <Badge variant="secondary" className="bg-white/80 border-slate-100 px-3 py-1 font-black text-[10px] uppercase tracking-[0.18em]">
                      {moduleItem.eyebrow}
                    </Badge>
                  </div>
                  <div>
                    <h3 className="font-outfit text-2xl font-black uppercase italic tracking-tight text-slate-950">
                      {moduleItem.title}
                    </h3>
                    <p className="mt-3 text-sm leading-6 text-slate-500">{moduleItem.description}</p>
                  </div>
                </div>
                <div className="flex items-end justify-between gap-4 border-t border-slate-100/80 pt-6">
                  <div>
                    <p className="text-3xl font-black italic tracking-tight text-slate-950">{moduleItem.metricValue}</p>
                    <p className="mt-1 text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">
                      {moduleItem.metricLabel}
                    </p>
                  </div>
                  <span className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-4 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-white transition-transform group-hover:translate-x-1">
                    Abrir
                    <ArrowRight className="h-3.5 w-3.5" />
                  </span>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-[2.5rem] bg-white border border-slate-100 shadow-lahomes overflow-hidden">
          <div className="flex items-center justify-between p-8 border-b border-slate-50">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Time-to-hire</p>
              <h3 className="text-xl font-black font-outfit uppercase tracking-tight text-slate-900 mt-1">
                Agenda de Entrevistas
              </h3>
            </div>
            <Link href="/rh/entrevistas">
              <Button variant="ghost" className="rounded-full font-black text-[10px] uppercase tracking-[0.18em] gap-2">
                Ver agenda completa <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
          <div className="p-4 space-y-3">
            {scheduledInterviews.length > 0 ? (
              scheduledInterviews.map((interview) => (
                <div key={interview.id} className="group flex items-center justify-between p-4 rounded-3xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 font-black">
                      {format(new Date(interview.scheduledDate), "dd")}
                    </div>
                    <div>
                      <p className="font-outfit font-black text-slate-900 uppercase tracking-tight">
                        {interview.candidate.fullName}
                      </p>
                      <p className="text-xs text-slate-500 font-medium">
                        {interview.jobOpening?.title || "Vaga não especificada"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <Badge variant="outline" className="rounded-full border-indigo-100 text-indigo-600 bg-indigo-50/50 text-[10px] font-black uppercase tracking-widest px-3">
                        {interview.stage}
                      </Badge>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                        {format(new Date(interview.startTime), "HH:mm")}h
                      </p>
                    </div>
                    <Link href={`/rh/entrevistas/${interview.id}`}>
                      <Button size="icon" variant="ghost" className="rounded-2xl group-hover:bg-white group-hover:shadow-sm">
                        <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-indigo-600" />
                      </Button>
                    </Link>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-10 text-slate-400">Nenhuma entrevista agendada para os próximos dias.</div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <Card className="rounded-[2.5rem] border-0 bg-slate-50 p-8 shadow-sm">
            <div className="flex items-center gap-4 mb-8">
              <div className="h-12 w-12 rounded-2xl bg-white shadow-sm flex items-center justify-center text-emerald-600">
                <Sparkles className="h-6 w-6" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Quick Actions</p>
                <h3 className="text-lg font-black font-outfit uppercase tracking-tight text-slate-900">Próximas Etapas</h3>
              </div>
            </div>
            
            <div className="space-y-3">
              <Link href="/rh/vagas/new" className="flex items-center justify-between p-4 rounded-2xl bg-white border border-slate-100 hover:border-emerald-200 transition-all hover:shadow-md group">
                <div className="flex items-center gap-3">
                  <UserPlus className="h-4 w-4 text-emerald-500" />
                  <span className="text-sm font-bold text-slate-700 uppercase tracking-tight">Anunciar Nova Vaga</span>
                </div>
                <ArrowRight className="h-4 w-4 text-slate-300 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link href="/rh/candidatos/search" className="flex items-center justify-between p-4 rounded-2xl bg-white border border-slate-100 hover:border-blue-200 transition-all hover:shadow-md group">
                <div className="flex items-center gap-3">
                  <Search className="h-4 w-4 text-blue-500" />
                  <span className="text-sm font-bold text-slate-700 uppercase tracking-tight">Buscar no Banco</span>
                </div>
                <ArrowRight className="h-4 w-4 text-slate-300 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </Card>

          <Card className="rounded-[2.5rem] border-slate-900 bg-slate-950 p-8 text-white">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-lg font-black font-outfit uppercase tracking-tight">Vagas em Destaque</h3>
              <TrendingUp className="h-6 w-6 text-emerald-400" />
            </div>
            <div className="space-y-4">
              {openJobs.map((job) => (
                <div key={job.id} className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-white/50 uppercase tracking-widest">{job.title}</span>
                    <span className="text-emerald-400 font-bold">{job._count?.applications || 0} cand.</span>
                  </div>
                  <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-emerald-400 rounded-full" 
                      style={{ width: `${Math.min((job._count?.applications || 0) * 10, 100)}%` }} 
                    />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </main>
  )
}
