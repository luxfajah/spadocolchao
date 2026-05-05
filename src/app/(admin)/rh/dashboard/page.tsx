import { Metadata } from "next"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import Link from "next/link"
import {
  ArrowRight,
  Briefcase,
  CalendarCheck,
  Clock3,
  Presentation,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  UserPlus,
  Users,
  ShieldAlert,
  UserMinus,
  Wallet,
  Building2,
} from "lucide-react"

import { PageHeader } from "@/components/layout/PageHeader"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

import { getRhDashboardData } from "./actions"

export const metadata: Metadata = {
  title: "Dashboard RH | Enterprise",
}

function getCandidateDisplayName(candidate: any) {
  return candidate?.socialName || candidate?.fullName || "Candidato sem nome"
}

function getInterviewStageLabel(stage?: string | null) {
  switch (stage) {
    case "SCREENING": return "Triagem"
    case "INITIAL": return "Inicial"
    case "TECHNICAL": return "Tecnica"
    case "FINAL": return "Final"
    case "ALIGNMENT": return "Alinhamento"
    case "FEEDBACK": return "Feedback"
    default: return stage || "Etapa"
  }
}

export default async function RHDashboardPage() {
  const data = await getRhDashboardData()

  const workforceCoverage =
    data.totalEmployees > 0 ? Math.round((data.activeEmployees / data.totalEmployees) * 100) : 0
  const inactiveEmployees = Math.max(data.totalEmployees - data.activeEmployees, 0)
  
  const spotlightModules = [
    {
      title: "Funcionarios",
      href: "/rh/funcionarios",
      description: "Gestao completa do quadro ativo, jornadas e documentos.",
      icon: Users,
      eyebrow: "Core",
      metricValue: data.activeEmployees,
      metricLabel: "colaboradores ativos",
      accentClass: "from-blue-600/18 via-cyan-500/10 to-white",
      iconClass: "bg-blue-600 text-white",
    },
    {
      title: "Processos Seletivos",
      href: "/rh/processos-seletivos",
      description: "Hub de recrutamento: vagas, candidatos e agendamentos.",
      icon: Briefcase,
      eyebrow: "Talentos",
      metricValue: data.openJobs,
      metricLabel: "vagas em aberto",
      accentClass: "from-emerald-500/18 via-teal-400/10 to-white",
      iconClass: "bg-emerald-600 text-white",
    },
    {
      title: "Advertencias",
      href: "/rh/advertencias",
      description: "Controle disciplinar, histórico e medidas corretivas.",
      icon: ShieldAlert,
      eyebrow: "Compliance",
      metricValue: data.disciplinaryActions,
      metricLabel: "registros totais",
      accentClass: "from-amber-500/18 via-orange-400/10 to-white",
      iconClass: "bg-amber-500 text-slate-950",
    },
    {
      title: "Desligamentos",
      href: "/rh/desligamentos",
      description: "Fluxo de saida, homologacoes e processos de desligamento.",
      icon: UserMinus,
      eyebrow: "Offboarding",
      metricValue: data.terminations,
      metricLabel: "processos concluidos",
      accentClass: "from-rose-500/18 via-pink-400/10 to-white",
      iconClass: "bg-rose-500 text-white",
    },
    {
      title: "Holerites & Folha",
      href: "/rh/folha",
      description: "Fechamento mensal, lancamentos e consulta de holerites.",
      icon: Wallet,
      eyebrow: "Financeiro",
      metricValue: workforceCoverage,
      metricLabel: "% cobertura folha",
      accentClass: "from-violet-500/18 via-fuchsia-400/10 to-white",
      iconClass: "bg-violet-600 text-white",
    },
  ]

  return (
    <main className="flex-1 py-10 px-6 max-w-[1700px] mx-auto space-y-10 animate-in fade-in duration-700 pb-20">
      <PageHeader
        title="Dashboard RH"
        subtitle="PANORAMA OPERACIONAL DO RH. GESTAO DE PESSOAS, RECRUTAMENTO E CONFORMIDADE DISCIPLINAR."
        icon={<Users className="h-8 w-8 text-blue-600" />}
        actions={
          <div className="flex gap-3">
            <Link href="/rh/funcionarios">
              <Button className="rounded-full h-12 px-8 bg-slate-900 hover:bg-black text-white font-black text-xs uppercase tracking-[0.14em]">
                Gerenciar Equipe
              </Button>
            </Link>
          </div>
        }
      />

      <section className="relative overflow-hidden rounded-[2.75rem] border-0 bg-slate-950 text-white shadow-[0_36px_90px_-48px_rgba(15,23,42,0.85)]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.22),_transparent_36%),radial-gradient(circle_at_80%_20%,_rgba(16,185,129,0.18),_transparent_28%),linear-gradient(135deg,_rgba(15,23,42,0.94),_rgba(15,23,42,0.82))]" />
        <div className="absolute -right-16 bottom-0 h-56 w-56 rounded-full bg-cyan-400/10 blur-3xl" />
        <div className="absolute -left-14 top-8 h-40 w-40 rounded-full bg-blue-500/10 blur-3xl" />
        
        <CardContent className="relative p-8 md:p-10 text-white">
          <div className="grid gap-8 xl:grid-cols-[1.35fr_0.95fr] xl:items-end">
            <div className="space-y-6">
              <span className="inline-flex rounded-full border border-white/15 bg-white/10 px-4 py-2 text-[10px] font-black uppercase tracking-[0.24em] text-slate-100">
                Modulo de RH Redesenhado
              </span>
              <div className="space-y-4">
                <h2 className="max-w-3xl font-outfit text-4xl font-black uppercase italic tracking-tight md:text-5xl">
                  O RH agora e o coracao estrategico da empresa.
                </h2>
                <p className="max-w-2xl text-sm leading-7 text-slate-300 md:text-base">
                  Centralizamos todas as operacoes de pessoas em cartoes prioritarios. 
                  Acesse advertencias, desligamentos e o novo hub de recrutamento direto por aqui, 
                  mantendo sua barra de navegacao mais limpa e focada no dia a dia.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                {["Navbar otimizada", "Acessos diretos", "Dashboards integrados"].map((item) => (
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
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-300">Quadro Total</p>
                <p className="mt-4 text-2xl font-black italic tracking-tight text-white md:text-3xl">{data.totalEmployees}</p>
                <p className="mt-3 text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">{data.activeEmployees} ativos agora</p>
              </div>
              <div className="rounded-[2rem] border border-white/10 bg-white/10 p-5 backdrop-blur-sm">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-300">Pipeline Recrutamento</p>
                <p className="mt-4 text-2xl font-black italic tracking-tight text-white md:text-3xl">{data.openJobs}</p>
                <p className="mt-3 text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">{data.activeCandidates} candidatos ativos</p>
              </div>
            </div>
          </div>
        </CardContent>
      </section>

      <div className="grid gap-5 lg:grid-cols-2 2xl:grid-cols-5">
        {spotlightModules.map((moduleItem) => (
          <Link key={moduleItem.href} href={moduleItem.href} className="group h-full">
            <Card className="relative h-full overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-[0_26px_70px_-52px_rgba(15,23,42,0.5)] transition-all duration-300 hover:-translate-y-1.5 hover:border-slate-300 hover:shadow-[0_34px_80px_-48px_rgba(37,99,235,0.35)]">
              <div className={`absolute inset-0 bg-gradient-to-br ${moduleItem.accentClass}`} />
              <CardContent className="relative flex h-full flex-col justify-between gap-8 p-6">
                <div className="space-y-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className={`flex h-14 w-14 items-center justify-center rounded-[1.5rem] shadow-lg shadow-slate-900/10 ${moduleItem.iconClass}`}>
                      <moduleItem.icon className="h-6 w-6" />
                    </div>
                    <span className="rounded-full border border-slate-200 bg-white/85 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-slate-600 backdrop-blur">
                      {moduleItem.eyebrow}
                    </span>
                  </div>

                  <div>
                    <h3 className="font-outfit text-2xl font-black uppercase italic tracking-tight text-slate-950">
                      {moduleItem.title}
                    </h3>
                    <p className="mt-3 text-sm leading-6 text-slate-600">{moduleItem.description}</p>
                  </div>
                </div>

                <div className="flex items-end justify-between gap-4 border-t border-slate-200/80 pt-5">
                  <div>
                    <p className="text-3xl font-black italic tracking-tight text-slate-950">{moduleItem.metricValue}</p>
                    <p className="mt-2 text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">
                      {moduleItem.metricLabel}
                    </p>
                  </div>
                  <span className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-4 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-white transition-transform duration-300 group-hover:translate-x-1">
                    Abrir
                    <ArrowRight className="h-3.5 w-3.5" />
                  </span>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
        <div className="rounded-[2.5rem] border border-slate-100 bg-white shadow-lahomes overflow-hidden">
          <div className="flex flex-col gap-4 border-b border-slate-100 p-8 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Time-to-hire</p>
              <h3 className="mt-2 text-xl font-black font-outfit uppercase tracking-tight text-slate-900">Proximas Entrevistas</h3>
              <p className="mt-1 text-sm text-slate-500">Fila de agendamento do modulo de recrutamento.</p>
            </div>
            <Link href="/rh/processos-seletivos">
              <Button variant="outline" className="rounded-full font-black text-[10px] uppercase tracking-[0.18em] gap-2">
                Ver Agenda Unificada <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
          <div className="p-4 space-y-3">
            {data.nextInterviews.length > 0 ? (
              data.nextInterviews.map((interview) => (
                <div key={interview.id} className="group flex items-center justify-between p-5 rounded-3xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100">
                  <div className="flex items-center gap-5">
                    <div className="h-14 w-14 rounded-2xl bg-indigo-50 flex flex-col items-center justify-center text-indigo-600">
                      <span className="text-lg font-black">{format(new Date(interview.scheduledDate), "dd")}</span>
                      <span className="text-[10px] font-bold uppercase">{format(new Date(interview.scheduledDate), "MMM", { locale: ptBR })}</span>
                    </div>
                    <div>
                      <p className="font-outfit font-black text-slate-900 uppercase tracking-tight text-lg">
                        {getCandidateDisplayName(interview.candidate)}
                      </p>
                      <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">
                        {interview.jobOpening?.title || "Vaga não especificada"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-right hidden sm:block">
                      <Badge variant="outline" className="rounded-full border-indigo-100 text-indigo-600 bg-indigo-50 text-[10px] font-black uppercase tracking-[0.15em] px-3">
                        {getInterviewStageLabel(interview.stage)}
                      </Badge>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2 flex items-center justify-end gap-1">
                        <Clock3 className="h-3 w-3" /> {format(new Date(interview.startTime), "HH:mm")}h
                      </p>
                    </div>
                    <Link href={`/rh/entrevistas/${interview.id}`}>
                      <Button size="icon" variant="ghost" className="rounded-2xl group-hover:bg-white group-hover:shadow-sm">
                        <ArrowRight className="h-5 w-5 text-slate-300 group-hover:text-indigo-600" />
                      </Button>
                    </Link>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-16">
                <CalendarCheck className="h-10 w-10 text-slate-200 mx-auto" />
                <p className="mt-4 text-slate-400 font-bold uppercase text-xs tracking-widest">Nenhuma entrevista agendada</p>
              </div>
            )}
          </div>
        </div>

        <aside className="space-y-6">
          <Card className="rounded-[2.5rem] border-0 bg-slate-950 p-8 text-white shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-10">
              <TrendingUp className="h-24 w-24 text-white" />
            </div>
            <div className="relative space-y-8">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">Radar Operacional</p>
                <h3 className="text-xl font-black font-outfit uppercase tracking-tight mt-1">Status da Equipe</h3>
              </div>
              
              <div className="grid gap-4">
                <div className="flex items-center justify-between p-4 rounded-3xl bg-white/5 border border-white/10">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-2xl bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                      <UserPlus className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white/60 uppercase tracking-widest">Admissoes 30d</p>
                      <p className="text-lg font-black font-outfit">+{data.recentHires}</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 rounded-3xl bg-white/5 border border-white/10">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-2xl bg-amber-500/20 flex items-center justify-center text-amber-400">
                      <ShieldAlert className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white/60 uppercase tracking-widest">Advertencias 30d</p>
                      <p className="text-lg font-black font-outfit">+{data.recentDisciplinaryActions}</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 rounded-3xl bg-white/5 border border-white/10">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-2xl bg-blue-500/20 flex items-center justify-center text-blue-400">
                      <Building2 className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white/60 uppercase tracking-widest">Ocupacao Geral</p>
                      <p className="text-lg font-black font-outfit">{workforceCoverage}%</p>
                    </div>
                  </div>
                </div>
              </div>

              <Link href="/rh/ponto">
                <Button className="w-full rounded-2xl h-11 bg-white text-slate-950 hover:bg-slate-100 font-black text-[10px] uppercase tracking-[0.2em]">
                  Abrir Espelho de Ponto
                </Button>
              </Link>
            </div>
          </Card>
        </aside>
      </div>
    </main>
  )
}
